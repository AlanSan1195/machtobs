import { describe, expect, it } from 'vitest';
import type { AIRecommendation } from '../../shared/types';
import { buildManualGroups } from './OBSManualGuide';

const recommendations: AIRecommendation['recommendations'] = {
  canvas_resolution: '1920x1080',
  resolution: '1920x1080',
  recording_resolution: '3840x2160',
  fps: 60,
  encoder: 'apple vt h264',
  bitrate: 9000,
  recording_encoder: 'apple vt hevc',
  recording_bitrate: 40000,
  audio_bitrate: 320,
  recording_format: 'mkv',
  recording_quality: 'high',
};

describe('buildManualGroups', () => {
  it('separa emision y grabacion con los valores recomendados', () => {
    const groups = buildManualGroups('stream_record', recommendations);

    expect(groups).toMatchObject([
      {
        title: 'Emision',
        settings: expect.arrayContaining([
          { label: 'Bitrate', value: '9000 Kbps' },
          { label: 'Perfil', value: 'High' },
        ]),
      },
      {
        title: 'Grabacion',
        settings: expect.arrayContaining([
          { label: 'Bitrate', value: '40000 Kbps' },
          { label: 'Calidad', value: 'Alta', optional: true },
        ]),
      },
    ]);
  });

  it('solo muestra la pestaña correspondiente en modos exclusivos', () => {
    expect(buildManualGroups('stream_only', recommendations).map((group) => group.title))
      .toEqual(['Emision']);
    expect(buildManualGroups('record_only', recommendations).map((group) => group.title))
      .toEqual(['Grabacion']);
  });
});
