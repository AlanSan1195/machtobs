import { describe, expect, it } from 'vitest';
import { isGenericMicrophoneName, normalizeMicrophoneName } from './microphoneName';

describe('microphoneName', () => {
  it.each([
    'Default',
    'Predeterminado',
    'Microphone',
    'Micrófono (USB Audio Device)',
    'Mic/Aux',
  ])('detecta una etiqueta generica: %s', (name) => {
    expect(isGenericMicrophoneName(normalizeMicrophoneName(name))).toBe(true);
  });

  it.each([
    ['Default - Elgato Wave:3', 'Elgato Wave:3'],
    ['Microphone (Shure MV7)', 'Shure MV7'],
    ['Micrófono (RØDE NT-USB Mini)', 'RØDE NT-USB Mini'],
  ])('extrae una marca y modelo utilizables de %s', (name, expected) => {
    const normalized = normalizeMicrophoneName(name);
    expect(normalized).toBe(expected);
    expect(isGenericMicrophoneName(normalized)).toBe(false);
  });
});
