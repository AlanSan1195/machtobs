export const SITE_URL = 'https://machtobs.vercel.app';
export const SITE_NAME = 'Machtobs';
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/og-image.png`;
export const CONTENT_LAST_MODIFIED = '2026-11-13';

export type SeoFaq = {
  question: string;
  answer: string;
};

export type SeoPageDefinition = {
  path: '/' | '/como-configurar-obs';
  kind: 'home' | 'guide';
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
  title: 'Configurar OBS fácil y paso a paso | Machtobs',
  description: 'Configura OBS Studio sin perderte entre ajustes. Machtobs detecta tu equipo, recomienda un perfil, explica cada cambio y lo aplica solo con tu permiso.',
  heading: 'Configura OBS fácil, incluso si es tu primera vez',
  datePublished: '2026-07-06',
  dateModified: CONTENT_LAST_MODIFIED,
  faqs: [
    {
      question: '¿Machtobs configura OBS automáticamente?',
      answer: 'Sí. Después de conectar OBS mediante WebSocket, Machtobs compara la configuración actual con una recomendación calculada para el equipo, la conexión y la plataforma. Muestra los cambios antes de aplicarlos y requiere tu confirmación.',
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

const guidePage: SeoPageDefinition = {
  path: '/como-configurar-obs',
  kind: 'guide',
  title: 'Cómo configurar OBS desde cero: guía fácil | Machtobs',
  description: 'Aprende a configurar OBS Studio paso a paso: escenas, fuentes, audio, vídeo y prueba final. Descubre cuándo usar el asistente de OBS y el configurador Machtobs.',
  heading: 'Cómo configurar OBS desde cero, paso a paso',
  datePublished: CONTENT_LAST_MODIFIED,
  dateModified: CONTENT_LAST_MODIFIED,
  faqs: [],
};

export const SEO_PAGES: SeoPageDefinition[] = [homePage, guidePage];

export function getSeoPage(path: string): SeoPageDefinition | undefined {
  return SEO_PAGES.find((page) => page.path === path);
}

export function absoluteUrl(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}
