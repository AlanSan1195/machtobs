import {
  DEFAULT_SOCIAL_IMAGE,
  SEO_PAGES,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  type SeoPageDefinition,
} from './content';
import { getVisibleFaqs, getVisibleSections } from './presentation';

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

function breadcrumbData(page: SeoPageDefinition): JsonLdNode {
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Machtobs',
      item: `${SITE_URL}/`,
    },
  ];

  if (page.path.startsWith('/guias/') || page.path === '/guias') {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: 'Guías de OBS',
      item: `${SITE_URL}/guias`,
    });
  }

  if (page.path !== '/guias') {
    items.push({
      '@type': 'ListItem',
      position: items.length + 1,
      name: page.heading,
      item: absoluteUrl(page.path),
    });
  }

  return {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(page.path)}#breadcrumb`,
    itemListElement: items,
  };
}

function faqData(page: SeoPageDefinition): JsonLdNode | null {
  const faqs = getVisibleFaqs(page);
  if (faqs.length === 0) return null;

  return {
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(page.path)}#faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

function howToData(page: SeoPageDefinition): JsonLdNode | null {
  const sections = getVisibleSections(page);
  const steps = sections.flatMap((section) => section.steps ?? []);
  if (page.kind !== 'guide' || steps.length === 0) return null;

  return {
    '@type': 'HowTo',
    '@id': `${absoluteUrl(page.path)}#howto`,
    name: page.heading,
    description: page.description,
    image: DEFAULT_SOCIAL_IMAGE,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.text,
      url: `${absoluteUrl(page.path)}#${sections.find((section) => section.steps?.includes(step))?.id ?? ''}`,
    })),
  };
}

export function buildStructuredData(page: SeoPageDefinition): JsonLdNode {
  if (page.path === '/') {
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
        {
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
        },
        faqData(page),
      ].filter(Boolean),
    };
  }

  const pageType = page.kind === 'hub' ? 'CollectionPage' : 'Article';
  const primaryPage: JsonLdNode = {
    '@type': pageType,
    '@id': `${absoluteUrl(page.path)}#article`,
    url: absoluteUrl(page.path),
    headline: page.heading,
    name: page.heading,
    description: page.description,
    image: DEFAULT_SOCIAL_IMAGE,
    inLanguage: 'es',
    datePublished: page.datePublished,
    dateModified: page.dateModified,
    author: { '@id': `${SITE_URL}/#organization` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    breadcrumb: { '@id': `${absoluteUrl(page.path)}#breadcrumb` },
    mainEntityOfPage: absoluteUrl(page.path),
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      primaryPage,
      breadcrumbData(page),
      howToData(page),
      faqData(page),
    ].filter(Boolean),
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
