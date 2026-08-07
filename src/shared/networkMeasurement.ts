import type { UploadSpeedMeasurement } from './types';

export function getReliableUploadMbps(measurement?: UploadSpeedMeasurement): number | undefined {
  return measurement?.sustainedUploadMbps ?? measurement?.uploadMbps;
}

export function getNetworkStabilityReason(measurement?: UploadSpeedMeasurement): string {
  if (!measurement?.stability || measurement.sustainedUploadMbps === undefined) return '';

  const variation = measurement.variationPercent !== undefined
    ? `, con ${measurement.variationPercent}% de variacion entre muestras`
    : '';
  if (measurement.stability === 'unstable') {
    return `La conexion fue inestable${variation}; se usa la subida sostenida de ${measurement.sustainedUploadMbps.toFixed(1)} Mbps en lugar del pico de ${measurement.uploadMbps.toFixed(1)} Mbps.`;
  }
  if (measurement.stability === 'variable') {
    return `La conexion mostro variacion${variation}; se usa la subida sostenida de ${measurement.sustainedUploadMbps.toFixed(1)} Mbps.`;
  }
  return `La conexion fue estable; la subida sostenida fue de ${measurement.sustainedUploadMbps.toFixed(1)} Mbps.`;
}
