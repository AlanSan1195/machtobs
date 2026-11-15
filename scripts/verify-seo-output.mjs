/* global console */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDirectory = path.join(repositoryRoot, 'dist');
const expectedPaths = [
  '/',
  '/como-configurar-obs',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function outputFileFor(route) {
  return route === '/'
    ? path.join(distDirectory, 'index.html')
    : path.join(distDirectory, `${route.slice(1)}.html`);
}

const titles = new Set();
const descriptions = new Set();

for (const route of expectedPaths) {
  const html = await readFile(outputFileFor(route), 'utf8');
  const title = html.match(/<title>(.*?)<\/title>/i)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];

  assert(title && !titles.has(title), `${route}: title ausente o duplicado.`);
  assert(description && !descriptions.has(description), `${route}: description ausente o duplicada.`);
  assert(canonical === `https://machtobs.vercel.app${route}`, `${route}: canonical incorrecto (${canonical}).`);
  assert(h1Count === 1, `${route}: se esperaba un H1 y se encontraron ${h1Count}.`);
  assert(jsonLd, `${route}: falta JSON-LD.`);
  JSON.parse(jsonLd);
  assert(!/name="keywords"/i.test(html), `${route}: meta keywords no debe existir.`);
  assert(/<div id="root">(?!\s*<\/div>)/i.test(html), `${route}: root no contiene HTML prerenderizado.`);
  assert(/<script\b[^>]*type="module"/i.test(html), `${route}: debe conservar el cliente interactivo.`);

  titles.add(title);
  descriptions.add(description);
}

const sitemap = await readFile(path.join(distDirectory, 'sitemap.xml'), 'utf8');
for (const route of expectedPaths) {
  assert(sitemap.includes(`<loc>https://machtobs.vercel.app${route}</loc>`), `${route}: falta en sitemap.xml.`);
}
assert((sitemap.match(/<url>/g) ?? []).length === expectedPaths.length, 'El sitemap debe incluir todas las páginas indexables.');

const configurator = await readFile(path.join(distDirectory, 'configurador.html'), 'utf8');
assert(configurator.includes('noindex, follow'), '/configurador debe incluir noindex, follow.');
assert((configurator.match(/<h1\b/gi) ?? []).length === 1, '/configurador debe tener un H1.');
assert(/<script\b[^>]*type="module"/i.test(configurator), '/configurador debe conservar el cliente interactivo.');
assert(configurator.includes('aria-label="Conectar con OBS"'), '/configurador debe contener el sistema de conexión.');
assert(!configurator.includes('OBS listo para tu equipo'), '/configurador no debe contener la landing.');
assert(configurator.includes('Abre OBS'), '/configurador debe mostrar los pasos desde el inicio.');
assert(!configurator.includes('guía / 4 pasos'), '/configurador no debe mostrar un botón intermedio de inicio.');

const home = await readFile(path.join(distDirectory, 'index.html'), 'utf8');
assert(home.includes('href="/configurador"'), 'La landing debe enlazar al configurador.');
assert(home.includes('href="/como-configurar-obs"'), 'La landing debe enlazar a la guía.');
assert(home.includes('Empezar'), 'La landing debe usar Empezar como llamada principal.');
assert(
  home.includes('<meta name="google-site-verification" content="Zjz9nhYz1hWfVGW-RE3JdWQNXUVdjCbYpX050ys0oro"'),
  'La landing debe conservar la verificación de Google Search Console.',
);
assert(!home.includes('aria-label="Conectar con OBS"'), 'La landing no debe contener el sistema de conexión.');

const guide = await readFile(path.join(distDirectory, 'como-configurar-obs.html'), 'utf8');
assert(guide.includes('href="/configurador"'), 'La guía debe enlazar al configurador.');
assert(guide.includes('PASO 01'), 'La guía debe contener los pasos visibles en HTML.');

const notFound = await readFile(path.join(distDirectory, '404.html'), 'utf8');
assert(notFound.includes('noindex, follow'), '404.html debe incluir noindex, follow.');
assert((notFound.match(/<h1\b/gi) ?? []).length === 1, '404.html debe tener un H1.');

console.log(`SEO output verified for ${expectedPaths.length} pages.`);
