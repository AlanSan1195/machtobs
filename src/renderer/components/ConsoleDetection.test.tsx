// @vitest-environment jsdom

import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../store';
import { ConsoleDetection } from './ConsoleDetection';

const apiMocks = vi.hoisted(() => ({
  getPeripherals: vi.fn(),
  getCaptureCapabilities: vi.fn(),
}));

vi.mock('../lib/app-api', () => ({
  appAPI: {
    system: {
      getPeripherals: apiMocks.getPeripherals,
    },
    obs: {
      getCaptureCapabilities: apiMocks.getCaptureCapabilities,
    },
  },
}));

describe('ConsoleDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getPeripherals.mockResolvedValue({
      captureDevices: [{ name: 'USB Capture' }],
      displays: [{
        model: 'Monitor actual',
        main: true,
        width: 2560,
        height: 1440,
        refreshRate: 0,
      }],
    });
    apiMocks.getCaptureCapabilities.mockResolvedValue({
      success: true,
      message: 'Capturadora detectada',
      capabilities: {
        deviceName: 'Elgato HD60 X',
        maxResolution: '3840x2160',
        maxFps: 60,
        resolutions: ['1920x1080', '3840x2160'],
      },
    });

    act(() => {
      useAppStore.setState({
        peripherals: null,
        selectedCaptureCard: '',
        selectedMonitor: '',
        captureCapabilities: null,
        obsConnected: true,
        error: null,
      });
    });
  });

  it('detecta capturadora, monitor y capacidades automaticamente al mostrarse', async () => {
    render(
      <React.StrictMode>
        <ConsoleDetection />
      </React.StrictMode>,
    );

    await waitFor(() => {
      expect(useAppStore.getState().selectedCaptureCard).toBe('Elgato HD60 X');
      expect(useAppStore.getState().selectedMonitor).toBe('Monitor actual');
    });

    expect(apiMocks.getPeripherals).toHaveBeenCalledTimes(1);
    expect(apiMocks.getCaptureCapabilities).toHaveBeenCalledWith({ deviceName: 'USB Capture' });
    expect(useAppStore.getState().captureCapabilities?.maxResolution).toBe('3840x2160');
  });

  it('usa OBS para identificar la capturadora aunque el navegador no tenga su nombre', async () => {
    apiMocks.getPeripherals.mockResolvedValue({
      captureDevices: [],
      displays: [{
        model: 'Monitor actual',
        main: true,
        width: 1920,
        height: 1080,
        refreshRate: 0,
      }],
    });

    render(<ConsoleDetection />);

    await waitFor(() => {
      expect(useAppStore.getState().selectedCaptureCard).toBe('Elgato HD60 X');
    });

    expect(apiMocks.getCaptureCapabilities).toHaveBeenCalledWith({ deviceName: undefined });
  });
});
