import React, { useEffect, useState } from 'react';
import { useAppStore } from './store';
import { ModeSelector } from './components/ModeSelector';
import { PlatformSelector } from './components/PlatformSelector';
import { AnalyzeButton } from './components/AnalyzeButton';
import { SourceTargetSelector } from './components/SourceTargetSelector';
import { ConsoleSelector } from './components/ConsoleSelector';
import { ConsoleDetection } from './components/ConsoleDetection';
import { ConsoleReport } from './components/ConsoleReport';
import { HardwareForm } from './components/HardwareForm';
import { OBSComparison } from './components/OBSComparison';
import { AudioConfiguration } from './components/AudioConfiguration';
import { ScenesPanel } from './components/ScenesPanel';
import { ConnectPanel } from './components/ConnectPanel';
import { ImportButton } from './components/ImportButton';
import { StatusBar } from './components/StatusBar';
import { HeroObsEye } from './components/HeroObsEye';
import { SiteFooter } from './components/SiteFooter';
import { appAPI } from './lib/app-api';
import { IconAlert, IconX } from './components/ui';

type TabIndex = 0 | 1 | 2 | 3;

const modeLabels: Record<string, string> = {
  stream_record: 'stream + rec',
  stream_only: 'stream',
  record_only: 'rec',
};

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-2 whitespace-nowrap">
      <span className="text-paper/40">{label} /</span>
      <span className="text-paper">{value}</span>
    </span>
  );
}

function StepHeader({ word, outline = false }: { word: string; outline?: boolean }) {
  return (
    <div className="border-b border-paper/10 pb-5">
      <h2 className={`display-xl text-[clamp(2.6rem,7vw,5.5rem)] ${outline ? 'text-outline' : 'text-paper'}`}>
        {word}
      </h2>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabIndex>(0);
  const [heroObsAnimationRun, setHeroObsAnimationRun] = useState(0);

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
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center gap-2.5"
            aria-label="Match-to-obs"
          >
            <span className="h-3 w-3 bg-primary" aria-hidden="true" />
            <span className="font-display text-sm font-black uppercase tracking-tight text-paper" style={{ fontStretch: '125%' }}>
              Match-to-<span className="text-primary">obs</span>
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
            <span className={`hidden sm:inline ${obsConnected ? 'text-paper' : 'text-paper/40'}`}>
              {obsConnected ? 'OBS / conectado' : 'OBS / sin conexion'}
            </span>
          </div>
        </div>

        {/* meta strip */}
        <div className="border-t border-paper/10">
          <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-2 font-mono text-[0.6rem] uppercase tracking-[0.18em]">
            <span className="text-paper/40">
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

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-3">
        {activeTab === 0 && (
          <div className="pb-16">
            {/* hero */}
            <section className="hero-shell relative isolate overflow-hidden border-b border-paper/10 py-10 sm:py-14 lg:py-16">
              <div className="hero-grid" aria-hidden="true" />

              <div className="relative z-10 flex items-center justify-between gap-6 font-mono text-[0.6rem] uppercase tracking-[0.18em]">
                <span className="flex items-center gap-3 text-paper/45">
                  <span className="bg-primary px-2 py-1 font-bold text-ink">01</span>
                  <span>señal de configuración</span>
                </span>
                <span className="flex items-center gap-2 text-paper/45">
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 ${obsConnected ? 'animate-pulse-dot bg-primary' : 'bg-paper/30'}`}
                  />
                  {obsConnected ? 'sistema / conectado' : 'sistema / listo'}
                </span>
              </div>

              <div className="relative z-10 py-[clamp(3.5rem,8vw,7.5rem)]">
                <p className="mb-4 font-mono text-[0.58rem] uppercase tracking-[0.26em] text-primary sm:mb-6">
                  tu hardware × el mejor perfil de OBS
                </p>
                <h1 className="hero-wordmark select-none " aria-label="machtobs">
                  <span aria-hidden="true" className="hero-wordmark__inner gap-x-6">
                    <span className="text-paper">macht</span>
                    <span className="hero-wordmark__obs">
                      <HeroObsEye animationRun={heroObsAnimationRun} />
                      <span>bs</span>
                    </span>
                  </span>
                </h1>
              </div>

              <div className="relative z-10 grid gap-8 border-t border-paper/15 pt-6 lg:grid-cols-[minmax(0,36rem)_1fr] lg:items-end">
                <div className="flex sm:grid-cols-[8rem_1fr] sm:gap-6">
                  <p className="max-w-lg text-base leading-relaxed text-paper/65 sm:text-lg">
                    Analiza tu hardware y encuentra la configuración ideal para OBS,
                    lista para importar.
                  </p>
                </div>
                <div>
                  <div className="rule-ticks" aria-hidden="true">
                    <span>720p</span>
                    <span>1080p</span>
                    <span>1440p</span>
                    <span>2160p</span>
                  </div>
                </div>
              </div>
            </section>

            {/* conexion — full-bleed dentro del lienzo editorial */}
            <div className="-mx-5 mt-10">
              <ConnectPanel
                onStart={() => setHeroObsAnimationRun((currentRun) => currentRun + 1)}
              />
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-8 py-10">
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
          <div className="space-y-8 py-10">
            <StepHeader word="deteccion" outline />
            <ConsoleReport />
            <OBSComparison />
            <AudioConfiguration onApplySuccess={() => setActiveTab(3)} />
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-8 py-10">
            <StepHeader word="escenas" />
            <ScenesPanel />
            <ImportButton />
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
      </main>

      {/* signal moment: OBS conectado en el hero */}
      {obsConnected && activeTab === 0 && (
        <section className="bg-primary text-ink">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start justify-between gap-4 px-5 py-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink/60">
                señal establecida
              </p>
              <p className="font-display text-2xl font-black uppercase tracking-tight" style={{ fontStretch: '125%' }}>
                OBS conectado ✓
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab(1)}
              className="group flex items-center gap-3 border border-ink/70 px-6 py-3 font-mono text-xs font-bold uppercase tracking-[0.18em] transition-colors hover:bg-ink hover:text-primary"
            >
              02 / ajustes
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </section>
      )}

      <SiteFooter />
      <StatusBar />
    </div>
  );
}
