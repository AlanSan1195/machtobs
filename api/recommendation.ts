import { getRecommendationFromGroq } from './_lib/groq';
import type { ApiRequest, ApiResponse } from './_lib/http';
import { readBody, requireJsonPost, sendJson } from './_lib/http';
import { checkRateLimit } from './_lib/rate-limit';
import { validateAIRecommendation, validateAIRecommendationRequest } from '../src/shared/validation';
import {
  clampRecordingResolutionForHardware,
  getPreferredEncoder,
  getPreferredRecordingEncoder,
  getRecordingBitrate,
  getStreamBitrate,
} from '../src/shared/localRecommendation';
import { getNetworkStabilityReason, getReliableUploadMbps } from '../src/shared/networkMeasurement';

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
    const recommendation = validateAIRecommendation(aiPayload);
    if (!recommendation.success) {
      return sendJson(response, 502, { message: recommendation.message });
    }

    const preferredStreamEncoder = getPreferredEncoder(validation.value.systemInfo);
    const wantsRecording = validation.value.mode !== 'stream_only';
    const preferredRecordingEncoder = wantsRecording
      ? getPreferredRecordingEncoder(validation.value.systemInfo)
      : preferredStreamEncoder;
    const recordingResolution = wantsRecording
      ? clampRecordingResolutionForHardware(
        validation.value,
        recommendation.value.recommendations.recording_resolution,
        recommendation.value.recommendations.fps,
      )
      : recommendation.value.recommendations.resolution;
    const recordingWasLimited = recordingResolution
      !== recommendation.value.recommendations.recording_resolution;
    const normalizedRecommendations = {
      ...recommendation.value.recommendations,
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
    const normalizedReasoning = recordingWasLimited
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
