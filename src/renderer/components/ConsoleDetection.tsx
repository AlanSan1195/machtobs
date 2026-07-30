import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { useAppAPI } from '../hooks/useAppAPI';
import { IconMonitor, IconRefresh, Section, Spinner } from './ui';

const secondaryButtonClasses =
  'inline-flex items-center gap-1.5 rounded-none border border-border px-3 py-2 text-xs font-semibold text-text transition-colors hover:border-primary/40 hover:bg-white/[0.04]';

const inputClasses =
  'w-full rounded-none border border-border bg-white/[0.03] px-3 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary/60';

export function ConsoleDetection() {
  const {
    peripherals,
    selectedCaptureCard,
    selectedMonitor,
    obsConnected,
    captureCapabilities,
    setSelectedCaptureCard,
    setSelectedMonitor,
  } = useAppStore();
  const { getPeripherals, getCaptureCapabilities } = useAppAPI();
  const [detecting, setDetecting] = React.useState(true);
  const startedRef = useRef(false);
  const mountedRef = useRef(false);
  const detectionRunRef = useRef(0);

  const detectHardware = async () => {
    const runId = ++detectionRunRef.current;
    const initialState = useAppStore.getState();
    const initialCaptureCard = initialState.selectedCaptureCard;
    const initialMonitor = initialState.selectedMonitor;
    setDetecting(true);

    try {
      const detected = await getPeripherals();
      if (!mountedRef.current || runId !== detectionRunRef.current) return;

      const captureCandidate = initialCaptureCard || detected?.captureDevices[0]?.name || '';
      const mainDisplay = detected?.displays.find((display) => display.main) ?? detected?.displays[0];
      const monitorCandidate = initialMonitor || mainDisplay?.model || '';
      const currentState = useAppStore.getState();

      // No pisar una correccion que el usuario haya escrito mientras se detectaba.
      if (!initialCaptureCard && !currentState.selectedCaptureCard && captureCandidate) {
        currentState.setSelectedCaptureCard(captureCandidate);
      }
      if (!initialMonitor && !currentState.selectedMonitor && monitorCandidate) {
        currentState.setSelectedMonitor(monitorCandidate);
      }

      if (obsConnected) {
        const capabilities = await getCaptureCapabilities(captureCandidate || undefined, { reportError: false });
        if (!mountedRef.current || runId !== detectionRunRef.current || !capabilities) return;

        const latestState = useAppStore.getState();
        const captureWasAutoSelected = !initialCaptureCard
          && (!latestState.selectedCaptureCard || latestState.selectedCaptureCard === captureCandidate);
        if (captureWasAutoSelected) {
          latestState.setSelectedCaptureCard(capabilities.deviceName);
        }
      }
    } finally {
      if (mountedRef.current && runId === detectionRunRef.current) {
        setDetecting(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    // startedRef evita que React StrictMode duplique la consulta automatica.
    if (!startedRef.current) {
      startedRef.current = true;
      void detectHardware();
    }
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const captureOptions = peripherals?.captureDevices ?? [];
  const displayOptions = peripherals?.displays ?? [];

  return (
    <Section
      title="equipo detectado"
      icon={<IconMonitor className="h-4 w-4" />}
      subtitle="La capturadora y la pantalla se detectan automaticamente. Solo corrige el modelo si algo no coincide (ej. una TV conectada a la consola)."
      action={
        <button
          type="button"
          onClick={() => void detectHardware()}
          disabled={detecting}
          className={`${secondaryButtonClasses} ${detecting ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          {detecting
            ? <Spinner className="h-3.5 w-3.5 border-text/60 border-t-transparent" />
            : <IconRefresh className="h-3.5 w-3.5" />}
          {detecting ? 'Detectando...' : 'Re-detectar'}
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">Capturadora</span>
          {captureOptions.length > 0 && (
            <select
              value={captureOptions.some((device) => device.name === selectedCaptureCard) ? selectedCaptureCard : ''}
              onChange={(event) => setSelectedCaptureCard(event.target.value)}
              className={`app-select mb-2 ${inputClasses}`}
            >
              <option value="" className="bg-background text-text">(escribir manualmente)</option>
              {captureOptions.map((device) => (
                <option key={device.name} value={device.name} className="bg-background text-text">
                  {device.name}{device.vendor ? ` · ${device.vendor}` : ''}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            value={selectedCaptureCard}
            onChange={(event) => setSelectedCaptureCard(event.target.value)}
            placeholder="Ej. Elgato HD60 X"
            spellCheck={false}
            className={inputClasses}
          />
          {captureOptions.length === 0 && (
            <span className="mt-2 block text-xs text-text-faint">
              {detecting ? 'Buscando capturadora en el navegador y en OBS...' : 'No se detecto una capturadora; puedes escribir el modelo.'}
            </span>
          )}
          <div className="mt-2">
            {!obsConnected && (
              <span className="block text-xs text-text-faint">Conecta OBS para leer la capacidad real de captura (en vez de adivinar por el nombre).</span>
            )}
            {captureCapabilities?.maxResolution && (
              <p className="mt-2 text-xs text-primary">
                Capacidad real: hasta {captureCapabilities.maxResolution}
                {captureCapabilities.maxFps ? ` a ${captureCapabilities.maxFps}fps` : ''}
                {captureCapabilities.deviceName ? ` · ${captureCapabilities.deviceName}` : ''}
              </p>
            )}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted">Monitor / TV</span>
          {displayOptions.length > 0 && (
            <select
              value={displayOptions.some((display) => display.model === selectedMonitor) ? selectedMonitor : ''}
              onChange={(event) => setSelectedMonitor(event.target.value)}
              className={`app-select mb-2 ${inputClasses}`}
            >
              <option value="" className="bg-background text-text">(escribir manualmente)</option>
              {displayOptions.map((display) => (
                <option key={`${display.model}-${display.width}x${display.height}`} value={display.model} className="bg-background text-text">
                  {display.model} · {display.width}x{display.height}@{display.refreshRate}Hz{display.main ? ' (principal)' : ''}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            value={selectedMonitor}
            onChange={(event) => setSelectedMonitor(event.target.value)}
            placeholder="Ej. LG 27GP850"
            spellCheck={false}
            className={inputClasses}
          />
        </div>
      </div>
    </Section>
  );
}
