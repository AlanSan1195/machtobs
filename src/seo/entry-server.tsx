import React from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import App from '../renderer/App';
import { LandingPage } from '../renderer/LandingPage';
import { StaticSeoPage } from './SeoPages';
import {
  DEFAULT_SOCIAL_IMAGE,
  STATIC_SEO_PAGES,
  getSeoPage,
  type SeoPageDefinition,
} from './content';
import { buildSitemap, buildStructuredData } from './structuredData';

export type RenderedSeoPage = {
  page: SeoPageDefinition;
  markup: string;
  structuredData: Record<string, unknown>;
};

export function renderSeoPage(path: string): RenderedSeoPage {
  const page = getSeoPage(path);
  if (!page) throw new Error(`No existe una página SEO registrada para ${path}.`);

  const markup = page.path === '/'
    ? renderToString(
      <React.StrictMode>
        <LandingPage />
      </React.StrictMode>,
    )
    : renderToStaticMarkup(<StaticSeoPage page={page} />);

  return {
    page,
    markup,
    structuredData: buildStructuredData(page),
  };
}

export function renderConfiguratorPage(): string {
  return renderToString(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

export function renderNotFoundPage(): string {
  return renderToStaticMarkup(
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-5 text-paper">
      <div className="app-backdrop" aria-hidden="true" />
      <main className="w-full max-w-4xl border border-paper/15 bg-paper/[0.018] p-7 sm:p-12">
        <p className="micro-label text-primary">error / 404</p>
        <h1 className="mt-7 font-display text-[clamp(4rem,15vw,10rem)] font-black uppercase leading-[0.78] tracking-[-0.06em] text-paper">Señal perdida</h1>
        <p className="mt-8 max-w-xl text-base leading-7 text-paper/60">La página no existe o cambió de dirección. Vuelve al configurador o continúa con las guías de OBS.</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href="/" className="inline-flex min-h-12 items-center bg-primary px-5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink">Abrir Machtobs</a>
          <a href="/guias" className="inline-flex min-h-12 items-center border border-paper/20 px-5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-paper">Ver guías</a>
        </div>
      </main>
    </div>,
  );
}

export {
  DEFAULT_SOCIAL_IMAGE,
  STATIC_SEO_PAGES,
  buildSitemap,
};
