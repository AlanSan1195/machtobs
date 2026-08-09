import React from 'react';
import { useAppStore } from '../store';
import { useAppAPI } from '../hooks/useAppAPI';
import { extractObsBaseline } from '../../shared/obsUsage';
import { IconSparkles, Spinner } from './ui';

function getDisplayCaptureResolution(width: number, height: number): string | undefined {
  if (width >= 3840 && height >= 2160) return '3840x2160';
  if (width >= 2560 && height >= 1440) return '2560x1440';
  if (width >= 1920 && height >= 1080) return '1920x1080';
  if (width >= 1280 && height >= 720) return '1280x720';
  return undefined;
}

export function AnalyzeButton() {
  const {
    mode,
    platform,
    isAnalyzing,
    setIsAnalyzing,
    setError,
    obsSettingsSnapshot,
    analysisTarget,
    consoleModel,
    peripherals,
    selectedCaptureCard,
    selectedMonitor,
    captureCapabilities,
    isAnalyzingConsole,
    isMeasuringUpload,
  } = useAppStore();
  const { getSystemInfo, getAIRecommendation, getPeripherals, measureNetworkUpload, profileConsole } = useAppAPI();

  const isConsole = analysisTarget === 'console';
  const busy = isAnalyzing || isAnalyzingConsole || isMeasuringUpload;
  const missingBase = !mode || !platform;
  const isDisabled = busy || missingBase || (isConsole && !consoleModel);

  const handleAnalyze = async () => {
    if (isDisabled || !mode || !platform) return;
    setError(null);

    if (isConsole) {
      if (!consoleModel) return;
      try {
        const [systemInfo, network] = await Promise.all([
          getSystemInfo(),
          measureNetworkUpload(),
        ]);
        if (!network) return;
        const matchedDisplay = peripherals?.displays.find((display) => display.model === selectedMonitor);
        await profileConsole({
          console: consoleModel,
          captureCard: selectedCaptureCard || captureCapabilities?.deviceName || undefined,
          monitor: selectedMonitor || undefined,
          monitorRefreshRate: matchedDisplay?.refreshRate || undefined,
          captureMaxResolution: captureCapabilities?.maxResolution,
          captureMaxFps: captureCapabilities?.maxFps,
          platform,
          mode,
          systemInfo,
          network,
        });
      } catch (error) {
        console.error('Console analysis failed:', error);
      }
      return;
    }

    setIsAnalyzing(true);
    try {
      const [systemInfo, network, detectedPeripherals] = await Promise.all([
        getSystemInfo(),
        measureNetworkUpload(),
        getPeripherals(),
      ]);
      if (!network) return;
      const currentSettings = obsSettingsSnapshot ? extractObsBaseline(obsSettingsSnapshot) : undefined;
      const mainDisplay = detectedPeripherals?.displays.find((display) => display.main)
        ?? detectedPeripherals?.displays[0];
      const sourceResolution = mainDisplay
        ? getDisplayCaptureResolution(mainDisplay.width, mainDisplay.height)
        : undefined;
      await getAIRecommendation({
        systemInfo,
        mode,
        platform,
        goal: {
          description: 'Transmitir o grabar el contenido del PC donde se ejecuta OBS.',
          source: 'computer',
          sourceResolution,
        },
        currentSettings,
        network,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const label = busy
    ? isMeasuringUpload
      ? 'midiendo subida...'
      : isConsole ? 'analizando consola...' : 'analizando sistema...'
    : missingBase
      ? 'selecciona modo y plataforma'
      : isConsole && !consoleModel
        ? 'selecciona tu consola'
        : isConsole
          ? 'analizar --consola'
          : 'analizar --recomendar';

  return (
    <button
      type="button"
      onClick={handleAnalyze}
      disabled={isDisabled}
      className={`group flex w-full items-center justify-center gap-3 rounded-none px-6 py-4 font-mono text-sm font-bold uppercase tracking-[0.18em] transition-colors duration-200 ${
        isDisabled
          ? 'cursor-not-allowed border border-border bg-surface/45 text-text-muted'
          : 'ai-glint bg-primary text-background glow-primary hover:bg-primary-hover active:scale-[0.99]'
      }`}
    >
      {busy ? (
        <Spinner className="h-5 w-5 border-background/80 border-t-transparent" />
      ) : (
        <IconSparkles className="h-5 w-5" />
      )}
      <span>
        <span className="opacity-60">{isDisabled ? '$ ' : './'}</span>
        {label}
      </span>
    </button>
  );
}
