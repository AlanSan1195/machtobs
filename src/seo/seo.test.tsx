import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from '../renderer/App';
import { LandingPage } from '../renderer/LandingPage';
import { StaticSeoPage } from './SeoPages';
import {
  SEO_PAGES,
  STATIC_SEO_PAGES,
  SITE_URL,
  getSeoPage,
} from './content';
import { buildSitemap, buildStructuredData } from './structuredData';

function countTag(html: string, tagName: string): number {
  return (html.match(new RegExp(`<${tagName}\\b`, 'gi')) ?? []).length;
}

describe('registro SEO', () => {
  it('mantiene URLs, títulos y descripciones únicos y aptos para resultados de búsqueda', () => {
    const paths = new Set<string>();
    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const page of SEO_PAGES) {
      expect(paths.has(page.path)).toBe(false);
      expect(titles.has(page.title)).toBe(false);
      expect(descriptions.has(page.description)).toBe(false);
      expect(page.title.length).toBeGreaterThanOrEqual(35);
      expect(page.title.length).toBeLessThanOrEqual(65);
      expect(page.description.length).toBeGreaterThanOrEqual(120);
      expect(page.description.length).toBeLessThanOrEqual(170);
      expect(page.path).toMatch(/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/);

      paths.add(page.path);
      titles.add(page.title);
      descriptions.add(page.description);
    }
  });

  it('no contiene enlaces relacionados rotos', () => {
    for (const page of SEO_PAGES) {
      for (const relatedPath of page.relatedPaths) {
        expect(getSeoPage(relatedPath), `${page.path} enlaza a ${relatedPath}`).toBeDefined();
      }
    }
  });

  it('genera JSON-LD válido y específico para cada página', () => {
    for (const page of SEO_PAGES) {
      const structuredData = buildStructuredData(page);
      expect(structuredData['@context']).toBe('https://schema.org');
      expect(Array.isArray(structuredData['@graph'])).toBe(true);
      expect(() => JSON.parse(JSON.stringify(structuredData))).not.toThrow();
    }
  });

  it('mantiene el sitemap sincronizado con todas las páginas canónicas', () => {
    const sitemap = buildSitemap();
    expect((sitemap.match(/<url>/g) ?? []).length).toBe(SEO_PAGES.length);

    for (const page of SEO_PAGES) {
      const canonical = page.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${page.path}`;
      expect(sitemap).toContain(`<loc>${canonical}</loc>`);
      expect(sitemap).toContain(`<lastmod>${page.dateModified}</lastmod>`);
    }
  });
});

describe('HTML indexable', () => {
  it('renderiza un solo H1 en la portada sin ejecutar efectos del navegador', () => {
    const html = renderToStaticMarkup(<LandingPage />);
    expect(countTag(html, 'h1')).toBe(1);
    expect(html).toContain('href="/configurador"');
  });

  it('renderiza un solo H1 y enlaces internos en cada página estática', () => {
    const allHtml = STATIC_SEO_PAGES.map((page) => {
      const html = renderToStaticMarkup(<StaticSeoPage page={page} />);
      expect(countTag(html, 'h1'), page.path).toBe(1);
      expect(countTag(html, 'h2'), page.path).toBeGreaterThan(0);
      expect(html).toContain('/configurador');
      return html;
    }).join('\n');

    for (const page of STATIC_SEO_PAGES) {
      expect(allHtml).toContain(`href="${page.path}"`);
    }
  });

  it('separa la landing del sistema de detección', () => {
    const landing = renderToStaticMarkup(<LandingPage />);
    const configurator = renderToStaticMarkup(<App />);

    expect(landing).toContain('id="home-seo-title"');
    expect(landing).toContain('Empezar');
    expect(landing).not.toContain('aria-label="Conectar con OBS"');
    expect(configurator).toContain('aria-label="Conectar con OBS"');
    expect(configurator).toContain('Abre OBS');
    expect(configurator).not.toContain('guía / 4 pasos');
    expect(configurator).not.toContain('OBS listo para tu equipo');
  });
});
