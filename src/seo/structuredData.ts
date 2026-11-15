import {
  SEO_PAGES,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  type SeoPageDefinition,
} from './content';

type JsonLdNode = Record<string, unknown>;

const organization: JsonLdNode = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/favicon.svg`,
  },
  sameAs: [
    'https://github.com/AlanSan1195/machtobs',
  ],
};

function faqData(page: SeoPageDefinition): JsonLdNode {
  return {
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/#faq`,
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildStructuredData(page: SeoPageDefinition): JsonLdNode {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        inLanguage: 'es',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      ...(page.kind === 'home' ? [{
        '@type': 'WebApplication',
        '@id': `${SITE_URL}/#application`,
        name: SITE_NAME,
        url: `${SITE_URL}/configurador`,
        description: page.description,
        applicationCategory: 'MultimediaApplication',
        inLanguage: 'es',
        featureList: [
          'Detección de hardware, red y ajustes de OBS',
          'Comparación de ajustes actuales y recomendados',
          'Explicación del cambio y su impacto',
          'Conexión local mediante OBS WebSocket',
          'Respaldo y aplicación de cambios con confirmación',
        ],
        publisher: { '@id': `${SITE_URL}/#organization` },
      }, faqData(page)] : [{
        '@type': 'Article',
        '@id': `${absoluteUrl(page.path)}#article`,
        mainEntityOfPage: absoluteUrl(page.path),
        headline: page.heading,
        description: page.description,
        inLanguage: 'es',
        datePublished: page.datePublished,
        dateModified: page.dateModified,
        author: { '@id': `${SITE_URL}/#organization` },
        publisher: { '@id': `${SITE_URL}/#organization` },
      }]),
    ],
  };
}

export function buildSitemap(): string {
  const urls = SEO_PAGES.map((page) => [
    '  <url>',
    `    <loc>${absoluteUrl(page.path)}</loc>`,
    `    <lastmod>${page.dateModified}</lastmod>`,
    '  </url>',
  ].join('\n')).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');
}
