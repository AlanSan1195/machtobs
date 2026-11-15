import React from 'react';
import { HomeSeoContent } from '../seo/HomeSeoContent';
import { HeroObsEye } from './components/HeroObsEye';
import { HeroParticleCanvas } from './components/HeroParticleCanvas';
import { SiteFooter } from './components/SiteFooter';

function SectionNumber({ value }: { value: number }) {
  return (
    <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-primary">
      {String(value).padStart(2, '0')}
    </span>
  );
}


export function LandingPage() {
  return (
    <div className="relative min-h-screen font-sans">
      <div className="app-backdrop" aria-hidden="true" />


      <main>
        <section className="hero-shell relative isolate mx-auto w-full max-w-[1440px] overflow-hidden border-b border-paper/10 px-3">
          <HeroParticleCanvas />

          <div className="relative z-10 py-[clamp(3.5rem,8vw,7.5rem)]">
            <div className="flex items-center gap-3 py-5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-paper/65">
              <span className="h-5 w-6 bg-primary" aria-hidden="true" />
              <span>tu hardware × el mejor perfil de OBS</span>
            </div>

            <div className="hero-wordmark select-none" role="img" aria-label="Machtobs">
              <span aria-hidden="true" className="hero-wordmark__inner gap-x-6">
                <span className="text-paper">macht</span>
                <span className="hero-wordmark__obs">
                  <HeroObsEye animationRun={0} />
                  <span>bs</span>
                </span>
              </span>
            </div>
          </div>

          <div className="relative z-10 grid gap-8 border-t border-paper/15 py-3 ">
          <div className="grid gap-7 border-b border-paper/15 pb-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
          <div>
            <h1 id="home-seo-title" className="mt-4 max-w-xl font-display text-[clamp(2.5rem,5.4vw,2rem)] font-black uppercase leading-[0.86] tracking-[-0.055em] text-paper">
            <span className="text-primary font-lg sm:font-9xl">/ </span>
            Configura OBS fácil, incluso si es tu primera vez
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-paper/70">Machtobs detecta tu equipo y tu conexión, te recomienda ajustes para transmitir o grabar y te explica cada cambio antes de aplicarlo.</p>
          </div>
          <div className="grid grid-cols-3 ">
          {[
            ['detecta', 'Lee el hardware, la red y los ajustes compatibles de OBS.'],
            ['compara', 'Presenta los valores actuales y recomendados con su motivo.'],
            ['aplica', 'Guarda respaldo y cambia únicamente después de tu confirmación.'],
          ].map(([title, text], index) => (
            <article key={title} className="border-r  border-paper/10 px-2 sm:px-6 sm:first:pl-0">
              <SectionNumber value={index + 1} />
              <h3 className="mt-3 font-display text-base font-black uppercase tracking-tight text-paper sm:text-2xl">{title}</h3>
              <p className="mt-2 hidden max-w-sm text-sm leading-6 text-paper/65 sm:block">{text}</p>
            </article>
          ))}
        </div>
        </div>
            <div>
              <div className="rule-ticks" aria-hidden="true">
                <span>720p</span>
                <span>1080p</span>
                <span>1440p</span>
                <span>2160p</span>
              </div>
              <a
                href="/configurador"
                className="group mt-7 flex min-h-16 text-center items-center justify-between bg-primary px-5 text-ink transition-colors hover:bg-primary-hover sm:px-7"
              >
                <span aria-hidden="true" className="font-mono text-xl transition-transform group-hover:translate-x-1"></span>

                <span className="font-display text-2xl  font-black uppercase tracking-[-0.035em] sm:text-3xl">Empezar</span>
                <span aria-hidden="true" className="font-mono text-xl transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a href="/como-configurar-obs" className="mt-4 inline-flex min-h-12 items-center font-mono text-xs font-bold uppercase tracking-widest text-paper/75 underline decoration-primary underline-offset-8 hover:text-primary">¿Nunca has usado OBS? Lee la guía paso a paso →</a>
            </div>
          </div>
        </section>

        <HomeSeoContent />
      </main>

      <SiteFooter />
    </div>
  );
}
