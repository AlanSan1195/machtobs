const GENERIC_MICROPHONE_WORDS = new Set([
  'audio',
  'aux',
  'built',
  'capture',
  'default',
  'device',
  'dispositivo',
  'entrada',
  'external',
  'externo',
  'in',
  'input',
  'integrado',
  'internal',
  'local',
  'mic',
  'microfono',
  'microphone',
  'predeterminado',
  'sistema',
  'system',
  'unknown',
  'usb',
]);

function comparableName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function isGenericMicrophoneName(value: string): boolean {
  const tokens = comparableName(value)
    .replace(/\bpor defecto\b/g, ' default ')
    .match(/[a-z0-9]+/g) ?? [];

  return tokens.length === 0 || tokens.every((token) => GENERIC_MICROPHONE_WORDS.has(token));
}

export function normalizeMicrophoneName(value: string): string {
  let normalized = value.trim().replace(/\s+/g, ' ');
  normalized = normalized.replace(
    /^(?:default|predeterminado|por defecto)\s*[-:–—]\s*/i,
    '',
  );

  const wrappedName = normalized.match(
    /^(?:microphone|micrófono|microfono|mic)\s*(?:\(|\[)\s*(.+?)\s*(?:\)|\])\s*$/i,
  )?.[1];

  if (wrappedName && !isGenericMicrophoneName(wrappedName)) {
    return wrappedName;
  }

  return normalized;
}
