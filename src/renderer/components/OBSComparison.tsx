import React from 'react';
import { useAppStore } from '../store';
import { useAppAPI } from '../hooks/useAppAPI';
import { appAPI } from '../lib/app-api';
import { getLocalRecommendationExplanation, isRecommendationExplanationConsistent } from '../../shared/localRecommendation';
import { ConfirmDialog } from './ConfirmDialog';
import { InlineEmphasis } from './InlineEmphasis';
import { OBSManualGuide } from './OBSManualGuide';
import { IconActivity, IconAlert, IconCheck, IconRefresh, Section, Spinner } from './ui';
import {
  recommendationAudioBitrateOptions,
  recommendationEncoderOptions,
  recommendationFpsOptions,
  recommendationRecordingFormatOptions,
  recommendationRecordingQualityOptions,
  recommendationResolutionOptions,
} from '../../shared/recommendationOptions';
import type { AIRecommendation, AIRecommendationField, AIRecommendationSettings, OBSMode, OBSSettingsSnapshot } from '../../shared/types';

const recommendationFields: AIRecommendationField[] = [
  'canvas_resolution',
  'resolution',
  'recording_resolution',
  'fps',
  'encoder',
  'bitrate',
  'recording_encoder',
  'recording_bitrate',
  'audio_bitrate',
  'recording_format',
  'recording_quality',
];

const advancedPluginUnavailable = 'Complemento de Machtobs no detectado';

export type ComparisonRow = {
  label: string;
  /** Explicacion breve de que hace el ajuste, para ensenar al usuario. */
  description?: string;
  current: string;
  recommended: string;
  type?: 'encoder' | 'recordingQuality';
  applyMethod?: 'automatic' | 'manual';
  /** Campo de la recomendacion que alimenta la fila; si existe, la celda es editable. */
  field?: AIRecommendationField;
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function getChangedFields(
  originalRecommendations: AIRecommendationSettings,
  currentRecommendations: AIRecommendationSettings,
): AIRecommendationField[] {
  return recommendationFields.filter((field) => (
    originalRecommendations[field] !== currentRecommendations[field]
  ));
}

function isUsableRecommendation(settings: AIRecommendationSettings): boolean {
  return Boolean(
    /^\d{3,4}x\d{3,4}$/.test(settings.canvas_resolution)
    && /^\d{3,4}x\d{3,4}$/.test(settings.resolution)
    && /^\d{3,4}x\d{3,4}$/.test(settings.recording_resolution)
    && settings.fps > 0
    && settings.bitrate > 0
    && settings.recording_bitrate > 0
    && settings.audio_bitrate > 0
    && settings.encoder.trim()
    && settings.recording_encoder.trim()
    && settings.recording_format.trim()
    && settings.recording_quality.trim(),
  );
}

function getSourceLabel(source: AIRecommendation['source']): string {
  return source === 'ai' ? 'IA integrada' : 'Recomendacion local';
}

export function normalizeEncoder(value: string): string {
  const normalized = normalize(value).replace(/[_-]/g, ' ');

  if ((normalized.includes('apple') || normalized.includes('videotoolbox')) && (normalized.includes('hevc') || normalized.includes('h265') || normalized.includes('h.265'))) return 'apple_hevc';
  if (normalized.includes('apple') || normalized.includes('videotoolbox')) return 'apple_h264';
  if (normalized.includes('nvenc') || normalized.includes('nvidia')) return 'nvenc';
  if (normalized.includes('qsv') || normalized.includes('quick sync') || normalized.includes('intel')) return 'qsv';
  if (normalized.includes('amf') || normalized.includes('amd')) return 'amd';
  if (normalized.includes('x264')) return 'x264';

  return normalized;
}

export function formatEncoderName(value: string): string {
  switch (normalizeEncoder(value)) {
    case 'apple_h264':
      return 'Apple VT H.264 (hardware)';
    case 'apple_hevc':
      return 'Apple VT HEVC (hardware)';
    case 'nvenc':
      return 'NVIDIA NVENC (hardware)';
    case 'qsv':
      return 'Intel Quick Sync (hardware)';
    case 'amd':
      return 'AMD AMF (hardware)';
    case 'x264':
      return 'x264 (CPU)';
    default:
      return value;
  }
}

function normalizeRecordingQuality(value: string): string {
  const normalized = normalize(value).replace(/[_-]/g, ' ');

  if (normalized === 'hq' || normalized === 'high') return 'high';
  if (normalized === 'small' || normalized === 'medium') return 'medium';
  if (normalized === 'stream' || normalized === 'same as stream' || normalized === 'same as stream encoder') return 'stream';
  if (normalized === 'lossless') return 'lossless';

  return normalized;
}

export function isSameValue(row: ComparisonRow): boolean {
  const { current, recommended } = row;
  if (current === '0' || current === 'Desconocido' || current === advancedPluginUnavailable) return false;

  if (row.type === 'encoder') {
    return normalizeEncoder(current) === normalizeEncoder(recommended);
  }

  if (row.type === 'recordingQuality') {
    return normalizeRecordingQuality(current) === normalizeRecordingQuality(recommended);
  }

  return normalize(current) === normalize(recommended);
}

export function buildComparisonRows(
  snapshot: OBSSettingsSnapshot,
  recommendations: AIRecommendation['recommendations'],
  targetMode?: OBSMode | null,
): ComparisonRow[] {
  const advancedAutomatic = snapshot.advancedControl?.available === true;
  const advancedOutputNeeded = targetMode
    ? targetMode !== 'stream_only'
    : snapshot.outputMode === 'Advanced';
  const advancedStreamNeeded = targetMode
    ? targetMode === 'stream_record'
    : snapshot.outputMode === 'Advanced';
  const advancedRecordingNeeded = targetMode
    ? targetMode !== 'stream_only'
    : snapshot.outputMode === 'Advanced';
  const rows: ComparisonRow[] = [
    {
      label: 'Lienzo base',
      description: 'Area donde armas tu escena; debe igualar la resolucion de tu fuente o pantalla.',
      current: snapshot.baseResolution,
      recommended: recommendations.canvas_resolution,
      field: 'canvas_resolution',
    },
    {
      label: 'Salida maestra / grabacion',
      description: 'Resolucion de tus grabaciones; define su nitidez y el peso del archivo.',
      current: snapshot.outputResolution,
      recommended: recommendations.recording_resolution,
      field: 'recording_resolution',
    },
    {
      label: 'Salida del stream',
      description: 'Resolucion que recibe la plataforma; bajarla reduce cortes y carga.',
      current: snapshot.streamResolution ?? snapshot.outputResolution,
      recommended: recommendations.resolution,
      field: 'resolution',
    },
    {
      label: 'FPS',
      description: 'Fluidez del video; mas FPS exigen mas GPU y mas bitrate.',
      current: String(snapshot.fps),
      recommended: String(recommendations.fps),
      field: 'fps',
    },
    {
      label: 'Encoder del stream',
      description: 'Quien comprime el directo; por hardware libera a la CPU.',
      current: snapshot.encoder,
      recommended: recommendations.encoder,
      type: 'encoder',
      field: 'encoder',
    },
    {
      label: 'Bitrate del stream',
      description: 'Datos que envias por segundo; lo limitan tu subida y la plataforma.',
      current: snapshot.bitrate > 0 ? String(snapshot.bitrate) : advancedPluginUnavailable,
      recommended: String(recommendations.bitrate),
      applyMethod: advancedStreamNeeded && !advancedAutomatic ? 'manual' : 'automatic',
      field: 'bitrate',
    },
    {
      label: 'Encoder de grabacion',
      description: 'Quien comprime tus grabaciones; puede ser de mas calidad que el del stream.',
      current: snapshot.advancedOutput?.recordingEncoder ?? snapshot.encoder,
      recommended: recommendations.recording_encoder,
      type: 'encoder',
      field: 'recording_encoder',
    },
    {
      label: 'Bitrate de grabacion',
      description: 'Calidad del archivo; al ser local puede ir muy por encima del stream.',
      current: advancedOutputNeeded
        ? snapshot.recordingBitrate && snapshot.recordingBitrate > 0
          ? String(snapshot.recordingBitrate)
          : advancedPluginUnavailable
        : 'No independiente',
      recommended: String(recommendations.recording_bitrate),
      applyMethod: advancedRecordingNeeded && !advancedAutomatic ? 'manual' : 'automatic',
      field: 'recording_bitrate',
    },
    {
      label: 'Bitrate de audio',
      description: 'Calidad del sonido; 160-320 kbps bastan para voz nitida.',
      current: String(snapshot.audioBitrate),
      recommended: String(recommendations.audio_bitrate),
      field: 'audio_bitrate',
    },
    {
      label: 'Formato de grabacion',
      description: 'Contenedor del video; MKV no pierde la grabacion si OBS se cierra.',
      current: snapshot.recordingFormat,
      recommended: recommendations.recording_format,
      field: 'recording_format',
    },
    {
      label: 'Calidad de grabacion',
      description: 'Nivel de compresion del archivo; mas calidad ocupa mas disco.',
      current: snapshot.recordingQuality,
      recommended: recommendations.recording_quality,
      type: 'recordingQuality',
      applyMethod: advancedRecordingNeeded && !advancedAutomatic ? 'manual' : 'automatic',
      field: 'recording_quality',
    },
  ];

  const stream = snapshot.advancedControl?.stream;
  const recording = snapshot.advancedControl?.recording;
  if (!advancedOutputNeeded || !advancedAutomatic || !stream || !recording) return rows;

  const spatialAQLabel = (value: number) => {
    if (value === 2) return 'Desactivado';
    if (value === 3) return 'Activado';
    return 'Automatico';
  };
  const booleanLabel = (value: boolean) => value ? 'Si' : 'No';

  if (advancedStreamNeeded) {
    rows.splice(6, 0,
      {
        label: 'Control de tasa del stream',
        description: 'Reparto del bitrate; CBR lo mantiene estable, como piden las plataformas.',
        current: stream.rateControl,
        recommended: 'CBR',
        applyMethod: 'automatic',
      },
      {
        label: 'Fotogramas clave del stream',
        description: 'Cada cuanto va un fotograma completo; 2s es el estandar de las plataformas.',
        current: String(stream.keyframeInterval),
        recommended: '2',
        applyMethod: 'automatic',
      },
      {
        label: 'Perfil del stream',
        description: 'Nivel de compresion; "high" rinde mas calidad al mismo bitrate.',
        current: stream.profile,
        recommended: 'high',
        applyMethod: 'automatic',
      },
      {
        label: 'B-frames del stream',
        description: 'Fotogramas predictivos; mejoran la calidad sin subir el bitrate.',
        current: booleanLabel(stream.bFrames),
        recommended: 'Si',
        applyMethod: 'automatic',
      },
      {
        label: 'AQ espacial del stream',
        description: 'Da mas bitrate a las zonas con detalle para evitar pixelado.',
        current: spatialAQLabel(stream.spatialAQMode),
        recommended: 'Automatico',
        applyMethod: 'automatic',
      },
    );
  }

  if (advancedRecordingNeeded) {
    const recordingEncoderIndex = rows.findIndex((row) => row.label === 'Encoder de grabacion');
    rows.splice(recordingEncoderIndex + 2, 0,
      {
        label: 'Control de tasa de grabacion',
        description: 'Reparto del bitrate; CBR lo mantiene estable en toda la grabacion.',
        current: recording.rateControl,
        recommended: 'CBR',
        applyMethod: 'automatic',
      },
      {
        label: 'Fotogramas clave de grabacion',
        description: 'Cada cuanto se guarda un fotograma completo; 2s facilita editar.',
        current: String(recording.keyframeInterval),
        recommended: '2',
        applyMethod: 'automatic',
      },
      {
        label: 'Perfil de grabacion',
        description: 'Nivel de compresion; se conserva el que ya usa tu OBS.',
        current: recording.profile,
        // La recomendación actual no cambia profundidad de color; conservar el
        // perfil detectado evita degradar main10 a main.
        recommended: recording.profile,
        applyMethod: 'automatic',
      },
      {
        label: 'B-frames de grabacion',
        description: 'Fotogramas predictivos; mas calidad sin archivos mas grandes.',
        current: booleanLabel(recording.bFrames),
        recommended: 'Si',
        applyMethod: 'automatic',
      },
      {
        label: 'AQ espacial de grabacion',
        description: 'Da mas bitrate a las zonas con detalle para evitar pixelado.',
        current: spatialAQLabel(recording.spatialAQMode),
        recommended: 'Automatico',
        applyMethod: 'automatic',
      },
    );
  }

  return rows;
}

const editableCellClasses =
  'w-full border border-paper/15 bg-paper/[0.03] px-2 py-1.5 text-sm text-text outline-none transition-colors hover:border-paper/35 focus:border-primary/60';

type RecommendedEditorProps = {
  row: ComparisonRow;
  onChange: (field: AIRecommendationField, value: string | number) => void;
};

function NumericRecommendationEditor({ row, onChange }: RecommendedEditorProps) {
  const field = row.field;
  const [draft, setDraft] = React.useState(row.recommended);

  React.useEffect(() => {
    setDraft(row.recommended);
  }, [row.recommended]);

  if (field !== 'bitrate' && field !== 'recording_bitrate') return null;

  return (
    <span className="relative">
      <input
        type="number"
        min={500}
        max={field === 'bitrate' ? 100000 : 200000}
        step={500}
        value={draft}
        aria-label={`${row.label} recomendado`}
        onChange={(event) => {
          const nextDraft = event.target.value;
          setDraft(nextDraft);
          const value = Number(nextDraft);
          if (Number.isFinite(value) && value > 0) onChange(field, value);
        }}
        className={`${editableCellClasses} w-full pr-[1.75rem]`}
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[0.55rem] uppercase tracking-widest text-paper/25">kbps</span>
    </span>
  );
}

/** Celda "Recomendado" editable: escribe directo en la recomendacion del store. */
function RecommendedEditor({ row, onChange }: RecommendedEditorProps) {
  const field = row.field;
  if (!field) return null;

  if (field === 'bitrate' || field === 'recording_bitrate') {
    return <NumericRecommendationEditor row={row} onChange={onChange} />;
  }

  const selectProps = {
    value: row.recommended,
    'aria-label': `${row.label} recomendado`,
    className: `${editableCellClasses} app-select cursor-pointer`,
  } as const;

  const renderOptions = (options: string[], format?: (value: string) => string) =>
    options.map((option) => (
      <option key={option} value={option} className="bg-background text-text">
        {format ? format(option) : option.toUpperCase()}
      </option>
    ));

  switch (field) {
    case 'canvas_resolution':
    case 'resolution':
    case 'recording_resolution':
      return (
        <select {...selectProps} onChange={(event) => onChange(field, event.target.value)}>
          {renderOptions(recommendationResolutionOptions)}
        </select>
      );
    case 'fps':
      return (
        <select {...selectProps} onChange={(event) => onChange(field, Number(event.target.value))}>
          {recommendationFpsOptions.map((option) => (
            <option key={option} value={option} className="bg-background text-text">{option}</option>
          ))}
        </select>
      );
    case 'encoder':
    case 'recording_encoder':
      return (
        <select {...selectProps} onChange={(event) => onChange(field, event.target.value)}>
          {renderOptions(recommendationEncoderOptions, formatEncoderName)}
        </select>
      );
    case 'audio_bitrate':
      return (
        <select {...selectProps} onChange={(event) => onChange(field, Number(event.target.value))}>
          {recommendationAudioBitrateOptions.map((option) => (
            <option key={option} value={option} className="bg-background text-text">{option}</option>
          ))}
        </select>
      );
    case 'recording_format':
      return (
        <select {...selectProps} onChange={(event) => onChange(field, event.target.value)}>
          {renderOptions(recommendationRecordingFormatOptions)}
        </select>
      );
    case 'recording_quality':
      return (
        <select {...selectProps} onChange={(event) => onChange(field, event.target.value)}>
          {renderOptions(recommendationRecordingQualityOptions)}
        </select>
      );
    default:
      return null;
  }
}

export function OBSComparison() {
  const {
    mode,
    platform,
    systemInfo,
    obsSettingsSnapshot,
    recommendation,
    obsConnected,
    setError,
    setRecommendation,
  } = useAppStore();
  const { getLastBackup, restoreLastBackup } = useAppAPI();
  const [restoreDialogOpen, setRestoreDialogOpen] = React.useState(false);
  const [manualGuideOpen, setManualGuideOpen] = React.useState(false);
  const [backupDate, setBackupDate] = React.useState<string | null>(null);
  const [isExplaining, setIsExplaining] = React.useState(false);
  const [explanationSource, setExplanationSource] = React.useState<AIRecommendation['source'] | null>(null);
  const explanationRequestIdRef = React.useRef(0);
  const manualGuideId = React.useId();

  React.useEffect(() => {
    if (!obsConnected) {
      setBackupDate(null);
      return;
    }

    getLastBackup()
      .then((result) => {
        setBackupDate(result.success && result.backup ? result.backup.createdAt : null);
      })
      .catch(() => setBackupDate(null));
  }, [getLastBackup, obsConnected]);

  React.useEffect(() => {
    if (!recommendation || !mode || !platform || !systemInfo) return undefined;

    const originalRecommendations = recommendation.originalRecommendations ?? recommendation.recommendations;
    const changedFields = getChangedFields(originalRecommendations, recommendation.recommendations);
    if (changedFields.length === 0 || !isUsableRecommendation(recommendation.recommendations)) {
      setIsExplaining(false);
      setExplanationSource(null);
      if (
        changedFields.length === 0
        && recommendation.originalReasoning
        && recommendation.reasoning !== recommendation.originalReasoning
      ) {
        setRecommendation({
          ...recommendation,
          reasoning: recommendation.originalReasoning,
        });
      }
      return undefined;
    }

    const requestId = explanationRequestIdRef.current + 1;
    explanationRequestIdRef.current = requestId;
    setIsExplaining(true);

    const request = {
      systemInfo,
      mode,
      platform,
      originalRecommendations,
      currentRecommendations: recommendation.recommendations,
      changedFields,
    };

    const timeoutId = window.setTimeout(async () => {
      const remoteExplanation = await appAPI.ai.explainRecommendation(request)
        .catch(() => getLocalRecommendationExplanation(request));
      const explanation = isRecommendationExplanationConsistent(request, remoteExplanation.reasoning)
        ? remoteExplanation
        : getLocalRecommendationExplanation(request);

      if (explanationRequestIdRef.current !== requestId) return;

      const latestRecommendation = useAppStore.getState().recommendation;
      if (!latestRecommendation) return;

      setRecommendation({
        ...latestRecommendation,
        originalRecommendations: latestRecommendation.originalRecommendations ?? originalRecommendations,
        reasoning: explanation.reasoning,
      });
      setExplanationSource(explanation.source);
      setIsExplaining(false);
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    mode,
    platform,
    recommendation?.originalRecommendations?.audio_bitrate,
    recommendation?.originalRecommendations?.bitrate,
    recommendation?.originalRecommendations?.canvas_resolution,
    recommendation?.originalRecommendations?.encoder,
    recommendation?.originalRecommendations?.fps,
    recommendation?.originalRecommendations?.recording_format,
    recommendation?.originalRecommendations?.recording_bitrate,
    recommendation?.originalRecommendations?.recording_encoder,
    recommendation?.originalRecommendations?.recording_quality,
    recommendation?.originalRecommendations?.recording_resolution,
    recommendation?.originalRecommendations?.resolution,
    recommendation?.originalReasoning,
    recommendation?.recommendations.audio_bitrate,
    recommendation?.recommendations.bitrate,
    recommendation?.recommendations.canvas_resolution,
    recommendation?.recommendations.encoder,
    recommendation?.recommendations.fps,
    recommendation?.recommendations.recording_format,
    recommendation?.recommendations.recording_bitrate,
    recommendation?.recommendations.recording_encoder,
    recommendation?.recommendations.recording_quality,
    recommendation?.recommendations.recording_resolution,
    recommendation?.recommendations.resolution,
    setRecommendation,
    systemInfo,
  ]);

  if (!obsConnected || !obsSettingsSnapshot || !recommendation) return null;

  const { recommendations } = recommendation;
  const rows = buildComparisonRows(obsSettingsSnapshot, recommendations, mode);
  const originalRecommendations = recommendation.originalRecommendations ?? recommendations;
  const hasUserChanges = getChangedFields(originalRecommendations, recommendations).length > 0;

  const updateRecommendation = (field: AIRecommendationField, value: string | number) => {
    // Conserva el baseline para re-explicar el impacto de cualquier ajuste
    // editable sin necesitar una segunda tabla de recomendaciones.
    const baselineRecommendations = recommendation.originalRecommendations ?? recommendation.recommendations;
    const baselineReasoning = recommendation.originalReasoning ?? recommendation.reasoning;
    setRecommendation({
      ...recommendation,
      originalRecommendations: baselineRecommendations,
      originalReasoning: baselineReasoning,
      recommendations: {
        ...recommendation.recommendations,
        [field]: value,
      } as AIRecommendationSettings,
    });
  };

  const changeCount = rows.filter((row) => !isSameValue(row)).length;
  const manualCount = rows.filter((row) => !isSameValue(row) && row.applyMethod === 'manual').length;
  // Campos que la comparacion marco como cambio manual; la guia resalta solo esos.
  const manualRequiredFields = rows.flatMap((row) =>
    !isSameValue(row) && row.applyMethod === 'manual' && row.field ? [row.field] : [],
  );
  const automaticCount = changeCount - manualCount;
  const readableBackupDate = backupDate ? new Date(backupDate).toLocaleString() : '';

  const handleRestore = async () => {
    try {
      const result = await restoreLastBackup();
      if (!result.success) {
        setError(result.message);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo restaurar la configuracion anterior');
    } finally {
      setRestoreDialogOpen(false);
    }
  };

  return (
    <Section
      title="obs.comparar"
      icon={<IconActivity className="h-4 w-4" />}
      action={
        <>
          {backupDate && (
            <button
              type="button"
              onClick={() => setRestoreDialogOpen(true)}
              className="inline-flex items-center gap-1.5 border border-paper/20 px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-paper/70 transition-colors hover:border-paper/50 hover:text-paper"
            >
              <IconRefresh className="h-3.5 w-3.5" />
              Restaurar configuracion anterior
            </button>
          )}
          <span
            className={`border px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] ${
              changeCount === 0
                ? 'border-secondary/40 bg-secondary/10 text-secondary'
                : 'border-warning/40 bg-warning/10 text-warning'
            }`}
          >
            {obsSettingsSnapshot.advancedControl?.available
              ? `Complemento ${obsSettingsSnapshot.advancedControl.pluginVersion} · `
              : ''}
            {changeCount === 0
              ? 'Sin cambios'
              : `${automaticCount} automatico${automaticCount === 1 ? '' : 's'}`}
            {manualCount > 0 ? ` · ${manualCount} manual${manualCount === 1 ? '' : 'es'}` : ''}
          </span>
        </>
      }
    >
      {recommendation.source === 'local' && (
        <div className="mb-4 flex items-start gap-3 border border-warning/35 bg-warning/[0.06] p-4 text-sm text-warning">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>La IA integrada no respondio o alcanzo su limite. Esta comparacion usa una recomendacion local de respaldo generada por Machtobs.</span>
        </div>
      )}
      <div className="mb-4 grid gap-2 border border-border bg-surface/45 p-3 text-xs text-text-muted sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-4">
        <span className="font-mono font-semibold uppercase tracking-[0.16em] text-primary">
          Recomendado por {getSourceLabel(recommendation.source)}
        </span>
        <span className="sm:text-right">
          Privacidad: solo se usa informacion tecnica del equipo, modo y plataforma; nunca archivos ni claves de OBS.
        </span>
      </div>
      {manualCount > 0 && (
        <div className="mb-4 border border-warning/35 bg-warning/[0.045]">
          <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-warning">
                complemento avanzado no detectado
              </span>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-paper/70">
                OBS WebSocket no expone estos valores por si solo. Instala o activa el complemento
                de Machtobs y vuelve a conectar para detectar y aplicar el bitrate automaticamente.
              </p>
            </div>
            <button
              type="button"
              aria-expanded={manualGuideOpen}
              aria-controls={manualGuideId}
              onClick={() => setManualGuideOpen((open) => !open)}
              className="border border-warning/55 bg-warning/10 px-4 py-2.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.16em] text-warning transition-colors hover:bg-warning/20"
            >
              {manualGuideOpen ? 'Cerrar guia' : 'Ver guia manual'}
            </button>
          </div>
          <OBSManualGuide
            id={manualGuideId}
            open={manualGuideOpen}
            mode={mode}
            recommendations={recommendations}
            requiredFields={manualRequiredFields}
            onClose={() => setManualGuideOpen(false)}
          />
        </div>
      )}
      <div className="overflow-hidden rounded-none border border-border">
        <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto] gap-4 bg-paper/[0.04] px-4 py-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-paper/50 lg:grid">
          <span>Ajuste</span>
          <span>OBS actual</span>
          <span>Recomendado <span className="text-primary/80">/ editable</span></span>
          <span>Estado</span>
        </div>
        {rows.map((row) => {
          const same = isSameValue(row);
          const manual = !same && row.applyMethod === 'manual';
          return (
            <div
              key={row.label}
              className="grid grid-cols-2 items-start gap-3 border-t border-border px-3 py-3 text-sm transition-colors first:border-t-0 hover:bg-surface-hover/70 sm:px-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto] lg:items-center lg:gap-4"
            >
              <span className="col-span-2 min-w-0 lg:col-span-1">
                <span className="block font-medium text-text">{row.label}</span>
                {row.description && (
                  <span className="mt-1 block text-xs leading-snug text-paper/45">{row.description}</span>
                )}
              </span>
              <span className="min-w-0 text-text-muted">
                <span className="mb-1 block font-mono text-[0.55rem] uppercase tracking-[0.14em] text-paper/35 lg:hidden">
                  OBS actual
                </span>
                <span className="block break-words">
                  {row.type === 'encoder' ? formatEncoderName(row.current) : row.current || 'Desconocido'}
                </span>
              </span>
              <span className="block min-w-0 text-text">
                <span className="mb-1 block font-mono text-[0.55rem] uppercase tracking-[0.14em] text-primary/60 lg:hidden">
                  Recomendado
                </span>
                {row.field ? (
                  <RecommendedEditor row={row} onChange={updateRecommendation} />
                ) : (
                  row.type === 'encoder' ? formatEncoderName(row.recommended) : row.recommended
                )}
              </span>
              <span className="col-span-2 whitespace-nowrap lg:col-span-1">
                {same ? (
                  <span className="inline-flex items-center gap-1.5 border border-paper/20 bg-paper/[0.06] px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-paper/70">
                    <IconCheck className="h-3 w-3" />
                    Mantener
                  </span>
                ) : manual ? (
                  <button
                    type="button"
                    aria-expanded={manualGuideOpen}
                    aria-controls={manualGuideId}
                    onClick={() => setManualGuideOpen(true)}
                    className="inline-flex items-center gap-1.5 border border-manual/40 bg-manual/10 px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-manual transition-colors hover:bg-manual/20"
                  >
                    Manual
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 border border-warning/40 bg-warning/10 px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-warning">
                    Cambiar
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {hasUserChanges && (
        <div className="mt-4 border border-primary/30 bg-primary/[0.06] p-4 sm:p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primary">
              Impacto de tus cambios
            </span>
            <span className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-primary">
              {isExplaining && <Spinner className="h-3 w-3" />}
              {isExplaining
                ? 'IA recalculando'
                : explanationSource === 'local'
                  ? 'Analisis verificado'
                  : 'IA integrada actualizada'}
            </span>
          </div>
          <p aria-live="polite" className="text-sm leading-relaxed text-text">
            <InlineEmphasis text={recommendation.reasoning} />
          </p>
        </div>
      )}
      <ConfirmDialog
        open={restoreDialogOpen}
        title="Restaurar configuracion anterior"
        confirmLabel="Restaurar"
        onCancel={() => setRestoreDialogOpen(false)}
        onConfirm={handleRestore}
      >
        <p>Restaurar la configuracion guardada el {readableBackupDate}?</p>
        <p>Machtobs volvera a aplicar los valores de video, salida y servidor guardados en el ultimo respaldo.</p>
      </ConfirmDialog>
    </Section>
  );
}
