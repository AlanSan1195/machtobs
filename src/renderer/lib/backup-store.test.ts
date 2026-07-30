// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import type { OBSSettingsSnapshot } from '../../shared/types';
import { loadBackup, saveBackup } from './backup-store';

const advancedSnapshot: OBSSettingsSnapshot = {
  streamServer: 'rtmps://live-upload.youtube.com/live2',
  baseResolution: '1920x1080',
  outputResolution: '1920x1080',
  streamResolution: '1920x1080',
  recordingResolution: '3840x2160',
  outputMode: 'Advanced',
  advancedOutput: {
    streamEncoder: 'com.apple.videotoolbox.videoencoder.ave.avc',
    recordingEncoder: 'com.apple.videotoolbox.videoencoder.ave.hevc',
    streamRescaleResolution: '1920x1080',
    recordingRescaleResolution: '3840x2160',
    streamRescaleFilter: '4',
    recordingRescaleFilter: '0',
    recordingFormat: 'mkv',
  },
  fps: 60,
  encoder: 'com.apple.videotoolbox.videoencoder.ave.avc',
  bitrate: 9000,
  recordingBitrate: 40000,
  audioBitrate: 320,
  recordingFormat: 'mkv',
  recordingQuality: 'high',
  advancedControl: {
    available: true,
    pluginVersion: '0.1.0',
    outputMode: 'Advanced',
    stream: {
      available: true,
      encoderId: 'com.apple.videotoolbox.videoencoder.ave.avc',
      active: false,
      rateControl: 'CBR',
      bitrate: 9000,
      quality: 60,
      limitBitrate: false,
      maxBitrate: 9000,
      maxBitrateWindow: 1.5,
      keyframeInterval: 2,
      profile: 'high',
      bFrames: true,
      spatialAQMode: 1,
    },
    recording: {
      available: true,
      encoderId: 'com.apple.videotoolbox.videoencoder.ave.hevc',
      active: false,
      rateControl: 'CBR',
      bitrate: 40000,
      quality: 76,
      limitBitrate: false,
      maxBitrate: 40000,
      maxBitrateWindow: 1.5,
      keyframeInterval: 2,
      profile: 'main10',
      bFrames: true,
      spatialAQMode: 1,
    },
  },
};

describe('backup-store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('conserva el control y los bitrates avanzados al guardar y cargar', async () => {
    await saveBackup(advancedSnapshot);

    const backup = await loadBackup();

    expect(backup?.snapshot).toMatchObject({
      bitrate: 9000,
      recordingBitrate: 40000,
      advancedControl: {
        available: true,
        pluginVersion: '0.1.0',
        stream: {
          bitrate: 9000,
          keyframeInterval: 2,
          profile: 'high',
        },
        recording: {
          bitrate: 40000,
          quality: 76,
          profile: 'main10',
        },
      },
    });
  });
});
