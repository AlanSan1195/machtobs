import React, { useState } from 'react';
import { useAppStore } from '../store';
import { useAppAPI } from '../hooks/useAppAPI';
import type { DeviceOption, ResolvedSourceKind, SceneItemSummary, SourceKindFriendly } from '../../shared/types';
import { IconClapperboard, IconMonitor, IconSliders, IconTv, IconVideo, Spinner } from './ui';

type AddSourceWizardProps = {
  sceneName: string;
  onClose: () => void;
  onCreated: () => void;
};

type WizardStep =
  | 'choose-what'
  | 'image-path'
  | 'choose-device'
  | 'camera-layout'
  | 'choose-frame-camera'
  | 'camera-frame'
  | 'confirm';

type FriendlyCard = {
  friendly: SourceKindFriendly;
  title: string;
  help: string;
  icon: React.ReactNode;
};

const CARDS: FriendlyCard[] = [
  { friendly: 'camera', title: 'Camara web', help: 'Tu webcam o camara USB', icon: <IconVideo className="h-6 w-6" /> },
  { friendly: 'display', title: 'Pantalla completa', help: 'Captura todo un monitor', icon: <IconMonitor className="h-6 w-6" /> },
  { friendly: 'window', title: 'Ventana', help: 'Una aplicacion abierta', icon: <IconTv className="h-6 w-6" /> },
  { friendly: 'game_console', title: 'Consola (PS5/Xbox/Switch)', help: 'Necesitas una tarjeta de captura conectada', icon: <IconClapperboard className="h-6 w-6" /> },
  { friendly: 'image', title: 'Imagen / Logo', help: 'Un PNG o JPG desde tu equipo', icon: <IconVideo className="h-6 w-6" /> },
];

const primaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-none bg-primary px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-background transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-none border border-border px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:border-primary/40 hover:bg-white/[0.04]';
const FRAME_COLORS = ['#3A9BDC', '#FFFFFF', '#7EE0C3', '#F2B84B', '#FF5C5C', '#B58CFF'];

export function AddSourceWizard({ sceneName, onClose, onCreated }: AddSourceWizardProps) {
  const availableSourceKinds = useAppStore((state) => state.availableSourceKinds);
  const sceneSources = useAppStore((state) => state.sceneSources);
  const {
    beginGuidedSource,
    applyGuidedSourceDevice,
    ensureCaptureAudio,
    cancelGuidedSource,
    setCameraLayout,
    setCameraFrame,
    createCameraScene,
    refreshScenes,
    createGuidedSource,
    renameSource,
  } = useAppAPI();

  const [step, setStep] = useState<WizardStep>('choose-what');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const [friendly, setFriendly] = useState<SourceKindFriendly | null>(null);
  const [inputName, setInputName] = useState('');
  const [sceneItemId, setSceneItemId] = useState<number | null>(null);
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [propertyName, setPropertyName] = useState<string | undefined>(undefined);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [frameTarget, setFrameTarget] = useState<SceneItemSummary | null>(null);
  const [editingExistingCamera, setEditingExistingCamera] = useState(false);
  const [cleanupInputOnClose, setCleanupInputOnClose] = useState(true);
  const [frameEnabled, setFrameEnabled] = useState(false);
  const [frameColor, setFrameColor] = useState('#3A9BDC');
  const [frameThickness, setFrameThickness] = useState(12);
  const [frameRounded, setFrameRounded] = useState(false);

  const cameraSources = sceneSources.filter((source) => source.friendlyKind === 'camera');

  const kindByFriendly = (value: SourceKindFriendly): ResolvedSourceKind | undefined =>
    availableSourceKinds?.find((kind) => kind.friendly === value);

  // Limpia el input recien creado en OBS si el asistente se cierra sin terminar.
  const closeWithCleanup = async () => {
    if (inputName && cleanupInputOnClose) {
      await cancelGuidedSource(inputName).catch(() => undefined);
    }
    onClose();
  };

  const handleChooseFriendly = async (value: SourceKindFriendly) => {
    setLocalError('');

    if (value === 'image') {
      // El navegador no expone rutas absolutas de archivos: se pide la ruta a mano
      // porque OBS necesita la ubicacion real de la imagen en el disco.
      setFriendly('image');
      setStep('image-path');
      return;
    }

    setBusy(true);
    setFriendly(value);
    try {
      const result = await beginGuidedSource({ sceneName, friendly: value });
      if (!result.success || !result.inputName || result.sceneItemId === undefined) {
        setLocalError(result.message);
        setFriendly(null);
        return;
      }
      setInputName(result.inputName);
      setSceneItemId(result.sceneItemId);
      setDevices(result.devices ?? []);
      setPropertyName(result.propertyName);
      setNameDraft(result.inputName);
      if (result.supportsDeviceEnum && (result.devices?.length ?? 0) > 0) {
        setSelectedDeviceId(result.devices?.[0]?.id ?? '');
        setStep('choose-device');
      } else {
        setStep('confirm');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCreateImage = async () => {
    const trimmedPath = imagePath.trim();
    if (!trimmedPath) {
      setLocalError('Escribe la ruta de la imagen.');
      return;
    }
    setBusy(true);
    setLocalError('');
    try {
      const sourceName = trimmedPath.split(/[\\/]/).pop() || 'Imagen';
      const result = await createGuidedSource({
        sceneName,
        friendly: 'image',
        sourceName,
        imagePath: trimmedPath,
        fitToCanvas: true,
      });
      if (result.success) {
        onCreated();
        onClose();
      } else {
        setLocalError(result.message);
      }
    } finally {
      setBusy(false);
    }
  };

  // Tras elegir el dispositivo, la camara ofrece elegir formato (facecam 1:1 o
  // pantalla completa); el resto va directo a confirmar.
  const stepAfterDevice = (): WizardStep => (friendly === 'camera' ? 'camera-layout' : 'confirm');

  const handleApplyDevice = async () => {
    if (!selectedDeviceId || !propertyName || sceneItemId === null) {
      setStep(stepAfterDevice());
      return;
    }
    setBusy(true);
    setLocalError('');
    try {
      const result = await applyGuidedSourceDevice({
        inputName,
        sceneName,
        sceneItemId,
        propertyName,
        deviceId: selectedDeviceId,
      });
      if (result.success) {
        setStep(stepAfterDevice());
      } else {
        setLocalError(result.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleChooseLayout = async (layout: 'facecam' | 'fullscreen') => {
    if (sceneItemId === null) {
      setStep('confirm');
      return;
    }
    setBusy(true);
    setLocalError('');
    try {
      const result = await setCameraLayout(sceneName, sceneItemId, layout);
      if (result.success) {
        if (layout === 'facecam') {
          setEditingExistingCamera(false);
          setFrameTarget({
            sceneItemId,
            sourceName: inputName,
            friendlyKind: 'camera',
            enabled: true,
          });
          setStep('camera-frame');
        } else {
          setStep('confirm');
        }
      } else {
        setLocalError(result.message);
      }
    } finally {
      setBusy(false);
    }
  };

  // "Ambas": la camara actual queda como facecam "camStream" en la escena actual,
  // y la camara a pantalla completa se separa en su propia escena "fullCam".
  const handleChooseBoth = async () => {
    if (sceneItemId === null) {
      setStep('confirm');
      return;
    }
    setBusy(true);
    setLocalError('');
    try {
      // 1) Fuente actual -> facecam + nombre camStream (se queda en esta escena).
      await setCameraLayout(sceneName, sceneItemId, 'facecam');
      const renamed = await renameSource(inputName, 'camStream');
      if (!renamed.success) {
        setLocalError(renamed.message);
        return;
      }
      setInputName('camStream');
      setNameDraft('camStream');
      // "Ambas" ya creo recursos definitivos en OBS. Si el usuario cierra el
      // paso siguiente, conservamos camStream y fullCam en vez de dejar media
      // configuracion eliminada.
      setCleanupInputOnClose(false);

      // 2) Escena nueva "fullCam" con la misma camara a pantalla completa.
      const prop = propertyName;
      if (prop && selectedDeviceId) {
        const sceneResult = await createCameraScene('fullCam', 'fullCam', selectedDeviceId, prop);
        if (!sceneResult.success) {
          setLocalError(sceneResult.message);
        } else {
          await refreshScenes();
        }
      } else {
        setLocalError('No se pudo identificar la camara para crear la escena fullCam.');
      }

      setEditingExistingCamera(false);
      setFrameTarget({
        sceneItemId,
        sourceName: 'camStream',
        friendlyKind: 'camera',
        enabled: true,
      });
      setStep('camera-frame');
    } finally {
      setBusy(false);
    }
  };

  const handleBackToChoose = async () => {
    if (inputName) {
      await cancelGuidedSource(inputName).catch(() => undefined);
    }
    setInputName('');
    setSceneItemId(null);
    setDevices([]);
    setFriendly(null);
    setFrameTarget(null);
    setEditingExistingCamera(false);
    setFrameEnabled(false);
    setStep('choose-what');
  };

  const openFrameEditor = (camera: SceneItemSummary, editingExisting: boolean) => {
    setFrameTarget(camera);
    setEditingExistingCamera(editingExisting);
    setFrameEnabled(editingExisting);
    setLocalError('');
    setStep('camera-frame');
  };

  const handleChooseFrameTool = () => {
    if (cameraSources.length === 1) {
      openFrameEditor(cameraSources[0], true);
      return;
    }
    setStep('choose-frame-camera');
  };

  const handleApplyFrameChoice = async () => {
    if (!frameTarget) return;

    if (!editingExistingCamera) {
      setFrameEnabled(true);
      setStep('confirm');
      return;
    }

    setBusy(true);
    setLocalError('');
    try {
      const layoutResult = await setCameraLayout(sceneName, frameTarget.sceneItemId, 'facecam');
      if (!layoutResult.success) {
        setLocalError(layoutResult.message);
        return;
      }
      const result = await setCameraFrame({
        sceneName,
        cameraSceneItemId: frameTarget.sceneItemId,
        cameraInputName: frameTarget.sourceName,
        config: {
          color: frameColor,
          thickness: frameThickness,
          rounded: frameRounded,
        },
      });
      if (result.success) {
        onCreated();
        onClose();
      } else {
        setLocalError(result.message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async () => {
    setBusy(true);
    setLocalError('');
    try {
      const trimmed = nameDraft.trim();
      let finalInputName = inputName;
      if (trimmed && trimmed !== inputName) {
        const renameResult = await renameSource(inputName, trimmed);
        if (!renameResult.success) {
          setLocalError(renameResult.message);
          return;
        }
        finalInputName = trimmed;
      }
      if (friendly === 'game_console') {
        // La fuente de video ya quedo lista; el audio es un complemento
        // best-effort. Si falla, el hook muestra el aviso global y cerramos
        // igual: bloquear aqui obligaria a cancelar y eso borraria el video.
        const deviceNameHint = devices.find((device) => device.id === selectedDeviceId)?.name;
        await ensureCaptureAudio({ sceneName, deviceNameHint });
      }
      if (frameEnabled && sceneItemId !== null) {
        const frameResult = await setCameraFrame({
          sceneName,
          cameraSceneItemId: sceneItemId,
          cameraInputName: finalInputName,
          config: {
            color: frameColor,
            thickness: frameThickness,
            rounded: frameRounded,
          },
        });
        if (!frameResult.success) {
          setLocalError(frameResult.message);
          return;
        }
      }
      onCreated();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const isConsole = friendly === 'game_console';

  return (
    <div className="border border-border bg-background/40 text-text">
      <div className="space-y-5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-paper">
            {step === 'choose-what' && 'Que quieres mostrar?'}
            {step === 'image-path' && 'Donde esta la imagen?'}
            {step === 'choose-device' && (isConsole ? 'Elige tu tarjeta de captura' : 'Elige cual')}
            {step === 'camera-layout' && 'Como quieres usar la camara?'}
            {step === 'choose-frame-camera' && 'Que camara quieres enmarcar?'}
            {step === 'camera-frame' && 'Personaliza tu marco 1:1'}
            {step === 'confirm' && 'Listo para agregar'}
          </h2>
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-text-faint">en {sceneName}</span>
        </div>

        {localError && (
          <p className="border border-danger/45 bg-danger/[0.06] p-3 text-sm text-danger">{localError}</p>
        )}

        {step === 'choose-what' && (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {CARDS.map((card) => {
              const resolved = kindByFriendly(card.friendly);
              const unavailable = card.friendly !== 'image' && availableSourceKinds !== null && resolved?.available === false;
              return (
                <button
                  key={card.friendly}
                  type="button"
                  disabled={busy || unavailable}
                  onClick={() => handleChooseFriendly(card.friendly)}
                  title={unavailable ? 'Tu instalacion de OBS no incluye esta captura en este sistema' : undefined}
                  className="flex items-start gap-3 border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="mt-0.5 shrink-0 text-primary">{card.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-text">{card.title}</span>
                    <span className="block text-xs text-text-muted">{unavailable ? 'No disponible en este OBS' : card.help}</span>
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              disabled={busy || cameraSources.length === 0}
              onClick={handleChooseFrameTool}
              title={cameraSources.length === 0 ? 'Agrega una camara a esta escena primero' : undefined}
              className="flex items-start gap-3 border border-primary/40 bg-primary/[0.035] p-3 text-left transition-colors hover:border-primary/70 hover:bg-primary/[0.07] disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:opacity-40"
            >
              <span className="mt-0.5 shrink-0 text-primary"><IconSliders className="h-6 w-6" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-text">Marco para facecam 1:1</span>
                <span className="block text-xs text-text-muted">
                  {cameraSources.length === 0 ? 'Agrega una camara primero' : 'Edita el color y el grosor de una camara existente'}
                </span>
              </span>
            </button>
          </div>
        )}

        {step === 'choose-frame-camera' && (
          <div className="space-y-3">
            <p className="text-sm text-text-muted">Elige la camara que se convertira a formato cuadrado y recibira el marco.</p>
            <div className="space-y-2">
              {cameraSources.map((camera) => (
                <button
                  key={camera.sceneItemId}
                  type="button"
                  onClick={() => openFrameEditor(camera, true)}
                  className="flex w-full items-center gap-3 border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-white/[0.04]"
                >
                  <IconVideo className="h-5 w-5 shrink-0 text-primary" />
                  <span className="truncate text-sm font-semibold text-text">{camera.sourceName}</span>
                </button>
              ))}
            </div>
            <button type="button" className={secondaryButton} onClick={() => setStep('choose-what')}>
              Atras
            </button>
          </div>
        )}

        {step === 'image-path' && (
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs text-text-faint">ruta del archivo de imagen</span>
              <input
                type="text"
                value={imagePath}
                onChange={(event) => setImagePath(event.target.value)}
                placeholder="C:\Users\tu-usuario\Pictures\logo.png"
                spellCheck={false}
                className="w-full rounded-none border border-border bg-background px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none"
              />
            </label>
            <p className="text-xs text-text-muted">
              Escribe la ruta completa de la imagen en la computadora donde corre OBS. Tip: en el explorador de archivos, clic derecho sobre la imagen y copia su ruta.
            </p>
            <div className="flex justify-between gap-3 pt-1">
              <button type="button" className={secondaryButton} onClick={handleBackToChoose} disabled={busy}>
                Atras
              </button>
              <button type="button" className={primaryButton} onClick={handleCreateImage} disabled={busy || imagePath.trim().length === 0}>
                {busy ? <Spinner className="h-4 w-4" /> : 'Agregar'}
              </button>
            </div>
          </div>
        )}

        {step === 'choose-device' && (
          <div className="space-y-3">
            {devices.length === 0 ? (
              <p className="text-sm text-text-muted">
                No se detectaron dispositivos. Verifica que esten conectados y que OBS tenga permisos del sistema.
              </p>
            ) : (
              <label className="block space-y-1.5">
                <span className="text-xs text-text-faint">
                  {isConsole ? 'tarjeta de captura' : 'dispositivo'}
                </span>
                <select
                  value={selectedDeviceId}
                  onChange={(event) => setSelectedDeviceId(event.target.value)}
                  className="w-full rounded-none border border-border bg-background px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none"
                >
                  {devices.map((device, index) => (
                    <option key={`${device.id}-${index}`} value={device.id}>
                      {device.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="flex justify-between gap-3 pt-1">
              <button type="button" className={secondaryButton} onClick={handleBackToChoose} disabled={busy}>
                Atras
              </button>
              <button type="button" className={primaryButton} onClick={handleApplyDevice} disabled={busy || devices.length === 0}>
                {busy ? <Spinner className="h-4 w-4" /> : 'Continuar'}
              </button>
            </div>
          </div>
        )}

        {step === 'camera-layout' && (
          <div className="space-y-3">
            <p className="text-sm text-text-muted">Elige como se vera tu camara en la escena. Cada opcion queda como una fuente mas que puedes mover o quitar despues.</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => handleChooseLayout('facecam')}
                className="flex flex-col items-start gap-2 border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-16 w-full items-end justify-end">
                  <span className="h-10 w-10 border border-primary/70 bg-primary/10" aria-hidden="true" />
                </span>
                <span className="block text-sm font-semibold text-text">Facecam 1:1</span>
                <span className="block text-xs text-text-muted">Cuadrado pequeno en la esquina, ideal para streamear</span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleChooseLayout('fullscreen')}
                className="flex flex-col items-start gap-2 border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-16 w-full items-center justify-center">
                  <span className="h-12 w-full border border-primary/70 bg-primary/10" aria-hidden="true" />
                </span>
                <span className="block text-sm font-semibold text-text">Pantalla completa</span>
                <span className="block text-xs text-text-muted">La camara abarca todo el lienzo</span>
              </button>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={handleChooseBoth}
              className="flex w-full items-center gap-3 border border-primary/40 bg-primary/[0.04] p-3 text-left transition-colors hover:border-primary/60 hover:bg-primary/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex shrink-0 items-end gap-1" aria-hidden="true">
                <span className="h-8 w-12 border border-primary/70 bg-primary/10" />
                <span className="h-5 w-5 border border-primary/70 bg-primary/10" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-text">Ambas</span>
                <span className="block text-xs text-text-muted">
                  Un facecam <span className="text-text">camStream</span> en esta escena y una escena aparte <span className="text-text">fullCam</span> con la camara a pantalla completa
                </span>
              </span>
            </button>
            {busy && (
              <div className="flex justify-center pt-1">
                <Spinner className="h-4 w-4" />
              </div>
            )}
          </div>
        )}

        {step === 'camera-frame' && frameTarget && (
          <div className="grid gap-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="flex flex-col items-center justify-center border border-paper/10 bg-black/40 p-5">
              <div
                className="camera-frame-preview aspect-square w-full max-w-[190px]"
                style={{
                  borderRadius: frameRounded ? `${Math.max(18, frameThickness * 2)}px` : 0,
                  backgroundColor: frameColor,
                  padding: frameThickness,
                } as React.CSSProperties}
                aria-label={`Vista previa de marco sólido ${frameRounded ? 'rounded' : 'recto'}, color ${frameColor}, grosor ${frameThickness} pixeles`}
              >
                <div
                  className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_50%_32%,rgba(241,239,232,0.2)_0_18%,transparent_19%),linear-gradient(145deg,rgba(58,155,220,0.2),rgba(9,10,10,0.96))]"
                  style={{ borderRadius: frameRounded ? `${Math.max(8, frameThickness)}px` : 0 }}
                >
                  <div className="absolute bottom-[12%] left-1/2 h-[45%] w-[62%] -translate-x-1/2 rounded-t-full bg-paper/15" />
                  <span className="absolute bottom-2 left-2 bg-black/70 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-paper/70">
                    1:1
                  </span>
                  <span className="absolute right-2 top-2 border border-paper/15 bg-black/70 px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-paper/70">
                    Solid
                  </span>
                </div>
              </div>
              <span className="mt-3 max-w-full truncate font-mono text-[0.6rem] uppercase tracking-[0.16em] text-text-faint">
                {frameTarget.sourceName}
              </span>
            </div>

            <div className="space-y-5">
              <fieldset className="space-y-2">
                <legend className="micro-label">forma</legend>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFrameRounded(false)}
                    aria-pressed={!frameRounded}
                    className={`border px-3 py-2 text-sm font-semibold transition-colors ${
                      !frameRounded ? 'border-primary bg-primary/[0.08] text-primary' : 'border-border text-text-muted'
                    }`}
                  >
                    Recto
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrameRounded(true)}
                    aria-pressed={frameRounded}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                      frameRounded ? 'border-primary bg-primary/[0.08] text-primary' : 'border-border text-text-muted'
                    }`}
                  >
                    Rounded
                  </button>
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="micro-label">color sólido</legend>
                <div className="flex flex-wrap items-center gap-2">
                  {FRAME_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFrameColor(color)}
                      aria-label={`Usar color ${color}`}
                      aria-pressed={frameColor === color}
                      className={`h-8 w-8 border-2 transition-transform hover:scale-105 ${
                        frameColor === color ? 'border-paper' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <label className="relative h-8 w-8 cursor-pointer border border-dashed border-paper/40">
                    <span className="absolute inset-0 flex items-center justify-center text-sm text-paper">+</span>
                    <input
                      type="color"
                      value={frameColor}
                      onChange={(event) => setFrameColor(event.target.value.toUpperCase())}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Elegir otro color"
                    />
                  </label>
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-text-muted">{frameColor}</span>
                </div>
              </fieldset>

              <label className="block space-y-2">
                <span className="flex items-center justify-between gap-3">
                  <span className="micro-label">grosor</span>
                  <span className="font-mono text-xs font-bold text-primary">{frameThickness} px</span>
                </span>
                <input
                  type="range"
                  min="2"
                  max="48"
                  step="1"
                  value={frameThickness}
                  onChange={(event) => setFrameThickness(Number(event.target.value))}
                  className="w-full accent-primary"
                  aria-label="Grosor del marco"
                />
                <span className="flex justify-between font-mono text-[0.55rem] uppercase tracking-[0.12em] text-text-faint">
                  <span>fino / 2</span>
                  <span>grueso / 48</span>
                </span>
              </label>

              <p className="border-l-2 border-primary/50 pl-3 text-xs leading-relaxed text-text-muted">
                {frameRounded
                  ? 'El marco sólido conservará la preferencia Rounded y usará la variante compatible con tu OBS.'
                  : 'El marco recto se importará como una fuente de color sólida y ligera.'}
                {' '}Podras volver a esta herramienta para cambiarlo.
              </p>

              <div className="flex flex-wrap justify-between gap-2 pt-1">
                <button
                  type="button"
                  className={secondaryButton}
                  onClick={() => {
                    if (editingExistingCamera) {
                      setStep('choose-what');
                    } else {
                      setFrameEnabled(false);
                      setStep('confirm');
                    }
                  }}
                  disabled={busy}
                >
                  {editingExistingCamera ? 'Cancelar' : 'Continuar sin marco'}
                </button>
                <button type="button" className={primaryButton} onClick={handleApplyFrameChoice} disabled={busy}>
                  {busy ? <Spinner className="h-4 w-4" /> : editingExistingCamera ? 'Aplicar en OBS' : 'Usar este marco'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs text-text-faint">nombre de la fuente</span>
              <input
                type="text"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                className="w-full rounded-none border border-border bg-background px-3 py-2.5 text-sm text-text focus:border-primary focus:outline-none"
              />
            </label>
            <div className="flex justify-between gap-3 pt-1">
              <button type="button" className={secondaryButton} onClick={closeWithCleanup} disabled={busy}>
                Cancelar
              </button>
              <button type="button" className={primaryButton} onClick={handleFinish} disabled={busy}>
                {busy ? <Spinner className="h-4 w-4" /> : 'Listo'}
              </button>
            </div>
          </div>
        )}

        {step === 'choose-what' && (
          <div className="flex justify-end">
            <button type="button" className={secondaryButton} onClick={closeWithCleanup} disabled={busy}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
