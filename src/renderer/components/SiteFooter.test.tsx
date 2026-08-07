// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../store';
import { SiteFooter } from './SiteFooter';

afterEach(cleanup);

describe('SiteFooter', () => {
  it('presenta la privacidad del producto y el origen de la recomendacion', () => {
    act(() => {
      useAppStore.setState({
        recommendation: {
          source: 'local',
          reasoning: 'test',
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
        },
      });
    });

    render(<SiteFooter />);

    expect(screen.getByText('Recomendado por motor local')).not.toBeNull();
    expect(screen.getByText(/solo datos tecnicos; nunca archivos ni claves de OBS/i)).not.toBeNull();
  });
});
