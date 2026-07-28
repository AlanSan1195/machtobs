import { describe, expect, it } from 'vitest';
import { getLocalMicProfile } from './localMicProfile';
import type { MicProfileRequest } from './types';

function makeRequest(overrides: Partial<MicProfileRequest> = {}): MicProfileRequest {
  return { deviceName: 'Microphone', mode: 'record_only', ...overrides };
}

describe('getLocalMicProfile', () => {
  it('identifica un condensador y activa la compuerta con ganancia moderada', () => {
    const result = getLocalMicProfile(makeRequest({ deviceName: 'Blue Yeti' }));
    expect(result.source).toBe('local');
    expect(result.profile.identified).toBe(true);
    expect(result.profile.type).toBe('condenser');
    expect(result.profile.connection).toBe('usb');
    expect(result.filters.noiseGate.enabled).toBe(true);
    expect(result.filters.gain.db).toBeLessThan(10);
  });

  it('identifica Elgato Wave:3 como condensador USB aun sin la API remota', () => {
    const result = getLocalMicProfile(makeRequest({ deviceName: 'Elgato Wave:3' }));

    expect(result.profile.identified).toBe(true);
    expect(result.profile.type).toBe('condenser');
    expect(result.profile.connection).toBe('usb');
  });

  it('distingue un FIFINE AM8 dinamico de un headset Astro A50 X', () => {
    const am8 = getLocalMicProfile(makeRequest({ deviceName: 'FIFINE AmpliGame AM8 USB/XLR' }));
    const a50 = getLocalMicProfile(makeRequest({ deviceName: 'Astro A50 X Wireless Headset' }));

    expect(am8.profile).toMatchObject({
      identified: true,
      type: 'dynamic',
      formFactor: 'standalone',
      pickupPattern: 'cardioid',
      hasBuiltinDsp: false,
      sensitivityDb: -50,
    });
    expect(a50.profile).toMatchObject({
      identified: true,
      formFactor: 'headset',
      pickupPattern: 'omnidirectional',
      hasBuiltinDsp: false,
      hasSoftwareProcessing: true,
      hasNoiseReduction: true,
      hasNoiseGate: true,
      hasCompressor: false,
      hasLimiter: false,
      connection: 'wireless',
      sampleRateKhz: 48,
    });
  });

  it('identifica un dinamico y sube la ganancia sin compuerta por defecto', () => {
    const result = getLocalMicProfile(makeRequest({ deviceName: 'Shure SM7B' }));
    expect(result.profile.type).toBe('dynamic');
    expect(result.profile.connection).toBe('xlr');
    expect(result.filters.gain.db).toBeGreaterThan(10);
    expect(result.filters.noiseGate.enabled).toBe(false);
  });

  it('omite la supresion de ruido cuando detecta DSP integrado', () => {
    const result = getLocalMicProfile(makeRequest({ deviceName: 'NVIDIA Broadcast' }));
    expect(result.profile.hasBuiltinDsp).toBe(true);
    expect(result.filters.noiseSuppression.enabled).toBe(false);
  });

  it('da valores conservadores cuando el nombre es generico', () => {
    const result = getLocalMicProfile(makeRequest({ deviceName: 'Default' }));
    expect(result.profile.identified).toBe(false);
    expect(result.profile.type).toBe('unknown');
    expect(result.filters.gain.enabled).toBe(true);
    expect(result.filters.compressor.enabled).toBe(true);
  });

  it('endurece el compresor en modo de streaming', () => {
    const stream = getLocalMicProfile(makeRequest({ deviceName: 'Default', mode: 'stream_record' }));
    const record = getLocalMicProfile(makeRequest({ deviceName: 'Default', mode: 'record_only' }));
    expect(stream.filters.compressor.ratio).toBeGreaterThan(record.filters.compressor.ratio);
  });
});
