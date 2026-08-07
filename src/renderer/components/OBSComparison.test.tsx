// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildComparisonRows, formatEncoderName, isSameValue, OBSComparison } from './OBSComparison';
import { useAppStore } from '../store';
import type { AIRecommendation, OBSSettingsSnapshot } from '../../shared/types';

const appApiMocks = vi.hoisted(() => ({
  explainRecommendation: vi.fn(),
  getLastBackup: vi.fn().mockResolvedValue({ success: false }),
  restoreLastBackup: vi.fn(),
}));

vi.mock('../lib/app-api', () => ({
  appAPI: {
    ai: {
      explainRecommendation: appApiMocks.explainRecommendation,
    },
    obs: {
      getLastBackup: appApiMocks.getLastBackup,
      restoreLastBackup: appApiMocks.restoreLastBackup,
      onConnectionChanged: vi.fn(() => () => undefined),
    },
  },
}));

const snapshot: OBSSettingsSnapshot = {
  streamServer: 'rtmp://live.twitch.tv/app',
  baseResolution: '1920x1080',
  outputResolution: '1920x1080',
  fps: 60,
  encoder: 'NVIDIA NVENC H.264',
  bitrate: 6000,
  audioBitrate: 320,
  recordingFormat: 'mkv',
  recordingQuality: 'HQ',
};

const recommendations: AIRecommendation['recommendations'] = {
  canvas_resolution: '3840x2160',
  resolution: '1920x1080',
  recording_resolution: '3840x2160',
  fps: 60,
  encoder: 'nvenc',
  bitrate: 6000,
  recording_encoder: 'nvenc',
  recording_bitrate: 60000,
  audio_bitrate: 320,
  recording_format: 'mkv',
  recording_quality: 'high',
};

describe('isSameValue', () => {
  it('normaliza encoders equivalentes', () => {
    expect(isSameValue({
      label: 'Encoder',
      current: 'NVIDIA NVENC H.264',
      recommended: 'nvenc',
      type: 'encoder',
    })).toBe(true);
  });

  it('distingue Apple VideoToolbox H264 de HEVC', () => {
    expect(isSameValue({
      label: 'Encoder de grabacion',
      current: 'com.apple.videotoolbox.videoencoder.ave.hevc',
      recommended: 'apple vt hevc',
      type: 'encoder',
    })).toBe(true);
    expect(isSameValue({
      label: 'Encoder de grabacion',
      current: 'com.apple.videotoolbox.videoencoder.ave.avc',
      recommended: 'apple vt hevc',
      type: 'encoder',
    })).toBe(false);
  });

  it('normaliza calidades de grabacion equivalentes', () => {
    expect(isSameValue({
      label: 'Calidad de grabacion',
      current: 'HQ',
      recommended: 'high',
      type: 'recordingQuality',
    })).toBe(true);
  });
});

describe('buildComparisonRows', () => {
  it('construye filas comparables desde snapshot y recomendacion', () => {
    const rows = buildComparisonRows(snapshot, recommendations);

    expect(rows).toHaveLength(11);
    expect(rows.find((row) => row.label === 'Lienzo base')?.recommended).toBe('3840x2160');
    expect(rows.find((row) => row.label === 'Salida del stream')?.recommended).toBe('1920x1080');
    expect(rows.find((row) => row.label === 'Salida maestra / grabacion')?.recommended).toBe('3840x2160');
    expect(rows.find((row) => row.label === 'Encoder de grabacion')?.recommended).toBe('nvenc');
    expect(rows.find((row) => row.label === 'Bitrate de grabacion')?.recommended).toBe('60000');
  });

  it('etiqueta las filas base con el campo editable de la recomendacion', () => {
    const rows = buildComparisonRows(snapshot, recommendations);

    expect(rows.find((row) => row.label === 'Lienzo base')?.field).toBe('canvas_resolution');
    expect(rows.find((row) => row.label === 'FPS')?.field).toBe('fps');
    expect(rows.find((row) => row.label === 'Encoder del stream')?.field).toBe('encoder');
    expect(rows.find((row) => row.label === 'Bitrate de grabacion')?.field).toBe('recording_bitrate');
    expect(rows.find((row) => row.label === 'Calidad de grabacion')?.field).toBe('recording_quality');
    expect(rows.every((row) => row.field !== undefined)).toBe(true);
  });

  it('explica brevemente que hace cada ajuste de la tabla', () => {
    const rows = buildComparisonRows(snapshot, recommendations);

    expect(rows.every((row) => typeof row.description === 'string' && row.description.length > 0)).toBe(true);
    expect(rows.find((row) => row.label === 'FPS')?.description).toContain('Fluidez');
  });

  it('no confunde el bitrate simple con el bitrate avanzado no expuesto por OBS', () => {
    const rows = buildComparisonRows({
      ...snapshot,
      outputMode: 'Advanced',
      encoder: 'com.apple.videotoolbox.videoencoder.ave.avc',
      bitrate: 0,
      audioBitrate: 320,
      advancedOutput: {
        streamEncoder: 'com.apple.videotoolbox.videoencoder.ave.avc',
        recordingEncoder: 'com.apple.videotoolbox.videoencoder.ave.hevc',
        streamRescaleResolution: '1920x1080',
        recordingRescaleResolution: '1920x1080',
        streamRescaleFilter: '0',
        recordingRescaleFilter: '0',
        recordingFormat: 'mkv',
      },
    }, recommendations);

    expect(rows.find((row) => row.label === 'Bitrate del stream')).toMatchObject({
      current: 'Complemento de Machtobs no detectado',
      applyMethod: 'manual',
    });
    expect(rows.find((row) => row.label === 'Bitrate de grabacion')).toMatchObject({
      current: 'Complemento de Machtobs no detectado',
      applyMethod: 'manual',
    });
    expect(rows.find((row) => row.label === 'Bitrate de audio')?.current).toBe('320');
  });

  it('usa los valores reales y marca automática toda la codificación cuando está el complemento', () => {
    const rows = buildComparisonRows({
      ...snapshot,
      outputMode: 'Advanced',
      bitrate: 8000,
      recordingBitrate: 40000,
      recordingQuality: 'high',
      advancedControl: {
        available: true,
        pluginVersion: '0.1.0',
        outputMode: 'Advanced',
        stream: {
          available: true,
          encoderId: 'com.apple.videotoolbox.videoencoder.ave.avc',
          active: false,
          rateControl: 'CBR',
          bitrate: 8000,
          quality: 60,
          limitBitrate: false,
          maxBitrate: 6000,
          maxBitrateWindow: 1.5,
          keyframeInterval: 2,
          profile: 'high',
          bFrames: true,
          spatialAQMode: 1,
        },
        recording: {
          available: true,
          encoderId: 'com.apple.videotoolbox.videoencoder.ave.hevc',
          active: false,
          rateControl: 'CBR',
          bitrate: 40000,
          quality: 76,
          limitBitrate: false,
          maxBitrate: 6000,
          maxBitrateWindow: 1.5,
          keyframeInterval: 2,
          profile: 'main10',
          bFrames: true,
          spatialAQMode: 1,
        },
      },
    }, recommendations);

    expect(rows).toHaveLength(21);
    expect(rows.find((row) => row.label === 'Bitrate del stream')).toMatchObject({
      current: '8000',
      applyMethod: 'automatic',
    });
    expect(rows.find((row) => row.label === 'Bitrate de grabacion')).toMatchObject({
      current: '40000',
      applyMethod: 'automatic',
    });
    expect(rows.find((row) => row.label === 'Control de tasa del stream')?.current).toBe('CBR');
    expect(rows.find((row) => row.label === 'Perfil de grabacion')).toMatchObject({
      current: 'main10',
      recommended: 'main10',
    });
    expect(rows.filter((row) => row.applyMethod === 'manual')).toHaveLength(0);
  });

  it('mantiene la tabla base y marca solo sus ajustes avanzados cuando falta el complemento', () => {
    const rows = buildComparisonRows(snapshot, recommendations, 'stream_record');
    const manualLabels = rows
      .filter((row) => row.applyMethod === 'manual')
      .map((row) => row.label);

    expect(rows).toHaveLength(11);
    expect(manualLabels).toEqual([
      'Bitrate del stream',
      'Bitrate de grabacion',
      'Calidad de grabacion',
    ]);
  });
});

describe('formatEncoderName', () => {
  it('presenta los identificadores internos de Apple como nombres legibles', () => {
    expect(formatEncoderName('com.apple.videotoolbox.videoencoder.ave.avc')).toBe('Apple VT H.264 (hardware)');
    expect(formatEncoderName('com.apple.videotoolbox.videoencoder.ave.hevc')).toBe('Apple VT HEVC (hardware)');
  });
});

describe('columna Recomendado editable', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    appApiMocks.getLastBackup.mockResolvedValue({ success: false });
    appApiMocks.explainRecommendation.mockRejectedValue(new Error('IA no disponible'));
    act(() => {
      useAppStore.setState({
        mode: 'stream_record',
        platform: null,
        systemInfo: null,
        obsConnected: true,
        obsSettingsSnapshot: { ...snapshot, streamResolution: '1920x1080', recordingResolution: '1920x1080' },
        recommendation: {
          source: 'local',
          reasoning: 'test',
          recommendations: { ...recommendations },
        },
        error: null,
      });
    });
  });

  it('concentra recomendacion y comparacion en una sola seccion', () => {
    render(<OBSComparison />);

    expect(screen.getByText('obs.comparar')).not.toBeNull();
    expect(screen.queryByText('config.recomendada')).toBeNull();
    expect(screen.getByText('Recomendado por Recomendacion local')).not.toBeNull();
    expect(screen.getByText(/Esta comparacion usa una recomendacion local de respaldo/i)).not.toBeNull();
    expect(screen.getByText(/Privacidad: solo se usa informacion tecnica/i)).not.toBeNull();
  });

  it('permite cambiar un valor con select y conserva el baseline original', async () => {
    const user = userEvent.setup();
    render(<OBSComparison />);

    await user.selectOptions(screen.getByLabelText('FPS recomendado'), '120');

    const state = useAppStore.getState().recommendation;
    expect(state?.recommendations.fps).toBe(120);
    expect(state?.originalRecommendations?.fps).toBe(60);
  });

  it('permite editar el bitrate numerico', async () => {
    const user = userEvent.setup();
    render(<OBSComparison />);

    const input = screen.getByLabelText('Bitrate del stream recomendado');
    await user.clear(input);
    await user.type(input, '8000');

    expect(useAppStore.getState().recommendation?.recommendations.bitrate).toBe(8000);
  });

  it('explica dentro de la misma tabla el impacto de los valores editados', async () => {
    const user = userEvent.setup();
    act(() => {
      useAppStore.setState({
        platform: 'twitch',
        systemInfo: {
          cpu: { model: 'Apple M3', cores: 8, speed: 3.5 },
          gpu: { model: 'Apple M3 GPU', vram: 8192, vendor: 'Apple', hasNvenc: false },
          ram: { total: 16 },
          os: { platform: 'darwin', distro: 'macOS', release: '15.5' },
        },
      });
    });
    render(<OBSComparison />);

    await user.selectOptions(screen.getByLabelText('FPS recomendado'), '120');

    expect(screen.getByText('Impacto de tus cambios')).not.toBeNull();
    expect(screen.getByText('IA recalculando')).not.toBeNull();
    await waitFor(() => {
      expect(useAppStore.getState().recommendation?.reasoning).toContain('Cambiaste');
      expect(screen.getByText('Analisis verificado')).not.toBeNull();
    }, { timeout: 2000 });
  });

  it('abre la guia manual desde el aviso cuando falta el complemento', async () => {
    const user = userEvent.setup();
    render(<OBSComparison />);

    expect(screen.queryByText('Ruta en OBS')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Ver guia manual' }));

    expect(screen.getByText('Ruta en OBS')).not.toBeNull();
    // Abre directo en la pestaña con cambios manuales (grabacion) y resalta el bitrate.
    expect(screen.getByRole('tab', { name: /grabacion/i }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('60000 Kbps')).not.toBeNull();
    expect(screen.getAllByText('manual').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('tab', { name: /emision/i }));
    expect(screen.getByText('6000 Kbps')).not.toBeNull();
  });
});
