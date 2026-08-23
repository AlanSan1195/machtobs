import React from 'react';
import { HomeSeoContent } from '../seo/HomeSeoContent';
import obsEyeSvg from './assets/obs-eye.svg';
import { HeroObsEye } from './components/HeroObsEye';
import { HeroParticleCanvas } from './components/HeroParticleCanvas';
import { SiteFooter } from './components/SiteFooter';

function BrandLink() {
  return (
    <a href="/" className="flex items-center gap-1" aria-label="Ir al inicio de Machtobs">
      <span className="relative flex h-5 w-5 items-center justify-center sm:h-6 sm:w-6">
        <span className="absolute inset-px rounded-full bg-primary" />
        <img
          src={obsEyeSvg}
          alt=""
          className="relative h-5 w-5 sm:h-6 sm:w-6"
          style={{ filter: 'brightness(0) saturate(100%)' }}
        />
      </span>
      <span className="font-display text-sm font-black uppercase tracking-tight text-paper">
        Macht<span className="text-outline-thin">obs</span>
      </span>
    </a>
  );
}

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
            ConfiguraciÓn Avanzada para tus directos
            </h1>
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
            </div>
          </div>
        </section>

        <HomeSeoContent />
      </main>

      <SiteFooter />
    </div>
  );
}
