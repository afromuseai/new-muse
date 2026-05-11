/**
 * AfroMuse Provider Credential Slots
 *
 * Clean configuration placeholders for future live provider API credentials.
 * Each provider category has a dedicated slot with all the fields a real
 * integration would need: apiKey, endpoint, model, region, timeout.
 *
 * Rules:
 *   - Do NOT add real secrets here. Use environment variables (process.env).
 *   - All fields default to null — they are inert until a real provider is connected.
 *   - When activating a live provider, set the corresponding env vars and
 *     update the registry status to "live-ready" (isLive: true).
 *
 * Env variable naming convention per provider:
 *   <CATEGORY>_API_KEY, <CATEGORY>_API_ENDPOINT, <CATEGORY>_MODEL,
 *   <CATEGORY>_REGION, <CATEGORY>_TIMEOUT_MS
 *
 * Example (instrumental live provider):
 *   INSTRUMENTAL_API_KEY=sk-...
 *   INSTRUMENTAL_API_ENDPOINT=https://api.udio.com/v1/generate
 *   INSTRUMENTAL_MODEL=udio-v2
 *   INSTRUMENTAL_REGION=us-east-1
 *   INSTRUMENTAL_TIMEOUT_MS=45000
 */

import type { ProviderCategory } from "./types.js";

// ─── Credential Slot Shape ────────────────────────────────────────────────────

export interface ProviderCredentialSlot {
  /** Primary authentication key for the live provider API. */
  apiKey: string | null;
  /** Base URL / endpoint for the live provider API. */
  endpoint: string | null;
  /** Model or variant identifier to use (e.g. "udio-v2", "eleven_multilingual_v2"). */
  model: string | null;
  /** Cloud region for the provider, if applicable. */
  region: string | null;
  /** Request timeout in milliseconds. */
  timeoutMs: number;
}

// ─── Credential Slots Registry ────────────────────────────────────────────────

const CREDENTIAL_SLOTS: Record<ProviderCategory, ProviderCredentialSlot> = {
  /**
   * Instrumental / Beat Generation — AI Music API (aimusicapi.org)
   * Primary key: AI_MUSIC_API_KEY
   * Fallback key: INSTRUMENTAL_API_KEY (legacy slot)
   * Endpoint: https://aimusicapi.org/api/v2/generate
   * Polling:  https://aimusicapi.org/api/v2/query?task_id=<id>
   */
  instrumental: {
    apiKey:    process.env.AI_MUSIC_API_KEY ?? process.env.INSTRUMENTAL_API_KEY ?? null,
    endpoint:  "https://aimusicapi.org/api/v2/generate",
    model:     process.env.AI_MUSIC_MODEL ?? "chirp-v4-5",
    region:    null,
    timeoutMs: Number(process.env.INSTRUMENTAL_TIMEOUT_MS ?? 90_000),
  },

  /**
   * Vocal Synthesis — NVIDIA AI brief (mock audio placeholder)
   * ElevenLabs has been removed. Voice clone route returns an AI text brief only
   * until a new vocal synthesis provider is connected.
   *
   * Optional overrides:
   *   VOCAL_TIMEOUT_MS — request timeout in ms (defaults to 90 000)
   */
  vocal: {
    apiKey:    null,
    endpoint:  null,
    model:     null,
    region:    null,
    timeoutMs: Number(process.env.VOCAL_TIMEOUT_MS ?? 90_000),
  },

  /**
   * Mix & Mastering
   * Candidate APIs: LANDR, CloudBounce, iZotope Ozone API, Matchering
   */
  mastering: {
    apiKey:    process.env.MASTERING_API_KEY    ?? null,
    endpoint:  process.env.MASTERING_API_ENDPOINT ?? null,
    model:     process.env.MASTERING_MODEL     ?? null,
    region:    process.env.MASTERING_REGION    ?? null,
    timeoutMs: Number(process.env.MASTERING_TIMEOUT_MS ?? 60_000),
  },

  /**
   * Stem Extraction / Separation
   * Candidate APIs: Demucs, Spleeter, iZotope RX, AudioShake
   */
  stems: {
    apiKey:    process.env.STEMS_API_KEY    ?? null,
    endpoint:  process.env.STEMS_API_ENDPOINT ?? null,
    model:     process.env.STEMS_MODEL     ?? null,
    region:    process.env.STEMS_REGION    ?? null,
    timeoutMs: Number(process.env.STEMS_TIMEOUT_MS ?? 120_000),
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Overwrites the API key for a provider at runtime (no server restart needed).
 * Also writes to process.env so any code reading env directly stays consistent.
 */
export function setProviderApiKey(category: ProviderCategory, apiKey: string): void {
  CREDENTIAL_SLOTS[category].apiKey = apiKey.trim() || null;
  if (category === "instrumental") {
    if (apiKey.trim()) {
      process.env["AI_MUSIC_API_KEY"] = apiKey.trim();
    } else {
      delete process.env["AI_MUSIC_API_KEY"];
    }
  }
}

/** Returns the full credential slot for a provider category. */
export function getProviderCredentials(category: ProviderCategory): ProviderCredentialSlot {
  return CREDENTIAL_SLOTS[category];
}

/**
 * Returns true only if both apiKey and endpoint are populated for this provider.
 * Used by the resolver to gate live-mode activation.
 */
export function isCredentialReady(category: ProviderCategory): boolean {
  const slot = CREDENTIAL_SLOTS[category];
  return slot.apiKey !== null && slot.endpoint !== null;
}

/**
 * Returns a safe summary of credential readiness (no actual secret values).
 * Suitable for diagnostics and admin endpoints.
 */
export function getCredentialSummary(category: ProviderCategory): {
  apiKeySet: boolean;
  endpointSet: boolean;
  modelSet: boolean;
  regionSet: boolean;
  timeoutMs: number;
} {
  const slot = CREDENTIAL_SLOTS[category];
  return {
    apiKeySet:   slot.apiKey   !== null,
    endpointSet: slot.endpoint !== null,
    modelSet:    slot.model    !== null,
    regionSet:   slot.region   !== null,
    timeoutMs:   slot.timeoutMs,
  };
}
