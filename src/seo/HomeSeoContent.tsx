import React, { useEffect, useRef, useState } from 'react';

type HomeFaq = {
  question: string;
  answer: string;
};

const HOME_FAQS: HomeFaq[] = [
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
  {
    question: '¿Cuál es la mejor configuración de OBS para streaming?',
    answer: 'No existe una configuración universal. Depende del encoder disponible, la potencia del equipo, la velocidad de subida, la plataforma, la resolución y los fotogramas por segundo.',
  },
  {
    question: '¿Machtobs sirve para grabar además de hacer stream?',
    answer: 'Sí. Puedes elegir streaming, grabación o ambos. La herramienta separa los ajustes de emisión y grabación para que el archivo local no quede limitado innecesariamente por la conexión a internet.',
  },
];

function SectionNumber({ value }: { value: number }) {
  return (
    <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-primary">
      {String(value).padStart(2, '0')}
    </span>
  );
}

function FaqList() {
  return (
    <div className="divide-y divide-paper/10 border-y border-paper/15">
      {HOME_FAQS.slice(0, 3).map((faq, index) => (
        <details key={faq.question} className="group py-1">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-4 text-left marker:hidden">
            <span className="flex items-start gap-4">
              <SectionNumber value={index + 1} />
              <span className="max-w-3xl text-base font-semibold text-paper sm:text-lg">{faq.question}</span>
            </span>
            <span aria-hidden="true" className="font-mono text-primary transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="max-w-3xl pb-6 pl-10 text-sm leading-7 text-paper/65 sm:text-base">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

function SecurityVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '320px' },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      width="960"
      height="500"
      className="aspect-[48/25] w-full border border-paper/10 bg-background object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      aria-label="Demostración de la conexión local entre Machtobs y OBS mediante WebSocket"
      aria-describedby="security-video-caption"
    >
      {shouldLoad ? <source src="/websockets.mp4" type="video/mp4" /> : null}
    </video>
  );
}

export function HomeSeoContent() {
  return (
    <section className="seo-deferred border-t border-paper/15" aria-labelledby="home-seo-title">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8 ">
        <section className="grid gap-8 border-b border-paper/15 py-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]" aria-labelledby="configurator-heading">
          <div>
            <p className="micro-label text-primary">/ empieza sin conocer cada ajuste</p>
            <h2 id="configurator-heading" className="mt-4 max-w-xl font-display text-3xl font-black uppercase leading-none tracking-[-0.035em] text-paper sm:text-5xl">Un configurador de OBS para tu equipo</h2>
          </div>
          <div className="max-w-2xl space-y-4 text-base leading-7 text-paper/70">
            <p>Abre OBS Studio, activa WebSocket y conecta Machtobs desde tu navegador. La herramienta revisa los ajustes disponibles y prepara una recomendación según tu hardware, conexión, plataforma y si quieres transmitir, grabar o ambas cosas.</p>
            <p>Verás una comparación antes de cambiar nada. Puedes entender qué hacen la resolución, los FPS, el codificador y la tasa de bits, y confirmar los cambios con un respaldo previo.</p>
            <a href="/como-configurar-obs" className="inline-flex min-h-12 items-center font-mono text-xs font-bold uppercase tracking-widest text-primary underline underline-offset-8">Aprender a configurar OBS paso a paso →</a>
          </div>
        </section>
      <div className="grid gap-8 border-b border-paper/15 pb-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center">
        <div>
            <p className="micro-label text-primary">/ conexión local</p>
            <h2 className=" max-w-lg font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.045em] text-paper sm:text-5xl">Conectividad segura</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-paper/70">
              Machtobs se conecta con OBS directamente en tu equipo. Tu contraseña, escenas y claves no salen del navegador, y ningún cambio se aplica sin tu confirmación.
            </p>
            
          </div>
          <figure className="relative overflow-hidden border border-paper/15 bg-paper/[0.02] p-2">
            <SecurityVideo />
            <figcaption
              id="security-video-caption"
              className="grid gap-px border-x border-b border-paper/10 bg-paper/10 font-mono text-[0.52rem] uppercase tracking-[0.12em] text-paper/70 sm:grid-cols-3"
            >
              <span className="bg-background px-3 py-2"><span className="text-primary">●</span> localhost:4455</span>
              <span className="bg-background px-3 py-2">credenciales / locales</span>
              <span className="bg-background px-3 py-2">cambios / confirmados</span>
            </figcaption>
          </figure>
        </div>
        <section className=" p-6 sm:py-6 sm:px-0" aria-labelledby="learn-obs-heading">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:items-end">
            <div>
              <p className="micro-label text-primary">/ aprende mientras configuras</p>
              <h2 id="learn-obs-heading" className="mt-4 max-w-3xl font-display text-3xl font-black uppercase leading-none tracking-[-0.035em] text-paper sm:text-5xl">
                Entiende tu stream.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-paper/70">
                Cada recomendación explica qué cambia, por qué conviene y cómo afecta la calidad, el rendimiento y la estabilidad. Así aprendes OBS mientras preparas tu primer directo.
              </p>
              <div className="mt-7">

              </div>
            </div>

            <ol className="grid grid-cols-3 border-y border-paper/15 lg:grid-cols-1">
              {[
                [ 'cambio', 'Qué ajuste se modifica.'],
                [ 'impacto', 'Qué mejora o limita.'],
                [ 'criterio', 'Cuándo elegirlo otra vez.'],
              ].map(([ title, description]) => (
                <li key={title} className="border-r border-paper/15 px-3 py-4 last:border-r-0 lg:grid lg:grid-cols-[3rem_6rem_1fr] lg:items-center lg:border-b lg:border-r-0 lg:last:border-b-0">
                  <span className="h-2 w-2 rounded-full bg-sky-600"></span>
                  <strong className="mt-2 block font-mono text-[0.58rem] uppercase tracking-[0.12em] text-paper lg:mt-0">{title}</strong>
                  <span className="mt-2 hidden text-sm leading-6 text-paper/60 sm:block lg:mt-0">{description}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
    
        <div className="grid gap-8 border-t border-paper/15 py-12 lg:grid-cols-1">
          <div className='content-end'>
            <h2 className="mt-4 font-display text-4xl font-black uppercase leading-[0.92] tracking-[-0.045em] text-paper">Preguntas frecuentes</h2>
          </div>
          <FaqList />
        </div>

    
      </div>
    </section>
  );
}
