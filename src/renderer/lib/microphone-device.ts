import { isGenericMicrophoneName, normalizeMicrophoneName } from '../../shared/microphoneName';

type MicrophoneMediaDevices = Pick<MediaDevices, 'enumerateDevices' | 'getUserMedia'>;

export interface ResolvedMicrophoneName {
  deviceName: string;
  source: 'obs' | 'browser' | 'unresolved';
}

function getBrowserMediaDevices(): MicrophoneMediaDevices | undefined {
  return typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
}

export async function resolveMicrophoneName(
  observedName: string,
  mediaDevices: MicrophoneMediaDevices | undefined = getBrowserMediaDevices(),
): Promise<ResolvedMicrophoneName> {
  const normalizedObservedName = normalizeMicrophoneName(observedName);
  if (!isGenericMicrophoneName(normalizedObservedName)) {
    return { deviceName: normalizedObservedName, source: 'obs' };
  }

  if (!mediaDevices?.getUserMedia || !mediaDevices.enumerateDevices) {
    return { deviceName: normalizedObservedName, source: 'unresolved' };
  }

  let stream: MediaStream | undefined;
  try {
    stream = await mediaDevices.getUserMedia({ audio: true });
    const track = stream.getAudioTracks()[0];
    const trackDeviceId = track?.getSettings().deviceId;
    const devices = await mediaDevices.enumerateDevices();
    const audioInputs = devices.filter((device) => device.kind === 'audioinput');
    const matchedDevice = trackDeviceId
      ? audioInputs.find((device) => device.deviceId === trackDeviceId)
      : undefined;
    const defaultDevice = audioInputs.find((device) => device.deviceId === 'default');
    const candidates = [
      matchedDevice?.label,
      track?.label,
      defaultDevice?.label,
      ...(audioInputs.length === 1 ? [audioInputs[0].label] : []),
    ];

    for (const candidate of candidates) {
      const normalizedCandidate = normalizeMicrophoneName(candidate ?? '');
      if (normalizedCandidate && !isGenericMicrophoneName(normalizedCandidate)) {
        return { deviceName: normalizedCandidate, source: 'browser' };
      }
    }
  } catch {
    // El usuario puede rechazar el permiso; el campo manual sigue disponible.
  } finally {
    stream?.getTracks().forEach((track) => track.stop());
  }

  return { deviceName: normalizedObservedName, source: 'unresolved' };
}
