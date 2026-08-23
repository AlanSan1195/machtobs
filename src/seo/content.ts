export const SITE_URL = 'https://machtobs.vercel.app';
export const SITE_NAME = 'Machtobs';
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/og-image.png`;
export const CONTENT_LAST_MODIFIED = '2026-08-22';

export type SeoLink = {
  href: string;
  label: string;
};

export type SeoStep = {
  title: string;
  text: string;
};

export type SeoSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  steps?: SeoStep[];
  note?: string;
};

export type SeoFaq = {
  question: string;
  answer: string;
};

export type SeoSource = SeoLink & {
  publisher: string;
};

export type SeoPageDefinition = {
  path: string;
  kind: 'home' | 'hub' | 'guide' | 'about';
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  introduction: string;
  datePublished: string;
  dateModified: string;
  sections: SeoSection[];
  faqs: SeoFaq[];
  relatedPaths: string[];
  sources: SeoSource[];
};

const obsQuickStart: SeoSource = {
  label: 'Guía de inicio rápido de OBS Studio',
  href: 'https://obsproject.com/kb/quick-start-guide',
  publisher: 'OBS Project',
};

const obsOverview: SeoSource = {
  label: 'Descripción general de OBS Studio',
  href: 'https://obsproject.com/kb/obs-studio-overview',
  publisher: 'OBS Project',
};

const obsEncoding: SeoSource = {
  label: 'Solución de problemas de rendimiento de codificación',
  href: 'https://obsproject.com/kb/encoding-performance-troubleshooting',
  publisher: 'OBS Project',
};

const youtubeEncoder: SeoSource = {
  label: 'Configuración recomendada del codificador para YouTube Live',
  href: 'https://support.google.com/youtube/answer/2853702?hl=es',
  publisher: 'Ayuda de YouTube',
};

const homePage: SeoPageDefinition = {
  path: '/',
  kind: 'home',
  title: 'Configuración avanzada de OBS para directos | Machtobs',
  description: 'Analiza hardware, red y ajustes de OBS. Machtobs compara recomendaciones, explica su impacto y aplica cambios confirmados mediante una conexión local segura.',
  eyebrow: 'Configuración avanzada de OBS',
  heading: 'Configuración avanzada para tus directos',
  introduction: 'Machtobs detecta el hardware, la red y los ajustes de OBS; compara la recomendación y explica el impacto de cada cambio antes de aplicarlo.',
  datePublished: '2026-07-06',
  dateModified: CONTENT_LAST_MODIFIED,
  sections: [],
  faqs: [
    {
      question: '¿Machtobs configura OBS automáticamente?',
      answer: 'Sí. Después de conectar OBS mediante WebSocket, Machtobs compara la configuración actual con una recomendación calculada para el equipo, la conexión y la plataforma. Siempre muestra los cambios antes de aplicarlos.',
    },
    {
      question: '¿Puedo usar Machtobs si nunca he hecho stream?',
      answer: 'Sí. El flujo explica cómo activar WebSocket, elegir el objetivo, revisar la recomendación y preparar escenas. Las guías complementarias explican los conceptos básicos sin asumir experiencia previa.',
    },
    {
      question: '¿Machtobs envía mi contraseña o mis escenas a internet?',
      answer: 'No. La conexión con OBS ocurre en el navegador contra localhost. La contraseña, las escenas y las claves de emisión no se envían al backend; solo se utilizan datos técnicos necesarios para calcular la recomendación.',
    },
  ],
  relatedPaths: ['/guias'],
  sources: [],
};

const guidesHub: SeoPageDefinition = {
  path: '/guias',
  kind: 'hub',
  title: 'Guías de OBS Studio en español | Machtobs',
  description: 'Aprende OBS Studio desde cero con guías claras sobre configuración, streaming, grabación, audio y tu primer directo. Sin copiar ajustes a ciegas.',
  eyebrow: 'Biblioteca / OBS desde cero',
  heading: 'Guías para aprender y entender OBS Studio',
  introduction: 'Una ruta práctica para comprender escenas, fuentes, audio, codificación y salida antes de emitir. Empieza por el tema que necesitas y vuelve al configurador cuando quieras obtener valores adaptados a tu equipo.',
  datePublished: CONTENT_LAST_MODIFIED,
  dateModified: CONTENT_LAST_MODIFIED,
  sections: [
    {
      id: 'ruta-recomendada',
      title: 'Una ruta corta para empezar bien',
      paragraphs: [
        'Si nunca has abierto OBS, comienza por la guía para principiantes. Después prepara una escena, comprueba el audio y termina con la guía del primer stream. El orden evita entrar en menús avanzados sin entender qué controla cada ajuste.',
        'Si ya transmites y solo buscas mejorar calidad o estabilidad, ve directamente a configuración de streaming, audio o grabación. Machtobs puede calcular valores concretos, pero entender el motivo de cada cambio te ayuda a detectar problemas durante una emisión real.',
      ],
      steps: [
        { title: 'Entiende la interfaz', text: 'Aprende qué hacen escenas, fuentes, mezclador de audio y controles.' },
        { title: 'Configura la salida', text: 'Elige encoder, resolución, FPS y bitrate según el uso real.' },
        { title: 'Haz una prueba', text: 'Graba o transmite en privado y corrige audio, encuadre y estabilidad.' },
      ],
    },
  ],
  faqs: [
    {
      question: '¿En qué orden debería aprender OBS?',
      answer: 'Interfaz y escenas primero, audio después y salida de streaming o grabación al final. Así puedes comprobar cada parte por separado antes del primer directo.',
    },
    {
      question: '¿Necesito memorizar todos los ajustes de OBS?',
      answer: 'No. Conviene entender para qué sirven resolución, FPS, encoder y bitrate. Los valores concretos pueden calcularse con Machtobs y revisarse cuando cambie el equipo o la conexión.',
    },
  ],
  relatedPaths: [
    '/guias/obs-para-principiantes',
    '/guias/configurar-obs',
    '/guias/primer-stream-con-obs',
    '/guias/configuracion-obs-streaming',
    '/guias/configurar-audio-obs',
    '/guias/configurar-obs-para-grabar',
  ],
  sources: [obsQuickStart, obsOverview],
};

const configureObs: SeoPageDefinition = {
  path: '/guias/configurar-obs',
  kind: 'guide',
  title: 'Cómo configurar OBS Studio paso a paso | Machtobs',
  description: 'Aprende cómo configurar OBS Studio paso a paso: escenas, fuentes, audio, resolución, encoder, bitrate y prueba final para streaming o grabación.',
  eyebrow: 'Guía / configuración esencial',
  heading: 'Cómo configurar OBS Studio paso a paso',
  introduction: 'Configurar OBS no consiste en copiar un bitrate de un vídeo. Primero hay que definir qué vas a emitir o grabar, comprobar el equipo y construir una escena que puedas probar sin presión.',
  datePublished: CONTENT_LAST_MODIFIED,
  dateModified: CONTENT_LAST_MODIFIED,
  sections: [
    {
      id: 'antes-de-empezar',
      title: 'Antes de tocar los ajustes',
      paragraphs: [
        'Instala la versión actual de OBS Studio desde el sitio oficial y abre la aplicación una vez para que cree sus carpetas y perfil inicial. Decide si harás stream, grabación o las dos cosas: la salida ideal cambia según ese objetivo.',
        'Anota también la plataforma de destino, la resolución de tu monitor o capturadora y una medida realista de la velocidad de subida. No uses únicamente el pico de un test; una emisión necesita ancho de banda sostenido y margen para que el resto de la red siga funcionando.',
      ],
      bullets: [
        'OBS Studio actualizado y abierto.',
        'Cuenta preparada en Twitch, YouTube u otra plataforma.',
        'Micrófono, cámara o capturadora conectados antes de detectar dispositivos.',
        'Una prueba de subida realizada con el mismo tipo de conexión que usarás al emitir.',
      ],
    },
    {
      id: 'escenas-y-fuentes',
      title: 'Crea una escena sencilla y verificable',
      paragraphs: [
        'Una escena es la composición que ve el público; las fuentes son las piezas que contiene. Para una primera prueba basta con captura de pantalla o juego, micrófono y, si lo necesitas, cámara. Añadir alertas y decoraciones antes de validar vídeo y audio multiplica los puntos de fallo.',
        'Ordena las fuentes como capas: el fondo abajo, la captura en medio y la cámara o textos arriba. Comprueba el encuadre en el lienzo y evita estirar una fuente con otra proporción, porque deformará la imagen aunque la resolución de salida sea correcta.',
      ],
    },
    {
      id: 'video-y-salida',
      title: 'Ajusta vídeo y salida según el equipo',
      paragraphs: [
        'La resolución base describe el lienzo de trabajo. La resolución de salida es lo que finalmente se codifica. Reducir la salida puede aliviar al encoder y a la conexión sin obligarte a rehacer toda la escena.',
        'El encoder comprime el vídeo. Si tu GPU o procesador ofrece codificación por hardware compatible, suele ser un buen punto de partida porque reserva recursos para el juego o la aplicación principal. El bitrate debe encajar tanto en la plataforma como en tu subida sostenida.',
      ],
      bullets: [
        'Usa 30 FPS cuando priorices estabilidad o contenido con poco movimiento.',
        'Considera 60 FPS para juegos rápidos solo si equipo, capturadora y conexión lo sostienen.',
        'Mantén un intervalo de fotogramas clave compatible con la plataforma.',
        'No aumentes bitrate para compensar una fuente borrosa o mal escalada.',
      ],
      note: 'Machtobs puede leer la configuración actual y proponer resolución, FPS, encoder y bitrate sin aplicar nada hasta que confirmes el cambio.',
    },
    {
      id: 'audio-y-prueba',
      title: 'Configura el audio y haz una prueba privada',
      paragraphs: [
        'Habla al volumen real que usarás y vigila el mezclador. La voz debe mantenerse clara sin llegar continuamente a la zona roja. Comprueba que el audio del escritorio no tape el micrófono y escucha la grabación con auriculares; mirar los medidores no sustituye oír el resultado.',
        'Graba varios minutos con movimiento, voz y cambios de escena. Revisa sincronización, fotogramas perdidos, carga del encoder y claridad del audio. Guarda la configuración estable antes de añadir más elementos.',
      ],
      steps: [
        { title: 'Conecta y detecta', text: 'Abre OBS, activa WebSocket y conecta Machtobs localmente.' },
        { title: 'Revisa la recomendación', text: 'Compara cada valor actual con el propuesto y lee el motivo.' },
        { title: 'Aplica y prueba', text: 'Guarda respaldo, aplica los cambios y realiza una grabación o emisión privada.' },
      ],
    },
  ],
  faqs: [
    {
      question: '¿Qué debo configurar primero en OBS?',
      answer: 'Primero escenas y fuentes, luego audio y finalmente vídeo y salida. Este orden permite comprobar que la señal existe antes de optimizar su codificación.',
    },
    {
      question: '¿Puedo restaurar mi configuración anterior?',
      answer: 'Machtobs guarda un respaldo local de los ajustes compatibles antes de aplicar cambios y permite restaurarlo desde la comparación.',
    },
  ],
  relatedPaths: ['/guias/obs-para-principiantes', '/guias/configuracion-obs-streaming', '/guias/configurar-audio-obs'],
  sources: [obsQuickStart, obsOverview],
};

const obsForBeginners: SeoPageDefinition = {
  path: '/guias/obs-para-principiantes',
  kind: 'guide',
  title: 'OBS para principiantes: guía desde cero | Machtobs',
  description: 'Guía de OBS para principiantes: entiende escenas, fuentes, mezclador, transiciones y salida para preparar tu primera grabación o transmisión.',
  eyebrow: 'Guía / fundamentos',
  heading: 'OBS para principiantes: empieza desde cero',
  introduction: 'OBS Studio parece complejo porque muestra producción, audio y emisión en una sola ventana. Cuando separas esas funciones, la interfaz se convierte en un flujo lógico: componer, escuchar, codificar y publicar.',
  datePublished: CONTENT_LAST_MODIFIED,
  dateModified: CONTENT_LAST_MODIFIED,
  sections: [
    {
      id: 'interfaz',
      title: 'Las cinco zonas que necesitas entender',
      paragraphs: [
        'El lienzo central es la vista previa. Debajo aparecen escenas y fuentes; a un lado está el mezclador de audio y, normalmente a la derecha, los controles de grabación y transmisión. No necesitas dominar todos los menús para empezar.',
        'Piensa en una escena como un plano de televisión. Puedes tener una escena de juego, otra de cámara completa y otra de pausa. Cambiar de escena sustituye la composición completa; activar o desactivar una fuente modifica solo una capa.',
      ],
      bullets: [
        'Escenas: composiciones completas para cada momento del directo.',
        'Fuentes: juego, pantalla, cámara, imagen, texto o entrada de audio.',
        'Mezclador: volumen, silencio, filtros y supervisión de cada señal.',
        'Transiciones: forma de cambiar entre escenas.',
        'Controles: iniciar grabación, transmisión, estudio virtual o ajustes.',
      ],
    },
    {
      id: 'primera-escena',
      title: 'Construye tu primera escena',
      paragraphs: [
        'Crea una escena con un nombre que explique su función, por ejemplo “Juego”. Añade una captura de juego si OBS reconoce la aplicación; usa captura de ventana para software específico o captura de pantalla cuando necesites mostrar el escritorio completo.',
        'Añade la cámara después y redimensiónala manteniendo la proporción. Una fuente seleccionada muestra controles de transformación. Si algo desaparece, comprueba el icono de visibilidad y el orden de las capas antes de volver a crearla.',
      ],
      steps: [
        { title: 'Crea la escena', text: 'Usa un nombre claro que puedas identificar durante el directo.' },
        { title: 'Añade la captura principal', text: 'Selecciona juego, ventana, pantalla o capturadora según el origen.' },
        { title: 'Incorpora voz y cámara', text: 'Comprueba dispositivo, nivel y encuadre antes de decorar.' },
      ],
    },
    {
      id: 'salida',
      title: 'Qué significan resolución, FPS, encoder y bitrate',
      paragraphs: [
        'La resolución determina cuántos píxeles tiene la imagen; los FPS indican cuántas imágenes se envían por segundo. El encoder comprime esa información y el bitrate limita cuántos datos utiliza. Subir todos los números no garantiza mejor calidad si el equipo o la red no pueden procesarlos.',
        'Para aprender, elige una configuración estable y realiza pruebas cortas. Cuando comprendas cómo se ve y cuánto recurso consume, podrás cambiar una variable cada vez. Si modificas resolución, FPS, encoder y bitrate simultáneamente, será difícil saber qué causó una mejora o un fallo.',
      ],
    },
    {
      id: 'errores-comunes',
      title: 'Errores comunes de principiante',
      paragraphs: [
        'El error más frecuente es preparar una escena visualmente compleja sin haber escuchado el audio. También es habitual capturar la pantalla equivocada, duplicar entradas de micrófono o emitir con una resolución que la conexión no sostiene.',
        'Antes de pulsar “Iniciar transmisión”, graba una muestra local y mírala completa. Esa prueba revela desincronización, eco, notificaciones privadas, textos ilegibles y fuentes ocultas sin exponerlos al público.',
      ],
      bullets: [
        'Evita capturar dos veces el mismo micrófono.',
        'No muestres claves, mensajes o ventanas privadas en una captura de pantalla.',
        'No ignores la advertencia de codificación sobrecargada.',
        'No dependas de una sola prueba de velocidad hecha en condiciones distintas.',
      ],
    },
  ],
  faqs: [
    {
      question: '¿OBS Studio es gratis?',
      answer: 'Sí. OBS Studio es software libre y gratuito. Descárgalo desde el sitio oficial de OBS Project para evitar instaladores modificados.',
    },
    {
      question: '¿Necesito una computadora potente para usar OBS?',
      answer: 'Depende de la resolución, FPS, fuentes y encoder. Un equipo modesto puede grabar o transmitir con una salida ajustada; lo importante es elegir valores acordes al hardware.',
    },
  ],
  relatedPaths: ['/guias/configurar-obs', '/guias/primer-stream-con-obs', '/guias/configurar-audio-obs'],
  sources: [obsOverview, obsQuickStart],
};

const streamingConfiguration: SeoPageDefinition = {
  path: '/guias/configuracion-obs-streaming',
  kind: 'guide',
  title: 'Mejor configuración de OBS para streaming | Machtobs',
  description: 'Elige la mejor configuración de OBS para streaming según hardware, subida y plataforma: resolución, FPS, encoder, bitrate y prueba de estabilidad.',
  eyebrow: 'Guía / salida de streaming',
  heading: 'La mejor configuración de OBS para streaming depende de tu equipo',
  introduction: 'La configuración correcta no es la que tiene los números más altos, sino la que mantiene imagen, audio y juego estables durante toda la transmisión. Hardware, red y plataforma fijan límites diferentes.',
  datePublished: CONTENT_LAST_MODIFIED,
  dateModified: CONTENT_LAST_MODIFIED,
  sections: [
    {
      id: 'variables',
      title: 'Las variables que deciden la calidad real',
      paragraphs: [
        'La plataforma establece formatos y límites; la subida determina cuánto bitrate puedes sostener; el encoder y la carga del equipo determinan cuánto vídeo puedes comprimir sin perder fotogramas. La resolución y los FPS reparten ese presupuesto entre detalle y movimiento.',
        'Por eso dos personas que transmiten el mismo juego pueden necesitar valores distintos. Copiar una configuración diseñada para otra GPU, otra red o una plataforma diferente puede producir pixelación, retraso o codificación sobrecargada.',
      ],
      bullets: [
        'Plataforma y servidor de emisión seleccionados.',
        'Subida sostenida con margen para variaciones.',
        'Encoder de hardware o software disponible.',
        'Carga del juego o aplicación durante una sesión real.',
        'Resolución y frecuencia de la fuente original.',
      ],
    },
    {
      id: 'resolucion-fps',
      title: 'Resolución y FPS: detalle frente a movimiento',
      paragraphs: [
        'Una salida más grande necesita más datos para conservar detalle. A bitrate constante, bajar resolución puede verse mejor que forzar 1080p con bloques y texturas borrosas. Aumentar a 60 FPS duplica la cantidad de imágenes que el encoder debe procesar frente a 30 FPS.',
        'Para conversación, tutoriales y contenido con poco movimiento, 30 FPS puede ser suficiente. Los juegos rápidos se benefician de 60 FPS cuando el equipo y la red mantienen estabilidad. Decide a partir de una grabación de prueba con el contenido más exigente, no desde un menú vacío.',
      ],
    },
    {
      id: 'encoder-bitrate',
      title: 'Encoder y bitrate sin recetas universales',
      paragraphs: [
        'Los encoders por hardware modernos suelen reducir el impacto sobre la CPU, mientras que la codificación por software puede competir con el juego por recursos. La calidad exacta depende de la generación del hardware y de los ajustes que OBS exponga.',
        'El bitrate debe respetar las recomendaciones actuales de la plataforma y mantenerse por debajo de la subida sostenida disponible. Reserva margen para audio, variaciones de red y otros dispositivos. Si aparecen fotogramas perdidos por red, aumentar bitrate empeora el problema.',
      ],
      note: 'Machtobs combina hardware, plataforma, modo y medición de subida para proponer un punto de partida, y muestra el cambio antes de aplicarlo.',
    },
    {
      id: 'diagnostico',
      title: 'Cómo saber qué límite estás alcanzando',
      paragraphs: [
        'OBS separa los problemas de renderizado, codificación y red. Los fotogramas omitidos por renderizado apuntan a carga gráfica; la codificación sobrecargada indica que el encoder no termina a tiempo; los fotogramas perdidos por red señalan conexión o servidor.',
        'Corrige una categoría cada vez. Reduce carga del juego o complejidad de escena si falla el renderizado; baja salida o cambia encoder si falla la codificación; reduce bitrate y revisa conexión por cable o servidor si falla la red.',
      ],
      steps: [
        { title: 'Prueba el peor caso', text: 'Usa la escena y el contenido que más recursos consuman.' },
        { title: 'Observa las estadísticas', text: 'Distingue renderizado, codificación y red antes de cambiar valores.' },
        { title: 'Ajusta una variable', text: 'Repite la prueba y conserva solo los cambios que mejoren estabilidad.' },
      ],
    },
  ],
  faqs: [
    {
      question: '¿Es mejor transmitir a 720p o 1080p?',
      answer: 'Depende del bitrate disponible, el tipo de contenido y el encoder. Una salida 720p estable puede conservar más claridad que 1080p con datos insuficientes.',
    },
    {
      question: '¿Cuánto bitrate debo usar en OBS?',
      answer: 'Usa un valor compatible con la plataforma y menor que tu subida sostenida, dejando margen. Machtobs calcula una recomendación con esas variables en vez de aplicar un número universal.',
    },
  ],
  relatedPaths: ['/guias/configurar-obs', '/guias/primer-stream-con-obs', '/guias/configurar-obs-para-grabar'],
  sources: [youtubeEncoder, obsEncoding, obsQuickStart],
};

const firstStream: SeoPageDefinition = {
  path: '/guias/primer-stream-con-obs',
  kind: 'guide',
  title: 'Cómo hacer tu primer stream con OBS | Machtobs',
  description: 'Prepara tu primer stream con OBS paso a paso: cuenta, escena, micrófono, configuración, prueba privada y checklist antes de iniciar el directo.',
  eyebrow: 'Guía / primera emisión',
  heading: 'Cómo hacer tu primer stream con OBS',
  introduction: 'El primer directo sale mejor cuando se trata como una prueba controlada. Prepara una escena mínima, verifica voz y vídeo, protege datos privados y ensaya el flujo antes de invitar público.',
  datePublished: CONTENT_LAST_MODIFIED,
  dateModified: CONTENT_LAST_MODIFIED,
  sections: [
    {
      id: 'prepara-cuenta',
      title: 'Prepara la cuenta y la conexión',
      paragraphs: [
        'Activa las funciones de transmisión de la plataforma con tiempo; algunas cuentas requieren verificación. Conecta OBS mediante la integración oficial o introduce la clave de emisión sin mostrarla en capturas ni compartirla.',
        'Siempre que sea posible, usa Ethernet. Detén descargas y sincronizaciones grandes durante la prueba, y comprueba la subida en condiciones parecidas a las del directo. Una buena velocidad máxima no compensa cortes frecuentes.',
      ],
    },
    {
      id: 'escena-minima',
      title: 'Crea una escena mínima que puedas controlar',
      paragraphs: [
        'Incluye solo la captura principal, el micrófono y la cámara si realmente la necesitas. Añade una escena de pausa para poder ocultar la pantalla cuando abras una ventana privada o atiendas un problema.',
        'Revisa que notificaciones, nombres reales, correo y claves no sean visibles. Si capturas toda la pantalla, cualquier ventana nueva puede aparecer en directo. Una captura específica de juego o ventana reduce esa exposición.',
      ],
      bullets: [
        'Escena principal con la fuente correcta.',
        'Escena de pausa o privacidad.',
        'Micrófono audible sin saturación.',
        'Audio del juego por debajo de la voz.',
        'Título, categoría y privacidad configurados en la plataforma.',
      ],
    },
    {
      id: 'ensayo',
      title: 'Haz un ensayo antes de transmitir',
      paragraphs: [
        'Graba localmente entre cinco y diez minutos mientras hablas, cambias de escena y ejecutas el contenido real. Escucha con auriculares y mira el archivo completo. Corrige eco, retraso, niveles, encuadre y textos demasiado pequeños.',
        'Después realiza una emisión privada o no listada cuando la plataforma lo permita. Comprueba el resultado desde otro dispositivo y no solo desde la vista previa de OBS, porque la plataforma vuelve a procesar la señal.',
      ],
      steps: [
        { title: 'Graba localmente', text: 'Verifica contenido, audio y rendimiento sin depender de internet.' },
        { title: 'Emite en privado', text: 'Comprueba conexión y procesamiento de la plataforma.' },
        { title: 'Haz el directo', text: 'Inicia con la escena correcta y vigila estadísticas y chat.' },
      ],
    },
    {
      id: 'durante-directo',
      title: 'Qué vigilar durante el primer directo',
      paragraphs: [
        'Mantén abiertas las estadísticas de OBS o revísalas periódicamente. Si la conexión falla, prioriza estabilidad: baja bitrate o detén la emisión para corregir el problema en vez de continuar con una señal entrecortada.',
        'Prepara agua, silencia dispositivos y define cómo leerás el chat. Termina la transmisión desde OBS y confirma en la plataforma que el directo finalizó. Guarda notas de los problemas para cambiar una sola cosa antes de la siguiente prueba.',
      ],
    },
  ],
  faqs: [
    {
      question: '¿Debo hacer una prueba antes de mi primer directo?',
      answer: 'Sí. Graba localmente y, si la plataforma lo permite, transmite en privado o como no listado. Así puedes revisar audio, imagen y estabilidad sin presión.',
    },
    {
      question: '¿Qué escena necesito para empezar?',
      answer: 'Una escena principal sencilla y una escena de pausa son suficientes. Añade elementos solo después de confirmar que captura, voz y conexión funcionan bien.',
    },
  ],
  relatedPaths: ['/guias/obs-para-principiantes', '/guias/configuracion-obs-streaming', '/guias/configurar-audio-obs'],
  sources: [obsQuickStart, youtubeEncoder],
};

const configureAudio: SeoPageDefinition = {
  path: '/guias/configurar-audio-obs',
  kind: 'guide',
  title: 'Cómo configurar el audio en OBS Studio | Machtobs',
  description: 'Configura micrófono y audio en OBS: dispositivos, niveles, filtros, monitoreo, sincronización y prueba para una voz clara en stream o grabación.',
  eyebrow: 'Guía / voz y mezcla',
  heading: 'Cómo configurar el audio en OBS Studio',
  introduction: 'El público tolera una imagen sencilla mejor que una voz con eco, saturación o ruido constante. Configura primero el dispositivo correcto, después los niveles y finalmente los filtros que resuelvan un problema real.',
  datePublished: CONTENT_LAST_MODIFIED,
  dateModified: CONTENT_LAST_MODIFIED,
  sections: [
    {
      id: 'dispositivos',
      title: 'Selecciona una sola entrada de voz',
      paragraphs: [
        'Elige el micrófono explícitamente en Ajustes de audio o como fuente de captura de entrada. Evita tener el mismo dispositivo activo en ambos lugares, porque puede duplicar la voz, crear eco o cambiar el nivel de forma impredecible.',
        'Desactiva entradas que no utilizas y asigna nombres claros. Si conectas una interfaz o micrófono después de abrir OBS, vuelve a revisar el dispositivo seleccionado antes de grabar.',
      ],
    },
    {
      id: 'niveles',
      title: 'Ajusta ganancia y balance antes de filtrar',
      paragraphs: [
        'Habla a la distancia y volumen reales. Ajusta la ganancia física o del sistema para obtener una señal firme sin saturación; después usa el fader de OBS para equilibrarla con juego, música y alertas.',
        'La voz debe conservar margen cuando ríes o elevas el volumen. Si llega de forma constante al extremo rojo, bajar el fader después no repara una señal que ya entró distorsionada.',
      ],
      bullets: [
        'Escucha con auriculares para evitar realimentación.',
        'Prueba voz suave y voz fuerte.',
        'Comprueba cada escena que contenga audio.',
        'Evita que música o juego oculten consonantes de la voz.',
      ],
    },
    {
      id: 'filtros',
      title: 'Usa filtros con una función concreta',
      paragraphs: [
        'La supresión de ruido reduce ruido continuo, pero un valor agresivo puede volver metálica la voz. La puerta o expansor atenúa el micrófono cuando no hablas. El compresor controla diferencias grandes y el limitador evita picos finales.',
        'Añade filtros uno por uno y compara grabaciones. Un filtro no sustituye acercar el micrófono, reducir ruido físico o ajustar la ganancia. Machtobs propone una cadena prudente según el dispositivo y el uso, pero la escucha final sigue siendo necesaria.',
      ],
      steps: [
        { title: 'Limpia la fuente', text: 'Reduce ruido físico, acerca el micrófono y ajusta ganancia.' },
        { title: 'Añade control', text: 'Aplica supresión, expansor o compresión solo cuando aporten una mejora audible.' },
        { title: 'Protege la salida', text: 'Usa un limitador final y comprueba picos con una grabación.' },
      ],
    },
    {
      id: 'sincronizacion',
      title: 'Comprueba monitoreo y sincronización',
      paragraphs: [
        'El monitoreo permite escuchar una fuente, pero puede generar eco si vuelve a entrar por otro dispositivo. Utilízalo con auriculares y verifica la salida de monitoreo seleccionada en los ajustes avanzados.',
        'Si la voz y la cámara llegan en momentos diferentes, mide el desfase con una palmada visible y ajusta la sincronización con cuidado. Repite la prueba después de cambiar capturadora, cámara o frecuencia de muestreo.',
      ],
    },
  ],
  faqs: [
    {
      question: '¿Qué filtros necesita un micrófono en OBS?',
      answer: 'Solo los que resuelvan un problema audible. Una cadena habitual puede incluir reducción de ruido prudente, expansor, compresor y limitador, ajustados para el micrófono y el entorno.',
    },
    {
      question: '¿Por qué mi voz se escucha doble en OBS?',
      answer: 'Suele ocurrir cuando el mismo micrófono está añadido más de una vez o cuando el monitoreo vuelve a capturarse. Revisa dispositivos globales, fuentes de entrada y monitoreo.',
    },
  ],
  relatedPaths: ['/guias/configurar-obs', '/guias/primer-stream-con-obs', '/guias/obs-para-principiantes'],
  sources: [obsOverview, obsQuickStart],
};

const configureRecording: SeoPageDefinition = {
  path: '/guias/configurar-obs-para-grabar',
  kind: 'guide',
  title: 'Cómo configurar OBS para grabar con calidad | Machtobs',
  description: 'Configura OBS para grabar con calidad y estabilidad: formato, encoder, resolución, FPS, audio, almacenamiento y recuperación de archivos.',
  eyebrow: 'Guía / grabación local',
  heading: 'Cómo configurar OBS para grabar con calidad',
  introduction: 'La grabación local no depende de la velocidad de subida y puede conservar más calidad que un stream. Aun así, debe respetar la capacidad del encoder, la velocidad del disco y el espacio disponible.',
  datePublished: CONTENT_LAST_MODIFIED,
  dateModified: CONTENT_LAST_MODIFIED,
  sections: [
    {
      id: 'separa-stream-grabacion',
      title: 'Separa la grabación de la transmisión',
      paragraphs: [
        'Si haces stream y grabas al mismo tiempo, no tienes que limitar el archivo local al bitrate de internet. OBS puede utilizar ajustes distintos para la grabación, siempre que el hardware soporte la carga adicional.',
        'Define el destino del archivo en un disco con espacio y velocidad suficientes. Evita grabar sesiones importantes en una carpeta sincronizada en tiempo real, porque puede competir por disco o red.',
      ],
    },
    {
      id: 'formato',
      title: 'Elige un formato resistente a cierres inesperados',
      paragraphs: [
        'Un formato que pueda recuperarse si OBS o el equipo se cierran protege sesiones largas. Después puedes remultiplexar a otro contenedor desde OBS sin volver a codificar el vídeo.',
        'Comprueba que tu editor acepte el codec y las pistas de audio elegidas. Realiza una importación de prueba antes de grabar un proyecto largo.',
      ],
      note: 'La compatibilidad de edición importa tanto como la calidad. Conserva un flujo que puedas abrir, respaldar y exportar con las herramientas que ya utilizas.',
    },
    {
      id: 'calidad-rendimiento',
      title: 'Equilibra calidad, tamaño y rendimiento',
      paragraphs: [
        'La grabación puede usar control de calidad o un bitrate mayor que el stream. Más calidad aumenta el tamaño del archivo y puede exigir más al encoder o al disco. El mejor valor es el que conserva el detalle necesario sin comprometer la sesión.',
        'Graba el contenido más exigente y revisa estadísticas. Si hay sobrecarga, reduce resolución o FPS, cambia el preset del encoder o evita codificar dos salidas pesadas simultáneamente.',
      ],
      bullets: [
        'Verifica espacio libre para toda la duración prevista.',
        'Usa una resolución que el material y la edición realmente necesiten.',
        'Separa pistas de voz, juego y música si vas a editar.',
        'Prueba reproducción e importación en el editor final.',
      ],
    },
    {
      id: 'prueba-archivo',
      title: 'Valida el archivo, no solo la vista previa',
      paragraphs: [
        'La vista previa puede verse bien mientras el archivo presenta saltos, audio desfasado o una pista ausente. Abre una grabación completa, salta entre varios puntos y escucha cada pista antes de iniciar una sesión importante.',
        'Machtobs puede recomendar ajustes diferentes para stream y grabación, mostrar el impacto y guardar un respaldo local. Conserva siempre una prueba corta como referencia antes de cambiar el perfil.',
      ],
      steps: [
        { title: 'Graba una muestra', text: 'Incluye movimiento, voz y cambios de escena.' },
        { title: 'Revisa estadísticas', text: 'Comprueba renderizado, encoder, disco y duración.' },
        { title: 'Abre en el editor', text: 'Valida codec, pistas, sincronización y color en tu flujo real.' },
      ],
    },
  ],
  faqs: [
    {
      question: '¿Debo usar la misma calidad para stream y grabación?',
      answer: 'No necesariamente. La grabación local puede usar más calidad porque no está limitada por la subida, siempre que encoder y disco soporten el trabajo adicional.',
    },
    {
      question: '¿Por qué una grabación de OBS ocupa tanto espacio?',
      answer: 'Resolución, FPS, duración, codec y nivel de calidad determinan el tamaño. Haz una prueba corta y calcula el espacio antes de una sesión larga.',
    },
  ],
  relatedPaths: ['/guias/configuracion-obs-streaming', '/guias/configurar-obs', '/guias/configurar-audio-obs'],
  sources: [obsQuickStart, obsEncoding],
};

const howMachtobsWorks: SeoPageDefinition = {
  path: '/como-funciona-machtobs',
  kind: 'about',
  title: 'Cómo funciona Machtobs y qué datos utiliza',
  description: 'Conoce cómo Machtobs analiza hardware y OBS, calcula recomendaciones, protege tu contraseña, muestra cambios y conserva un respaldo local.',
  eyebrow: 'Metodología / transparencia',
  heading: 'Cómo funciona Machtobs',
  introduction: 'Machtobs es un configurador guiado para OBS Studio. Su objetivo no es ocultar decisiones: reúne información técnica, propone cambios, explica su motivo y espera tu confirmación.',
  datePublished: CONTENT_LAST_MODIFIED,
  dateModified: CONTENT_LAST_MODIFIED,
  sections: [
    {
      id: 'analisis',
      title: 'Qué analiza para crear una recomendación',
      paragraphs: [
        'La recomendación combina el objetivo —stream, grabación o ambos— con plataforma, sistema operativo, CPU, GPU, memoria, resolución y velocidad de subida disponible. Cuando conectas OBS, también compara los valores que la aplicación puede leer localmente.',
        'Para consolas, Machtobs considera la capturadora y las capacidades detectadas. Para audio, utiliza el dispositivo seleccionado y el contexto de uso. Si el servicio de IA no está disponible, un motor local genera una recomendación conservadora para que el flujo no quede bloqueado.',
      ],
    },
    {
      id: 'privacidad',
      title: 'La conexión con OBS permanece en tu equipo',
      paragraphs: [
        'El navegador se conecta a OBS mediante WebSocket en localhost. La contraseña de OBS, las escenas y la clave de emisión no se envían a Machtobs. Los datos técnicos utilizados por la recomendación no incluyen archivos personales.',
        'La compatibilidad depende del navegador porque la conexión local usa WebSocket. Chrome, Edge y Firefox permiten este flujo; Safari impone restricciones que impiden la conexión utilizada por la aplicación.',
      ],
    },
    {
      id: 'control',
      title: 'Qué ocurre antes de aplicar cambios',
      paragraphs: [
        'Machtobs muestra una comparación entre la configuración actual y la recomendada. Puedes revisar resolución, encoder, bitrate, grabación y otros valores antes de confirmar. Los ajustes que OBS no expone de forma segura se presentan como pasos manuales.',
        'Antes de aplicar una configuración compatible, la app conserva un respaldo local. La restauración vuelve a utilizar la conexión local con OBS y nunca publica la configuración.',
      ],
      steps: [
        { title: 'Detectar', text: 'Reúne hardware, uso, plataforma, red y valores actuales compatibles.' },
        { title: 'Comparar', text: 'Explica la recomendación y presenta las diferencias.' },
        { title: 'Confirmar', text: 'Guarda respaldo y aplica únicamente después de tu aprobación.' },
      ],
    },
    {
      id: 'limites',
      title: 'Límites y uso responsable',
      paragraphs: [
        'Ningún configurador puede sustituir una prueba real. Juegos, plugins, controladores, temperatura, red doméstica y servicios de la plataforma pueden cambiar el resultado. Revisa los ajustes aplicados antes de un directo importante.',
        'Machtobs no pertenece a OBS Project ni a las plataformas de streaming. Las guías enlazan documentación oficial y se redactan para explicar principios, no para presentar una afiliación inexistente.',
      ],
    },
  ],
  faqs: [
    {
      question: '¿Machtobs guarda mi contraseña de OBS?',
      answer: 'No. La contraseña se utiliza en la pestaña actual para establecer la conexión local con OBS y no se envía al backend.',
    },
    {
      question: '¿Qué pasa si la recomendación con IA no está disponible?',
      answer: 'La aplicación utiliza un motor local de respaldo para generar una configuración conservadora y explica que la recomendación procede de ese motor.',
    },
  ],
  relatedPaths: ['/guias/configurar-obs', '/guias/configuracion-obs-streaming', '/guias/configurar-audio-obs'],
  sources: [obsQuickStart, obsOverview],
};

export const SEO_PAGES: SeoPageDefinition[] = [
  homePage,
  guidesHub,
  configureObs,
  obsForBeginners,
  streamingConfiguration,
  firstStream,
  configureAudio,
  configureRecording,
  howMachtobsWorks,
];

export const STATIC_SEO_PAGES = SEO_PAGES.filter((page) => page.path !== '/');

const pagesByPath = new Map(SEO_PAGES.map((page) => [page.path, page]));

export function getSeoPage(path: string): SeoPageDefinition | undefined {
  const normalized = path === '/' ? '/' : path.replace(/\/$/, '');
  return pagesByPath.get(normalized);
}

export function getRelatedPages(page: SeoPageDefinition): SeoPageDefinition[] {
  return page.relatedPaths.flatMap((path) => {
    const related = getSeoPage(path);
    return related ? [related] : [];
  });
}

export function absoluteUrl(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export function pathToOutputFile(path: string): string {
  if (path === '/') return 'index.html';
  return `${path.slice(1)}.html`;
}
