import { loadBackup } from './backup-store';
import { getSystemInfo, getOsPlatform } from './system-info';
import { getPeripherals } from './peripherals';
import {
  getRemoteAIUserMessage,
  getRemoteConsoleProfile,
  getRemoteMicProfile,
  getRemoteRecommendation,
  getRemoteRecommendationExplanation,
  postToRemoteAI,
} from './ai-remote';
import { getLocalRecommendation, getLocalRecommendationExplanation } from '../../shared/localRecommendation';
import { getLocalMicProfile } from '../../shared/localMicProfile';
import { applyEvidenceBasedMicFilterPolicy } from '../../shared/micFilterPolicy';
import { getLocalConsoleProfile } from '../../shared/localConsoleProfile';
import { measureUploadSpeed } from './upload-speed';
import {
  validateAIRecommendationExplanationRequest,
  validateAIRecommendationRequest,
  validateApplyGuidedSourceDevice,
  validateBeginGuidedSource,
  validateConsoleProfileRequest,
  validateCreateGuidedSourceConfig,
  validateEnsureCaptureAudioInput,
  validateInputName,
  validateMicProfileRequest,
  validateOBSAudioConfig,
  validateOBSConfig,
  validateOBSConnectionSettings,
  validateSceneName,
  validateSetCameraFrame,
  validateSetCameraLayout,
} from '../../shared/validation';
import type {
  AIRecommendationExplanationRequest,
  AIRecommendationRequest,
  ApplyGuidedSourceDeviceInput,
  BeginGuidedSourceInput,
  ConsoleProfileRequest,
  CreateGuidedSourceConfig,
  EnsureCaptureAudioInput,
  MicProfileRequest,
  OBSAudioConfig,
  OBSConfig,
  OBSConnectionSettings,
  SetCameraLayoutInput,
  SetCameraFrameInput,
} from '../../shared/types';

type OBSStatusListener = (status: { connected: boolean; message: string }) => void;
type OBSManagerInstance = import('./obs-manager').OBSManager;

let obsManagerPromise: Promise<OBSManagerInstance> | null = null;
let activeObsManager: OBSManagerInstance | null = null;
let obsStatusListener: OBSStatusListener | null = null;

// OBS WebSocket es la dependencia más pesada del cliente y sólo es necesaria
// cuando la persona intenta conectar. Mantenerla fuera del bundle inicial
// también permite prerenderizar la portada en Node sin APIs del navegador.
async function getObsManager(): Promise<OBSManagerInstance> {
  if (typeof window === 'undefined') {
    throw new Error('La conexión con OBS sólo está disponible en el navegador.');
  }

  if (!obsManagerPromise) {
    obsManagerPromise = import('./obs-manager').then(async ({ obsManager }) => {
      await obsManager.initialize();
      activeObsManager = obsManager;
      if (obsStatusListener) obsManager.onStatusChange(obsStatusListener);
      return obsManager;
    });
  }

  return obsManagerPromise;
}

async function searchWeb(query: string): Promise<string[]> {
  try {
    const payload = await postToRemoteAI('/api/web-search', { query });
    const sources = typeof payload === 'object' && payload !== null
      ? (payload as { sources?: unknown }).sources
      : undefined;
    return Array.isArray(sources) ? sources.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export const appAPI = {
  obs: {
    connect: async (settings: OBSConnectionSettings) => {
      const validation = validateOBSConnectionSettings(settings);
      if (!validation.success) {
        return { success: false, message: validation.message };
      }
      const obsManager = await getObsManager();
      return obsManager.connect(validation.value);
    },
    disconnect: async () => (await getObsManager()).disconnect(),
    getStatus: async () => (await getObsManager()).getStatus(),
    getSettingsSnapshot: async () => (await getObsManager()).getSettingsSnapshot(),
    getAudioSnapshot: async () => (await getObsManager()).getAudioSnapshot(),
    getLastBackup: async () => {
      const backup = await loadBackup();
      return backup
        ? { success: true, message: 'Respaldo disponible', backup }
        : { success: false, message: 'No hay respaldo guardado' };
    },
    restoreLastBackup: async () => {
      const backup = await loadBackup();
      if (!backup) {
        return { success: false, message: 'No hay respaldo guardado', warnings: [] as string[] };
      }
      return (await getObsManager()).restoreSnapshot(backup.snapshot);
    },
    configure: async (config: OBSConfig) => {
      const validation = validateOBSConfig(config);
      if (!validation.success) {
        return { success: false, message: validation.message };
      }
      return (await getObsManager()).configure(validation.value);
    },
    configureAudio: async (config: OBSAudioConfig) => {
      const validation = validateOBSAudioConfig(config);
      if (!validation.success) {
        return { success: false, message: validation.message, warnings: [] as string[] };
      }
      return (await getObsManager()).configureAudio(validation.value);
    },
    getScenes: async () => (await getObsManager()).getScenesSnapshot(),
    createScene: async (name: string) => {
      const validation = validateSceneName(name);
      if (!validation.success) {
        return { success: false, message: validation.message };
      }
      return (await getObsManager()).createScene(validation.value);
    },
    setCurrentScene: async (name: string) => {
      const validation = validateSceneName(name);
      if (!validation.success) {
        return { success: false, message: validation.message };
      }
      return (await getObsManager()).setCurrentScene(validation.value);
    },
    removeScene: async (name: string) => {
      const validation = validateSceneName(name);
      if (!validation.success) {
        return { success: false, message: validation.message };
      }
      return (await getObsManager()).removeScene(validation.value);
    },
    getSourceKinds: async () => (await getObsManager()).getAvailableSourceKinds(),
    getSceneSources: async (name: string) => {
      const validation = validateSceneName(name);
      if (!validation.success) {
        return { success: false, message: validation.message };
      }
      return (await getObsManager()).getSceneSources(validation.value);
    },
    beginGuidedSource: async (arg: BeginGuidedSourceInput) => {
      const validation = validateBeginGuidedSource(arg);
      if (!validation.success) {
        return { success: false, message: validation.message, warnings: [] as string[] };
      }
      return (await getObsManager()).beginGuidedSource(validation.value.sceneName, validation.value.friendly);
    },
    applyGuidedSourceDevice: async (arg: ApplyGuidedSourceDeviceInput) => {
      const validation = validateApplyGuidedSourceDevice(arg);
      if (!validation.success) {
        return { success: false, message: validation.message, warnings: [] as string[] };
      }
      return (await getObsManager()).applyGuidedSourceDevice(validation.value);
    },
    ensureCaptureAudio: async (arg: EnsureCaptureAudioInput) => {
      const validation = validateEnsureCaptureAudioInput(arg);
      if (!validation.success) {
        return { success: false, message: validation.message, warnings: [] as string[] };
      }
      return (await getObsManager()).ensureCaptureAudio(validation.value);
    },
    cancelGuidedSource: async (name: string) => {
      const validation = validateInputName(name);
      if (!validation.success) {
        return { success: false, message: validation.message };
      }
      return (await getObsManager()).cancelGuidedSource(validation.value);
    },
    createGuidedSource: async (config: CreateGuidedSourceConfig) => {
      const validation = validateCreateGuidedSourceConfig(config);
      if (!validation.success) {
        return { success: false, message: validation.message, warnings: [] as string[] };
      }
      return (await getObsManager()).createGuidedSource(validation.value);
    },
    removeSource: async (name: string) => {
      const validation = validateInputName(name);
      if (!validation.success) {
        return { success: false, message: validation.message };
      }
      return (await getObsManager()).removeInput(validation.value);
    },
    setCameraLayout: async (arg: SetCameraLayoutInput) => {
      const validation = validateSetCameraLayout(arg);
      if (!validation.success) {
        return { success: false, message: validation.message, warnings: [] as string[] };
      }
      return (await getObsManager()).setCameraLayout(validation.value.sceneName, validation.value.sceneItemId, validation.value.layout);
    },
    setCameraFrame: async (arg: SetCameraFrameInput) => {
      const validation = validateSetCameraFrame(arg);
      if (!validation.success) {
        return { success: false, message: validation.message, warnings: [] as string[] };
      }
      return (await getObsManager()).setCameraFrame(validation.value);
    },
    createCameraScene: async (arg: { sceneName: string; inputName: string; deviceId: string; propertyName: string }) => {
      const sceneName = validateSceneName(arg.sceneName);
      if (!sceneName.success) return { success: false, message: sceneName.message, warnings: [] as string[] };
      const inputName = validateInputName(arg.inputName);
      if (!inputName.success) return { success: false, message: inputName.message, warnings: [] as string[] };
      if (arg.deviceId.trim().length === 0) {
        return { success: false, message: 'Selecciona una camara valida.', warnings: [] as string[] };
      }
      if (arg.propertyName.trim().length === 0) {
        return { success: false, message: 'Falta la propiedad del dispositivo.', warnings: [] as string[] };
      }
      return (await getObsManager()).createCameraScene(sceneName.value, inputName.value, arg.deviceId.trim(), arg.propertyName.trim());
    },
    setSourceToBottom: async (arg: { sceneName: string; sceneItemId: number }) => {
      return (await getObsManager()).setSourceToBottom(arg.sceneName, arg.sceneItemId);
    },
    renameSource: async (arg: { inputName: string; newInputName: string }) => {
      const current = validateInputName(arg.inputName);
      if (!current.success) return { success: false, message: current.message };
      const next = validateInputName(arg.newInputName);
      if (!next.success) return { success: false, message: next.message };
      return (await getObsManager()).renameInput(current.value, next.value);
    },
    setSourceEnabled: async (arg: { sceneName: string; sceneItemId: number; enabled: boolean }) => {
      return (await getObsManager()).setSceneItemEnabled(arg.sceneName, arg.sceneItemId, arg.enabled);
    },
    sourceScreenshot: async (arg: { sourceName: string; maxWidth?: number }) => {
      if (arg.sourceName.trim().length === 0) {
        return { success: false, message: 'Falta el nombre de la fuente.' };
      }
      return (await getObsManager()).getSourceScreenshot(arg.sourceName, arg.maxWidth);
    },
    getCaptureCapabilities: async (arg: { deviceName?: string }) => {
      return (await getObsManager()).getCaptureCapabilities(arg.deviceName);
    },
    onConnectionChanged: (callback: (status: { connected: boolean; message: string }) => void) => {
      obsStatusListener = callback;
      activeObsManager?.onStatusChange(callback);
      return () => {
        if (obsStatusListener === callback) obsStatusListener = null;
        activeObsManager?.onStatusChange(() => undefined);
      };
    },
  },
  system: {
    getInfo: async () => getSystemInfo(),
    getPeripherals: async () => getPeripherals(),
    measureUploadSpeed: async () => measureUploadSpeed(),
  },
  ai: {
    getRecommendation: async (rawRequest: AIRecommendationRequest) => {
      const validation = validateAIRecommendationRequest(rawRequest);
      if (!validation.success) {
        throw new Error(validation.message);
      }

      const request: AIRecommendationRequest = validation.value;
      try {
        return await getRemoteRecommendation(request);
      } catch (error) {
        console.error('Error getting integrated AI recommendation:', error);
        const localRecommendation = getLocalRecommendation(request);
        return {
          ...localRecommendation,
          reasoning: `${localRecommendation.reasoning} IA integrada no disponible: ${getRemoteAIUserMessage(error)}`,
        };
      }
    },
    explainRecommendation: async (rawRequest: AIRecommendationExplanationRequest) => {
      const validation = validateAIRecommendationExplanationRequest(rawRequest);
      if (!validation.success) {
        throw new Error(validation.message);
      }

      const request: AIRecommendationExplanationRequest = validation.value;
      try {
        return await getRemoteRecommendationExplanation(request);
      } catch (error) {
        console.error('Error explaining integrated AI recommendation:', error);
        const localExplanation = getLocalRecommendationExplanation(request);
        return {
          ...localExplanation,
          reasoning: `${localExplanation.reasoning} IA integrada no disponible: ${getRemoteAIUserMessage(error)}`,
        };
      }
    },
    profileMicrophone: async (rawRequest: MicProfileRequest) => {
      const validation = validateMicProfileRequest(rawRequest);
      if (!validation.success) {
        throw new Error(validation.message);
      }

      const request: MicProfileRequest = { ...validation.value, os: getOsPlatform() };
      try {
        return await getRemoteMicProfile(request);
      } catch (error) {
        console.error('Error profiling microphone with integrated AI:', error);
        const localProfile = getLocalMicProfile(request);
        const tailoredProfile = applyEvidenceBasedMicFilterPolicy(localProfile, request.mode);
        return {
          ...tailoredProfile,
          reasoning: `${tailoredProfile.reasoning} IA integrada no disponible: ${getRemoteAIUserMessage(error)}`,
        };
      }
    },
    profileConsole: async (rawRequest: ConsoleProfileRequest) => {
      const validation = validateConsoleProfileRequest(rawRequest);
      if (!validation.success) {
        throw new Error(validation.message);
      }

      const request: ConsoleProfileRequest = { ...validation.value, os: getOsPlatform() };
      try {
        return await getRemoteConsoleProfile(request);
      } catch (error) {
        console.error('Error profiling console with integrated AI:', error);
        // Intento 2: busqueda web via /api/web-search (Tavily en el servidor)
        const webSources = await searchWeb(`${request.captureCard} capture card specifications resolution fps`);
        const localProfile = getLocalConsoleProfile(request);
        return {
          ...localProfile,
          profile: {
            ...localProfile.profile,
            sources: webSources.length > 0 ? webSources : localProfile.profile.sources,
            research: {
              status: webSources.length > 0 ? 'verified' as const : 'no_results' as const,
              provider: 'tavily' as const,
              sourceCount: webSources.length,
            },
          },
          reasoning: `${localProfile.reasoning}${webSources.length > 0 ? ' [Fuentes navegadas via Tavily]' : ' IA integrada no disponible: ' + getRemoteAIUserMessage(error)}`,
        };
      }
    },
  },
};
