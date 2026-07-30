// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../store';
import { AddSourceWizard } from './AddSourceWizard';

const apiMocks = vi.hoisted(() => ({
  beginGuidedSource: vi.fn(),
  applyGuidedSourceDevice: vi.fn(),
  ensureCaptureAudio: vi.fn(),
  cancelGuidedSource: vi.fn(),
  setCameraLayout: vi.fn(),
  setCameraFrame: vi.fn(),
  createCameraScene: vi.fn(),
  refreshScenes: vi.fn(),
  createGuidedSource: vi.fn(),
  renameSource: vi.fn(),
}));

vi.mock('../hooks/useAppAPI', () => ({
  useAppAPI: () => apiMocks,
}));

describe('AddSourceWizard marco de facecam', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.setCameraLayout.mockResolvedValue({ success: true, message: 'Camara 1:1', warnings: [] });
    apiMocks.setCameraFrame.mockResolvedValue({ success: true, message: 'Marco aplicado', warnings: [] });
    apiMocks.applyGuidedSourceDevice.mockResolvedValue({ success: true, message: 'Dispositivo aplicado', warnings: [] });
    apiMocks.renameSource.mockResolvedValue({ success: true, message: 'Sin cambios' });
    act(() => {
      useAppStore.setState({
        availableSourceKinds: [],
        sceneSources: [
          {
            sceneItemId: 7,
            sourceName: 'Camara principal',
            inputKind: 'av_capture_input_v2',
            friendlyKind: 'camera',
            enabled: true,
          },
        ],
      });
    });
  });

  it('permite elegir color y grosor y aplica el marco a la camara existente', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCreated = vi.fn();
    render(<AddSourceWizard sceneName="Gameplay" onClose={onClose} onCreated={onCreated} />);

    await user.click(screen.getByRole('button', { name: /Marco para facecam 1:1/i }));
    expect(screen.getByText('Personaliza tu marco 1:1')).toBeTruthy();

    expect(screen.queryByText('Aura')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Rounded' }));
    await user.click(screen.getByRole('button', { name: 'Usar color #F2B84B' }));
    fireEvent.change(screen.getByRole('slider', { name: 'Grosor del marco' }), { target: { value: '24' } });
    await user.click(screen.getByRole('button', { name: 'Aplicar en OBS' }));

    await waitFor(() => {
      expect(apiMocks.setCameraLayout).toHaveBeenCalledWith('Gameplay', 7, 'facecam');
      expect(apiMocks.setCameraFrame).toHaveBeenCalledWith({
        sceneName: 'Gameplay',
        cameraSceneItemId: 7,
        cameraInputName: 'Camara principal',
        config: {
          color: '#F2B84B',
          thickness: 24,
          rounded: true,
        },
      });
    });
    expect(onCreated).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('integra el marco en la creacion de una nueva facecam 1:1', async () => {
    const user = userEvent.setup();
    apiMocks.beginGuidedSource.mockResolvedValue({
      success: true,
      message: 'Camara creada',
      inputName: 'Camara web',
      sceneItemId: 9,
      supportsDeviceEnum: true,
      propertyName: 'video_device_id',
      devices: [{ id: 'cam-1', name: 'Webcam USB', isDefault: true }],
      warnings: [],
    });
    act(() => {
      useAppStore.setState({
        availableSourceKinds: [
          {
            friendly: 'camera',
            inputKind: 'av_capture_input_v2',
            supportsDeviceEnum: true,
            available: true,
          },
        ],
        sceneSources: [],
      });
    });
    render(<AddSourceWizard sceneName="Gameplay" onClose={vi.fn()} onCreated={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Camara webTu webcam/i }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: /Facecam 1:1/i }));
    await user.click(screen.getByRole('button', { name: 'Usar color #7EE0C3' }));
    await user.click(screen.getByRole('button', { name: 'Usar este marco' }));
    await user.click(screen.getByRole('button', { name: 'Listo' }));

    await waitFor(() => {
      expect(apiMocks.setCameraFrame).toHaveBeenCalledWith({
        sceneName: 'Gameplay',
        cameraSceneItemId: 9,
        cameraInputName: 'Camara web',
        config: {
          color: '#7EE0C3',
          thickness: 12,
          rounded: false,
        },
      });
    });
  });
});

describe('AddSourceWizard audio de capturadora', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.beginGuidedSource.mockResolvedValue({
      success: true,
      message: 'Consola creada',
      inputName: 'Consola',
      sceneItemId: 9,
      supportsDeviceEnum: true,
      propertyName: 'device',
      devices: [{ id: 'cap-1', name: 'Elgato Game Capture 4K X', isDefault: false }],
      warnings: [],
    });
    apiMocks.applyGuidedSourceDevice.mockResolvedValue({
      success: true,
      message: 'Dispositivo aplicado',
      warnings: [],
    });
    apiMocks.renameSource.mockResolvedValue({ success: true, message: 'Sin cambios' });
    act(() => {
      useAppStore.setState({
        availableSourceKinds: [
          {
            friendly: 'game_console',
            inputKind: 'av_capture_input_v2',
            supportsDeviceEnum: true,
            available: true,
          },
        ],
        sceneSources: [],
      });
    });
  });

  it('agrega el audio al terminar con el nombre del dispositivo elegido', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCreated = vi.fn();
    apiMocks.ensureCaptureAudio.mockResolvedValue({
      success: true,
      message: 'Audio agregado',
      warnings: [],
    });
    render(<AddSourceWizard sceneName="Gameplay" onClose={onClose} onCreated={onCreated} />);

    await user.click(screen.getByRole('button', { name: /Consola \(PS5\/Xbox\/Switch\)/i }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Listo' }));

    await waitFor(() => {
      expect(apiMocks.ensureCaptureAudio).toHaveBeenCalledWith({
        sceneName: 'Gameplay',
        deviceNameHint: 'Elgato Game Capture 4K X',
      });
    });
    expect(onCreated).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('cierra el asistente aunque no pueda agregar el audio', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCreated = vi.fn();
    apiMocks.ensureCaptureAudio.mockResolvedValue({
      success: false,
      message: 'No se encontro el audio',
      warnings: [],
    });
    render(<AddSourceWizard sceneName="Gameplay" onClose={onClose} onCreated={onCreated} />);

    await user.click(screen.getByRole('button', { name: /Consola \(PS5\/Xbox\/Switch\)/i }));
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    await user.click(screen.getByRole('button', { name: 'Listo' }));

    await waitFor(() => {
      expect(apiMocks.ensureCaptureAudio).toHaveBeenCalledOnce();
      expect(onCreated).toHaveBeenCalledOnce();
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
