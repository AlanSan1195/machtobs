import React from 'react';
import type { AIRecommendation, AIRecommendationField, OBSMode } from '../../shared/types';
import { IconCheck, IconSliders } from './ui';

type ManualSetting = {
  label: string;
  value: string;
  optional?: boolean;
  /** Enlaza el ajuste con la fila de la tabla comparativa; si esta en requiredFields, se resalta. */
  field?: AIRecommendationField;
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
  /** Campos que la comparacion marco como cambio manual; esos ajustes se resaltan en la guia. */
  requiredFields?: AIRecommendationField[];
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
        { label: 'Bitrate', value: `${recommendations.bitrate} Kbps`, field: 'bitrate' },
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
        { label: 'Bitrate', value: `${recommendations.recording_bitrate} Kbps`, field: 'recording_bitrate' },
        {
          label: 'Calidad',
          value: recordingQualityLabel(recommendations.recording_quality),
          optional: true,
          field: 'recording_quality',
        },
        { label: 'Intervalo de fotogramas clave', value: '2 s' },
        { label: 'B-frames', value: 'Activados', optional: true },
        { label: 'AQ espacial', value: 'Automatico', optional: true },
      ],
    });
  }

  return groups;
}

/** Barra lateral imitando la navegacion de Ajustes de OBS, con "Salida" activa. */
function OBSSettingsNav() {
  return (
    <ul className="mt-4 space-y-1" aria-label="Secciones de Ajustes de OBS">
      {['General', 'Emision', 'Salida', 'Audio', 'Video', 'Avanzado'].map((item) => {
        const active = item === 'Salida';
        return (
          <li
            key={item}
            aria-current={active ? 'true' : undefined}
            className={`flex items-center gap-2 border px-2.5 py-1.5 text-sm ${
              active
                ? 'border-warning/45 bg-warning/10 font-medium text-warning'
                : 'border-transparent text-paper/35'
            }`}
          >
            {active && <span className="h-1.5 w-1.5 shrink-0 bg-warning" aria-hidden="true" />}
            {item}
          </li>
        );
      })}
    </ul>
  );
}

export function OBSManualGuide({
  id,
  open,
  mode,
  recommendations,
  requiredFields,
  onClose,
}: OBSManualGuideProps) {
  const [copyState, setCopyState] = React.useState<'idle' | 'copied' | 'failed'>('idle');
  const guideRef = React.useRef<HTMLDivElement>(null);
  const groups = buildManualGroups(mode, recommendations);
  const required = new Set<AIRecommendationField>(
    requiredFields ?? ['bitrate', 'recording_bitrate', 'recording_quality'],
  );
  const groupHasRequired = (group: ManualGroup) =>
    group.settings.some((setting) => setting.field !== undefined && required.has(setting.field));

  // Abre directo en la pestaña que tiene ajustes manuales pendientes.
  const firstRequiredIndex = groups.findIndex(groupHasRequired);
  const [activeTitle, setActiveTitle] = React.useState(
    () => groups[firstRequiredIndex >= 0 ? firstRequiredIndex : 0]?.title,
  );

  React.useEffect(() => {
    if (open) guideRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const activeGroup = groups.find((group) => group.title === activeTitle) ?? groups[0];

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
      <div className="grid lg:grid-cols-[13.5rem_minmax(0,1fr)]">
        <div className="border-b border-warning/20 p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2 text-warning">
            <IconSliders className="h-4 w-4" />
            <h4 className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.18em]">
              Ruta en OBS
            </h4>
          </div>
          <OBSSettingsNav />
          <p className="mt-4 text-xs leading-relaxed text-paper/50">
            Ajustes → Salida, modo Avanzado. Los valores marcados como “manual” son los
            unicos que debes cambiar; el resto es verificacion.
          </p>
          <p className="mt-3 border-l border-paper/20 pl-3 text-xs leading-relaxed text-paper/45">
            Algunas opciones solo aparecen con ciertos encoders. Si no ves una marcada como
            “si aparece”, puedes continuar.
          </p>
        </div>

        <div className="min-w-0 p-4">
          {/* Selector de modo, igual que arriba de las pestañas en OBS */}
          <div className="flex items-center justify-between gap-3 border border-paper/15 bg-paper/[0.025] px-3 py-2.5">
            <span className="text-sm text-paper/60">Modo de salida</span>
            <span className="inline-flex items-center gap-2 border border-paper/15 bg-background px-2.5 py-1 font-mono text-xs text-primary">
              Avanzado
              <span aria-hidden="true" className="text-paper/35">▾</span>
            </span>
          </div>

          {/* Pestñas como en OBS: Emision / Grabacion (el resto, decorativas) */}
          <div
            role="tablist"
            aria-label="Pestañas de salida de OBS"
            className="mt-3 flex flex-wrap items-end gap-1 border-b border-paper/15"
          >
            {groups.map((group) => {
              const active = group.title === activeGroup.title;
              return (
                <button
                  key={group.title}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTitle(group.title)}
                  className={`inline-flex items-center gap-1.5 border border-b-0 px-3.5 py-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] transition-colors ${
                    active
                      ? 'border-paper/25 bg-paper/[0.05] text-paper'
                      : 'border-transparent text-paper/40 hover:text-paper/70'
                  }`}
                >
                  {groupHasRequired(group) && (
                    <span className="h-1.5 w-1.5 shrink-0 bg-warning" aria-hidden="true" />
                  )}
                  {group.title}
                </button>
              );
            })}
            <span
              aria-disabled="true"
              className="px-3.5 py-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-paper/20"
            >
              Audio
            </span>
            <span
              aria-disabled="true"
              className="hidden px-3.5 py-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-paper/20 sm:inline"
            >
              Buffer de repeticion
            </span>
          </div>

          {activeGroup && (
            <div role="tabpanel" aria-label={activeGroup.tab}>
              <div className="flex items-center justify-between border-x border-paper/15 bg-paper/[0.018] px-3 py-2">
                <span className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.16em] text-paper/70">
                  Ajustes de codificacion
                </span>
                <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-primary">
                  {activeGroup.tab}
                </span>
              </div>
              <dl className="border-x border-b border-paper/15">
                {activeGroup.settings.map((setting) => {
                  const isRequired = setting.field !== undefined && required.has(setting.field);
                  return (
                    <div
                      key={setting.label}
                      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-paper/10 px-3 py-2.5 first:border-t-0 ${
                        isRequired ? 'border-l-2 border-l-warning bg-warning/[0.06]' : ''
                      }`}
                    >
                      <dt className={`text-sm ${isRequired ? 'text-paper' : 'text-paper/60'}`}>
                        {isRequired && (
                          <span className="mr-2 inline-flex items-center border border-warning/50 bg-warning/15 px-1.5 py-px align-middle font-mono text-[0.55rem] uppercase tracking-[0.1em] text-warning">
                            manual
                          </span>
                        )}
                        {setting.label}
                        {setting.optional && (
                          <span className="ml-1.5 font-mono text-[0.55rem] uppercase tracking-[0.08em] text-paper/30">
                            si aparece
                          </span>
                        )}
                      </dt>
                      <dd
                        className={`font-mono text-xs font-medium ${
                          isRequired ? 'text-warning' : 'text-primary'
                        }`}
                      >
                        {setting.value}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          )}

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
