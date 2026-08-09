// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AIRecommendation } from '../../shared/types';
import { useAppStore } from '../store';
import { SourceTargetSelector } from './SourceTargetSelector';

const recommendation: AIRecommendation = {
  source: 'local',
  reasoning: 'Perfil calculado para consola.',
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

describe('SourceTargetSelector', () => {
  beforeEach(() => {
    act(() => {
      useAppStore.getState().reset();
      useAppStore.setState({
        analysisTarget: 'console',
        recommendation,
        error: 'Error de un analisis anterior',
      });
    });
  });

  it('invalida la recomendacion anterior al cambiar de consola a PC', async () => {
    const user = userEvent.setup();
    render(<SourceTargetSelector />);

    await user.click(screen.getByRole('button', { name: 'pc' }));

    expect(useAppStore.getState().analysisTarget).toBe('pc');
    expect(useAppStore.getState().recommendation).toBeNull();
    expect(useAppStore.getState().consoleProfile).toBeNull();
    expect(useAppStore.getState().error).toBeNull();
  });

  it('conserva el analisis al pulsar otra vez la fuente ya seleccionada', async () => {
    const user = userEvent.setup();
    render(<SourceTargetSelector />);

    await user.click(screen.getByRole('button', { name: 'consola' }));

    expect(useAppStore.getState().recommendation).toEqual(recommendation);
  });
});
