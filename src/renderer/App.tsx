import React, { Suspense, lazy, type ReactNode, useEffect, useState } from 'react';
import { useAppStore } from './store';
import { ConnectPanel } from './components/ConnectPanel';
import obsEyeSvg from './assets/obs-eye.svg';
import { SiteFooter } from './components/SiteFooter';
import { appAPI } from './lib/app-api';
import { IconAlert, IconX } from './components/ui';



const ModeSelector = lazy(() => import('./components/ModeSelector').then((module) => ({ default: module.ModeSelector })));
const PlatformSelector = lazy(() => import('./components/PlatformSelector').then((module) => ({ default: module.PlatformSelector })));
const AnalyzeButton = lazy(() => import('./components/AnalyzeButton').then((module) => ({ default: module.AnalyzeButton })));
const SourceTargetSelector = lazy(() => import('./components/SourceTargetSelector').then((module) => ({ default: module.SourceTargetSelector })));
const ConsoleSelector = lazy(() => import('./components/ConsoleSelector').then((module) => ({ default: module.ConsoleSelector })));
const ConsoleDetection = lazy(() => import('./components/ConsoleDetection').then((module) => ({ default: module.ConsoleDetection })));
const ConsoleReport = lazy(() => import('./components/ConsoleReport').then((module) => ({ default: module.ConsoleReport })));
const ComputerReport = lazy(() => import('./components/ComputerReport').then((module) => ({ default: module.ComputerReport })));
const HardwareForm = lazy(() => import('./components/HardwareForm').then((module) => ({ default: module.HardwareForm })));
const OBSComparison = lazy(() => import('./components/OBSComparison').then((module) => ({ default: module.OBSComparison })));
const AudioConfiguration = lazy(() => import('./components/AudioConfiguration').then((module) => ({ default: module.AudioConfiguration })));
const ScenesPanel = lazy(() => import('./components/ScenesPanel').then((module) => ({ default: module.ScenesPanel })));
const ImportButton = lazy(() => import('./components/ImportButton').then((module) => ({ default: module.ImportButton })));
const NetworkDetectionSummary = lazy(() => import('./components/NetworkDetectionSummary').then((module) => ({ default: module.NetworkDetectionSummary })));

type TabIndex = 0 | 1 | 2 | 3;

const modeLabels: Record<string, string> = {
  stream_record: 'stream + rec',
  stream_only: 'stream',
  record_only: 'rec',
};

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-2 whitespace-nowrap">
      <span className="text-paper/60">{label} /</span>
      <span className="text-paper">{value}</span>
    </span>
  );
}

function StepHeader({
  word,
  outline = false,
  aside,
}: {
  word: string;
  outline?: boolean;
  aside?: ReactNode;
}) {
  return (
    <div className={`grid items-end gap-5 border-b border-paper/10 pb-5 ${
      aside ? 'xl:grid-cols-[minmax(0,1fr)_minmax(32rem,16rem)]' : ''
    }`}>
      <h2 className={`display-xl text-[clamp(2.6rem,7vw,5.5rem)] ${outline ? 'text-outline' : 'text-paper'}`}>
        {word}
      </h2>
      {aside ? <div className="min-w-0">{aside}</div> : null}
    </div>
  );
}

function StepLoading() {
  return (
    <div role="status" className="my-10 border border-paper/15 px-5 py-8 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-paper/60">
      cargando módulo del configurador…
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabIndex>(0);

  const {
    error,
    setError,
    mode,
    platform,
    systemInfo,
    obsConnected,
    analysisTarget,
    recommendation,
    reset,
    setObsAudioSnapshot,
    setObsConnected,
    setObsMessage,
    setObsSettingsSnapshot,
  } = useAppStore();

  useEffect(() => {
    return appAPI.obs.onConnectionChanged((status) => {
      setObsConnected(status.connected);
      setObsMessage(status.message);

      if (!status.connected) {
        setObsSettingsSnapshot(null);
        setObsAudioSnapshot(null);
      } else if (activeTab === 0) {
        setActiveTab(1);
      }
    });
  }, [setObsAudioSnapshot, setObsConnected, setObsMessage, setObsSettingsSnapshot, activeTab]);

  useEffect(() => {
    if (recommendation && activeTab === 1) {
      setActiveTab(2);
    }
  }, [recommendation, activeTab]);

  const tabs = [
    { label: 'conectar', blocked: false, completed: obsConnected },
    { label: 'ajustes', blocked: !obsConnected, completed: obsConnected && !!recommendation },
    { label: 'deteccion', blocked: !obsConnected, completed: false },
    { label: 'escenas', blocked: !obsConnected, completed: false },
  ] as const;

  return (
    <div className="relative flex min-h-screen flex-col font-sans">
      <div className="app-backdrop" aria-hidden="true" />


      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-paper/10 bg-background/95">
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-4 px-5">
          <a
            href="/"
            className="flex items-center gap-x-1 sm:gapx-2"
            aria-label="Ir al inicio de Machtobs"
          >
            <span className="relative flex h-4 w-4 sm:h-6 sm:w-6 items-center justify-center">
              <span className="absolute inset-[0.9px] rounded-full bg-[#3a9bdc] " />
              <img src={obsEyeSvg} alt="" className="relative h-4 w-4 sm:h-6 sm:w-6 " style={{ filter: 'brightness(0) saturate(100%)' }} />
            </span>
            <span className="font-display text-sm font-black  uppercase tracking-tight text-paper " style={{ fontStretch: '125%' }}>
              Macht<span style={{ color: 'transparent', WebkitTextStroke: '0.8px rgb(var(--paper))', margin:'1px' }}>obs</span>
            </span>
          </a>

          {/* numbered step nav */}
          <nav className="flex items-center gap-4 md:gap-6" aria-label="progreso">
            {tabs.map((tab, idx) => {
              const isActive = activeTab === idx;
              const num = String(idx + 1).padStart(2, '0');
              return (
                <button
                  key={idx}
                  onClick={() => !tab.blocked && setActiveTab(idx as TabIndex)}
                  disabled={tab.blocked}
                  aria-current={isActive ? 'step' : undefined}
                  className={`group relative pb-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed ${
                    isActive ? 'text-paper' : tab.blocked ? 'text-paper/25' : 'text-paper/50 hover:text-paper'
                  }`}
                >
                  <span className={`md:mr-2 ${isActive ? 'text-primary' : tab.completed ? 'text-paper' : 'text-paper/30'}`}>
                    {tab.completed && !isActive ? '✓' : num}
                  </span>
                  <span className="hidden md:inline">{tab.label}</span>
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 -bottom-[1px] h-[2px] transition-colors ${
                      isActive ? 'bg-primary' : 'bg-transparent group-hover:bg-paper/25'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.18em]">
            <span
              aria-hidden="true"
              className={`inline-block h-1.5 w-1.5 ${obsConnected ? 'animate-pulse-dot bg-primary' : 'bg-paper/30'}`}
            />
            <span className={`hidden sm:inline ${obsConnected ? 'text-paper' : 'text-paper/60'}`}>
              {obsConnected ? 'OBS / conectado' : 'OBS / sin conexion'}
            </span>
          </div>
        </div>

        {/* meta strip */}
        <div className="border-t border-paper/10">
          <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2 font-mono text-[0.6rem] uppercase tracking-[0.18em]">
            <span className="text-paper/60">
              00—{String(activeTab + 1).padStart(2, '0')} <span className="text-paper">/ {tabs[activeTab].label}</span>
            </span>
            <span className="flex items-center gap-5">
              <MetaItem label="modo" value={mode ? modeLabels[mode] : '—'} />
              <MetaItem label="destino" value={platform ?? '—'} />
              <MetaItem label="so" value={systemInfo ? systemInfo.os.distro.toLowerCase() : '—'} />
            </span>
          </div>
        </div>
      </header>

      {error && (
        <div className="border-b border-danger/45 bg-danger/[0.08]">
          <div
            role="alert"
            className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 py-3"
          >
            <div className="flex items-center gap-3">
              <IconAlert className="h-4 w-4 shrink-0 text-danger" />
              <span className="font-mono text-xs text-danger">
                <span className="text-danger/60">err / </span>
                {error}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Cerrar mensaje de error"
              className="p-1 text-danger transition-colors hover:bg-danger/15"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <main id="configurador" className="mx-auto w-full max-w-[1440px] flex-1 scroll-mt-20 px-3">
        {activeTab === 0 && (
          <div className="mx-auto w-full max-w-[1440PX] py-10 sm:py-16">
            <header className="mb-8 border-b border-paper/15 pb-7">
              <p className="font-mono text-[0.58rem] font-bold uppercase tracking-[0.16em] text-primary">/ conexión local</p>
              <h1 className="mt-4 font-display text-[clamp(2.8rem,8vw,7rem)] font-black uppercase leading-[0.84] tracking-[-0.055em] text-paper">
                Conecta OBS
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-paper/70">
                Abre OBS Studio y sigue los cuatro pasos para iniciar la detección.
              </p>
            </header>
            <div className="-mx-3 sm:mx-0">
              <ConnectPanel showStepsInitially />
            </div>
          </div>
        )}

        <Suspense fallback={<StepLoading />}>
        {activeTab === 1 && (
          <div className="space-y-8 py-10 ">
            <StepHeader word="ajustes" />
            <div className="grid gap-5 lg:grid-cols-2">
              <ModeSelector />
              <PlatformSelector />
            </div>
            <HardwareForm />
            <SourceTargetSelector />
            {analysisTarget === 'console' && (
              <>
                <ConsoleSelector />
                <ConsoleDetection />
              </>
            )}
            <AnalyzeButton />
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-8 py-10 ">
            <StepHeader word="deteccion" outline aside={<NetworkDetectionSummary />} />
            <ConsoleReport />
            <ComputerReport onConfigure={() => setActiveTab(1)} />
            <OBSComparison outputAction={<ImportButton />} />
            <AudioConfiguration onApplySuccess={() => setActiveTab(3)} />
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-8 py-10">
            <StepHeader word="escenas" />
            <ScenesPanel />
            <div className="border-t border-paper/10 pt-6">
              <button
                type="button"
                onClick={() => {
                  reset();
                  setActiveTab(0);
                }}
                className="w-full border border-paper/20 px-6 py-4 font-mono text-xs uppercase tracking-[0.18em] text-paper/60 transition-colors hover:border-paper/50 hover:text-paper"
              >
                ↺ nueva configuracion
              </button>
            </div>

          </div>
        )}
        </Suspense>

      </main>

      <SiteFooter />
    </div>
  );
}
