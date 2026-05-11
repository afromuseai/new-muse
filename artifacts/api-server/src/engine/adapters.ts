/**
 * AfroMuse Response Adapter Layer
 *
 * Normalizes raw provider-specific API responses into the internal
 * NormalizedResponse format that routes and the UI consume.
 *
 * Each adapter knows the expected raw response shape from its provider.
 * When a real API is connected, the provider module calls the raw API,
 * receives its proprietary response, then passes it through the relevant
 * adapter here. Routes and the UI never see raw provider payloads.
 *
 * Mock providers use these adapters to prove the architecture end-to-end:
 * they build a RawXxxResponse from their AI brief output and call adaptXxx().
 *
 * Live swap pattern:
 *   Real provider data flows in → adapter normalizes → same NormalizedResponse out
 *   Nothing in routes, UI, or downstream consumers changes.
 */

import type { NormalizedResponse, SessionBlueprintData } from "./types.js";
import { emptyOutputRegistry } from "./jobStore.js";

// ─── Raw Provider Response Shapes ────────────────────────────────────────────
// These represent the response shapes real external APIs would return.
// Fields marked "slot:" are null in mock mode; real providers populate them.

export interface RawInstrumentalResponse {
  jobId: string;
  status: "completed" | "failed";
  audioUrl: string | null;            // slot: real beat audio URL (MP3/stream)
  wavUrl: string | null;              // slot: WAV download URL
  blueprintData: Partial<SessionBlueprintData>;
  externalJobId?: string | null;      // slot: provider's own track/job ID
  previewUrl?: string | null;         // slot: short preview clip URL
  coverArt?: string | null;           // slot: generated cover art URL
}

export interface RawVocalResponse {
  jobId: string;
  status: "completed" | "failed";
  audioUrl: string | null;            // slot: full vocal track URL
  wavUrl: string | null;              // slot: WAV download URL
  blueprintData: Partial<SessionBlueprintData>;
  externalJobId?: string | null;      // slot: vocal synthesis provider job ID
  vocalPreviewUrl?: string | null;    // slot: short vocal preview audio URL
  syncScore?: number | null;          // slot: vocal-to-beat sync quality score (0–100)
}

export interface RawMasteringResponse {
  jobId: string;
  status: "completed" | "failed";
  masteredMp3Url: string | null;      // slot: mastered MP3 download URL
  masteredWavUrl: string | null;      // slot: mastered WAV download URL
  stemsZipUrl?: string | null;        // slot: stems bundle ZIP URL
  blueprintData: Partial<SessionBlueprintData>;
  externalJobId?: string | null;      // slot: mastering API job reference
  loudnessLufs?: number | null;       // slot: achieved LUFS from mastering engine
}

export interface RawStemExtractionResponse {
  jobId: string;
  status: "completed" | "failed";
  stemsZipUrl: string | null;         // slot: all stems in a ZIP archive
  blueprintData: Partial<SessionBlueprintData>;
  externalJobId?: string | null;      // slot: stem splitter job reference
  stemTrackUrls?: Record<string, string> | null; // slot: individual per-stem audio URLs
  qualityScore?: number | null;       // slot: extraction quality score (0–100)
}

// ─── Adapter Functions ────────────────────────────────────────────────────────

/**
 * Normalizes a raw instrumental provider response.
 * When a real beat-generation API (Suno, Udio, Stability) is connected,
 * map its response fields to RawInstrumentalResponse and call this function.
 */
export function adaptInstrumental(raw: RawInstrumentalResponse): NormalizedResponse {
  const bp = raw.blueprintData;
  return {
    status: raw.status,
    jobId: raw.jobId,
    provider: "instrumental",
    audioUrl: raw.audioUrl ?? raw.previewUrl ?? null,
    wavUrl: raw.wavUrl,
    stemsUrl: null,
    blueprintData: Object.keys(bp).length > 0 ? (bp as SessionBlueprintData) : null,
    notes: bp.sessionBrief ?? null,
    error: null,
    outputRegistry: {
      ...emptyOutputRegistry(),
      instrumentalPreview: raw.previewUrl ?? raw.audioUrl ?? null,
      arrangementBlueprint: bp.arrangementMap ?? null,
    },
  };
}

/**
 * Normalizes a raw vocal provider response.
 * When a real vocal synthesis API (ElevenLabs, Musicfy) is connected,
 * map its response fields to RawVocalResponse and call this function.
 */
export function adaptVocal(raw: RawVocalResponse): NormalizedResponse {
  const bp = raw.blueprintData;
  return {
    status: raw.status,
    jobId: raw.jobId,
    provider: "vocal",
    audioUrl: raw.audioUrl ?? raw.vocalPreviewUrl ?? null,
    wavUrl: raw.wavUrl,
    stemsUrl: null,
    blueprintData: Object.keys(bp).length > 0 ? (bp as SessionBlueprintData) : null,
    notes: bp.vocalBrief ?? null,
    error: null,
    outputRegistry: {
      ...emptyOutputRegistry(),
      vocalPreview: raw.vocalPreviewUrl ?? raw.audioUrl ?? null,
    },
  };
}

/**
 * Normalizes a raw mastering provider response.
 * When a real mastering API (LANDR, CloudBounce, iZotope) is connected,
 * map its response fields to RawMasteringResponse and call this function.
 */
export function adaptMastering(raw: RawMasteringResponse): NormalizedResponse {
  const bp = raw.blueprintData;
  return {
    status: raw.status,
    jobId: raw.jobId,
    provider: "mastering",
    audioUrl: raw.masteredMp3Url,
    wavUrl: raw.masteredWavUrl,
    stemsUrl: raw.stemsZipUrl ?? null,
    blueprintData: Object.keys(bp).length > 0 ? (bp as SessionBlueprintData) : null,
    notes: bp.mixBrief ?? null,
    error: null,
    outputRegistry: {
      ...emptyOutputRegistry(),
      masteredMp3: raw.masteredMp3Url,
      masteredWav: raw.masteredWavUrl,
      stemsZip: raw.stemsZipUrl ?? null,
    },
  };
}

/**
 * Normalizes a raw stem extraction provider response.
 * When a real stem splitter (Demucs, Spleeter, iZotope RX) is connected,
 * map its response fields to RawStemExtractionResponse and call this function.
 */
export function adaptStems(raw: RawStemExtractionResponse): NormalizedResponse {
  const bp = raw.blueprintData;
  return {
    status: raw.status,
    jobId: raw.jobId,
    provider: "stems",
    audioUrl: null,
    wavUrl: null,
    stemsUrl: raw.stemsZipUrl,
    blueprintData: Object.keys(bp).length > 0 ? (bp as SessionBlueprintData) : null,
    notes: bp.extractionBrief ?? null,
    error: null,
    outputRegistry: {
      ...emptyOutputRegistry(),
      stemsZip: raw.stemsZipUrl,
    },
  };
}
