// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../store';
import { ConnectPanel } from './ConnectPanel';

const apiMocks = vi.hoisted(() => ({
  connectToOBS: vi.fn(),
}));

vi.mock('../hooks/useAppAPI', () => ({
  useAppAPI: () => ({
    connectToOBS: apiMocks.connectToOBS,
  }),
}));

describe('ConnectPanel', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.connectToOBS.mockResolvedValue({
      success: true,
      message: 'Conectado a OBS',
    });

    act(() => {
      useAppStore.setState({
        obsConnected: false,
        obsConnectionSettings: {
          host: 'localhost',
          port: 4455,
          password: '',
        },
        error: null,
      });
    });
  });

  it('reemplaza el enlace rapido por un unico inicio de la guia', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<ConnectPanel onStart={onStart} />);

    expect(screen.queryByText('canal de control')).toBeNull();
    expect(screen.queryByText('Abre OBS en esta computadora.')).toBeNull();
    expect(screen.queryByText('conexión avanzada')).toBeNull();
    expect(screen.queryByLabelText(/contraseña de OBS/i)).toBeNull();
    expect(screen.queryByText('abre OBS')).toBeNull();

    await user.click(screen.getByRole('button', { name: /empezar/i }));

    expect(screen.getByText('abre OBS')).toBeTruthy();
    expect(onStart).toHaveBeenCalledOnce();
    expect(apiMocks.connectToOBS).not.toHaveBeenCalled();
  });

  it('completa el flujo guiado y enlaza con la contraseña indicada', async () => {
    const user = userEvent.setup();
    render(<ConnectPanel />);

    await user.click(screen.getByRole('button', { name: /empezar/i }));

    expect(screen.getByText('abre OBS')).toBeTruthy();
    expect(screen.getByText('activa WebSocket')).toBeTruthy();
    expect(screen.getByText('pega la contraseña')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Paso 04: enlazar con OBS' })).toBeTruthy();

    await user.type(screen.getByLabelText('pega la contraseña'), 'secreto-guiado');
    await user.click(screen.getByRole('button', { name: 'Paso 04: enlazar con OBS' }));

    await waitFor(() => {
      expect(apiMocks.connectToOBS).toHaveBeenCalledWith({
        host: 'localhost',
        port: 4455,
        password: 'secreto-guiado',
      });
    });
  });

  it('abre la guia automaticamente cuando OBS no responde', async () => {
    apiMocks.connectToOBS.mockResolvedValue({
      success: false,
      message: 'OBS no esta abierto o el servidor WebSocket esta apagado',
    });
    const user = userEvent.setup();
    render(<ConnectPanel />);

    await user.click(screen.getByRole('button', { name: /empezar/i }));
    await user.click(screen.getByRole('button', { name: 'Paso 04: enlazar con OBS' }));

    expect((await screen.findByRole('status')).textContent).toContain(
      'No encontramos OBS en localhost:4455',
    );
    expect(screen.getByLabelText('pega la contraseña')).toBeTruthy();
  });

  it('pide la contraseña sólo después de un fallo de autenticacion y permite reintentar', async () => {
    apiMocks.connectToOBS
      .mockResolvedValueOnce({
        success: false,
        message: 'Authentication failed. OBS requiere password o rechazo el password enviado.',
      })
      .mockResolvedValueOnce({
        success: true,
        message: 'Conectado a OBS',
      });
    const user = userEvent.setup();
    render(<ConnectPanel />);

    await user.click(screen.getByRole('button', { name: /empezar/i }));
    await user.type(screen.getByLabelText('pega la contraseña'), 'incorrecta');
    await user.click(screen.getByRole('button', { name: 'Paso 04: enlazar con OBS' }));

    expect((await screen.findByRole('status')).textContent).toContain(
      'OBS rechazó la contraseña',
    );
    const passwordInput = screen.getByLabelText('pega la contraseña');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'secreto-local');
    await user.click(screen.getByRole('button', { name: 'Paso 04: enlazar con OBS' }));

    await waitFor(() => {
      expect(apiMocks.connectToOBS).toHaveBeenLastCalledWith({
        host: 'localhost',
        port: 4455,
        password: 'secreto-local',
      });
    });
    expect(apiMocks.connectToOBS).toHaveBeenCalledTimes(2);
  });

});
