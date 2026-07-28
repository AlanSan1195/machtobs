import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiResponse } from './_lib/http';

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  getMicProfileFromGroq: vi.fn(),
}));

vi.mock('./_lib/rate-limit', () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock('./_lib/groq', () => ({
  getMicProfileFromGroq: mocks.getMicProfileFromGroq,
}));

import handler from './audio-profile';

function createResponse() {
  let statusCode = 200;
  let body: unknown;
  const response: ApiResponse = {
    status: vi.fn((code: number) => {
      statusCode = code;
      return response;
    }),
    json: vi.fn((value: unknown) => {
      body = value;
    }),
    setHeader: vi.fn(),
  };
  return { response, getStatus: () => statusCode, getBody: () => body };
}

describe('audio profile endpoint', () => {
  beforeEach(() => {
    mocks.checkRateLimit.mockReset();
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 19 });
    mocks.getMicProfileFromGroq.mockReset();
  });

  it('reemplaza la plantilla generica de la IA con decisiones basadas en el perfil', async () => {
    mocks.getMicProfileFromGroq.mockResolvedValue({
      profile: {
        identified: true,
        model: 'FIFINE AmpliGame AM8',
        type: 'dynamic',
        connection: 'usb',
        formFactor: 'standalone',
        pickupPattern: 'cardioid',
        hasBuiltinDsp: false,
        hasSoftwareProcessing: false,
        hasHardwareGainControl: true,
        sensitivityDb: -50,
        summary: 'Microfono dinamico cardioide USB/XLR.',
        sources: ['https://fifinemicrophone.com/products/fifine-ampligame-am8-microphone'],
      },
      filters: {
        noiseSuppression: { enabled: true, method: 'rnnoise', reason: 'Mejora la calidad.' },
        noiseGate: { enabled: true, closeThresholdDb: -45, openThresholdDb: -35, reason: 'Evita sonido fuerte.' },
        gain: { enabled: true, db: 6, reason: 'Sonido natural.' },
        compressor: { enabled: false, ratio: 3, thresholdDb: -18, reason: 'Buena calidad.' },
        limiter: { enabled: true, thresholdDb: -1.5, reason: 'Protege el equipo.' },
      },
      reasoning: 'Respuesta de IA.',
    });
    const result = createResponse();

    await handler({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: { deviceName: 'FIFINE AmpliGame AM8', mode: 'stream_record' },
    }, result.response);

    expect(result.getStatus()).toBe(200);
    expect(result.getBody()).toMatchObject({
      filters: {
        noiseSuppression: { enabled: false },
        noiseGate: { enabled: false },
        gain: { enabled: false, db: 0 },
        compressor: { enabled: true, ratio: 3, thresholdDb: -18 },
        limiter: { enabled: true, thresholdDb: -1.5 },
      },
    });
  });
});
