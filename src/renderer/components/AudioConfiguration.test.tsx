// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OBSAudioSettingsSnapshot } from '../../shared/types';
import { useAppStore } from '../store';
import { AudioConfiguration } from './AudioConfiguration';

const apiMocks = vi.hoisted(() => ({
  refreshAudioSnapshot: vi.fn(),
  applyAudioConfig: vi.fn(),
  profileMicrophone: vi.fn(),
}));

vi.mock('../hooks/useAppAPI', () => ({
  useAppAPI: () => apiMocks,
}));

const unconfiguredSnapshot: OBSAudioSettingsSnapshot = {
  inputName: 'Voz · Match-to-obs',
  inputKind: 'coreaudio_input_capture',
  devicePropertyName: 'device',
  requiresInputCreation: true,
  devices: [{
    id: 'shure-mv7',
    name: 'Shure MV7 USB',
    isDefault: false,
    isRecommended: true,
    score: 65,
    reason: 'microfono/interfaz USB, hardware de audio dedicado',
  }],
  recommendedDevice: {
    id: 'shure-mv7',
    name: 'Shure MV7 USB',
    isDefault: false,
    isRecommended: true,
    score: 65,
    reason: 'microfono/interfaz USB, hardware de audio dedicado',
  },
  muted: false,
  volumeDb: 0,
  monitorType: 'OBS_MONITORING_TYPE_NONE',
  syncOffsetMs: 0,
  duckingTargets: [],
  filters: [],
  matchToObsFiltersConfigured: false,
  monoConfigured: false,
  monoSupported: false,
  warnings: ['OBS tiene Mic/Aux en Ninguno. Match-to-obs creara una entrada de voz al aplicar.'],
};

describe('AudioConfiguration con OBS virgen', () => {
  beforeAll(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute('open', '');
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute('open');
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.applyAudioConfig.mockResolvedValue({
      success: true,
      message: 'Microfono agregado y configurado',
    });

    act(() => {
      useAppStore.setState({
        obsConnected: true,
        obsAudioSnapshot: unconfiguredSnapshot,
        obsSettingsSnapshot: null,
        isApplying: false,
        mode: 'record_only',
        micProfile: null,
        isProfilingMic: false,
        error: null,
      });
    });
  });

  it('destaca la seleccion requerida y oculta Apply hasta confirmar un microfono', async () => {
    const user = userEvent.setup();
    render(<AudioConfiguration />);

    expect(screen.getByText('OBS esta listo para recibir tu microfono.')).toBeTruthy();
    expect(screen.getByText('02 / seleccion requerida')).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Recomendado - Shure MV7 USB' })).toBeTruthy();
    expect((screen.getByRole('option', { name: 'Selecciona un microfono' }) as HTMLOptionElement).selected).toBe(true);
    expect(screen.queryByRole('button', { name: /apply --voice match-to-obs/i })).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('Selecciona un microfono');

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Elige tu microfono' }),
      'shure-mv7',
    );

    await user.click(screen.getByRole('button', { name: /apply --voice match-to-obs/i }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/creara la fuente "Voz · Match-to-obs"/i)).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Aplicar audio' }));

    expect(apiMocks.applyAudioConfig).toHaveBeenCalledWith(expect.objectContaining({
      inputName: 'Voz · Match-to-obs',
      inputKind: 'coreaudio_input_capture',
      devicePropertyName: 'device',
      createInputIfMissing: true,
      deviceId: 'shure-mv7',
      deviceName: 'Shure MV7 USB',
    }));
  });
});
