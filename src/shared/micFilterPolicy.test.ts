import { describe, expect, it } from 'vitest';
import type { MicProfileResponse } from './types';
import { applyEvidenceBasedMicFilterPolicy } from './micFilterPolicy';

function makeProfile(overrides: Partial<MicProfileResponse['profile']>): MicProfileResponse {
  return {
    source: 'ai',
    profile: {
      identified: true,
      model: 'Microfono',
      type: 'unknown',
      connection: 'unknown',
      hasBuiltinDsp: false,
      summary: '',
      sources: ['https://example.com/spec'],
      ...overrides,
    },
    filters: {
      noiseSuppression: { enabled: true, method: 'rnnoise', reason: 'generico' },
      noiseGate: { enabled: true, closeThresholdDb: -45, openThresholdDb: -35, reason: 'generico' },
      gain: { enabled: true, db: 6, reason: 'generico' },
      compressor: { enabled: false, ratio: 3, thresholdDb: -18, reason: 'generico' },
      limiter: { enabled: true, thresholdDb: -1.5, reason: 'generico' },
    },
    reasoning: 'Perfil de prueba.',
  };
}

describe('applyEvidenceBasedMicFilterPolicy', () => {
  it('usa el rechazo natural y compresion moderada para FIFINE AM8', () => {
    const result = applyEvidenceBasedMicFilterPolicy(makeProfile({
      model: 'FIFINE AmpliGame AM8',
      type: 'dynamic',
      connection: 'usb',
      formFactor: 'standalone',
      pickupPattern: 'cardioid',
      hasHardwareGainControl: true,
      sensitivityDb: -50,
    }), 'stream_record');

    expect(result.filters.noiseSuppression.enabled).toBe(false);
    expect(result.filters.noiseGate.enabled).toBe(false);
    expect(result.filters.gain.enabled).toBe(false);
    expect(result.filters.compressor).toMatchObject({ enabled: true, ratio: 3, thresholdDb: -18 });
    expect(result.filters.gain.reason).toContain('-50 dB');
  });

  it('omite procesamiento duplicado para Astro A50 X', () => {
    const result = applyEvidenceBasedMicFilterPolicy(makeProfile({
      model: 'Logitech G Astro A50 X',
      type: 'electret',
      connection: 'wireless',
      formFactor: 'headset',
      pickupPattern: 'omnidirectional',
      hasSoftwareProcessing: true,
      hasNoiseReduction: true,
      hasNoiseGate: true,
      sampleRateKhz: 48,
    }), 'stream_record');

    expect(result.filters.noiseSuppression.enabled).toBe(false);
    expect(result.filters.noiseGate.enabled).toBe(false);
    expect(result.filters.gain.enabled).toBe(false);
    expect(result.filters.compressor).toMatchObject({ enabled: true, ratio: 2, thresholdDb: -18 });
    expect(result.filters.compressor.reason).toContain('boom cercano');
    expect(result.filters.limiter.enabled).toBe(true);
  });

  it('produce cadenas distintas para un dinamico sin DSP y un headset procesado', () => {
    const am8 = applyEvidenceBasedMicFilterPolicy(makeProfile({
      model: 'FIFINE AM8',
      type: 'dynamic',
      formFactor: 'standalone',
      pickupPattern: 'cardioid',
    }), 'stream_only');
    const a50 = applyEvidenceBasedMicFilterPolicy(makeProfile({
      model: 'Astro A50 X',
      formFactor: 'headset',
      pickupPattern: 'omnidirectional',
      hasSoftwareProcessing: true,
      hasNoiseReduction: true,
      hasNoiseGate: true,
    }), 'stream_only');

    expect(am8.filters).not.toEqual(a50.filters);
    expect(am8.filters.compressor.ratio).toBe(3);
    expect(a50.filters.compressor.ratio).toBe(2);
  });
});
