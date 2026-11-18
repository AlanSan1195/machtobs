GOAL:    quien nunca abrió OBS termina pensando "solo tengo que seguir los pasos".
OUTPUT:  HyperFrames, 1080x1920, 30 fps.
TIME:    40 s x 30 = 1200 frames. Sin música (no hay fuente disponible); efectos sobre acciones visibles.
LOOK:    la marca de Machtobs. Tierra ink #090a0a con reglas verticales 1/6 al 2.8%; paper #f1efe8; acento OBS blue #3a9bdc
         (selección, enlace, CTA); warning #f2b84b solo en "cambiar". Esquinas a 0 px, filetes de 2 px.
         Display Archivo 900 stretch 125% tracking -0.055em; cuerpo Instrument Sans; etiquetas JetBrains Mono caps +0.08em, mínimo 28 px.
         Numerales fantasma y etiquetas mono son material de la propia marca, no adorno añadido.
OBJECTS: barra EMPEZAR, pasos 01-04 de ConnectPanel, grabación real de OBS (public/websockets.mp4, cortada antes de la contraseña),
         selectores reales de modo/plataforma/consola, informe de fuentes, comparación OBS actual → recomendado, diálogo de aplicar, lista de escenas.
MOTION:  llegada expo.out 0.3-0.5 s; cámara/inundación power2.inOut 0.4 s; zoom-through power3.in 0.35-0.45 s; títulos blur 10→0 en 0.2 s y quietos.
         El cursor llega con power3.inOut, su clic causa lo siguiente en ese mismo frame.
SHOTS:   0.0-3.0  gancho: jerga de OBS llena el cuadro → "Solo sigue los pasos" → clic en EMPEZAR, zoom a azul.
         3.0-5.0  CONECTA OBS, paso 01; cursor a "Herramientas" → iris desde la palabra.
         4.9-9.6  OBS real: Herramientas, activar servidor, autenticación, mostrar información.
         9.6-13.0 pega la contraseña, ENLAZAR → el bloque se vuelve el mundo azul: enlace local.
         13.0-16.6 AJUSTES: stream + rec, twitch.
         16.6-20.6 equipo detectado, consola PS5 Pro, ./analizar --consola → mundo paper.
         20.6-26.0 IA busca en fuentes oficiales, 5 dominios, contrastadas → la banda inunda a ink.
         26.0-31.2 DETECCIÓN: match; tres ajustes explicados; ./aplicar.
         31.2-34.4 diálogo con respaldo automático → valores cambian en OBS.
         34.4-36.8 ESCENAS: crear Gameplay, en vivo → el punto se vuelve azul.
         36.8-40.0 LISTO. A STREAM → wordmark, EMPEZAR, URL.
BANNED:  glow, partículas, degradados, tarjetas de cristal, tres tarjetas en fila como feature list, logo en esquina fuera de la propia barra del producto,
         títulos que se mueven al leerlos, afirmar "todo es local" (la IA y la búsqueda pasan por el backend), mostrar la contraseña real o su QR.
QA:      t=0 gancho legible; t=7.5 cuadro real de OBS sin contraseña; t=11 ENLAZAR; t=15.8 selección; t=19 PS5 Pro; t=25 cinco fuentes;
         t=30 tres filas; t=33.5 valores en OBS; t=36 en vivo; t=39.5 wordmark.
