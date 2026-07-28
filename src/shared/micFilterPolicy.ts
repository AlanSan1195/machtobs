import type {
  MicFormFactor,
  MicPickupPattern,
  MicProfileResponse,
  MicType,
  OBSMode,
} from './types';

function comparableText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function inferProfileFacts(profile: MicProfileResponse['profile']): {
  type: MicType;
  formFactor: MicFormFactor;
  pickupPattern: MicPickupPattern;
  hasSoftwareProcessing: boolean;
  hasNoiseReduction: boolean;
  hasNoiseGate: boolean;
  hasCompressor: boolean;
  hasLimiter: boolean;
} {
  const text = comparableText(`${profile.model} ${profile.summary}`);
  const isAm8 = /\bfifine\b.*\bam8\b|\bam8\b.*\bfifine\b/.test(text);
  const isAstroA50 = /\bastro\b.*\ba50[\s:_-]*x?\b|\ba50[\s:_-]*x?\b.*\bastro\b/.test(text);

  const type = profile.type !== 'unknown'
    ? profile.type
    : isAm8 || /\bdynamic|dinamico\b/.test(text)
      ? 'dynamic'
      : /\bcondenser|condensador\b/.test(text)
        ? 'condenser'
        : 'unknown';

  const formFactor = profile.formFactor && profile.formFactor !== 'unknown'
    ? profile.formFactor
    : isAstroA50 || /\bheadset|auricular|audifono|boom mic\b/.test(text)
      ? 'headset'
      : isAm8 || /\bmicrophone|microfono\b/.test(text)
        ? 'standalone'
        : 'unknown';

  const pickupPattern = profile.pickupPattern && profile.pickupPattern !== 'unknown'
    ? profile.pickupPattern
    : isAm8 || /\bcardioid|cardioide\b/.test(text)
      ? 'cardioid'
      : isAstroA50 || /\bomnidirectional|omnidireccional\b/.test(text)
        ? 'omnidirectional'
        : 'unknown';

  const hasSoftwareProcessing = profile.hasSoftwareProcessing === true || isAstroA50;

  return {
    type,
    formFactor,
    pickupPattern,
    hasSoftwareProcessing,
    hasNoiseReduction: profile.hasNoiseReduction === true || isAstroA50,
    hasNoiseGate: profile.hasNoiseGate === true || isAstroA50,
    hasCompressor: profile.hasCompressor === true,
    hasLimiter: profile.hasLimiter === true,
  };
}

function factSource(profile: MicProfileResponse['profile']): string {
  return profile.sources && profile.sources.length > 0
    ? 'La ficha oficial'
    : 'El perfil disponible';
}

export function applyEvidenceBasedMicFilterPolicy(
  response: MicProfileResponse,
  mode: OBSMode,
): MicProfileResponse {
  const profile = response.profile;
  const facts = inferProfileFacts(profile);
  const source = factSource(profile);
  const directional = facts.pickupPattern === 'cardioid' || facts.pickupPattern === 'supercardioid';
  const streaming = mode !== 'record_only';

  const noiseSuppression = facts.hasNoiseReduction
    ? {
      enabled: false,
      method: 'rnnoise' as const,
      reason: `${source} confirma reduccion de ruido configurable. Se omite RNNoise en OBS para evitar procesar el ruido dos veces y volver artificial la voz.`,
    }
    : facts.type === 'dynamic' && directional
      ? {
        enabled: false,
        method: 'rnnoise' as const,
        reason: `${source} lo describe como dinamico ${facts.pickupPattern}. Esa combinacion ya rechaza bastante ambiente; se omite RNNoise hasta que una escucha confirme ruido constante.`,
      }
      : {
        enabled: true,
        method: response.filters.noiseSuppression.method,
        reason: `${source} no confirma reduccion de ruido integrada ni rechazo direccional suficiente. Se conserva supresion para ruido constante, pero debe validarse escuchando la voz.`,
      };

  const noiseGate = {
    enabled: false,
    closeThresholdDb: -45,
    openThresholdDb: -35,
    reason: facts.hasNoiseGate
      ? `${source} confirma una compuerta configurable. Se omite la compuerta de OBS para evitar cortes de palabras por dos gates encadenados.`
      : 'La ficha del microfono no contiene el ruido real de la habitacion. Sin medir ese piso de ruido no es seguro inventar umbrales; se omite la compuerta.',
  };

  const sensitivity = profile.sensitivityDb !== undefined
    ? ` (${profile.sensitivityDb} dB de sensibilidad)`
    : '';
  const gain = {
    enabled: false,
    db: 0,
    reason: profile.hasHardwareGainControl || facts.type === 'dynamic'
      ? `${source} indica control de entrada o una capsula dinamica${sensitivity}. La ganancia debe calibrarse en el dispositivo/interfaz hasta que la voz pique entre -12 y -6 dBFS; no se añade un +6 dB arbitrario en OBS.`
      : 'La sensibilidad de fabrica no determina el nivel real que llega a OBS. Sin medir la voz, se omite ganancia digital para no elevar ruido ni provocar clipping.',
  };

  const compressor = facts.hasCompressor
    ? {
      enabled: false,
      ratio: 1,
      thresholdDb: 0,
      reason: `${source} confirma compresion propia. Se omite el compresor de OBS para no comprimir dos veces la señal.`,
    }
    : profile.identified && facts.formFactor !== 'virtual' && facts.formFactor !== 'unknown'
      ? {
        enabled: true,
        ratio: facts.formFactor === 'headset'
          ? streaming ? 2 : 1.5
          : facts.type === 'dynamic'
            ? streaming ? 3 : 2
            : streaming ? 2.5 : 2,
        thresholdDb: -18,
        reason: `No hay compresion propia confirmada. Se aplica una compresion ${facts.formFactor === 'headset' ? 'ligera para el boom cercano' : streaming ? 'moderada' : 'suave'}; esto depende de la cadena existente, no de que el microfono sea “de buena calidad”.`,
      }
      : {
        enabled: false,
        ratio: 1,
        thresholdDb: 0,
        reason: 'No hay evidencia suficiente para fijar una compresion segura para esta entrada; se omite hasta confirmar el procesamiento y el nivel real.',
      };

  const limiter = facts.hasLimiter
    ? {
      enabled: false,
      thresholdDb: -1.5,
      reason: `${source} confirma limitador propio. Se omite el de OBS para no limitar dos veces la señal.`,
    }
    : {
      enabled: true,
      thresholdDb: -1.5,
      reason: 'Se conserva como techo digital final de OBS para contener picos posteriores a los filtros. No protege el equipo ni corrige saturacion ocurrida antes de OBS.',
    };

  return {
    ...response,
    profile: {
      ...profile,
      type: facts.type,
      formFactor: facts.formFactor,
      pickupPattern: facts.pickupPattern,
      hasSoftwareProcessing: facts.hasSoftwareProcessing,
      hasNoiseReduction: facts.hasNoiseReduction,
      hasNoiseGate: facts.hasNoiseGate,
      hasCompressor: facts.hasCompressor,
      hasLimiter: facts.hasLimiter,
    },
    filters: {
      noiseSuppression,
      noiseGate,
      gain,
      compressor,
      limiter,
    },
    reasoning: `${response.reasoning} La cadena final aplica una politica basada en evidencia: ganancia y compuerta requieren medicion real; el procesamiento duplicado se omite.`,
  };
}
