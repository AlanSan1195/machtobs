import { beforeEach, describe, expect, it, vi } from 'vitest';

const speedTestMocks = vi.hoisted(() => ({
  uploadBps: 93_680_000,
  points: [
    { bytes: 100_000, bps: 22_905_983, duration: 35 },
    { bytes: 1_000_000, bps: 80_319_680, duration: 100 },
    { bytes: 1_000_000, bps: 81_541_582, duration: 99 },
    { bytes: 10_000_000, bps: 23_646_363, duration: 3400 },
    { bytes: 10_000_000, bps: 5_943_097, duration: 13_528 },
    { bytes: 10_000_000, bps: 84_685_064, duration: 949 },
  ],
  failWith: '',
  options: undefined as unknown,
}));

vi.mock('@cloudflare/speedtest', () => ({
  default: class FakeSpeedTest {
    private finish: ((results: {
      getUploadBandwidth: () => number | undefined;
      getUploadBandwidthPoints: () => typeof speedTestMocks.points;
    }) => void) | undefined;
    private error: ((message: string) => void) | undefined;

    constructor(options: unknown) {
      speedTestMocks.options = options;
    }

    set onFinish(callback: (results: {
      getUploadBandwidth: () => number | undefined;
      getUploadBandwidthPoints: () => typeof speedTestMocks.points;
    }) => void) {
      this.finish = callback;
    }

    set onError(callback: (message: string) => void) {
      this.error = callback;
    }

    play() {
      if (speedTestMocks.failWith) {
        this.error?.(speedTestMocks.failWith);
        return;
      }
      this.finish?.({
        getUploadBandwidth: () => speedTestMocks.uploadBps,
        getUploadBandwidthPoints: () => speedTestMocks.points,
      });
    }
  },
}));

import { measureUploadSpeed } from './upload-speed';

describe('measureUploadSpeed', () => {
  beforeEach(() => {
    speedTestMocks.uploadBps = 93_680_000;
    speedTestMocks.failWith = '';
    speedTestMocks.options = undefined;
  });

  it('detecta variacion y conserva una subida sostenida', async () => {
    await expect(measureUploadSpeed()).resolves.toMatchObject({
      uploadMbps: 93.7,
      sustainedUploadMbps: 23.6,
      stability: 'unstable',
      variationPercent: 75,
      sampleCount: 5,
    });
    expect(speedTestMocks.options).toMatchObject({
      autoStart: false,
      measureDownloadLoadedLatency: false,
      measureUploadLoadedLatency: false,
      logAimApiUrl: null,
      measurements: [
        { type: 'upload', bytes: 100_000, count: 1 },
        { type: 'upload', bytes: 1_000_000, count: 2 },
        { type: 'upload', bytes: 10_000_000, count: 3 },
      ],
    });
  });

  it('clasifica muestras consistentes como estables', async () => {
    speedTestMocks.uploadBps = 84_000_000;
    speedTestMocks.points = [
      { bytes: 1_000_000, bps: 80_000_000, duration: 100 },
      { bytes: 1_000_000, bps: 82_000_000, duration: 98 },
      { bytes: 10_000_000, bps: 81_000_000, duration: 990 },
      { bytes: 10_000_000, bps: 83_000_000, duration: 970 },
      { bytes: 10_000_000, bps: 84_000_000, duration: 960 },
    ];

    await expect(measureUploadSpeed()).resolves.toMatchObject({
      sustainedUploadMbps: 81,
      stability: 'stable',
      variationPercent: 4,
    });
  });

  it('propaga un error del motor de medicion', async () => {
    speedTestMocks.failWith = 'Cloudflare no disponible.';
    await expect(measureUploadSpeed()).rejects.toThrow('Cloudflare no disponible.');
  });
});
