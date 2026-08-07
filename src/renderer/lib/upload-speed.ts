import SpeedTest from '@cloudflare/speedtest';
import type { UploadSpeedMeasurement } from '../../shared/types';

const UPLOAD_MEASUREMENTS = [
  { type: 'upload' as const, bytes: 100_000, count: 1, bypassMinDuration: true },
  { type: 'upload' as const, bytes: 1_000_000, count: 2 },
  { type: 'upload' as const, bytes: 10_000_000, count: 3 },
];

type UploadBandwidthPoint = {
  bytes: number;
  bps: number;
  duration: number;
};

type UploadSummary = Pick<
  UploadSpeedMeasurement,
  'uploadMbps' | 'sustainedUploadMbps' | 'stability' | 'variationPercent' | 'sampleCount'
>;

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function summarizeUploadBandwidth(
  reportedUploadBps: number,
  points: UploadBandwidthPoint[],
): UploadSummary | null {
  const validSamplesMbps = points
    .filter((point) => point.bytes >= 1_000_000
      && point.duration >= 20
      && Number.isFinite(point.bps)
      && point.bps > 0)
    .map((point) => point.bps / 1_000_000);
  if (!Number.isFinite(reportedUploadBps) || reportedUploadBps <= 0 || validSamplesMbps.length < 3) {
    return null;
  }

  const uploadMbps = reportedUploadBps / 1_000_000;
  const sustainedUploadMbps = Math.min(uploadMbps, percentile(validSamplesMbps, 0.25));
  const sustainedRatio = sustainedUploadMbps / uploadMbps;
  const stability = sustainedRatio >= 0.75
    ? 'stable'
    : sustainedRatio >= 0.5
      ? 'variable'
      : 'unstable';

  return {
    uploadMbps: Math.round(Math.min(uploadMbps, 100_000) * 10) / 10,
    sustainedUploadMbps: Math.round(Math.min(sustainedUploadMbps, 100_000) * 10) / 10,
    stability,
    variationPercent: Math.round((1 - sustainedRatio) * 100),
    sampleCount: validSamplesMbps.length,
  };
}

export async function measureUploadSpeed(): Promise<UploadSpeedMeasurement> {
  return new Promise((resolve, reject) => {
    const test = new SpeedTest({
      autoStart: false,
      measurements: UPLOAD_MEASUREMENTS,
      measureDownloadLoadedLatency: false,
      measureUploadLoadedLatency: false,
      logMeasurementApiUrl: null,
      logAimApiUrl: null,
      bandwidthMinRequestDuration: 20,
    });
    let settled = false;

    test.onError = (message) => {
      if (settled) return;
      settled = true;
      reject(new Error(message || 'No se pudo completar la prueba de subida con Cloudflare.'));
    };
    test.onFinish = (results) => {
      if (settled) return;
      const uploadBps = results.getUploadBandwidth();
      const summary = uploadBps
        ? summarizeUploadBandwidth(uploadBps, results.getUploadBandwidthPoints())
        : null;
      if (!summary) {
        settled = true;
        reject(new Error('Cloudflare no devolvio suficientes muestras validas de subida.'));
        return;
      }

      settled = true;
      resolve({
        ...summary,
        measuredAt: new Date().toISOString(),
      });
    };

    test.play();
  });
}
