import type { MicConnection, MicProfileRequest, MicProfileResponse, MicType } from './types';

// Respaldo offline: cuando la IA con busqueda web no esta disponible, inferimos
// un perfil razonable a partir de palabras clave del nombre del dispositivo.
// No consulta la web; da valores conservadores pero coherentes.

const CONDENSER_HINTS = ['yeti', 'snowball', 'nt-usb', 'nt usb', 'nt1', 'at20', 'at2020', 'c01', 'condenser', 'condensador', 'k669', 'quadcast', 'solo cast', 'solocast', 'spark', 'wave:1', 'wave 1', 'wave:3', 'wave 3'];
const DYNAMIC_HINTS = ['sm7', 'sm58', 'sm57', 'q2u', 'procaster', 'podmic', 'pd-', 'pdmic', 're20', 'mv7', 'am8', 'dynamic', 'dinamico'];
const DSP_HINTS = ['nvidia', 'rtx voice', 'broadcast', 'krisp', 'voicemeeter', 'steelseries sonar', 'realtek'];
const SOFTWARE_PROCESSING_HINTS = ['astro a50', 'a50 x', 'a50-x'];
const USB_HINTS = ['usb', 'yeti', 'quadcast', 'snowball', 'nt-usb', 'mv7', 'k669', 'wave'];
const XLR_HINTS = ['sm7', 'sm58', 'sm57', 'nt1', 're20', 'procaster', 'podmic', 'scarlett', 'focusrite', 'xlr', 'goxlr'];
const WIRELESS_HINTS = ['wireless', 'inalambrico', 'lightspeed', 'astro a50', 'a50 x'];

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

export function getLocalMicProfile(request: MicProfileRequest): MicProfileResponse {
  const name = request.deviceName.toLowerCase();
  const aggressive = request.mode !== 'record_only'; // en stream conviene mas limpieza

  const isDynamic = includesAny(name, DYNAMIC_HINTS);
  const isCondenser = !isDynamic && includesAny(name, CONDENSER_HINTS);
  const hasBuiltinDsp = includesAny(name, DSP_HINTS);
  const hasSoftwareProcessing = includesAny(name, SOFTWARE_PROCESSING_HINTS);
  const isHeadset = name.includes('headset') || name.includes('auricular') || name.includes('astro a50') || name.includes('a50 x') || name.includes('a50-x');

  const type: MicType = isDynamic ? 'dynamic' : isCondenser ? 'condenser' : 'unknown';
  const connection: MicConnection = includesAny(name, WIRELESS_HINTS)
    ? 'wireless'
    : includesAny(name, XLR_HINTS)
      ? 'xlr'
      : includesAny(name, USB_HINTS)
        ? 'usb'
        : 'unknown';

  const identified = isDynamic || isCondenser || isHeadset;

  // Ganancia: los dinamicos de baja salida necesitan mas; los condensadores menos.
  const gainDb = isDynamic ? 12 : isCondenser ? 4 : 6;
  // Noise gate util sobre todo en condensadores sensibles.
  const gateEnabled = isCondenser;
  // Si el micro trae DSP propio, evitamos duplicar la supresion de ruido.
  const noiseEnabled = !hasBuiltinDsp;

  const typeLabel = type === 'dynamic'
    ? 'dinamico'
    : type === 'condenser'
      ? 'de condensador'
      : isHeadset
        ? 'integrado en headset'
        : 'de tipo desconocido';
  const summary = identified
    ? `Perfil estimado localmente: microfono ${typeLabel}${connection !== 'unknown' ? ` (${connection.toUpperCase()})` : ''}${hasBuiltinDsp || hasSoftwareProcessing ? ' con procesamiento configurable' : ''}.`
    : 'No se pudo identificar el modelo exacto sin conexion; se aplican valores conservadores.';

  return {
    source: 'local',
    profile: {
      identified,
      model: request.deviceName,
      type,
      connection,
      formFactor: isHeadset ? 'headset' : identified ? 'standalone' : 'unknown',
      pickupPattern: name.includes('am8') ? 'cardioid' : isHeadset ? 'omnidirectional' : 'unknown',
      hasBuiltinDsp,
      hasSoftwareProcessing,
      hasNoiseReduction: hasBuiltinDsp || hasSoftwareProcessing,
      hasNoiseGate: hasSoftwareProcessing,
      hasCompressor: false,
      hasLimiter: false,
      hasHardwareGainControl: name.includes('am8'),
      sensitivityDb: name.includes('am8') ? -50 : undefined,
      sampleRateKhz: isHeadset ? 48 : undefined,
      summary,
    },
    filters: {
      noiseSuppression: {
        enabled: noiseEnabled,
        method: 'rnnoise',
        reason: hasBuiltinDsp
          ? 'El microfono parece tener cancelacion de ruido integrada; se omite para no duplicar el procesamiento.'
          : 'Supresion de ruido RNNoise para limpiar ruido de fondo constante.',
      },
      noiseGate: {
        enabled: gateEnabled,
        closeThresholdDb: -45,
        openThresholdDb: -35,
        reason: gateEnabled
          ? 'Los condensadores captan mucho ambiente; la compuerta corta el ruido cuando no hablas.'
          : 'No se activa la compuerta por defecto para este microfono.',
      },
      gain: {
        enabled: true,
        db: gainDb,
        reason: isDynamic
          ? 'Los microfonos dinamicos tienen salida baja y necesitan mas ganancia.'
          : isCondenser
            ? 'Los condensadores son sensibles; una ganancia moderada evita saturar.'
            : 'Ganancia moderada como punto de partida seguro.',
      },
      compressor: {
        enabled: true,
        ratio: aggressive ? 4 : 3,
        thresholdDb: -18,
        reason: 'Empareja el volumen de la voz suavizando los picos.',
      },
      limiter: {
        enabled: true,
        thresholdDb: -1.5,
        reason: 'Tope de seguridad para evitar saturacion en picos fuertes.',
      },
    },
    reasoning: `Perfil generado localmente a partir del nombre del dispositivo (la IA con busqueda web no estuvo disponible). ${summary}`,
  };
}
