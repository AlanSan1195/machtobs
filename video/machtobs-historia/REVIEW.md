# Review — machtobs-historia (60 s, 1080×1920, sin música)

`hyperframes check`: ok, 0 errores. `snapshot --review`: 19 beats + 11 costuras revisadas.

## Corregido
- **marca / cierre**: el "bs" con contorno era invisible (`.out` ponía `color: transparent`, y el trazo usaba `currentColor`). Ahora usa `-webkit-text-fill-color`.
- **marca**: el wordmark se salía del lienzo a 150px → 128px.
- **elige, analiza, aplica, vivo**: los títulos de tres líneas (o "configurado") chocaban con la barra de `.act` o se cortaban a la derecha → clase `.tight` (máx. 92px; en horizontal no cambia).
- **elige**: la facecam tapaba "STREAM + REC" → resumen a 50px.
- **vivo**: el chat salía en Times (sin `font-family`) → Instrument Sans.
- **aplica**: "Aplicar salida en OBS" se partía en dos líneas y empujaba el texto bajo los botones → 46px en una línea. Campos de OBS con más aire (54px de alto, el giro de valores ajustado a 54px).
- **audio**: sfx44–47 recortados a la duración real del clip (0.37s).

## Avisos aceptados
- `line_unread` en cuarto (ajustes de OBS en ráfaga): el caos es el punto de la escena.
- `line_unread` en busca/analiza: textos de apoyo; el título de cada escena se lee completo.
- `line_unread` en cierre: falso positivo, la tarjeta final se sostiene ~3 s (verificado en 38.3–41.1 s).
- `rotation_pivot_drift` en los brazos de Nico: giran desde el hombro a propósito.
- `contrast_aa_failure` en "OBS" del monitor y en "Empezar": se muestrean a mitad de transición; en reposo el contraste es correcto.

## Versión de 60 s (sin música, efectos conservados)
- Música (`#music`) eliminada; los 71 efectos originales se movieron a los nuevos tiempos y se añadieron 24 para las escenas nuevas.
- Escenas nuevas con datos reales de la app: **red** (subida sostenida y 70 % seguro, `NetworkDetectionSummary`), **audio** (rnnoise, compuerta −35/−45 dB, +6 dB, 3:1 a −18 dB, limitador −1.5 dB), **escenas** (AddSourceWizard → facecam `camStream` → "Iniciar transmisión", que pasó de aplica a escenas).
- Pausas más largas: marca +0.6 s, vivo +1.4 s (el chat sube: Nico responde, luna pide el link) y cierre con 3.3 s de tarjeta final.
- La facecam de Nico reacciona también en las tres escenas nuevas y se pone los audífonos justo antes de salir en vivo.
