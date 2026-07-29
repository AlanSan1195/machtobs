# Audio en Match-to-obs

Este documento explica la primera etapa de configuracion de audio de Match-to-obs:
que hace, por que se eligieron estos valores y que limitaciones existen al
controlar OBS mediante WebSocket.

La meta no es convertir Match-to-obs en una consola profesional de audio. La meta es
darle al usuario una base razonable para que su microfono suene mas estable sin
tener que entender primero todos los filtros de OBS.

## Objetivo

Muchos usuarios abren OBS, conectan un microfono y no saben si su voz esta baja,
si se va a saturar cuando griten, o si necesitan filtros. Match-to-obs busca reducir
ese trabajo inicial.

En esta etapa, Match-to-obs intenta:

- detectar el microfono que OBS esta usando
- elegir una entrada de microfono razonable
- aplicar una cadena basica de filtros para voz
- explicar que se aplico y que queda como paso manual
- evitar cambios silenciosos que el usuario no entienda

La razon de ser de esta configuracion es simple: una voz puede sonar baja en
partes normales, pero saturar cuando el usuario se emociona, habla fuerte o
grita. La cadena predeterminada intenta levantar la voz, controlar esos picos y
poner un techo de seguridad.

## Que configura Match-to-obs

Match-to-obs lee OBS mediante OBS WebSocket y busca una entrada de microfono. Puede
usar:

- una entrada global `Mic/Aux`
- una fuente de tipo `Audio Input Capture`

Cuando encuentra una entrada compatible, Match-to-obs puede crear o actualizar estos
filtros en esa fuente:

- `Match-to-obs - Gain`
- `Match-to-obs - Compressor`
- `Match-to-obs - Limiter`

Los filtros son idempotentes: si ya existen con esos nombres, Match-to-obs intenta
actualizarlos en lugar de duplicarlos.

## Cadena predeterminada

La configuracion inicial elegida es:

| Filtro | Tipo OBS | Valor |
| --- | --- | --- |
| `Match-to-obs - Gain` | `gain_filter` | `+10 dB` |
| `Match-to-obs - Compressor` | `compressor_filter` | ratio `4:1`, threshold `-10 dB`, attack `6 ms`, release `60 ms`, output gain `0 dB` |
| `Match-to-obs - Limiter` | `limiter_filter` | threshold `-1 dB`, release `60 ms` |

El orden esperado es:

1. Ganancia
2. Compresor
3. Limitador

Primero se levanta la senal, luego se controla la dinamica y al final se pone
un limite para evitar picos demasiado fuertes.

## Que hace cada filtro

### Gain

`Match-to-obs - Gain` sube el volumen de entrada del microfono en `+10 dB`.

Esto ayuda cuando el microfono suena bajo aunque el usuario este hablando cerca
del micro. Es una forma rapida de levantar la voz antes de procesarla.

El riesgo es que la ganancia tambien sube todo lo que entra: voz, ruido de
fondo, ventilador, teclado, eco del cuarto o ruido electrico. Por eso esta bien
como default inicial, pero no debe entenderse como una solucion universal.

### Compressor

`Match-to-obs - Compressor` reduce la diferencia entre partes suaves y partes muy
fuertes de la voz.

Con ratio `4:1`, cuando la voz pasa el umbral configurado, OBS baja esa energia
extra de forma controlada. Con threshold `-10 dB`, el compresor actua sobre
momentos fuertes: risas, gritos, enfasis o palabras dichas muy cerca del micro.

En practica, esto ayuda a que la voz sea mas consistente y menos brusca para
quien escucha.

### Limiter

`Match-to-obs - Limiter` pone un techo final en `-1 dB`.

Su trabajo es proteger contra picos fuertes. Si el usuario grita o golpea el
microfono con una consonante explosiva, el limitador intenta evitar que la senal
pase de ese limite.

Esto no arregla una mala grabacion por completo, pero reduce el riesgo de
saturacion fuerte en directo.

## Que conseguimos con esto

Con esta cadena predeterminada buscamos:

- que microfonos bajos tengan mas presencia
- que la voz no cambie tanto entre hablar normal y hablar fuerte
- que los gritos o picos no rompan tanto el audio
- que el usuario tenga una base lista sin configurar filtros manualmente
- que Match-to-obs se diferencie del asistente nativo de OBS explicando el cambio

La configuracion esta pensada para creadores que quieren empezar rapido y no
quieren abrir cinco ventanas de OBS para entender filtros, umbrales y ratios.

## Por que estos valores

### Gain +10 dB

`+10 dB` es una subida clara y facil de notar. Sirve para muchos microfonos que
entran bajos en OBS.

No es perfecto para todos. Si el microfono ya entra fuerte, `+10 dB` puede ser
agresivo. En ese caso el compresor y el limitador ayudan, pero el usuario podria
preferir menos ganancia.

### Compressor 4:1 con threshold -10 dB

Un ratio `4:1` es firme sin ser extremo. Es suficiente para controlar una voz
dinamica sin aplastarla demasiado.

El threshold `-10 dB` hace que el compresor se enfoque en partes fuertes, no en
toda la voz todo el tiempo. Para un default inicial, es una decision razonable
porque evita sobreprocesar conversaciones normales.

### Limiter -1 dB

`-1 dB` deja un margen pequeno antes de llegar a 0 dB. Es una proteccion
practica contra saturacion.

En streaming o grabacion, un pico que llega a 0 dB puede sonar roto o molesto.
El limitador reduce ese riesgo.

## Sobre Mono

OBS tiene una opcion de Mono en `Propiedades avanzadas de audio`. Esa opcion es
util cuando un microfono entra solo por un canal o cuando queremos que la voz
quede centrada.

Match-to-obs intenta detectar si el input expone una configuracion como `mono` o
`force_mono`. Si OBS WebSocket la expone para esa entrada, Match-to-obs puede
aplicarla.

Pero OBS WebSocket no siempre expone la casilla Mono de `Propiedades avanzadas
de audio`. Cuando eso pasa, Match-to-obs no debe prometer que la activo. En la app se
muestra como paso manual:

`OBS > Propiedades avanzadas de audio > buscar el microfono > marcar Mono`

Esta limitacion no viene de la interfaz de Match-to-obs, sino de lo que OBS WebSocket
permite controlar de forma automatica.

## Limitaciones

Esta primera etapa no hace todo el trabajo de audio. Hay cosas que quedan fuera:

- no elimina ruido de fondo
- no reemplaza tratamiento acustico del cuarto
- no configura puerta de ruido ni supresion de ruido todavia
- no mide niveles reales durante una prueba de voz
- no sabe si el usuario esta muy lejos o muy cerca del microfono
- `+10 dB` puede subir ruido si el microfono o el cuarto ya son ruidosos
- Mono puede requerir activacion manual en OBS

Tambien es importante recordar que cada microfono es distinto. Un microfono USB
barato, una interfaz XLR, un headset y una webcam pueden necesitar ajustes
distintos.

## Opinion sobre estos defaults

Como primera configuracion predeterminada, la cadena elegida es razonable para
usuarios principiantes.

El limitador en `-1 dB` es una buena medida de seguridad. Es dificil discutir
contra tener un techo que proteja al usuario cuando grita o cuando ocurre un
pico inesperado.

El compresor `4:1` con threshold `-10 dB` tambien tiene sentido: controla la voz
sin convertir el audio en algo necesariamente artificial. Es un punto medio
decente para streaming, clases, grabaciones simples y contenido casual.

La parte mas delicada es `+10 dB` de ganancia. Es util para microfonos bajos,
pero puede ser demasiado si el microfono ya entra fuerte. Por eso, a futuro
convendria convertir esto en perfiles:

- `Suave`: menos ganancia y compresion ligera
- `Normal`: la configuracion actual o una variante cercana
- `Fuerte`: mas control para usuarios que gritan, narran juegos o hacen streams
  con mucha energia

En resumen: estos defaults son buenos como primer paso porque simplifican OBS,
pero deberian evolucionar hacia perfiles ajustables.

## Futuras mejoras

Siguientes pasos recomendados:

- agregar perfiles `Suave`, `Normal` y `Fuerte`
- agregar una prueba de voz con medidor de nivel
- recomendar menos ganancia si el microfono ya entra alto
- agregar supresion de ruido o puerta de ruido como opcion, no siempre por
  defecto
- mostrar una explicacion corta dentro de la app para cada filtro
- detectar si los filtros ya existen con valores distintos y explicar la
  diferencia

El objetivo final es que Match-to-obs no solo aplique ajustes, sino que ayude al
usuario a entender por que esos ajustes existen.

## Etapa 2

La segunda etapa agrega controles que suelen aparecer cuando el usuario ya
tiene una base de voz funcionando y quiere pulir el audio para directo.

### Supresion de ruido

Match-to-obs puede agregar `Match-to-obs - Noise Suppression`, un filtro
`noise_suppress_filter` con metodo `rnnoise`.

RNNoise ayuda a limpiar estatica, ventiladores, zumbidos suaves y ruido de
fondo constante antes de que la ganancia y el compresor levanten la senal. Por
eso se crea antes que la ganancia, el compresor y el limitador.

El default esta activado porque es una mejora segura para muchos usuarios, pero
puede apagarse si el microfono ya esta limpio o si la voz empieza a sonar
demasiado procesada.

### Monitoreo

Match-to-obs ahora puede escribir el tipo de monitoreo de la entrada de microfono:

- sin monitoreo
- solo monitoreo
- monitorizar y emitir

Esto sirve para escuchar en audifonos exactamente lo que OBS esta procesando.
Es importante usar audifonos conectados a la salida de monitoreo de OBS para
evitar eco o realimentacion.

### Sincronizacion labial

El offset de audio se puede ajustar en milisegundos dentro del rango que acepta
OBS. La UI incluye una ayuda simple:

`cuadros de desfase x (1000 / FPS) = ms`

Por ejemplo, si la voz llega 3 cuadros tarde a 60 fps, el ajuste aproximado es
`3 x (1000 / 60) = 50 ms`.

Match-to-obs no mide automaticamente el desfase; el usuario introduce el valor tras
hacer una prueba visual o una grabacion corta.

### Ducking

Match-to-obs puede agregar `Match-to-obs - Ducking` al audio de escritorio. Es un compresor
con sidechain que usa el microfono como fuente de control: cuando el usuario
habla, el audio de escritorio baja y luego vuelve de forma suave.

Los valores iniciales son ratio `4:1`, threshold `-30 dB`, attack `6 ms` y
release `300 ms`. El release mas largo evita que la musica suba y baje de forma
nerviosa entre palabras.

OBS identifica el sidechain por nombre de fuente. Si el usuario renombra el
microfono en OBS, conviene volver a aplicar la configuracion para que el ducking
apunte al nombre actual.

### Captura de audio por aplicacion

La etapa 2 no crea fuentes nuevas de captura por aplicacion porque depende de
la plataforma:

- Windows: OBS estable incluye una fuente `Application Audio Capture` para
  capturar una app especifica.
- macOS: normalmente se necesita un driver virtual como BlackHole o Loopback y
  enrutar la app hacia ese dispositivo.

Cuando esa fuente ya existe en OBS, Match-to-obs puede trabajar sobre el audio que OBS
expone, pero no intenta crear ni enrutar capturas por aplicacion de forma
automatica.
