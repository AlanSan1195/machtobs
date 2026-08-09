import React from 'react';
import { useAppStore } from '../store';
import { getNetworkStabilityReason, getReliableUploadMbps } from '../../shared/networkMeasurement';
import { IconCpu, Section, Spinner } from './ui';

type ComputerReportProps = {
  onConfigure?: () => void;
};

type StatProps = {
  label: string;
  value: string;
  detail: string;
};

function Stat({ label, value, detail }: StatProps) {
  return (
    <div className="border border-paper/12 bg-paper/[0.018] p-4">
      <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-paper/35">{label}</span>
      <p className="mt-2 break-words font-display text-lg font-black uppercase leading-tight text-paper">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-paper/45">{detail}</p>
    </div>
  );
}

export function ComputerReport({ onConfigure }: ComputerReportProps) {
  const {
    analysisTarget,
    systemInfo,
    uploadSpeed,
    recommendation,
    isAnalyzing,
    isMeasuringUpload,
  } = useAppStore();

  if (analysisTarget !== 'pc') return null;

  if (isAnalyzing || isMeasuringUpload) {
    return (
      <Section title="pc.analisis" icon={<IconCpu className="h-4 w-4" />}>
        <div className="flex items-center gap-3">
          <Spinner />
          <span className="text-sm text-text-muted">Analizando el PC y la subida disponible...</span>
        </div>
      </Section>
    );
  }

  if (!recommendation || !systemInfo) {
    return (
      <Section
        title="pc.analisis"
        icon={<IconCpu className="h-4 w-4" />}
        subtitle="Todavia no existe una recomendacion calculada para la fuente PC."
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <p className="max-w-2xl text-sm leading-relaxed text-paper/65">
            Vuelve a Ajustes y ejecuta <span className="font-mono text-primary">analizar --recomendar</span>.
            Machtobs comparara el hardware, la red y la configuracion actual de OBS antes de sugerir cambios.
          </p>
          {onConfigure ? (
            <button
              type="button"
              onClick={onConfigure}
              className="border border-primary/60 bg-primary/10 px-4 py-2.5 font-mono text-[0.65rem] font-bold uppercase tracking-[0.16em] text-primary transition-colors hover:bg-primary/20"
            >
              Volver a ajustes
            </button>
          ) : null}
        </div>
      </Section>
    );
  }

  const reliableUpload = getReliableUploadMbps(uploadSpeed ?? undefined);
  const networkDetail = uploadSpeed
    ? getNetworkStabilityReason(uploadSpeed) || 'Medicion de subida completada para limitar el bitrate de forma segura.'
    : 'No se incorporo una medicion de subida a este analisis.';

  return (
    <Section
      title="pc.analisis"
      icon={<IconCpu className="h-4 w-4" />}
      subtitle="Hardware y red usados para calcular los ajustes de OBS que aparecen en la comparacion."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="cpu"
          value={systemInfo.cpu.model}
          detail={`${systemInfo.cpu.cores} nucleos detectados para estimar la carga disponible.`}
        />
        <Stat
          label="gpu / encoder"
          value={systemInfo.gpu.model}
          detail={`Perfil recomendado: ${recommendation.recommendations.encoder.toUpperCase()}.`}
        />
        <Stat
          label="memoria"
          value={`${systemInfo.ram.total} GB RAM`}
          detail="Se usa para limitar resolucion y carga cuando emision y grabacion trabajan juntas."
        />
        <Stat
          label="subida estable"
          value={reliableUpload ? `${reliableUpload.toFixed(1)} Mbps` : 'No medida'}
          detail={networkDetail}
        />
      </div>
      <p className="mt-4 border-l-2 border-primary/70 pl-3 text-xs leading-relaxed text-paper/55">
        Debajo veras cada valor actual de OBS frente al recomendado y cuales conviene cambiar.
      </p>
    </Section>
  );
}
