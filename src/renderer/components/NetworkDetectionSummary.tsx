import React from 'react';
import { getReliableUploadMbps } from '../../shared/networkMeasurement';
import { useAppStore } from '../store';

function safeUploadMbps(uploadMbps: number): number {
  return uploadMbps * 0.7;
}

function connectionMargin(safeMbps: number, recommendedKbps?: number): string {
  if (!recommendedKbps) return 'pendiente';
  const ratio = safeMbps * 1000 / recommendedKbps;
  if (ratio >= 3) return 'excelente';
  if (ratio >= 1.5) return 'holgado';
  if (ratio > 1.05) return 'suficiente';
  return 'red al limite';
}

const stabilityLabels = {
  stable: 'estable',
  variable: 'variable',
  unstable: 'inestable',
} as const;

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0 border-l border-paper/10 px-3 first:border-l-0">
      <span className="block truncate font-mono text-[0.48rem] uppercase tracking-[0.14em] text-paper/35">{label}</span>
      <strong className={`mt-1 block truncate font-mono text-[0.72rem] font-semibold ${accent ? 'text-primary' : 'text-paper/80'}`}>
        {value}
      </strong>
    </div>
  );
}

export function NetworkDetectionSummary() {
  const uploadSpeed = useAppStore((state) => state.uploadSpeed);
  const recommendation = useAppStore((state) => state.recommendation);

  if (!uploadSpeed) return null;

  const sustainedMbps = getReliableUploadMbps(uploadSpeed) ?? uploadSpeed.uploadMbps;
  const safeMbps = safeUploadMbps(sustainedMbps);
  const recommendedBitrate = recommendation?.recommendations.bitrate;
  const measuredAt = new Date(uploadSpeed.measuredAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const stability = uploadSpeed.stability ? stabilityLabels[uploadSpeed.stability] : 'no evaluada';
  const unstable = uploadSpeed.stability === 'unstable';
  const variable = uploadSpeed.stability === 'variable';

  return (
    <aside
      aria-label="Resumen de red detectada"
      className='  max-w-3xl'
      
    >
      <div className="flex items-center justify-between gap-3 border-b border-paper/10 px-3 py-2">
        <span className="font-mono text-[0.52rem] uppercase tracking-[0.18em] text-paper/45">
          red / {measuredAt}
        </span>
        <span className={`font-mono text-[0.52rem] font-bold uppercase tracking-[0.14em] ${
          unstable ? 'text-red-400' : variable ? 'text-warning' : 'text-primary'
        }`}>
          <Metric label="segura 70%" value={`${safeMbps.toFixed(1)} Mbps`} accent />
        </span>
      </div>

      <div className="grid grid-cols-2 gap-y-3 py-3 sm:grid-cols-4 sm:gap-y-0">
        <Metric label="observada" value={`${uploadSpeed.uploadMbps.toFixed(1)} Mbps`} />
        <Metric label="sostenida" value={`${sustainedMbps.toFixed(1)} Mbps`} />
       
        <Metric label="bitrate OBS" value={recommendedBitrate ? `${recommendedBitrate} kbps` : 'pendiente'} />
        <Metric label="margen" value={connectionMargin(safeMbps, recommendedBitrate)} />
      </div>

      {unstable || variable ? (
        <p className={`border-t px-3 py-2 text-[0.65rem] leading-relaxed ${
          unstable
            ? 'border-red-400/20 bg-red-400/[0.05] text-red-200/75'
            : 'border-warning/20 bg-warning/[0.05] text-warning/75'
        }`}>
          Se usa la subida sostenida de {sustainedMbps.toFixed(1)} Mbps, no el pico de {uploadSpeed.uploadMbps.toFixed(1)} Mbps, para proteger el stream.
        </p>
      ) : null}
    </aside>
  );
}
