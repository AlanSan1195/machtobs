import React, { useState } from 'react';
import { useAppStore } from '../store';
import { useAppAPI } from '../hooks/useAppAPI';
import { IconPlug } from './ui';

export function ConnectPanel() {
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const {
    obsConnectionSettings,
    obsConnected,
    setObsConnectionSettings,
    setError,
  } = useAppStore();
  const { connectToOBS } = useAppAPI();

  if (obsConnected) return null;

  const handleConnect = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsConnecting(true);

    try {
      const result = await connectToOBS(obsConnectionSettings);
      if (!result.success) {
        setError(result.message);
        setIsConnecting(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo conectar con OBS');
      setIsConnecting(false);
    }
  };

  return (
    <section
      aria-labelledby="obs-connect-title"
      className="relative border-y border-paper/15 bg-background/55"
    >
      <header className="grid border-b border-paper/10 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 items-center gap-3 px-5 py-3">
          <span className="h-1.5 w-1.5 shrink-0 bg-primary" aria-hidden="true" />
          <IconPlug className="h-4 w-4 shrink-0 text-primary" />
          <h2
            id="obs-connect-title"
            className="truncate font-mono text-[0.68rem] font-medium uppercase tracking-[0.18em] text-paper"
          >
            01 / obs.conectar
          </h2>
          <span className="hidden h-px min-w-8 flex-1 bg-paper/10 sm:block" aria-hidden="true" />
        </div>

      </header>

      <div className="grid lg:grid-cols-[minmax(18rem,0.9fr)_minmax(18rem,1.1fr)]">
        <div className="relative overflow-hidden border-b border-paper/10 px-5 py-5 sm:px-8 sm:py-6 lg:h-[8.25rem] lg:border-b-0 lg:border-r lg:px-10 lg:py-5">
          <span
            className="pointer-events-none absolute -bottom-8 right-0 font-display text-[7rem] font-black leading-none text-paper/[0.03]"
            aria-hidden="true"
          >
            01
          </span>

          <div className="relative flex items-center gap-4">
            <p className="micro-label shrink-0 text-primary">canal de control</p>
            <span className="h-px max-w-24 flex-1 bg-primary/25" aria-hidden="true" />
          </div>
          <p className="relative mt-3 max-w-2xl text-[0.82rem] leading-[1.45] text-paper/50">
            Abre OBS y activa el servidor WebSocket. Match-to-obs leerá tu
            configuración para preparar el siguiente paso.
          </p>
          <div className="relative mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[0.52rem] uppercase tracking-[0.15em] text-paper/35">
            <span>protocolo / ws</span>
          </div>
        </div>

        <button
          type="submit"
          form="obs-connect-form"
          disabled={isConnecting}
          className="group grid min-h-[11rem] w-full grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border-t border-primary bg-primary text-left text-ink transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-inset disabled:cursor-wait disabled:opacity-70 lg:h-[8.25rem] lg:min-h-0 lg:border-l lg:border-t-0"
        >
          <span className="flex items-center justify-between gap-4 border-b border-ink/20 px-5 py-2 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-ink/60 sm:px-8 lg:px-10">
            <span className="flex items-center gap-3">
              <IconPlug className="h-4 w-4" />
              {isConnecting ? 'negociando señal' : 'iniciar enlace'}
            </span>
            <span
              className={`h-2 w-2 bg-ink ${isConnecting ? 'animate-pulse' : ''}`}
              aria-hidden="true"
            />
          </span>

          <span className="flex min-w-0 items-center justify-center px-5 py-2 sm:px-8 lg:px-10">
            <span className="text-center font-display text-[clamp(2.35rem,3.2vw,3.7rem)] font-black uppercase leading-[0.82] tracking-[-0.05em]">
              {isConnecting ? 'enlazado' : 'enlazar'}
            </span>
          </span>

          <span className="flex items-center justify-between gap-4 border-t border-ink/20 px-5 py-2 font-mono text-[0.55rem] font-bold uppercase tracking-[0.16em] sm:px-8 lg:px-10">
            <span>
              destino / obs
            </span>
            <span
              className="text-xl transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
              aria-hidden="true"
            >
              →
            </span>
          </span>
        </button>
      </div>

      <form
        id="obs-connect-form"
        onSubmit={handleConnect}
        className="min-w-0 border-t border-paper/10"
      >
        <div className="grid min-w-0 lg:grid-cols-[minmax(14rem,0.62fr)_minmax(0,1.18fr)_minmax(14rem,0.72fr)]">
          <div className="border-b border-paper/10 px-5 py-6 sm:px-8 lg:border-b-0 lg:border-r">
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-primary">
              credencial / opcional
            </span>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-paper/40">
              Úsala sólo si OBS tiene autenticación activa. Compatible con
              Chrome, Edge y Firefox.
            </p>
          </div>

          <div className="min-w-0 border-b border-paper/10 px-5 py-6 sm:px-8 lg:border-b-0 lg:border-r">
            <label
              htmlFor="obs-password"
              className="mb-2 block font-mono text-[0.6rem] uppercase tracking-[0.16em] text-paper/55"
            >
              contraseña de OBS{' '}
              <span className="text-paper/25">/ puede quedar vacía</span>
            </label>
            <div className="flex border border-paper/15 bg-paper/[0.025] transition-colors focus-within:border-primary/70">
              <input
                id="obs-password"
                type={showPassword ? 'text' : 'password'}
                value={obsConnectionSettings.password}
                onChange={(event) => setObsConnectionSettings({ password: event.target.value })}
                autoComplete="off"
                aria-describedby="obs-password-help"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-paper outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-controls="obs-password"
                aria-pressed={showPassword}
                className="shrink-0 border-l border-paper/15 px-4 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-paper/45 transition-colors hover:bg-paper/[0.04] hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset"
              >
                {showPassword ? 'ocultar' : 'mostrar'}
              </button>
            </div>
            <p
              id="obs-password-help"
              className="mt-2 text-[0.68rem] leading-relaxed text-paper/30"
            >
              En OBS: Herramientas → Ajustes WebSocket → información de conexión.
            </p>
          </div>

          <aside className="px-5 py-6 sm:px-8">
            <p className="font-mono text-[0.54rem] uppercase tracking-[0.14em] text-primary/70">
              privado / local
            </p>
            <p className="mt-3 text-xs leading-relaxed text-paper/40">
              Se usa sólo para enlazar con OBS en esta computadora. No se guarda
              ni se envía.
            </p>
            <button
              type="button"
              onClick={() => setShowAdvanced((value) => !value)}
              aria-expanded={showAdvanced}
              className="mt-4 flex w-full items-center justify-between border-t border-paper/10 pt-3 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-paper/40 transition-colors hover:text-paper focus-visible:outline-none focus-visible:text-paper"
            >
              <span>host / puerto avanzados</span>
              <span className="text-primary">{showAdvanced ? '—' : '+'}</span>
            </button>
          </aside>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-1 gap-3 border-t border-paper/10 px-5 py-5 sm:grid-cols-[1fr_9rem] sm:px-8">
            <label className="block">
              <span className="mb-2 block font-mono text-[0.58rem] uppercase tracking-[0.14em] text-paper/45">
                host
              </span>
              <input
                type="text"
                value={obsConnectionSettings.host}
                onChange={(event) => setObsConnectionSettings({ host: event.target.value })}
                spellCheck={false}
                className="w-full border border-paper/15 bg-paper/[0.025] px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-primary/70"
              />
            </label>
            <label className="block">
              <span className="mb-2 block font-mono text-[0.58rem] uppercase tracking-[0.14em] text-paper/45">
                puerto
              </span>
              <input
                type="number"
                min={1}
                max={65535}
                value={obsConnectionSettings.port}
                onChange={(event) => setObsConnectionSettings({ port: Number(event.target.value) })}
                className="w-full border border-paper/15 bg-paper/[0.025] px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-primary/70"
              />
            </label>
          </div>
        )}
      </form>

      <footer className="grid border-t border-warning/25 bg-warning/[0.035] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
        <span className="border-b border-warning/20 px-5 py-3 font-mono text-[0.56rem] font-bold uppercase tracking-[0.16em] text-warning sm:border-b-0 sm:border-r">
          beta / 01
        </span>
        <span className="px-5 py-3 text-xs leading-relaxed text-paper/45">
          Versión en prueba: revisa en OBS los ajustes aplicados antes de un directo importante.
        </span>
        <span className="hidden border-l border-warning/20 px-5 py-3 font-mono text-[0.52rem] uppercase tracking-[0.14em] text-warning/45 sm:block">
          revisión / manual
        </span>
      </footer>
    </section>
  );
}
