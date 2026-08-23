import React from 'react';
import {
  CONTENT_LAST_MODIFIED,
  SEO_PAGES,
  getRelatedPages,
  getSeoPage,
  type SeoFaq,
  type SeoPageDefinition,
  type SeoSection,
} from './content';
import { getFirstSentence, getVisibleFaqs, getVisibleSections } from './presentation';

const home = getSeoPage('/');

if (!home) throw new Error('La portada SEO no está registrada.');

const homePage: SeoPageDefinition = home;

function BrandMark() {
  return (
    <span className="flex items-center gap-2" aria-label="Machtobs">
      <span className="relative grid h-6 w-6 place-items-center bg-primary text-ink">
        <span className="h-2 w-2 border border-ink" aria-hidden="true" />
      </span>
      <span className="font-display text-sm font-black uppercase tracking-tight text-paper">
        Macht<span className="text-outline-thin">obs</span>
      </span>
    </span>
  );
}

function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="group inline-flex min-h-12 items-center gap-3 border border-paper/20 px-4 py-3 font-mono text-[0.64rem] font-bold uppercase tracking-[0.14em] text-paper transition-colors hover:border-primary hover:text-primary"
    >
      {children}
      <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
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

function GuideCard({ page, index }: { page: SeoPageDefinition; index: number }) {
  return (
    <article className="group relative flex min-h-52 flex-col justify-between overflow-hidden border border-paper/15 bg-paper/[0.018] p-5 transition-colors hover:border-primary/55 hover:bg-primary/[0.025]">
      <div>
        <div className="flex items-center justify-between border-b border-paper/10 pb-4">
          <SectionNumber value={index + 1} />
          <span className="font-mono text-[0.52rem] uppercase tracking-[0.14em] text-paper/60">guía / obs</span>
        </div>
        <h3 className="mt-5 max-w-md font-display text-xl font-black uppercase leading-[0.95] tracking-[-0.035em] text-paper sm:text-2xl">
          {page.heading}
        </h3>
        <p className="mt-3 max-w-lg text-sm leading-6 text-paper/60">{getFirstSentence(page.introduction)}</p>
      </div>
      <a
        href={page.path}
        className="mt-5 inline-flex min-h-11 items-center justify-between border-t border-paper/10 pt-3 font-mono text-[0.6rem] font-bold uppercase tracking-[0.14em] text-primary"
      >
        Abrir guía <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
      </a>
    </article>
  );
}

function FaqList({ faqs }: { faqs: SeoFaq[] }) {
  return (
    <div className="divide-y divide-paper/10 border-y border-paper/15">
      {faqs.map((faq, index) => (
        <details key={faq.question} className="group py-1">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-4 text-left marker:hidden">
            <span className="flex items-start gap-4">
              <SectionNumber value={index + 1} />
              <span className="max-w-3xl text-base font-semibold text-paper sm:text-lg">{faq.question}</span>
            </span>
            <span aria-hidden="true" className="font-mono text-primary transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="max-w-3xl pb-6 pl-10 text-sm leading-7 text-paper/60 sm:text-base">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function HomeSeoContent() {
  const featuredGuides = getRelatedPages(homePage);

  return (
    <section className="seo-deferred border-t border-paper/15" aria-labelledby="home-seo-title">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-10 border-b border-paper/15 pb-16 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-end">
          <div>
            <p className="micro-label text-primary">01 / qué configura</p>
            <h2 id="home-seo-title" className="mt-5 max-w-xl font-display text-[clamp(2.8rem,6vw,5.7rem)] font-black uppercase leading-[0.85] tracking-[-0.055em] text-paper">
              OBS listo para tu equipo, no para uno genérico
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <p className="text-base leading-7 text-paper/65 sm:text-lg">
              Machtobs relaciona CPU, GPU, memoria, resolución, plataforma y subida sostenida para recomendar encoder, bitrate, FPS y salida.
            </p>
            <p className="text-base leading-7 text-paper/65 sm:text-lg">
              Antes de aplicar, compara el estado actual, explica cada diferencia y conserva un respaldo local. Tú mantienes el control.
            </p>
          </div>
        </div>

        <div className="grid border-b border-paper/15 lg:grid-cols-3">
          {[
            ['detectar', 'Lee el hardware, la red y los ajustes compatibles de OBS.'],
            ['comparar', 'Presenta los valores actuales y recomendados con su motivo.'],
            ['aplicar', 'Guarda respaldo y cambia únicamente después de tu confirmación.'],
          ].map(([title, text], index) => (
            <article key={title} className="min-h-56 border-b border-paper/10 py-8 lg:border-b-0 lg:border-r lg:px-7 lg:first:pl-0 lg:last:border-r-0">
              <SectionNumber value={index + 1} />
              <h3 className="mt-8 font-display text-3xl font-black uppercase tracking-tight text-paper">{title}</h3>
              <p className="mt-4 max-w-sm text-sm leading-6 text-paper/55">{text}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-10 border-b border-paper/15 py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
          <div>
            <p className="micro-label text-primary">02 / vista previa</p>
            <h2 className="mt-5 max-w-lg font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.045em] text-paper sm:text-6xl">
              Entiende qué cambia antes de tocar OBS
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-paper/60">
              La comparación visual separa streaming, grabación, audio y escenas. Los ajustes que requieren intervención manual aparecen como instrucciones, no como cambios ocultos.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ArrowLink href="/como-funciona-machtobs">Conocer la metodología</ArrowLink>
              <ArrowLink href="/guias/configurar-obs">Configurar OBS paso a paso</ArrowLink>
            </div>
          </div>
          <picture className="block overflow-hidden border border-paper/15 bg-paper/[0.02] p-2">
            <source
              srcSet="/machtobs-configurador-480.jpg 480w, /machtobs-configurador-960.jpg 960w, /machtobs-configurador.jpg 1600w"
              sizes="(max-width: 1024px) calc(100vw - 58px), 52vw"
              type="image/jpeg"
            />
            <img
              src="/machtobs-configurador-960.jpg"
              alt="Interfaz del configurador Machtobs mostrando el análisis y los ajustes recomendados para OBS Studio"
              width="3820"
              height="1990"
              loading="lazy"
              decoding="async"
              className="h-auto w-full border border-paper/10"
            />
          </picture>
        </div>

        <div className="py-16">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="micro-label text-primary">03 / aprender OBS</p>
              <h2 className="mt-5 max-w-3xl font-display text-4xl font-black uppercase leading-[0.9] tracking-[-0.045em] text-paper sm:text-6xl">
                Guías para tu primera configuración y tu primer stream
              </h2>
            </div>
            <ArrowLink href="/guias">Ver todas las guías</ArrowLink>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {featuredGuides.map((page, index) => <GuideCard key={page.path} page={page} index={index} />)}
          </div>
        </div>

        <div className="grid gap-10 border-t border-paper/15 py-16 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)]">
          <div>
            <p className="micro-label text-primary">04 / preguntas frecuentes</p>
            <h2 className="mt-5 font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.045em] text-paper sm:text-5xl">
              Antes de conectar
            </h2>
          </div>
          <FaqList faqs={homePage.faqs} />
        </div>

        <div className="border border-primary/45 bg-primary/[0.035] p-6 sm:p-9">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div>
              <p className="micro-label text-primary">listo / configuración guiada</p>
              <h2 className="mt-4 max-w-3xl font-display text-3xl font-black uppercase leading-none tracking-[-0.035em] text-paper sm:text-5xl">
                Abre OBS, conecta localmente y revisa tu perfil
              </h2>
            </div>
            <ArrowLink href="/configurador">Abrir configurador</ArrowLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function Breadcrumbs({ page }: { page: SeoPageDefinition }) {
  return (
    <nav aria-label="Migas de pan" className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-paper/60">
      <ol className="flex flex-wrap items-center gap-2">
        <li><a href="/" className="transition-colors hover:text-primary">Machtobs</a></li>
        <li aria-hidden="true">/</li>
        {page.path.startsWith('/guias/') ? (
          <>
            <li><a href="/guias" className="transition-colors hover:text-primary">Guías</a></li>
            <li aria-hidden="true">/</li>
          </>
        ) : null}
        <li aria-current="page" className="text-paper/70">{page.heading}</li>
      </ol>
    </nav>
  );
}

function ArticleSection({ section, index }: { section: SeoSection; index: number }) {
  return (
    <section id={section.id} className="seo-article-section scroll-mt-24 border-t border-paper/15 py-9 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[9rem_minmax(0,1fr)]">
        <div><SectionNumber value={index + 1} /></div>
        <div className="max-w-4xl">
          <h2 className="font-display text-3xl font-black uppercase leading-[0.95] tracking-[-0.035em] text-paper sm:text-5xl">{section.title}</h2>
          <div className="mt-5 space-y-4">
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-base leading-7 text-paper/70">{paragraph}</p>
            ))}
          </div>
          {section.bullets ? (
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 border border-paper/10 bg-paper/[0.018] p-4 text-sm leading-6 text-paper/60">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-primary" aria-hidden="true" />
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
          {section.steps ? (
            <ol className="mt-8 grid gap-3 lg:grid-cols-3">
              {section.steps.map((step, stepIndex) => (
                <li key={step.title} className="border border-primary/25 bg-primary/[0.025] p-5">
                  <span className="font-mono text-[0.56rem] text-primary">{String(stepIndex + 1).padStart(2, '0')}</span>
                  <h3 className="mt-6 font-display text-xl font-black uppercase tracking-tight text-paper">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-paper/55">{step.text}</p>
                </li>
              ))}
            </ol>
          ) : null}
          {section.note ? (
            <aside className="mt-8 border-l-2 border-primary bg-primary/[0.04] px-5 py-4 text-sm leading-7 text-paper/65">
              <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-primary">Nota Machtobs / </span>
              {section.note}
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function StaticHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-paper/15 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-5 px-5 sm:px-8">
        <a href="/" aria-label="Ir a Machtobs"><BrandMark /></a>
        <nav aria-label="Navegación principal" className="flex items-center gap-3 sm:gap-6">
          <a href="/guias" className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-paper/55 transition-colors hover:text-primary">Guías</a>
          <a href="/como-funciona-machtobs" className="hidden font-mono text-[0.58rem] uppercase tracking-[0.14em] text-paper/55 transition-colors hover:text-primary sm:block">Cómo funciona</a>
          <a href="/configurador" className="inline-flex min-h-10 items-center bg-primary px-3 font-mono text-[0.56rem] font-bold uppercase tracking-[0.12em] text-ink sm:px-4">Configurar OBS</a>
        </nav>
      </div>
    </header>
  );
}

function StaticFooter() {
  return (
    <footer className="border-t border-paper/15">
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-xl text-xs leading-5 text-paper/60">Proyecto independiente, no afiliado con OBS Project ni plataformas de streaming.</p>
        </div>
        <nav aria-label="Enlaces del pie" className="flex flex-wrap gap-x-5 gap-y-3 font-mono text-[0.56rem] uppercase tracking-[0.12em] text-paper/65">
          <a href="/" className="hover:text-primary">Configurador</a>
          <a href="/guias" className="hover:text-primary">Guías</a>
          <a href="/como-funciona-machtobs" className="hover:text-primary">Privacidad y método</a>
          <a href="https://github.com/AlanSan1195/machtobs" rel="noreferrer" className="hover:text-primary">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}

export function StaticSeoPage({ page }: { page: SeoPageDefinition }) {
  const related = getRelatedPages(page);
  const visibleSections = getVisibleSections(page);
  const visibleFaqs = getVisibleFaqs(page);
  const hubCards = page.kind === 'hub'
    ? SEO_PAGES.filter((candidate) => candidate.kind === 'guide')
    : [];

  return (
    <div className="relative min-h-screen bg-background text-paper">
      <div className="app-backdrop" aria-hidden="true" />
      <StaticHeader />
      <main>
        <article>
          <header className="mx-auto w-full max-w-[1200px] px-5 pb-10 pt-8 sm:px-8 sm:pb-14 sm:pt-12">
            <Breadcrumbs page={page} />
            <div className="mt-9 grid gap-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-end">
              <div>
                <p className="micro-label text-primary">{page.eyebrow}</p>
                <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.8rem,6.4vw,6.2rem)] font-black uppercase leading-[0.83] tracking-[-0.06em] text-paper">{page.heading}</h1>
              </div>
              <div className="border-l border-primary/45 pl-5">
                <p className="text-base leading-7 text-paper/70">{getFirstSentence(page.introduction)}</p>
                <p className="mt-5 font-mono text-[0.54rem] uppercase tracking-[0.14em] text-paper/60">
                  Revisado / <time dateTime={page.dateModified}>{page.dateModified}</time>
                </p>
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
            {page.kind === 'hub' ? (
              <section aria-labelledby="guide-index-heading" className="border-t border-paper/15 py-10 sm:py-12">
                <h2 id="guide-index-heading" className="font-display text-3xl font-black uppercase tracking-tight text-paper sm:text-5xl">Elige tu siguiente paso</h2>
                <div className="mt-9 grid gap-4 lg:grid-cols-2">
                  {hubCards.map((guide, index) => <GuideCard key={guide.path} page={guide} index={index} />)}
                </div>
              </section>
            ) : null}

            {visibleSections.map((section, index) => <ArticleSection key={section.id} section={section} index={index} />)}

            {visibleFaqs.length > 0 ? (
              <section className="border-t border-paper/15 py-10 sm:py-12" aria-labelledby="faq-heading">
                <div className="grid gap-9 lg:grid-cols-[9rem_minmax(0,1fr)]">
                  <p className="micro-label text-primary">FAQ</p>
                  <div>
                    <h2 id="faq-heading" className="font-display text-3xl font-black uppercase tracking-tight text-paper sm:text-5xl">Preguntas frecuentes</h2>
                    <div className="mt-6"><FaqList faqs={visibleFaqs} /></div>
                  </div>
                </div>
              </section>
            ) : null}

            {page.sources.length > 0 ? (
              <section className="border-t border-paper/15 py-10" aria-labelledby="sources-heading">
                <h2 id="sources-heading" className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] text-paper/55">Fuentes oficiales consultadas</h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {page.sources.map((source) => (
                    <li key={source.href}>
                      <a href={source.href} rel="noreferrer" className="text-sm text-paper/55 underline decoration-paper/20 underline-offset-4 transition-colors hover:text-primary">
                        {source.label} — {source.publisher}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </article>

        <aside className="border-t border-paper/15 bg-paper/[0.015]" aria-labelledby="related-heading">
          <div className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8 sm:py-12">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="micro-label text-primary">Siguiente / aprender OBS</p>
                <h2 id="related-heading" className="mt-4 font-display text-3xl font-black uppercase tracking-tight text-paper sm:text-5xl">Continúa con estas guías</h2>
              </div>
              <ArrowLink href="/configurador">Abrir configurador</ArrowLink>
            </div>
            <div className="mt-7 grid gap-4 lg:grid-cols-2">
              {related.slice(0, 2).map((relatedPage, index) => <GuideCard key={relatedPage.path} page={relatedPage} index={index} />)}
            </div>
          </div>
        </aside>
      </main>
      <StaticFooter />
      <span className="sr-only">Contenido revisado el {CONTENT_LAST_MODIFIED}.</span>
    </div>
  );
}
