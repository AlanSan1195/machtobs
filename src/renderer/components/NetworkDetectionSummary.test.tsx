// @vitest-environment jsdom

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../store';
import { NetworkDetectionSummary } from './NetworkDetectionSummary';

afterEach(cleanup);

describe('NetworkDetectionSummary', () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  it('no ocupa espacio antes de medir la red', () => {
    const { container } = render(<NetworkDetectionSummary />);

    expect(container.innerHTML).toBe('');
  });

  it('muestra capacidad observada, sostenida, segura y bitrate final', () => {
    useAppStore.setState({
      uploadSpeed: {
        uploadMbps: 80,
        sustainedUploadMbps: 80,
        stability: 'stable',
        variationPercent: 0,
        sampleCount: 5,
        measuredAt: '2026-08-07T05:18:00.000Z',
      },
      recommendation: {
        source: 'local',
        recommendations: {
          canvas_resolution: '1920x1080',
          resolution: '1920x1080',
          recording_resolution: '1920x1080',
          fps: 60,
          encoder: 'nvenc',
          bitrate: 6000,
          recording_encoder: 'nvenc',
          recording_bitrate: 20000,
          audio_bitrate: 320,
          recording_format: 'mkv',
          recording_quality: 'high',
        },
        reasoning: 'Perfil de prueba.',
      },
    });

    render(<NetworkDetectionSummary />);

    expect(screen.getAllByText('80.0 Mbps')).toHaveLength(2);
    expect(screen.getByText('56.0 Mbps')).toBeTruthy();
    expect(screen.getByText('6000 kbps')).toBeTruthy();
    expect(screen.getByText('excelente')).toBeTruthy();
    expect(screen.getByText('estable · 0%')).toBeTruthy();
  });

  it('destaca la subida sostenida cuando la medicion fue inestable', () => {
    useAppStore.setState({
      uploadSpeed: {
        uploadMbps: 83.1,
        sustainedUploadMbps: 23.6,
        stability: 'unstable',
        variationPercent: 72,
        sampleCount: 5,
        measuredAt: '2026-08-07T05:41:00.000Z',
      },
    });

    render(<NetworkDetectionSummary />);

    expect(screen.getByText('83.1 Mbps')).toBeTruthy();
    expect(screen.getByText('23.6 Mbps')).toBeTruthy();
    expect(screen.getByText('16.5 Mbps')).toBeTruthy();
    expect(screen.getByText('inestable · 72%')).toBeTruthy();
    expect(screen.getByText(/no el pico de 83.1 Mbps/)).toBeTruthy();
  });
});
