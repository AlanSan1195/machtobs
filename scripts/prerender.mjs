/* global console */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDirectory = path.join(repositoryRoot, 'dist');
const ssrDirectory = path.join(repositoryRoot, '.seo-ssr');
const entryPath = path.join(ssrDirectory, 'entry-server.mjs');

const {
  DEFAULT_SOCIAL_IMAGE,
  STATIC_SEO_PAGES,
  buildSitemap,
  renderConfiguratorPage,
  renderNotFoundPage,
  renderSeoPage,
} = await import(pathToFileURL(entryPath).href);

const template = await readFile(path.join(distDirectory, 'index.html'), 'utf8');

function escapeAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function replaceMetadata(html, page, structuredData) {
  const canonical = page.path === '/'
    ? 'https://machtobs.vercel.app/'
    : `https://machtobs.vercel.app${page.path}`;
  const type = page.kind === 'home' || page.kind === 'hub' ? 'website' : 'article';
  const extraArticleMeta = type === 'article'
    ? [
      `<meta property="article:published_time" content="${page.datePublished}" />`,
      `<meta property="article:modified_time" content="${page.dateModified}" />`,
    ].join('\n    ')
    : '';
  const seoHead = [
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:url" content="${escapeAttribute(canonical)}" />`,
    `<meta property="og:title" content="${escapeAttribute(page.title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(page.description)}" />`,
    `<meta property="og:image" content="${DEFAULT_SOCIAL_IMAGE}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${escapeAttribute(`Machtobs — ${page.heading}`)}" />`,
    '<meta property="og:locale" content="es_ES" />',
    '<meta property="og:locale:alternate" content="es_MX" />',
    '<meta property="og:site_name" content="Machtobs" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeAttribute(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(page.description)}" />`,
    `<meta name="twitter:image" content="${DEFAULT_SOCIAL_IMAGE}" />`,
    extraArticleMeta,
    `<script type="application/ld+json">${safeJson(structuredData)}</script>`,
  ].filter(Boolean).join('\n    ');

  return html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttribute(page.title)}</title>`)
    .replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${escapeAttribute(page.description)}" />`)
    .replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeAttribute(canonical)}" />`)
    .replace('<meta name="seo-head" content="prerender" />', seoHead);
}

function injectMarkup(html, markup) {
  return html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
}

function removeClientScripts(html) {
  return html
    .replace(/\s*<script\b[^>]*\btype="module"[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\s*<link\b[^>]*\brel="modulepreload"[^>]*>/gi, '');
}

async function writePage(rendered, keepClient) {
  let html = injectMarkup(template, rendered.markup);
  html = replaceMetadata(html, rendered.page, rendered.structuredData);
  if (!keepClient) html = removeClientScripts(html);

  const outputFile = rendered.page.path === '/'
    ? path.join(distDirectory, 'index.html')
    : path.join(distDirectory, `${rendered.page.path.slice(1)}.html`);
  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, html, 'utf8');
}

await writePage(renderSeoPage('/'), true);

const configuratorHtml = injectMarkup(
  template
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>Configurador de OBS | Machtobs</title>')
    .replace(/<meta name="description"[^>]*>/i, '<meta name="description" content="Conecta OBS Studio y detecta la configuración recomendada para tu hardware, conexión y plataforma." />')
    .replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="noindex, follow" />')
    .replace(/<link rel="canonical"[^>]*>/i, '<link rel="canonical" href="https://machtobs.vercel.app/configurador" />')
    .replace('<meta name="seo-head" content="prerender" />', ''),
  renderConfiguratorPage(),
);
await writeFile(path.join(distDirectory, 'configurador.html'), configuratorHtml, 'utf8');

for (const page of STATIC_SEO_PAGES) {
  await writePage(renderSeoPage(page.path), false);
}

const notFoundHtml = template
  .replace(/<title>[\s\S]*?<\/title>/i, '<title>Página no encontrada | Machtobs</title>')
  .replace(/<meta name="description"[^>]*>/i, '<meta name="description" content="La página solicitada no existe. Vuelve al configurador Machtobs o consulta las guías de OBS Studio." />')
  .replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="noindex, follow" />')
  .replace(/<link rel="canonical"[^>]*>/i, '<link rel="canonical" href="https://machtobs.vercel.app/404" />')
  .replace('<meta name="seo-head" content="prerender" />', '')
  .replace('<div id="root"></div>', `<div id="root">${renderNotFoundPage()}</div>`);

await writeFile(path.join(distDirectory, '404.html'), removeClientScripts(notFoundHtml), 'utf8');
await writeFile(path.join(distDirectory, 'sitemap.xml'), buildSitemap(), 'utf8');
await rm(ssrDirectory, { recursive: true, force: true });

console.log(`Prerendered ${STATIC_SEO_PAGES.length + 1} indexable pages, the configurator and a custom 404.`);
