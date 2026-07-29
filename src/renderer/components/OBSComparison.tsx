import React from 'react';
import { useAppStore } from '../store';
import { useAppAPI } from '../hooks/useAppAPI';
import { ConfirmDialog } from './ConfirmDialog';
import { IconActivity, IconCheck, IconRefresh, Section } from './ui';
import {
  recommendationAudioBitrateOptions,
  recommendationEncoderOptions,
  recommendationFpsOptions,
  recommendationRecordingFormatOptions,
  recommendationRecordingQualityOptions,
  recommendationResolutionOptions,
} from '../../shared/recommendationOptions';
import type { AIRecommendation, AIRecommendationField, AIRecommendationSettings, OBSSettingsSnapshot } from '../../shared/types';

export type ComparisonRow = {
  label: string;
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
  if (current === '0' || current === 'Desconocido' || current === 'No disponible por WebSocket') return false;

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
): ComparisonRow[] {
  const advancedAutomatic = snapshot.advancedControl?.available === true;
  const rows: ComparisonRow[] = [
    {
      label: 'Lienzo base',
      current: snapshot.baseResolution,
      recommended: recommendations.canvas_resolution,
      field: 'canvas_resolution',
    },
    {
      label: 'Salida maestra / grabacion',
      current: snapshot.outputResolution,
      recommended: recommendations.recording_resolution,
      field: 'recording_resolution',
    },
    {
      label: 'Salida del stream',
      current: snapshot.streamResolution ?? snapshot.outputResolution,
      recommended: recommendations.resolution,
      field: 'resolution',
    },
    {
      label: 'FPS',
      current: String(snapshot.fps),
      recommended: String(recommendations.fps),
      field: 'fps',
    },
    {
      label: 'Encoder del stream',
      current: snapshot.encoder,
      recommended: recommendations.encoder,
      type: 'encoder',
      field: 'encoder',
    },
    {
      label: 'Bitrate del stream',
      current: snapshot.bitrate > 0 ? String(snapshot.bitrate) : 'No disponible por WebSocket',
      recommended: String(recommendations.bitrate),
      applyMethod: snapshot.outputMode === 'Advanced' && !advancedAutomatic ? 'manual' : 'automatic',
      field: 'bitrate',
    },
    {
      label: 'Encoder de grabacion',
      current: snapshot.advancedOutput?.recordingEncoder ?? snapshot.encoder,
      recommended: recommendations.recording_encoder,
      type: 'encoder',
      field: 'recording_encoder',
    },
    {
      label: 'Bitrate de grabacion',
      current: snapshot.outputMode === 'Advanced'
        ? snapshot.recordingBitrate && snapshot.recordingBitrate > 0
          ? String(snapshot.recordingBitrate)
          : 'No disponible por WebSocket'
        : 'No independiente',
      recommended: String(recommendations.recording_bitrate),
      applyMethod: snapshot.outputMode === 'Advanced' && advancedAutomatic ? 'automatic' : 'manual',
      field: 'recording_bitrate',
    },
    {
      label: 'Bitrate de audio',
      current: String(snapshot.audioBitrate),
      recommended: String(recommendations.audio_bitrate),
      field: 'audio_bitrate',
    },
    {
      label: 'Formato de grabacion',
      current: snapshot.recordingFormat,
      recommended: recommendations.recording_format,
      field: 'recording_format',
    },
    {
      label: 'Calidad de grabacion',
      current: snapshot.recordingQuality,
      recommended: recommendations.recording_quality,
      type: 'recordingQuality',
      applyMethod: snapshot.outputMode === 'Advanced' && !advancedAutomatic ? 'manual' : 'automatic',
      field: 'recording_quality',
    },
  ];

  const stream = snapshot.advancedControl?.stream;
  const recording = snapshot.advancedControl?.recording;
  if (!advancedAutomatic || !stream || !recording) return rows;

  const spatialAQLabel = (value: number) => {
    if (value === 2) return 'Desactivado';
    if (value === 3) return 'Activado';
    return 'Automatico';
  };
  const booleanLabel = (value: boolean) => value ? 'Si' : 'No';

  rows.splice(6, 0,
    {
      label: 'Control de tasa del stream',
      current: stream.rateControl,
      recommended: 'CBR',
      applyMethod: 'automatic',
    },
    {
      label: 'Fotogramas clave del stream',
      current: String(stream.keyframeInterval),
      recommended: '2',
      applyMethod: 'automatic',
    },
    {
      label: 'Perfil del stream',
      current: stream.profile,
      recommended: 'high',
      applyMethod: 'automatic',
    },
    {
      label: 'B-frames del stream',
      current: booleanLabel(stream.bFrames),
      recommended: 'Si',
      applyMethod: 'automatic',
    },
    {
      label: 'AQ espacial del stream',
      current: spatialAQLabel(stream.spatialAQMode),
      recommended: 'Automatico',
      applyMethod: 'automatic',
    },
  );

  const recordingEncoderIndex = rows.findIndex((row) => row.label === 'Encoder de grabacion');
  rows.splice(recordingEncoderIndex + 2, 0,
    {
      label: 'Control de tasa de grabacion',
      current: recording.rateControl,
      recommended: 'CBR',
      applyMethod: 'automatic',
    },
    {
      label: 'Fotogramas clave de grabacion',
      current: String(recording.keyframeInterval),
      recommended: '2',
      applyMethod: 'automatic',
    },
    {
      label: 'Perfil de grabacion',
      current: recording.profile,
      // La recomendación actual no cambia profundidad de color; conservar el
      // perfil detectado evita degradar main10 a main.
      recommended: recording.profile,
      applyMethod: 'automatic',
    },
    {
      label: 'B-frames de grabacion',
      current: booleanLabel(recording.bFrames),
      recommended: 'Si',
      applyMethod: 'automatic',
    },
    {
      label: 'AQ espacial de grabacion',
      current: spatialAQLabel(recording.spatialAQMode),
      recommended: 'Automatico',
      applyMethod: 'automatic',
    },
  );

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
    <span className="flex items-center gap-2">
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
        className={`${editableCellClasses} min-w-0 flex-1`}
      />
      <span className="shrink-0 text-xs text-paper/40">kbps</span>
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
  const { obsSettingsSnapshot, recommendation, obsConnected, setError, setRecommendation } = useAppStore();
  const { getLastBackup, restoreLastBackup } = useAppAPI();
  const [restoreDialogOpen, setRestoreDialogOpen] = React.useState(false);
  const [backupDate, setBackupDate] = React.useState<string | null>(null);

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

  if (!obsConnected || !obsSettingsSnapshot || !recommendation) return null;

  const { recommendations } = recommendation;
  const rows = buildComparisonRows(obsSettingsSnapshot, recommendations);

  const updateRecommendation = (field: AIRecommendationField, value: string | number) => {
    // Conserva el baseline para que "config.recomendada" pueda re-explicar el
    // impacto del ajuste del usuario (mismo patron que Recommendations).
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
            {automaticCount} cambio{automaticCount === 1 ? '' : 's'}
            {manualCount > 0 ? ` · ${manualCount} manual${manualCount === 1 ? '' : 'es'}` : ''}
          </span>
        </>
      }
    >
      <div className="overflow-hidden rounded-none border border-border">
        <div className="grid grid-cols-[1fr_1fr_1fr_104px] bg-paper/[0.04] px-4 py-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-paper/50">
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
              className="grid grid-cols-[1fr_1fr_1fr_104px] items-center border-t border-border px-4 py-3 text-sm transition-colors hover:bg-surface-hover/70"
            >
              <span className="font-medium text-text">{row.label}</span>
              <span className="text-text-muted">
                {row.type === 'encoder' ? formatEncoderName(row.current) : row.current || 'Desconocido'}
              </span>
              <span className="block text-text">
                {row.field ? (
                  <RecommendedEditor row={row} onChange={updateRecommendation} />
                ) : (
                  row.type === 'encoder' ? formatEncoderName(row.recommended) : row.recommended
                )}
              </span>
              <span>
                {same ? (
                  <span className="inline-flex items-center gap-1.5 border border-paper/20 bg-paper/[0.06] px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-paper/70">
                    <IconCheck className="h-3 w-3" />
                    Mantener
                  </span>
                ) : manual ? (
                  <span className="inline-flex items-center gap-1.5 border border-warning/40 bg-warning/10 px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-warning">
                    Manual
                  </span>
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
      <ConfirmDialog
        open={restoreDialogOpen}
        title="Restaurar configuracion anterior"
        confirmLabel="Restaurar"
        onCancel={() => setRestoreDialogOpen(false)}
        onConfirm={handleRestore}
      >
        <p>Restaurar la configuracion guardada el {readableBackupDate}?</p>
        <p>Match-to-obs volvera a aplicar los valores de video, salida y servidor guardados en el ultimo respaldo.</p>
      </ConfirmDialog>
    </Section>
  );
}
