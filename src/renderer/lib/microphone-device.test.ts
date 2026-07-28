import { describe, expect, it, vi } from 'vitest';
import { resolveMicrophoneName } from './microphone-device';

function makeTrack(label: string, deviceId = 'browser-device') {
  return {
    label,
    getSettings: () => ({ deviceId }),
    stop: vi.fn(),
  } as unknown as MediaStreamTrack;
}

function makeMediaDevices(track: MediaStreamTrack, labels: Array<{ id: string; label: string }>) {
  return {
    getUserMedia: vi.fn(async () => ({
      getAudioTracks: () => [track],
      getTracks: () => [track],
    } as unknown as MediaStream)),
    enumerateDevices: vi.fn(async () => labels.map(({ id, label }) => ({
      deviceId: id,
      groupId: '',
      kind: 'audioinput' as const,
      label,
      toJSON: () => ({}),
    }))),
  };
}

describe('resolveMicrophoneName', () => {
  it('conserva el nombre especifico de OBS sin pedir permiso', async () => {
    const mediaDevices = makeMediaDevices(makeTrack('Otro microfono'), []);
    const result = await resolveMicrophoneName('Elgato Wave:3', mediaDevices);

    expect(result).toEqual({ deviceName: 'Elgato Wave:3', source: 'obs' });
    expect(mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });

  it('resuelve el dispositivo predeterminado usando la pista autorizada del navegador', async () => {
    const track = makeTrack('Default - Shure MV7');
    const mediaDevices = makeMediaDevices(track, [
      { id: 'browser-device', label: 'Default - Shure MV7' },
    ]);

    await expect(resolveMicrophoneName('Predeterminado', mediaDevices)).resolves.toEqual({
      deviceName: 'Shure MV7',
      source: 'browser',
    });
    expect(track.stop).toHaveBeenCalledOnce();
  });

  it('mantiene el nombre generico si el permiso no esta disponible', async () => {
    const mediaDevices = {
      getUserMedia: vi.fn(async () => { throw new Error('denied'); }),
      enumerateDevices: vi.fn(),
    };

    await expect(resolveMicrophoneName('Default', mediaDevices)).resolves.toEqual({
      deviceName: 'Default',
      source: 'unresolved',
    });
  });
});
