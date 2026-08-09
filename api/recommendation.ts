import { getRecommendationFromGroq } from './_lib/groq';
import type { ApiRequest, ApiResponse } from './_lib/http';
import { readBody, requireJsonPost, sendJson } from './_lib/http';
import { checkRateLimit } from './_lib/rate-limit';
import { parseResolution, validateAIRecommendation, validateAIRecommendationRequest } from '../src/shared/validation';
import {
  getCanvasResolution,
  getLocalRecommendation,
  getPreferredEncoder,
  getPreferredRecordingEncoder,
  getRecommendedRecordingResolution,
  getRecordingBitrate,
  getStreamBitrate,
} from '../src/shared/localRecommendation';
import type { AIRecommendationRequest } from '../src/shared/types';
import { getNetworkStabilityReason, getReliableUploadMbps } from '../src/shared/networkMeasurement';

type ResolutionField = 'canvas_resolution' | 'resolution' | 'recording_resolution';

const providerResolutionAliases: Record<string, string> = {
  '720p': '1280x720',
  '1080p': '1920x1080',
  '1440p': '2560x1440',
  '2160p': '3840x2160',
  '4k': '3840x2160',
  fhd: '1920x1080',
  uhd: '3840x2160',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Los modelos pueden respetar las dimensiones pero variar la presentacion
// ("1920 x 1080", signo ×, sufijo p o nombres como 1080p). Esta coercion se
// aplica solo a la salida del proveedor; la validacion que protege OBS sigue
// exigiendo el formato canonico anchoxalto.
function normalizeProviderResolution(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const compact = value.trim().toLowerCase().replace(/\s+/g, '');
  const alias = providerResolutionAliases[compact];
  if (alias) return alias;

  const dimensions = /^(\d{3,4})[x×](\d{3,4})p?$/.exec(compact);
  if (!dimensions) return null;

  const candidate = `${Number(dimensions[1])}x${Number(dimensions[2])}`;
  return parseResolution(candidate).success ? candidate : null;
}

function repairProviderResolutions(
  request: AIRecommendationRequest,
  payload: unknown,
): { payload: unknown; repairedFields: ResolutionField[]; usedFallback: boolean } {
  if (!isRecord(payload) || !isRecord(payload.recommendations)) {
    return { payload, repairedFields: [], usedFallback: false };
  }

  const local = getLocalRecommendation(request).recommendations;
  const recommendations = { ...payload.recommendations };
  const repairedFields: ResolutionField[] = [];
  let usedFallback = false;

  for (const field of ['canvas_resolution', 'resolution', 'recording_resolution'] as const) {
    // `canvas_resolution` y `recording_resolution` son opcionales por
    // compatibilidad; si el proveedor no los envia, el validador reutiliza la
    // salida principal sin convertir esa omision esperada en una reparacion.
    if (field !== 'resolution' && !(field in recommendations)) continue;

    const original = recommendations[field];
    const normalized = normalizeProviderResolution(original);
    const replacement = normalized ?? local[field];

    if (original !== replacement) repairedFields.push(field);
    if (!normalized) usedFallback = true;
    recommendations[field] = replacement;
  }

  // Encoder y bitrates no son decisiones libres del proveedor: mas abajo el
  // endpoint los recalcula a partir del hardware, la plataforma y la red. Se
  // colocan valores deterministas validos antes de validar para que etiquetas
  // equivalentes como "Apple VideoToolbox H.264" no tumben toda la respuesta.
  recommendations.encoder = getPreferredEncoder(request.systemInfo);
  recommendations.recording_encoder = request.mode === 'stream_only'
    ? recommendations.encoder
    : getPreferredRecordingEncoder(request.systemInfo);
  recommendations.bitrate = local.bitrate;
  recommendations.recording_bitrate = local.recording_bitrate;

  return {
    payload: { ...payload, recommendations },
    repairedFields,
    usedFallback,
  };
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  response.setHeader('Cache-Control', 'no-store');

  const boundary = requireJsonPost(request);
  if (!boundary.allowed) {
    return sendJson(response, boundary.status, { message: boundary.message });
  }

  const rateLimit = await checkRateLimit(request);
  if (!rateLimit.allowed) {
    response.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    return sendJson(response, 429, { message: rateLimit.message });
  }

  try {
    const validation = validateAIRecommendationRequest(readBody(request));
    if (!validation.success) {
      return sendJson(response, 400, { message: validation.message });
    }

    const aiPayload = await getRecommendationFromGroq(validation.value);
    const repairedPayload = repairProviderResolutions(validation.value, aiPayload);
    if (repairedPayload.repairedFields.length > 0) {
      console.warn(`[recommendation] Resoluciones de IA normalizadas o completadas: ${repairedPayload.repairedFields.join(', ')}`);
    }
    const recommendation = validateAIRecommendation(repairedPayload.payload);
    if (!recommendation.success) {
      return sendJson(response, 502, { message: recommendation.message });
    }

    const preferredStreamEncoder = getPreferredEncoder(validation.value.systemInfo);
    const wantsRecording = validation.value.mode !== 'stream_only';
    const preferredRecordingEncoder = wantsRecording
      ? getPreferredRecordingEncoder(validation.value.systemInfo)
      : preferredStreamEncoder;
    const recordingResolution = wantsRecording
      ? getRecommendedRecordingResolution(
        validation.value,
        recommendation.value.recommendations.recording_resolution,
        recommendation.value.recommendations.fps,
      )
      : recommendation.value.recommendations.resolution;
    const recordingWasLimited = recordingResolution
      !== recommendation.value.recommendations.recording_resolution;
    const normalizedRecommendations = {
      ...recommendation.value.recommendations,
      canvas_resolution: getCanvasResolution(
        recommendation.value.recommendations.resolution,
        recordingResolution,
      ),
      encoder: preferredStreamEncoder,
      bitrate: getStreamBitrate(
        validation.value.platform,
        recommendation.value.recommendations.resolution,
        recommendation.value.recommendations.fps,
        getReliableUploadMbps(validation.value.network),
      ),
      recording_resolution: recordingResolution,
      recording_encoder: preferredRecordingEncoder,
      recording_bitrate: wantsRecording
        ? getRecordingBitrate(
          recordingResolution,
          recommendation.value.recommendations.fps,
          preferredRecordingEncoder,
        )
        : recommendation.value.recommendations.bitrate,
    };
    const normalizedReasoning = recordingWasLimited || repairedPayload.usedFallback
      ? `El stream ${normalizedRecommendations.resolution} a ${normalizedRecommendations.bitrate} kbps prioriza estabilidad en ${validation.value.platform}. La grabacion ${recordingResolution} con ${preferredRecordingEncoder.toUpperCase()} a ${normalizedRecommendations.recording_bitrate} kbps reserva margen para emitir y grabar al mismo tiempo. Los ${normalizedRecommendations.fps} FPS conservan fluidez.`
      : recommendation.value.reasoning;
    const networkReasoning = validation.value.mode !== 'record_only' && validation.value.network
      ? `${getNetworkStabilityReason(validation.value.network) || `La subida medida fue de ${validation.value.network.uploadMbps.toFixed(1)} Mbps.`} El bitrate de emision conserva 30% de margen.`
      : '';

    response.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
    return sendJson(response, 200, {
      ...recommendation.value,
      recommendations: normalizedRecommendations,
      reasoning: `${normalizedReasoning} ${networkReasoning}`.trim(),
      source: 'ai',
    });
  } catch (error) {
    console.error('Recommendation endpoint failed:', error);
    return sendJson(response, 500, {
      message: 'La IA integrada no pudo generar una recomendacion.',
    });
  }
}
