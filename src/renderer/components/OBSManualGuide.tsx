import React from 'react';
import type { AIRecommendation, OBSMode } from '../../shared/types';
import { IconCheck, IconSliders } from './ui';

type ManualSetting = {
  label: string;
  value: string;
  optional?: boolean;
};

type ManualGroup = {
  title: string;
  tab: string;
  settings: ManualSetting[];
};

type OBSManualGuideProps = {
  id: string;
  open: boolean;
  mode: OBSMode | null;
  recommendations: AIRecommendation['recommendations'];
  onClose: () => void;
};

function recordingQualityLabel(value: string): string {
  switch (value.trim().toLowerCase()) {
    case 'lossless':
      return 'Sin perdida';
    case 'high':
    case 'hq':
      return 'Alta';
    case 'medium':
    case 'small':
      return 'Media';
    case 'low':
      return 'Baja';
    default:
      return value;
  }
}

export function buildManualGroups(
  mode: OBSMode | null,
  recommendations: AIRecommendation['recommendations'],
): ManualGroup[] {
  const includeStream = mode !== 'record_only';
  const includeRecording = mode !== 'stream_only';
  const groups: ManualGroup[] = [];

  if (includeStream) {
    groups.push({
      title: 'Emision',
      tab: 'Pestaña Emision',
      settings: [
        { label: 'Control de tasa', value: 'CBR' },
        { label: 'Bitrate', value: `${recommendations.bitrate} Kbps` },
        { label: 'Intervalo de fotogramas clave', value: '2 s' },
        { label: 'Perfil', value: 'High' },
        { label: 'B-frames', value: 'Activados', optional: true },
        { label: 'AQ espacial', value: 'Automatico', optional: true },
      ],
    });
  }

  if (includeRecording) {
    groups.push({
      title: 'Grabacion',
      tab: 'Pestaña Grabacion',
      settings: [
        { label: 'Control de tasa', value: 'CBR' },
        { label: 'Bitrate', value: `${recommendations.recording_bitrate} Kbps` },
        {
          label: 'Calidad',
          value: recordingQualityLabel(recommendations.recording_quality),
          optional: true,
        },
        { label: 'Intervalo de fotogramas clave', value: '2 s' },
        { label: 'B-frames', value: 'Activados', optional: true },
        { label: 'AQ espacial', value: 'Automatico', optional: true },
      ],
    });
  }

  return groups;
}

export function OBSManualGuide({
  id,
  open,
  mode,
  recommendations,
  onClose,
}: OBSManualGuideProps) {
  const [copyState, setCopyState] = React.useState<'idle' | 'copied' | 'failed'>('idle');
  const guideRef = React.useRef<HTMLDivElement>(null);
  const groups = buildManualGroups(mode, recommendations);

  React.useEffect(() => {
    if (open) guideRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const copyValues = async () => {
    const text = groups
      .map((group) => [
        `${group.title}:`,
        ...group.settings.map((setting) => `- ${setting.label}: ${setting.value}`),
      ].join('\n'))
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <div
      ref={guideRef}
      id={id}
      tabIndex={-1}
      className="border-t border-warning/25 bg-background/70 focus:outline-none"
    >
      <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="border-b border-warning/20 p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 text-warning">
            <IconSliders className="h-4 w-4" />
            <h4 className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.18em]">
              Ruta en OBS
            </h4>
          </div>
          <ol className="mt-4 space-y-4">
            {[
              'Abre Ajustes en OBS.',
              'Entra en Salida.',
              'Selecciona el modo Avanzado.',
              'Copia los valores de cada pestaña.',
            ].map((instruction, index) => (
              <li key={instruction} className="grid grid-cols-[1.5rem_1fr] gap-2 text-sm text-paper/70">
                <span className="font-mono text-[0.62rem] text-warning">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-l border-paper/20 pl-3 text-xs leading-relaxed text-paper/45">
            Algunas opciones solo aparecen con ciertos encoders. Si no ves una marcada como
            “si aparece”, puedes continuar.
          </p>
        </div>

        <div className="min-w-0 p-4">
          <div className="grid gap-3 xl:grid-cols-2">
            {groups.map((group) => (
              <section key={group.title} aria-labelledby={`${id}-${group.title}`}>
                <div className="flex items-center justify-between border border-paper/15 bg-paper/[0.025] px-3 py-2.5">
                  <h5
                    id={`${id}-${group.title}`}
                    className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.16em] text-paper"
                  >
                    {group.title}
                  </h5>
                  <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-primary">
                    {group.tab}
                  </span>
                </div>
                <dl className="border-x border-b border-paper/15">
                  {group.settings.map((setting) => (
                    <div
                      key={setting.label}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-paper/10 px-3 py-2.5 first:border-t-0"
                    >
                      <dt className="text-sm text-paper/60">
                        {setting.label}
                        {setting.optional && (
                          <span className="ml-1.5 font-mono text-[0.55rem] uppercase tracking-[0.08em] text-paper/30">
                            si aparece
                          </span>
                        )}
                      </dt>
                      <dd className="font-mono text-xs font-medium text-primary">{setting.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-paper/10 pt-4">
            <p role="status" className="text-xs text-paper/45">
              {copyState === 'copied'
                ? 'Valores copiados al portapapeles.'
                : copyState === 'failed'
                  ? 'No se pudo copiar; los valores siguen visibles arriba.'
                  : 'Sin complemento, Match-to-obs no puede verificar estos valores automáticamente.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyValues()}
                className="border border-paper/20 px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-paper/70 transition-colors hover:border-paper/45 hover:text-paper"
              >
                Copiar valores
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-warning px-3 py-2 font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-background transition-colors hover:bg-warning/85"
              >
                <IconCheck className="h-3.5 w-3.5" />
                Cerrar guia
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
