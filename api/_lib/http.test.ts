import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ApiRequest, ApiResponse } from './http';
import { requireJsonPost } from './http';

const endpointMocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  getRecommendationFromGroq: vi.fn(),
}));

vi.mock('./rate-limit', () => ({
  checkRateLimit: endpointMocks.checkRateLimit,
}));

vi.mock('./groq', () => ({
  getRecommendationFromGroq: endpointMocks.getRecommendationFromGroq,
}));

import recommendationHandler from '../recommendation';

function request(headers: ApiRequest['headers'] = {}): ApiRequest {
  return { method: 'POST', headers };
}

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

  return {
    response,
    getStatus: () => statusCode,
    getBody: () => body,
  };
}

describe('JSON request boundary', () => {
  beforeEach(() => {
    endpointMocks.checkRateLimit.mockReset();
    endpointMocks.getRecommendationFromGroq.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('allows canonical same-origin JSON POST requests', () => {
    expect(requireJsonPost(request({
      'content-type': 'application/json',
      origin: 'https://machtobs.vercel.app',
    }))).toEqual({ allowed: true });
  });

  test('allows JSON parameters and exact configured origins', () => {
    vi.stubEnv('MACHTOBS_ALLOWED_ORIGINS', 'https://preview.example.com,not a URL,https://ignored.example/path');

    expect(requireJsonPost(request({
      'content-type': 'Application/JSON; Charset=UTF-8',
      origin: 'https://preview.example.com',
    }))).toEqual({ allowed: true });
  });

  test('supports the legacy documented origin variable', () => {
    vi.stubEnv('MATCH_TO_OBS_ALLOWED_ORIGINS', 'https://legacy-preview.example.com');

    expect(requireJsonPost(request({
      'content-type': 'application/json',
      origin: 'https://legacy-preview.example.com',
    }))).toEqual({ allowed: true });
  });

  test.each([
    undefined,
    'text/plain',
    'application/x-www-form-urlencoded',
    'multipart/form-data; boundary=example',
  ])('rejects unsupported content type %s', (contentType) => {
    const headers = contentType ? { 'content-type': contentType } : {};
    expect(requireJsonPost(request(headers))).toMatchObject({ allowed: false, status: 415 });
  });

  test.each([
    'https://machtobs.vercel.app.evil.test',
    'https://evil-machtobs.vercel.app',
    'https://machtobs.vercel.app/path',
    'not an origin',
    'null',
  ])('rejects hostile or malformed origin %s', (origin) => {
    expect(requireJsonPost(request({
      'content-type': 'application/json',
      origin,
    }))).toMatchObject({ allowed: false, status: 403 });
  });

  test('allows no-Origin JSON clients such as the CLI smoke test', () => {
    expect(requireJsonPost(request({ 'content-type': 'application/json' }))).toEqual({ allowed: true });
  });

  test('rejects non-POST methods before other checks', () => {
    expect(requireJsonPost({ method: 'GET', headers: {} })).toMatchObject({ allowed: false, status: 405 });
  });

  test('rejects a request before rate limiting or provider work', async () => {
    const result = createResponse();

    await recommendationHandler({
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: '{}',
    }, result.response);

    expect(result.getStatus()).toBe(415);
    expect(result.getBody()).toEqual({ message: 'Content-Type must be application/json.' });
    expect(endpointMocks.checkRateLimit).not.toHaveBeenCalled();
    expect(endpointMocks.getRecommendationFromGroq).not.toHaveBeenCalled();
  });

  test('maximizes useful 4K recording on an M4 while Twitch stays at 1080p', async () => {
    endpointMocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 19 });
    endpointMocks.getRecommendationFromGroq.mockResolvedValue({
      recommendations: {
        canvas_resolution: '1920x1080',
        resolution: '1920x1080',
        recording_resolution: '1920x1080',
        fps: 60,
        encoder: 'apple vt h264',
        bitrate: 6000,
        recording_encoder: 'apple vt hevc',
        recording_bitrate: 40000,
        audio_bitrate: 320,
        recording_format: 'mkv',
        recording_quality: 'high',
      },
      reasoning: 'La IA propuso conservar todo a 1080p.',
    });
    const result = createResponse();

    await recommendationHandler({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        systemInfo: {
          cpu: { model: 'Apple M4', cores: 10, speed: 4.4 },
          gpu: { model: 'Apple M4', vendor: 'Apple', hasNvenc: false },
          ram: { total: 16 },
          os: { platform: 'darwin', distro: 'macOS', release: '15.5' },
        },
        mode: 'stream_record',
        platform: 'twitch',
        goal: {
          description: 'Usar el maximo potencial util del equipo.',
          source: 'computer',
          sourceResolution: '3840x2160',
        },
        network: { uploadMbps: 5, measuredAt: '2026-08-07T02:00:00.000Z' },
      },
    }, result.response);

    expect(result.getStatus()).toBe(200);
    expect(result.getBody()).toMatchObject({
      recommendations: {
        canvas_resolution: '3840x2160',
        resolution: '1920x1080',
        recording_resolution: '3840x2160',
        fps: 60,
        bitrate: 3500,
        recording_encoder: 'apple vt hevc',
        recording_bitrate: 40000,
      },
    });
    expect((result.getBody() as { reasoning: string }).reasoning).toContain('reserva margen');
    expect((result.getBody() as { reasoning: string }).reasoning).toContain('5.0 Mbps');
    expect((result.getBody() as { reasoning: string }).reasoning).not.toContain('conservar todo a 1080p');
  });

  test('normalizes safe resolution variants returned by the AI provider', async () => {
    endpointMocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 19 });
    endpointMocks.getRecommendationFromGroq.mockResolvedValue({
      recommendations: {
        canvas_resolution: '2560 X 1440p',
        resolution: '1920 × 1080',
        recording_resolution: '1440p',
        fps: 60,
        encoder: 'apple vt h264',
        bitrate: 6000,
        recording_encoder: 'apple vt hevc',
        recording_bitrate: 20000,
        audio_bitrate: 320,
        recording_format: 'mkv',
        recording_quality: 'high',
      },
      reasoning: 'La IA eligio una configuracion equilibrada.',
    });
    const result = createResponse();

    await recommendationHandler({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        systemInfo: {
          cpu: { model: 'Apple M4', cores: 10, speed: 4.4 },
          gpu: { model: 'Apple M4', vendor: 'Apple', hasNvenc: false },
          ram: { total: 16 },
          os: { platform: 'darwin', distro: 'macOS', release: '15.5' },
        },
        mode: 'stream_record',
        platform: 'twitch',
        network: { uploadMbps: 93.1, sustainedUploadMbps: 82.8, stability: 'stable', variationPercent: 11, sampleCount: 5, measuredAt: '2026-08-08T19:52:00.000Z' },
      },
    }, result.response);

    expect(result.getStatus()).toBe(200);
    expect(result.getBody()).toMatchObject({
      source: 'ai',
      recommendations: {
        canvas_resolution: '2560x1440',
        resolution: '1920x1080',
        recording_resolution: '2560x1440',
      },
    });
  });

  test('uses a safe local resolution only when the provider value is ambiguous', async () => {
    endpointMocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 19 });
    endpointMocks.getRecommendationFromGroq.mockResolvedValue({
      recommendations: {
        canvas_resolution: 'cinematic',
        resolution: 'full quality',
        recording_resolution: null,
        fps: 60,
        encoder: 'apple vt h264',
        bitrate: 6000,
        recording_encoder: 'apple vt hevc',
        recording_bitrate: 20000,
        audio_bitrate: 320,
        recording_format: 'mkv',
        recording_quality: 'high',
      },
      reasoning: 'Texto que menciona valores ambiguos.',
    });
    const result = createResponse();

    await recommendationHandler({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        systemInfo: {
          cpu: { model: 'Apple M4', cores: 10, speed: 4.4 },
          gpu: { model: 'Apple M4', vendor: 'Apple', hasNvenc: false },
          ram: { total: 16 },
          os: { platform: 'darwin', distro: 'macOS', release: '15.5' },
        },
        mode: 'stream_record',
        platform: 'twitch',
        network: { uploadMbps: 93.1, sustainedUploadMbps: 82.8, stability: 'stable', variationPercent: 11, sampleCount: 5, measuredAt: '2026-08-08T19:52:00.000Z' },
      },
    }, result.response);

    expect(result.getStatus()).toBe(200);
    expect(result.getBody()).toMatchObject({
      source: 'ai',
      recommendations: {
        canvas_resolution: '1920x1080',
        resolution: '1920x1080',
        recording_resolution: '1920x1080',
      },
    });
    expect((result.getBody() as { reasoning: string }).reasoning).not.toContain('valores ambiguos');
  });

  test('uses hardware-safe encoders instead of unsupported provider labels', async () => {
    endpointMocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 19 });
    endpointMocks.getRecommendationFromGroq.mockResolvedValue({
      recommendations: {
        resolution: '1920x1080',
        fps: 60,
        encoder: 'Apple VideoToolbox H.264 (hardware)',
        bitrate: 6000,
        recording_encoder: 'Apple VideoToolbox HEVC (hardware)',
        recording_bitrate: 16000,
        audio_bitrate: 320,
        recording_format: 'mkv',
        recording_quality: 'high',
      },
      reasoning: 'Resultado de prueba.',
    });
    const result = createResponse();

    await recommendationHandler({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        systemInfo: {
          cpu: { model: 'Apple M3', cores: 8, speed: 3.5 },
          gpu: { model: 'Apple M3 GPU', vram: 8192, vendor: 'Apple', hasNvenc: false },
          ram: { total: 16 },
          os: { platform: 'darwin', distro: 'macOS', release: '15.5' },
        },
        mode: 'stream_record',
        platform: 'twitch',
      },
    }, result.response);

    expect(result.getStatus()).toBe(200);
    expect(result.getBody()).toMatchObject({
      source: 'ai',
      recommendations: {
        encoder: 'apple vt h264',
        recording_encoder: 'apple vt hevc',
      },
    });
  });

  test('returns the safe 502 path for unsupported provider-controlled OBS values', async () => {
    endpointMocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 19 });
    endpointMocks.getRecommendationFromGroq.mockResolvedValue({
      recommendations: {
        resolution: '1920x1080',
        fps: 60,
        encoder: 'apple vt h264',
        bitrate: 6000,
        audio_bitrate: 320,
        recording_format: 'executable',
        recording_quality: 'high',
      },
      reasoning: 'Resultado de prueba.',
    });
    const result = createResponse();

    await recommendationHandler({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: {
        systemInfo: {
          cpu: { model: 'Apple M3', cores: 8, speed: 3.5 },
          gpu: { model: 'Apple M3 GPU', vram: 8192, vendor: 'Apple', hasNvenc: false },
          ram: { total: 16 },
          os: { platform: 'darwin', distro: 'macOS', release: '15.5' },
        },
        mode: 'stream_record',
        platform: 'twitch',
      },
    }, result.response);

    expect(result.getStatus()).toBe(502);
    expect(result.getBody()).toEqual({ message: 'AI recommendation has unsupported recording format.' });
  });
});
