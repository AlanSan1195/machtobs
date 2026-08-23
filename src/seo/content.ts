export const SITE_URL = 'https://machtobs.vercel.app';
export const SITE_NAME = 'Machtobs';
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/og-image.png`;
export const CONTENT_LAST_MODIFIED = '2026-08-22';

export type SeoFaq = {
  question: string;
  answer: string;
};

export type SeoPageDefinition = {
  path: '/';
  kind: 'home';
  title: string;
  description: string;
  heading: string;
  datePublished: string;
  dateModified: string;
  faqs: SeoFaq[];
};

const homePage: SeoPageDefinition = {
  path: '/',
  kind: 'home',
  title: 'Configuración avanzada de OBS para directos | Machtobs',
  description: 'Analiza hardware, red y ajustes de OBS. Machtobs compara recomendaciones, explica su impacto y aplica cambios confirmados mediante una conexión local segura.',
  heading: 'Configuración avanzada para tus directos',
  datePublished: '2026-07-06',
  dateModified: CONTENT_LAST_MODIFIED,
  faqs: [
    {
      question: '¿Machtobs configura OBS automáticamente?',
      answer: 'Sí. Después de conectar OBS mediante WebSocket, Machtobs compara la configuración actual con una recomendación calculada para el equipo, la conexión y la plataforma. Siempre muestra los cambios antes de aplicarlos.',
    },
    {
      question: '¿Puedo usar Machtobs si nunca he hecho stream?',
      answer: 'Sí. El flujo explica cómo conectar OBS, qué cambia, por qué conviene y cómo afecta la calidad, el rendimiento y la estabilidad antes de aplicar cada ajuste.',
    },
    {
      question: '¿Machtobs envía mi contraseña o mis escenas a internet?',
      answer: 'No. La conexión con OBS ocurre en el navegador contra localhost. La contraseña, las escenas y las claves de emisión no se envían al backend; solo se utilizan datos técnicos necesarios para calcular la recomendación.',
    },
  ],
};

export const SEO_PAGES: SeoPageDefinition[] = [homePage];

export function getSeoPage(path: string): SeoPageDefinition | undefined {
  return path === '/' ? homePage : undefined;
}

export function absoluteUrl(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}
