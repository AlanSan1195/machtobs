// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AIRecommendation, SystemInfo, UploadSpeedMeasurement } from '../../shared/types';
import { useAppStore } from '../store';
import { ComputerReport } from './ComputerReport';

const systemInfo: SystemInfo = {
  cpu: { model: 'AMD Ryzen 7 7800X3D', cores: 8 },
  gpu: { model: 'NVIDIA RTX 4070', vendor: 'NVIDIA', hasNvenc: true },
  ram: { total: 32 },
  os: { platform: 'win32', distro: 'Windows', release: '11' },
};

const uploadSpeed: UploadSpeedMeasurement = {
  uploadMbps: 50,
  sustainedUploadMbps: 45,
  stability: 'stable',
  variationPercent: 10,
  sampleCount: 5,
  measuredAt: '2026-08-08T18:00:00.000Z',
};

const recommendation: AIRecommendation = {
  source: 'local',
  reasoning: 'Configuracion calculada para PC.',
  recommendations: {
    canvas_resolution: '1920x1080',
    resolution: '1920x1080',
    recording_resolution: '1920x1080',
    fps: 60,
    encoder: 'nvenc',
    bitrate: 6000,
    recording_encoder: 'nvenc',
    recording_bitrate: 30000,
    audio_bitrate: 320,
    recording_format: 'mkv',
    recording_quality: 'high',
  },
};

afterEach(cleanup);

describe('ComputerReport', () => {
  beforeEach(() => {
    act(() => {
      useAppStore.getState().reset();
      useAppStore.setState({ analysisTarget: 'pc' });
    });
  });

  it('explica como iniciar el analisis cuando aun no hay recomendacion para PC', async () => {
    const onConfigure = vi.fn();
    const user = userEvent.setup();
    render(<ComputerReport onConfigure={onConfigure} />);

    expect(screen.getByText('pc.analisis')).toBeTruthy();
    expect(screen.getByText(/Todavia no existe una recomendacion/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Volver a ajustes' }));
    expect(onConfigure).toHaveBeenCalledTimes(1);
  });

  it('muestra el hardware y la red usados para recomendar cambios en OBS', () => {
    act(() => {
      useAppStore.setState({ systemInfo, uploadSpeed, recommendation });
    });
    render(<ComputerReport />);

    expect(screen.getByText('AMD Ryzen 7 7800X3D')).toBeTruthy();
    expect(screen.getByText('NVIDIA RTX 4070')).toBeTruthy();
    expect(screen.getByText('32 GB RAM')).toBeTruthy();
    expect(screen.getByText('45.0 Mbps')).toBeTruthy();
    expect(screen.getByText(/Debajo veras cada valor actual de OBS/)).toBeTruthy();
  });
});
