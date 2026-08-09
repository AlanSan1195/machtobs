// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SystemInfo, UploadSpeedMeasurement } from '../../shared/types';
import { useAppStore } from '../store';
import { AnalyzeButton } from './AnalyzeButton';

const mocks = vi.hoisted(() => ({
  getSystemInfo: vi.fn(),
  getAIRecommendation: vi.fn(),
  getPeripherals: vi.fn(),
  measureNetworkUpload: vi.fn(),
  profileConsole: vi.fn(),
}));

vi.mock('../hooks/useAppAPI', () => ({
  useAppAPI: () => mocks,
}));

const systemInfo: SystemInfo = {
  cpu: { model: 'Apple M4', cores: 10 },
  gpu: { model: 'Apple M4', vendor: 'Apple', hasNvenc: false },
  ram: { total: 16 },
  os: { platform: 'darwin', distro: 'macOS', release: '15' },
};

const network: UploadSpeedMeasurement = {
  uploadMbps: 83.1,
  sustainedUploadMbps: 81.5,
  stability: 'stable',
  variationPercent: 2,
  sampleCount: 5,
  measuredAt: '2026-08-07T05:41:00.000Z',
};

afterEach(cleanup);

describe('AnalyzeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.getState().reset();
    useAppStore.setState({ mode: 'stream_record', platform: 'twitch' });
    mocks.getSystemInfo.mockResolvedValue(systemInfo);
    mocks.getPeripherals.mockResolvedValue({
      displays: [{ model: 'Monitor actual', main: true, width: 3840, height: 2160, refreshRate: 0 }],
      captureDevices: [],
    });
    mocks.measureNetworkUpload.mockResolvedValue(network);
    mocks.getAIRecommendation.mockResolvedValue(null);
  });

  it('mide la subida y usa esa misma medicion al recomendar', async () => {
    const user = userEvent.setup();
    render(<AnalyzeButton />);

    await user.click(screen.getByRole('button', { name: /analizar --recomendar/i }));

    await waitFor(() => {
      expect(mocks.measureNetworkUpload).toHaveBeenCalledTimes(1);
      expect(mocks.getAIRecommendation).toHaveBeenCalledWith({
        systemInfo,
        mode: 'stream_record',
        platform: 'twitch',
        goal: {
          description: 'Transmitir o grabar el contenido del PC donde se ejecuta OBS.',
          source: 'computer',
          sourceResolution: '3840x2160',
        },
        currentSettings: undefined,
        network,
      });
    });
  });

  it('no recomienda con datos anteriores si la medicion falla', async () => {
    mocks.measureNetworkUpload.mockResolvedValue(null);
    const user = userEvent.setup();
    render(<AnalyzeButton />);

    await user.click(screen.getByRole('button', { name: /analizar --recomendar/i }));

    await waitFor(() => expect(mocks.measureNetworkUpload).toHaveBeenCalledTimes(1));
    expect(mocks.getAIRecommendation).not.toHaveBeenCalled();
  });
});
