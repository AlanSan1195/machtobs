import type { OBSBackup, OBSSettingsSnapshot } from '../../shared/types';
import { validateOBSBackup } from '../../shared/validation';

const BACKUP_KEY = 'machtobs-backup';

function sanitizeAdvancedControl(
  advancedControl: OBSSettingsSnapshot['advancedControl'],
): OBSSettingsSnapshot['advancedControl'] {
  if (!advancedControl) return undefined;

  const sanitizeEncoder = (
    encoder: NonNullable<OBSSettingsSnapshot['advancedControl']>['stream'],
  ) => encoder ? { ...encoder } : undefined;

  return {
    available: advancedControl.available,
    pluginVersion: advancedControl.pluginVersion,
    outputMode: advancedControl.outputMode,
    stream: sanitizeEncoder(advancedControl.stream),
    recording: sanitizeEncoder(advancedControl.recording),
  };
}

function sanitizeSnapshot(snapshot: OBSSettingsSnapshot): OBSSettingsSnapshot {
  return {
    streamServer: snapshot.streamServer,
    baseResolution: snapshot.baseResolution,
    outputResolution: snapshot.outputResolution,
    streamResolution: snapshot.streamResolution,
    recordingResolution: snapshot.recordingResolution,
    outputMode: snapshot.outputMode,
    advancedOutput: snapshot.advancedOutput,
    fps: snapshot.fps,
    encoder: snapshot.encoder,
    bitrate: snapshot.bitrate,
    recordingBitrate: snapshot.recordingBitrate,
    audioBitrate: snapshot.audioBitrate,
    recordingFormat: snapshot.recordingFormat,
    recordingQuality: snapshot.recordingQuality,
    advancedControl: sanitizeAdvancedControl(snapshot.advancedControl),
    audio: snapshot.audio,
  };
}

export async function saveBackup(snapshot: OBSSettingsSnapshot): Promise<void> {
  const backup: OBSBackup = {
    createdAt: new Date().toISOString(),
    appliedByMachtobs: true,
    snapshot: sanitizeSnapshot(snapshot),
  };

  localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
}

export async function loadBackup(): Promise<OBSBackup | null> {
  try {
    const content = localStorage.getItem(BACKUP_KEY);
    if (!content) return null;
    const parsed: unknown = JSON.parse(content);
    const validation = validateOBSBackup(parsed);
    return validation.success ? validation.value : null;
  } catch {
    return null;
  }
}
