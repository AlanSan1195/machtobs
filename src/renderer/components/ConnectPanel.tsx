import React, { useState } from 'react';
import { useAppStore } from '../store';
import { useAppAPI } from '../hooks/useAppAPI';
import { IconAlert, IconCheck, IconPlug } from './ui';

type ConnectionIssue = 'authentication' | 'unavailable';

function classifyConnectionIssue(message: string): ConnectionIssue {
  const authenticationFailure =
    /authentication failed|requiere (?:un )?password|rechaz[oó] (?:el )?password|password required/i;

  return authenticationFailure.test(message) ? 'authentication' : 'unavailable';
}

export function ConnectPanel() {
  const [showGuide, setShowGuide] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionIssue, setConnectionIssue] = useState<ConnectionIssue | null>(null);
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
    setConnectionIssue(null);
    setIsConnecting(true);

    try {
      const result = await connectToOBS(obsConnectionSettings);
      if (!result.success) {
        setConnectionIssue(classifyConnectionIssue(result.message));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo conectar con OBS';
      setError(null);
      setConnectionIssue(classifyConnectionIssue(message));
    } finally {
      setIsConnecting(false);
    }
  };

  const startGuide = () => {
    setConnectionIssue(null);
    setShowGuide(true);
  };

  return (
    <section
      aria-label="Conectar con OBS"
      className="relative border-y border-paper/15 bg-background/55"
    >
      <header className="border-b border-paper/10">
        <div className="flex min-w-0 items-center gap-3 px-5 py-3">
          <span className="h-1.5 w-1.5 shrink-0 bg-primary" aria-hidden="true" />
          <IconPlug className="h-4 w-4 shrink-0 text-primary" />
        </div>
      </header>

      <footer className="grid border-b border-warning/25 bg-warning/[0.035] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
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

      <form id="obs-connect-form" onSubmit={handleConnect}>
        {!showGuide ? (
          <button
            type="button"
            onClick={startGuide}
            aria-controls="obs-first-steps"
            className="group relative left-1/2 block w-screen -translate-x-1/2 bg-primary text-left text-ink transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-inset"
          >
            <span className="mx-auto grid min-h-16 w-full max-w-[1440px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] px-5 sm:min-h-[4.75rem]">
              <span className="flex min-w-0 items-center gap-2 border-r border-ink/20 pr-4 font-mono text-[0.48rem] uppercase tracking-[0.14em] text-ink/60 sm:gap-3 sm:pr-8 sm:text-[0.55rem]">
                <IconPlug className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate">configurar enlace</span>
              </span>

              <span className="flex min-w-0 items-center justify-center px-4 sm:px-10">
                <span className="text-center font-display text-[clamp(1.8rem,3.2vw,3.15rem)] font-black uppercase leading-none tracking-[-0.05em]">
                  empezar
                </span>
              </span>

              <span className="flex min-w-0 items-center justify-end gap-3 border-l border-ink/20 pl-4 font-mono text-[0.48rem] font-bold uppercase tracking-[0.14em] sm:pl-8 sm:text-[0.55rem]">
                <span className="hidden truncate sm:block">guía / 4 pasos</span>
                <span
                  className="text-lg transition-transform group-hover:translate-x-1 motion-reduce:transition-none sm:text-xl"
                  aria-hidden="true"
                >
                  →
                </span>
              </span>
            </span>
          </button>
        ) : null}

        {showGuide ? (
          <div id="obs-first-steps">
            {connectionIssue ? (
              <div
                role="status"
                className={`flex items-start gap-3 border-b px-5 py-3 sm:px-8 ${
                  connectionIssue === 'authentication'
                    ? 'border-primary/30 bg-primary/[0.045]'
                    : 'border-warning/25 bg-warning/[0.04]'
                }`}
              >
                <IconAlert
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    connectionIssue === 'authentication' ? 'text-primary' : 'text-warning'
                  }`}
                />
                <p className="text-xs leading-relaxed text-paper/55">
                  {connectionIssue === 'authentication' ? (
                    <>
                      OBS rechazó la contraseña. Verifica el paso 02, vuelve a copiarla
                      y pégala en el paso 03.
                    </>
                  ) : (
                    <>
                      No encontramos OBS en{' '}
                      <span className="font-mono text-warning">localhost:4455</span>.
                      Revisa los pasos 01 y 02 antes de volver a enlazar.
                    </>
                  )}
                </p>
              </div>
            ) : null}

            <div className="grid md:grid-cols-2">
              <div className="relative min-h-48 overflow-hidden border-b border-paper/10 px-5 py-6 sm:px-8 md:border-r">
                <span
                  className="pointer-events-none absolute bottom-2 right-5 font-display text-7xl font-black leading-none text-paper/[0.055]"
                  aria-hidden="true"
                >
                  01
                </span>
                <p className="font-display text-2xl font-black uppercase tracking-tight text-paper">
                  abre OBS
                </p>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-paper/50">
                  Ve a <span className="text-primary">Herramientas</span> →{' '}
                  <span className="text-paper/75">Ajustes del servidor WebSocket</span>.
                </p>
              </div>

              <div className="relative min-h-48 overflow-hidden border-b border-paper/10 px-5 py-6 sm:px-8">
                <span
                  className="pointer-events-none absolute bottom-2 right-5 font-display text-7xl font-black leading-none text-paper/[0.055]"
                  aria-hidden="true"
                >
                  02
                </span>
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center border border-primary text-primary">
                    <IconCheck className="h-4 w-4" />
                  </span>
                  <p className="font-display text-2xl font-black uppercase tracking-tight text-paper">
                    activa WebSocket
                  </p>
                </div>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-paper/50">
                  Marca <span className="text-paper/75">Habilitar servidor WebSocket</span>{' '}
                  y mantén activa la autenticación.
                </p>
                <p className="mt-2 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-paper/35">
                  Mostrar información de conexión{' '}
                  <span className="text-primary">→ copiar contraseña</span>
                </p>
              </div>

              <div className="relative min-h-48 overflow-hidden border-b border-paper/10 px-5 py-6 sm:px-8 md:border-b-0 md:border-r">
                <span
                  className="pointer-events-none absolute bottom-2 right-5 font-display text-7xl font-black leading-none text-paper/[0.055]"
                  aria-hidden="true"
                >
                  03
                </span>
                <label
                  htmlFor="obs-guide-password"
                  className="block font-display text-2xl font-black uppercase tracking-tight text-paper"
                >
                  pega la contraseña
                </label>
                <div className="relative mt-4 flex max-w-lg border border-primary/55 bg-paper/[0.025] transition-colors focus-within:border-primary">
                  <input
                    id="obs-guide-password"
                    type={showPassword ? 'text' : 'password'}
                    value={obsConnectionSettings.password}
                    onChange={(event) => setObsConnectionSettings({ password: event.target.value })}
                    autoComplete="off"
                    aria-describedby="obs-guide-password-help"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-paper outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-controls="obs-guide-password"
                    aria-pressed={showPassword}
                    className="shrink-0 border-l border-primary/30 px-4 font-mono text-[0.56rem] uppercase tracking-[0.12em] text-paper/45 transition-colors hover:bg-primary/10 hover:text-paper focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-inset"
                  >
                    {showPassword ? 'ocultar' : 'mostrar'}
                  </button>
                </div>
                <p
                  id="obs-guide-password-help"
                  className="mt-2 text-[0.68rem] leading-relaxed text-paper/30"
                >
                  La contraseña permanece sólo en esta pestaña.
                </p>
              </div>

              <button
                type="submit"
                disabled={isConnecting}
                aria-label="Paso 04: enlazar con OBS"
                className="group relative grid min-h-48 place-items-center overflow-hidden border border-primary bg-primary/[0.035] px-5 py-6 text-primary transition-colors hover:bg-primary hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset disabled:cursor-wait disabled:opacity-60 sm:px-8"
              >
                <span
                  className="pointer-events-none absolute bottom-2 right-5 font-display text-7xl font-black leading-none text-primary/10 transition-colors group-hover:text-ink/10"
                  aria-hidden="true"
                >
                  04
                </span>
                <span className="relative text-center">
                  <span className="block font-display text-4xl font-black uppercase tracking-[-0.04em]">
                    {isConnecting ? 'enlazando' : 'enlazar'}
                  </span>
                  <span className="mt-3 block font-mono text-[0.56rem] uppercase tracking-[0.14em] opacity-55">
                    conectar con OBS <span aria-hidden="true">→</span>
                  </span>
                </span>
              </button>
            </div>
          </div>
        ) : null}

      </form>
    </section>
  );
}
