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
          expect.objectContaining({ label: 'Bitrate', value: '9000 Kbps' }),
          expect.objectContaining({ label: 'Perfil', value: 'High' }),
        ]),
      },
      {
        title: 'Grabacion',
        settings: expect.arrayContaining([
          expect.objectContaining({ label: 'Bitrate', value: '40000 Kbps' }),
          expect.objectContaining({ label: 'Calidad', value: 'Alta', optional: true }),
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

  it('enlaza los ajustes manuales con los campos de la tabla comparativa', () => {
    const groups = buildManualGroups('stream_record', recommendations);
    const emision = groups.find((group) => group.title === 'Emision');
    const grabacion = groups.find((group) => group.title === 'Grabacion');

    expect(emision?.settings.find((setting) => setting.label === 'Bitrate')?.field).toBe('bitrate');
    expect(grabacion?.settings.find((setting) => setting.label === 'Bitrate')?.field).toBe('recording_bitrate');
    expect(grabacion?.settings.find((setting) => setting.label === 'Calidad')?.field).toBe('recording_quality');
  });
});
