import React from 'react';
import { SiteFooter } from '../renderer/components/SiteFooter';

const steps = [
  {
    title: 'Instala OBS Studio y define tu objetivo',
    body: 'Descarga OBS Studio desde su sitio oficial. Decide si quieres transmitir en vivo, grabar vídeos o hacer ambas cosas: la mejor configuración depende de ese objetivo.',
  },
  {
    title: 'Crea una escena y añade fuentes',
    body: 'En Escenas, crea tu espacio de trabajo. En Fuentes, pulsa + y añade captura de pantalla, ventana, juego o dispositivo de vídeo según lo que quieras mostrar. Comprueba la vista previa antes de continuar.',
  },
  {
    title: 'Comprueba el micrófono y el sonido',
    body: 'Habla y mira si se mueve el medidor del mezclador de audio. Si no responde, abre Ajustes → Audio y selecciona el dispositivo correcto. Haz una grabación corta para escuchar el resultado.',
  },
  {
    title: 'Ajusta vídeo y salida para tu equipo',
    body: 'Empieza con el Asistente de configuración automática de OBS en Herramientas. Evalúa tu equipo y, si vas a transmitir, tu conexión. Evita copiar valores de otra persona: resolución, FPS, codificador y tasa de bits deben ajustarse a tu caso.',
  },
  {
    title: 'Haz una prueba antes del directo',
    body: 'Graba unos minutos o prueba una transmisión privada. Revisa imagen, sonido y estabilidad. Si notas saltos, revisa los ajustes de salida y la capacidad de tu equipo o conexión antes de emitir en público.',
  },
];

export function ObsBeginnerGuide() {
  return (
    <div className="relative min-h-screen font-sans text-paper">
      <div className="app-backdrop" aria-hidden="true" />
      <header className="relative z-10 mx-auto flex w-full max-w-[1120px] items-center justify-between px-5 py-6 sm:px-8">
        <a href="/" className="font-display text-lg font-black uppercase tracking-tight text-paper">Macht<span className="text-primary">obs</span></a>
        <a href="/configurador" className="border border-primary px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-ink">Abrir configurador →</a>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1120px] px-5 pb-20 sm:px-8">
        <nav aria-label="Ruta de navegación" className="border-b border-paper/15 py-4 font-mono text-xs text-paper/60">
          <a href="/" className="hover:text-primary">Inicio</a> <span aria-hidden="true">/</span> Guía para principiantes
        </nav>

        <article>
          <div className="grid gap-8 border-b border-paper/15 py-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] lg:items-end">
            <div>
              <p className="micro-label text-primary">/ guía para principiantes</p>
              <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.8rem,6vw,5.6rem)] font-black uppercase leading-[0.9] tracking-[-0.055em]">Cómo configurar OBS desde cero, paso a paso</h1>
            </div>
            <p className="max-w-lg text-base leading-8 text-paper/75">Si nunca has usado OBS Studio, empieza aquí. Prepara una escena, comprueba el audio, elige ajustes apropiados para tu equipo y haz una prueba antes de transmitir o grabar.</p>
          </div>

          <div className="grid gap-12 py-12 lg:grid-cols-[minmax(14rem,0.6fr)_minmax(0,1.4fr)]">
            <aside className="lg:sticky lg:top-8 lg:self-start">
              <p className="micro-label text-primary">/ en esta guía</p>
              <ol className="mt-5 space-y-3 text-sm text-paper/75">
                {steps.map((step, index) => <li key={step.title}><a className="hover:text-primary" href={`#paso-${index + 1}`}>{String(index + 1).padStart(2, '0')} / {step.title}</a></li>)}
              </ol>
            </aside>

            <div>
              <section aria-labelledby="quick-answer" className="border border-primary/40 bg-primary/[0.07] p-6 sm:p-8">
                <p className="micro-label text-primary">/ respuesta rápida</p>
                <h2 id="quick-answer" className="mt-3 font-display text-2xl font-black uppercase">¿Cómo se configura OBS fácilmente?</h2>
                <p className="mt-4 leading-7 text-paper/80">Instala OBS, añade una escena y sus fuentes, verifica el micrófono, ejecuta el asistente de configuración automática y realiza una grabación de prueba. Si quieres revisar tu perfil con explicaciones antes de aplicarlo, conecta OBS a Machtobs.</p>
              </section>

              <ol className="mt-10 divide-y divide-paper/15 border-y border-paper/15">
                {steps.map((step, index) => (
                  <li id={`paso-${index + 1}`} key={step.title} className="scroll-mt-8 py-8">
                    <span className="font-mono text-xs font-bold text-primary">{`PASO ${String(index + 1).padStart(2, '0')}`}</span>
                    <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">{step.title}</h2>
                    <p className="mt-3 max-w-2xl text-base leading-8 text-paper/75">{step.body}</p>
                  </li>
                ))}
              </ol>

              <section className="mt-12 border border-paper/20 p-6 sm:p-8" aria-labelledby="assistant-heading">
                <p className="micro-label text-primary">/ del tutorial a tu configuración</p>
                <h2 id="assistant-heading" className="mt-3 font-display text-3xl font-black uppercase tracking-tight">Deja que Machtobs revise tus ajustes</h2>
                <p className="mt-4 leading-7 text-paper/75">El asistente de OBS es un buen punto de partida. Machtobs añade una comparación de tus ajustes actuales con una recomendación según tu hardware, red, plataforma y uso. Explica cada cambio, guarda un respaldo y solo lo aplica cuando tú lo confirmas. Necesitas OBS Studio abierto y WebSocket activado para conectarlo desde el navegador.</p>
                <a href="/configurador" className="mt-6 inline-flex min-h-12 items-center bg-primary px-5 font-mono text-xs font-bold uppercase tracking-widest text-ink hover:bg-primary-hover">Configurar mi OBS →</a>
              </section>

              <section className="mt-12" aria-labelledby="terms-heading">
                <h2 id="terms-heading" className="font-display text-2xl font-black uppercase">Ajustes que conviene entender</h2>
                <dl className="mt-5 grid gap-5 text-sm leading-7 text-paper/75 sm:grid-cols-2">
                  <div><dt className="font-bold text-paper">Resolución de salida</dt><dd>El tamaño del vídeo que ven tus espectadores o que guardas en el archivo.</dd></div>
                  <div><dt className="font-bold text-paper">FPS</dt><dd>Cuántos fotogramas se muestran por segundo. Más FPS exigen más recursos.</dd></div>
                  <div><dt className="font-bold text-paper">Codificador</dt><dd>Comprime el vídeo. La opción adecuada depende del hardware disponible.</dd></div>
                  <div><dt className="font-bold text-paper">Tasa de bits</dt><dd>La cantidad de datos enviada por segundo; para directos debe encajar con tu subida y plataforma.</dd></div>
                </dl>
              </section>

              <p className="mt-12 border-t border-paper/15 pt-6 text-sm leading-7 text-paper/60">Basado en la <a href="https://obsproject.com/kb/quick-start-guide/" className="text-primary underline underline-offset-4" rel="noopener noreferrer" target="_blank">guía oficial de inicio de OBS Studio</a> y su <a href="https://obsproject.com/kb/remote-control-guide" className="text-primary underline underline-offset-4" rel="noopener noreferrer" target="_blank">documentación de WebSocket</a>. Machtobs es una herramienta independiente y no está afiliada a OBS Project.</p>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
