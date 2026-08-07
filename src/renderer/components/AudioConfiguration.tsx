import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store';
import { useAppAPI } from '../hooks/useAppAPI';
import type { MicProfileResponse, OBSAudioConfig, OBSAudioDevice, OBSAudioFilterConfig, OBSAudioSettingsSnapshot } from '../../shared/types';
import { resolveMicrophoneName } from '../lib/microphone-device';
import { ConfirmDialog } from './ConfirmDialog';
import { IconAlert, IconCheck, IconMic, IconRefresh, IconSparkles, IconX, Section, Spinner } from './ui';

const defaultFilters = {
  gainDb: 10,
  compressorRatio: 4,
  compressorThresholdDb: -10,
  limiterThresholdDb: -1,
  noiseSuppression: true,
};

const secondaryButtonClasses =
  'inline-flex items-center gap-1.5 rounded-none border border-border px-3 py-2 text-xs font-semibold text-text transition-colors hover:border-primary/40 hover:bg-white/[0.04]';

function getSelectedDevice(devices: OBSAudioDevice[], selectedDeviceId?: string): OBSAudioDevice | undefined {
  return devices.find((device) => device.id === selectedDeviceId);
}

function getDefaultDeviceId(devices: OBSAudioDevice[], currentDeviceId?: string): string {
  // Respetar el dispositivo que OBS ya tiene seleccionado; el "recomendado" solo
  // es una sugerencia para cuando no hay nada elegido todavia.
  if (currentDeviceId && devices.some((device) => device.id === currentDeviceId)) {
    return currentDeviceId;
  }
  const recommended = devices.find((device) => device.isRecommended);
  return recommended?.id ?? devices[0]?.id ?? '';
}

export function createDefaultAudioConfig(
  snapshot: OBSAudioSettingsSnapshot,
  device?: OBSAudioDevice,
): OBSAudioConfig {
  return {
    inputName: snapshot.inputName,
    inputKind: snapshot.inputKind,
    devicePropertyName: snapshot.devicePropertyName,
    createInputIfMissing: snapshot.requiresInputCreation,
    deviceId: device?.id,
    deviceName: device?.name,
    mono: true,
    filters: defaultFilters,
  };
}

// Traduce la recomendacion de la IA al formato de filtros que aplica machtobs.
function filtersFromProfile(profile: MicProfileResponse): OBSAudioFilterConfig {
  const f = profile.filters;
  return {
    gainDb: f.gain.db,
    gainEnabled: f.gain.enabled,
    compressorRatio: f.compressor.ratio,
    compressorThresholdDb: f.compressor.thresholdDb,
    compressorEnabled: f.compressor.enabled,
    limiterThresholdDb: f.limiter.thresholdDb,
    limiterEnabled: f.limiter.enabled,
    noiseSuppression: f.noiseSuppression.enabled,
    noiseSuppressionMethod: f.noiseSuppression.method,
    noiseGate: {
      enabled: f.noiseGate.enabled,
      closeThresholdDb: f.noiseGate.closeThresholdDb,
      openThresholdDb: f.noiseGate.openThresholdDb,
    },
  };
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url.slice(0, 40);
  }
}

// Lineas legibles que resumen lo que la IA aplicara u omitira.
function aiFilterSummary(profile: MicProfileResponse): string[] {
  const f = profile.filters;
  const lines: string[] = [];
  lines.push(f.noiseSuppression.enabled ? `Supresion de ruido (${f.noiseSuppression.method})` : 'Supresion de ruido: omitida');
  lines.push(f.noiseGate.enabled ? `Compuerta de ruido: abre ${f.noiseGate.openThresholdDb} dB / cierra ${f.noiseGate.closeThresholdDb} dB` : 'Compuerta de ruido: omitida');
  lines.push(f.gain.enabled ? `Ganancia ${f.gain.db > 0 ? '+' : ''}${f.gain.db} dB` : 'Ganancia: omitida');
  lines.push(f.compressor.enabled ? `Compresor ${f.compressor.ratio}:1 a ${f.compressor.thresholdDb} dB` : 'Compresor: omitido');
  lines.push(f.limiter.enabled ? `Limitador a ${f.limiter.thresholdDb} dB` : 'Limitador: omitido');
  return lines;
}

const MIC_TYPE_LABELS: Record<string, string> = {
  condenser: 'Condensador',
  dynamic: 'Dinamico',
  electret: 'Electret',
  unknown: 'Tipo desconocido',
};

const MIC_CONNECTION_LABELS: Record<string, string> = {
  usb: 'USB',
  xlr: 'XLR',
  analog: 'Analogico',
  wireless: 'Inalambrico',
  unknown: 'Conexion desconocida',
};

interface AudioConfigurationProps {
  onApplySuccess?: () => void;
}

export function AudioConfiguration({ onApplySuccess }: AudioConfigurationProps = {}) {
  const {
    obsConnected,
    obsAudioSnapshot,
    isApplying,
    mode,
    micProfile,
    isProfilingMic,
    setError,
    setObsMessage,
    setMicProfile,
  } = useAppStore();
  const { refreshAudioSnapshot, applyAudioConfig, profileMicrophone } = useAppAPI();
  const [useAiRecommendation, setUseAiRecommendation] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [micResearchName, setMicResearchName] = useState('');
  const [micIdentityStatus, setMicIdentityStatus] = useState('');
  const [detectionMessage, setDetectionMessage] = useState('');
  const [autoDetectTried, setAutoDetectTried] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewConfirmOpen, setPreviewConfirmOpen] = useState(false);

  useEffect(() => {
    if (obsAudioSnapshot) {
      // No pisar la eleccion manual del usuario: si su seleccion sigue existiendo
      // entre los dispositivos (p. ej. tras refrescar al aplicar), se conserva.
      setSelectedDeviceId((prev) => {
        if (prev && obsAudioSnapshot.devices.some((device) => device.id === prev)) {
          return prev;
        }
        // En OBS virgen la recomendacion se muestra, pero no se confirma por el
        // usuario automaticamente. La seleccion explicita desbloquea Apply.
        if (obsAudioSnapshot.requiresInputCreation) return '';
        return getDefaultDeviceId(obsAudioSnapshot.devices, obsAudioSnapshot.selectedDeviceId);
      });
      setDetectionMessage('');
    }
  }, [obsAudioSnapshot]);

  useEffect(() => {
    if (!obsConnected || obsAudioSnapshot || autoDetectTried) return;

    setAutoDetectTried(true);
    refreshAudioSnapshot().then((result) => {
      if (!result.success) {
        setDetectionMessage(result.message);
      }
    }).catch(() => {
      setDetectionMessage('Machtobs no pudo leer las entradas de audio desde OBS.');
    });
  }, [autoDetectTried, obsConnected, obsAudioSnapshot, refreshAudioSnapshot]);

  const selectedDevice = useMemo(() => {
    if (!obsAudioSnapshot) return undefined;
    return getSelectedDevice(obsAudioSnapshot.devices, selectedDeviceId);
  }, [obsAudioSnapshot, selectedDeviceId]);
  const awaitingMicrophoneSelection = Boolean(
    obsAudioSnapshot?.requiresInputCreation
      && obsAudioSnapshot.devices.length > 0
      && !selectedDevice,
  );

  const handleRefresh = async () => {
    setError(null);
    setDetectionMessage('');
    const result = await refreshAudioSnapshot();
    if (!result.success) {
      setDetectionMessage(result.message);
      setError(result.message);
    }
  };

  const handleAnalyzeMic = async () => {
    if (!obsAudioSnapshot) return;
    setError(null);
    const observedName = micResearchName.trim()
      || selectedDevice?.name
      || obsAudioSnapshot.selectedDeviceName
      || obsAudioSnapshot.inputName;
    const identity = await resolveMicrophoneName(observedName);

    if (identity.source === 'browser') {
      setMicResearchName(identity.deviceName);
      setMicIdentityStatus(`Microfono identificado localmente: ${identity.deviceName}.`);
    } else if (identity.source === 'unresolved') {
      setMicIdentityStatus('OBS solo expuso un nombre generico. Autoriza el microfono o escribe la marca y el modelo para buscar la ficha oficial.');
    } else {
      setMicIdentityStatus(`Buscando la ficha oficial de ${identity.deviceName}.`);
    }

    const profile = await profileMicrophone({
      deviceName: identity.deviceName,
      inputKind: obsAudioSnapshot.inputKind,
      mode: mode ?? 'record_only',
    });
    if (profile) {
      setUseAiRecommendation(true);
    }
  };


  const usingAi = useAiRecommendation && micProfile !== null;

  const buildAudioConfig = (useAi: boolean): OBSAudioConfig => {
    const filters: OBSAudioFilterConfig = useAi && micProfile
      ? filtersFromProfile(micProfile)
      : {
          gainDb: 0,
          gainEnabled: false,
          compressorRatio: 1,
          compressorThresholdDb: 0,
          compressorEnabled: false,
          limiterThresholdDb: 0,
          limiterEnabled: false,
          noiseSuppression: false,
          noiseSuppressionMethod: 'rnnoise',
          noiseGate: {
            enabled: false,
            closeThresholdDb: -40,
            openThresholdDb: -35,
          },
        };

    return {
      inputName: obsAudioSnapshot!.inputName,
      inputKind: obsAudioSnapshot!.inputKind,
      devicePropertyName: obsAudioSnapshot!.devicePropertyName,
      createInputIfMissing: obsAudioSnapshot!.requiresInputCreation,
      deviceId: selectedDevice?.id,
      deviceName: selectedDevice?.name,
      mono: true,
      filters,
    };
  };

  const handleApplyWithPreview = async () => {
    if (!obsAudioSnapshot || !usingAi || !micProfile) {
      await handleApplyFinal(false);
      return;
    }

    setConfirmOpen(false);
    setError(null);
    const config = buildAudioConfig(true);
    const result = await applyAudioConfig(config);
    if (result.success) {
      setObsMessage(result.message);
      setPreviewConfirmOpen(true);
    } else {
      setError(result.message);
    }
  };

  const handleApplyFinal = async (withAi: boolean) => {
    if (!obsAudioSnapshot) return;

    setError(null);
    const config = buildAudioConfig(withAi);
    const result = await applyAudioConfig(config);
    if (result.success) {
      setObsMessage(result.message);
      setPreviewConfirmOpen(false);
      onApplySuccess?.();
    } else {
      setError(result.message);
    }
  };

  const handleConfirmPreview = () => {
    setPreviewConfirmOpen(false);
    onApplySuccess?.();
  };

  const handleRejectPreview = async () => {
    setPreviewConfirmOpen(false);
    await handleApplyFinal(false);
  };

  if (!obsAudioSnapshot) {
    return (
      <Section
        title="audio.voz"
        icon={<IconMic className="h-4 w-4" />}
        action={
          <button type="button" onClick={handleRefresh} className={secondaryButtonClasses}>
            <IconRefresh className="h-3.5 w-3.5" />
            Detectar audio
          </button>
        }
      >
        <div className="rounded-none border border-border bg-surface/45 p-4">
          <p className="text-sm text-text">
            {obsConnected
              ? 'Machtobs esta buscando un dispositivo Mic/Aux o una fuente Audio Input Capture para aplicar la configuracion de voz.'
              : 'Conecta OBS para detectar tu microfono y aplicar la configuracion de voz de Machtobs.'}
          </p>
          {detectionMessage && (
            <p className="mt-3 text-sm text-warning">{detectionMessage}</p>
          )}
        </div>
      </Section>
    );
  }

  const stageTwoActions = [
    'Configuracion de audio optimizada por IA',
  ];

  return (
    <Section
      title="audio.voz"
      icon={<IconMic className="h-4 w-4" />}
      subtitle="Objetivo: que tu voz se escuche clara, fuerte y sin ruido de fondo al grabar o transmitir."
      action={
        <button
          type="button"
          onClick={handleAnalyzeMic}
          disabled={isProfilingMic || awaitingMicrophoneSelection}
          title={awaitingMicrophoneSelection ? 'Selecciona primero el microfono que usara OBS' : undefined}
          className={`${secondaryButtonClasses} ${
            isProfilingMic || awaitingMicrophoneSelection
              ? 'cursor-not-allowed opacity-60'
              : 'ai-glint hover:border-primary/60'
          }`}
        >
          {isProfilingMic ? <Spinner className="h-3.5 w-3.5 border-text/60 border-t-transparent" /> : <IconSparkles className="h-3.5 w-3.5" />}
          {isProfilingMic ? 'Analizando...' : 'Buscar filtros'}
        </button>
      }
    >
      {micProfile && (
        <MicProfileCard
          profile={micProfile}
          active={useAiRecommendation}
          onToggle={setUseAiRecommendation}
          onDismiss={() => { setMicProfile(null); setUseAiRecommendation(false); }}
        />
      )}
      {obsAudioSnapshot.requiresInputCreation && (
        <div className="mb-4 flex items-start gap-3 rounded-none border border-primary/35 bg-primary/[0.06] p-4 text-sm text-text">
          <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-primary">OBS esta listo para recibir tu microfono.</p>
            <p className="mt-1 text-text-muted">
              Mic/Aux esta en Ninguno. Elige el microfono que quieres usar; despues Machtobs podra agregarlo a la escena activa.
            </p>
          </div>
        </div>
      )}
      <div className="mb-4 grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <label
          className={`block rounded-none border p-4 transition-colors ${
            awaitingMicrophoneSelection
              ? 'border-primary/70 bg-primary/[0.07] shadow-[inset_3px_0_0_0_rgba(58,155,220,0.85)]'
              : 'border-border bg-surface/45 focus-within:border-primary/50'
          }`}
        >
          {awaitingMicrophoneSelection && (
            <span className="mb-2 block font-mono text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
              02 / seleccion requerida
            </span>
          )}
          <span className={`mb-2 block text-xs uppercase tracking-wider ${
            awaitingMicrophoneSelection ? 'font-semibold text-primary' : 'text-text-muted'
          }`}>
            {awaitingMicrophoneSelection ? 'Elige tu microfono' : 'Microfono recomendado'}
          </span>
          <select
            aria-label="Elige tu microfono"
            value={selectedDeviceId}
            onChange={(event) => {
              setSelectedDeviceId(event.target.value);
              setMicResearchName('');
              setMicIdentityStatus('');
              setMicProfile(null);
              setUseAiRecommendation(false);
            }}
            className={`app-select w-full bg-transparent text-base font-medium text-text outline-none ${
              awaitingMicrophoneSelection ? 'border-primary ring-1 ring-primary/70' : ''
            }`}
          >
            {obsAudioSnapshot.devices.length === 0 ? (
              <option value="" className="bg-background text-text">Dispositivo actual de OBS</option>
            ) : (
              <>
                {obsAudioSnapshot.requiresInputCreation && (
                  <option value="" disabled className="bg-background text-text-muted">
                    Selecciona un microfono
                  </option>
                )}
                {obsAudioSnapshot.devices.map((device) => (
                  <option key={`${device.id}-${device.name}`} value={device.id} className="bg-background text-text">
                    {device.isRecommended ? 'Recomendado - ' : ''}{device.name}
                  </option>
                ))}
              </>
            )}
          </select>
          <span className="mt-2 block text-xs text-text-faint">
            {selectedDevice?.reason ?? (
              awaitingMicrophoneSelection
                ? 'La recomendacion es una sugerencia: confirma cual dispositivo debe usar OBS.'
                : 'OBS no expuso una lista de dispositivos para esta entrada.'
            )}
          </span>
          <span className="mb-1 mt-3 block text-xs uppercase tracking-wider text-text-muted">
            Marca y modelo para la busqueda oficial
          </span>
          <input
            type="text"
            value={micResearchName}
            onChange={(event) => {
              setMicResearchName(event.target.value);
              setMicIdentityStatus('');
              setMicProfile(null);
              setUseAiRecommendation(false);
            }}
            placeholder={selectedDevice?.name ?? obsAudioSnapshot.selectedDeviceName ?? obsAudioSnapshot.inputName}
            maxLength={128}
            className="w-full rounded-none border border-border bg-background px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-faint focus:border-primary"
          />
          <span className="mt-2 block text-xs text-text-faint">
            {micIdentityStatus || 'Si OBS muestra “Predeterminado”, al buscar se pedira permiso para leer la etiqueta real del microfono.'}
          </span>
        </label>

        <div className="rounded-none border border-border bg-surface/45 p-4">
          <span className="mb-2 block text-xs uppercase tracking-wider text-text-muted">Filtros</span>
          <span className={usingAi ? 'text-base font-semibold text-primary' : 'text-base font-semibold text-text-muted'}>
            {usingAi ? 'A medida (IA)' : 'Ninguno seleccionado'}
          </span>
        </div>
      </div>





      {awaitingMicrophoneSelection ? (
        <div
          role="status"
          className="flex items-center gap-3 rounded-none border border-primary/35 bg-primary/[0.04] px-4 py-3 text-sm text-text-muted"
        >
          <IconMic className="h-4 w-4 shrink-0 text-primary" />
          <p>Selecciona un microfono arriba para habilitar Apply.</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isApplying}
          className={`group flex w-full items-center justify-center gap-3 rounded-none px-6 py-4 font-mono text-sm font-bold uppercase tracking-[0.18em] transition-colors duration-200 ${
            isApplying
              ? 'cursor-not-allowed border border-border bg-surface/45 text-text-muted'
              : 'bg-primary text-background glow-primary hover:bg-primary-hover active:scale-[0.99]'
          }`}
        >
          {isApplying ? (
            <>
              <Spinner className="h-5 w-5 border-background/80 border-t-transparent" />
              <span>aplicando audio...</span>
            </>
          ) : (
            <>
              <IconMic className="h-5 w-5" />
              <span><span className="opacity-60">./</span>applicar --MicRO</span>
            </>
          )}
        </button>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar configuracion de audio"
        confirmLabel="Aplicar audio"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void handleApplyWithPreview();
        }}
      >
        {obsAudioSnapshot.requiresInputCreation && (
          <p>OBS no tiene Mic/Aux configurado. Machtobs creara la fuente "{obsAudioSnapshot.inputName}" en la escena activa.</p>
        )}
        <p>Aplicar configuracion de voz Machtobs a "{selectedDevice?.name ?? obsAudioSnapshot.selectedDeviceName ?? obsAudioSnapshot.inputName}"?</p>
        {usingAi && micProfile && (
          <>
            <p>Machtobs aplicara la cadena de voz recomendada por la IA para "{micProfile.profile.model}":</p>
            <ul className="list-disc space-y-1 pl-5">
              {aiFilterSummary(micProfile).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </>
        )}
        <ul className="list-disc space-y-1 pl-5">
          {stageTwoActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </ConfirmDialog>

      <ConfirmDialog
        open={previewConfirmOpen}
        title="Prueba de filtros"
        confirmLabel="Mantener filtros"
        onCancel={handleRejectPreview}
        onConfirm={handleConfirmPreview}
      >
        <p>Los filtros de IA se han aplicado a tu micrófono.</p>
        <p className="mt-3 font-semibold">Escucha cómo suena tu voz durante 10-15 segundos.</p>
        <p className="mt-3">¿Te parece que mejora la calidad de tu voz?</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-text-muted">
          <li>Si suena bien: mantén los filtros</li>
          <li>Si suena peor o artificial: revierte a sin filtros</li>
        </ul>
      </ConfirmDialog>
    </Section>
  );
}

interface MicProfileCardProps {
  profile: MicProfileResponse;
  active: boolean;
  onToggle: (value: boolean) => void;
  onDismiss: () => void;
}

function MicProfileCard({ profile, active, onToggle, onDismiss }: MicProfileCardProps) {
  const { profile: p, filters: f } = profile;
  const rows = [
    { key: 'noise', label: 'Supresion de ruido', enabled: f.noiseSuppression.enabled, detail: `metodo ${f.noiseSuppression.method}`, reason: f.noiseSuppression.reason },
    { key: 'gate', label: 'Compuerta de ruido', enabled: f.noiseGate.enabled, detail: `abre ${f.noiseGate.openThresholdDb} dB / cierra ${f.noiseGate.closeThresholdDb} dB`, reason: f.noiseGate.reason },
    { key: 'gain', label: 'Ganancia', enabled: f.gain.enabled, detail: `${f.gain.db > 0 ? '+' : ''}${f.gain.db} dB`, reason: f.gain.reason },
    { key: 'comp', label: 'Compresor', enabled: f.compressor.enabled, detail: `${f.compressor.ratio}:1 a ${f.compressor.thresholdDb} dB`, reason: f.compressor.reason },
    { key: 'lim', label: 'Limitador', enabled: f.limiter.enabled, detail: `${f.limiter.thresholdDb} dB`, reason: f.limiter.reason },
  ];

  return (
    <div className="mb-4 rounded-none border border-primary/40 bg-primary/[0.04] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <IconSparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-text">
              {p.identified ? p.model : 'Microfono no identificado'}
              {profile.source === 'local' && <span className="ml-2 text-xs font-normal text-text-faint">(perfil local sin conexion)</span>}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {MIC_TYPE_LABELS[p.type]} · {MIC_CONNECTION_LABELS[p.connection]}{p.hasBuiltinDsp ? ' · DSP integrado' : ''}
            </p>
            {p.summary && <p className="mt-1 text-xs leading-relaxed text-text-muted">{p.summary}</p>}
          </div>
        </div>
        <button type="button" onClick={onDismiss} className="text-text-faint transition-colors hover:text-text" aria-label="Descartar analisis">
          <IconX className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {rows.map((row) => (
          <div key={row.key} className={`rounded-none border px-3 py-2 ${row.enabled ? 'border-border bg-surface/45' : 'border-border/60 bg-transparent opacity-70'}`}>
            <div className="flex items-center gap-2">
              {row.enabled ? <IconCheck className="h-3.5 w-3.5 text-secondary" /> : <IconX className="h-3.5 w-3.5 text-text-faint" />}
              <span className="text-sm font-semibold text-text">{row.label}</span>
              <span className="ml-auto text-xs text-text-muted">{row.enabled ? row.detail : 'omitir'}</span>
            </div>
            {row.reason && <p className="mt-1 text-xs leading-relaxed text-text-faint">{row.reason}</p>}
          </div>
        ))}
      </div>

      {p.sources && p.sources.length > 0 && (
        <p className="mt-3 text-xs text-text-faint">
          Segun fabricante:{' '}
          {p.sources.map((url, index) => (
            <React.Fragment key={url}>
              {index > 0 && ' · '}
              <a href={url} target="_blank" rel="noreferrer" className="text-primary/80 underline hover:text-primary">{safeHostname(url)}</a>
            </React.Fragment>
          ))}
        </p>
      )}

      {profile.reasoning && <p className="mt-3 text-xs leading-relaxed text-text-muted">{profile.reasoning}</p>}

      <label className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3">
        <input type="checkbox" checked={active} onChange={(event) => onToggle(event.target.checked)} />
        <span className="text-sm font-medium text-text">Usar esta recomendacion de la IA al aplicar</span>
      </label>
    </div>
  );
}
