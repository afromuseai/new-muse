/**
 * AfroMuse Provider Capability Profiles
 *
 * Each provider declares exactly what it can and cannot do.
 * These profiles drive compatibility checks before a job is dispatched,
 * so the system can catch unsupported mode/feature combinations early —
 * without waiting for a provider to reject the request.
 *
 * When a real provider is connected, update its profile here to reflect
 * what the live API actually supports. Nothing else needs to change.
 */

import type { ProviderCategory, ProviderCapabilities } from "./types.js";

// ─── Capability Profiles ──────────────────────────────────────────────────────

const CAPABILITY_PROFILES: Record<ProviderCategory, ProviderCapabilities> = {
  instrumental: {
    supportsInstrumental: true,
    supportsVocals: false,
    supportsBlueprint: true,      // AI session brief (always available)
    supportsMastering: false,
    supportsStems: false,
    supportsPreviewOnly: true,    // mock: brief only; live: beat preview audio
    supportsFullExport: false,    // not until real beat-gen API is connected
    supportsPolling: true,        // fire-and-poll job pattern
    supportsRealtime: false,      // slot: SSE / websocket streaming (future)
    supportsCustomLyrics: false,  // instrumental — no lyric input
  },

  vocal: {
    supportsInstrumental: false,
    supportsVocals: true,
    supportsBlueprint: true,      // AI vocal brief (always available)
    supportsMastering: false,
    supportsStems: false,
    supportsPreviewOnly: true,    // mock: brief only; live: vocal demo audio
    supportsFullExport: false,    // not until real vocal synthesis API is connected
    supportsPolling: true,
    supportsRealtime: false,
    supportsCustomLyrics: true,   // accepts user-supplied lyrics for lead vocal
  },

  mastering: {
    supportsInstrumental: false,
    supportsVocals: false,
    supportsBlueprint: true,      // AI mix & master brief (always available)
    supportsMastering: true,
    supportsStems: true,          // can produce stems guidance alongside master
    supportsPreviewOnly: false,
    supportsFullExport: true,     // slot: real mastered MP3 + WAV
    supportsPolling: true,
    supportsRealtime: false,
    supportsCustomLyrics: false,
  },

  stems: {
    supportsInstrumental: false,
    supportsVocals: false,
    supportsBlueprint: true,      // AI stem extraction brief (always available)
    supportsMastering: false,
    supportsStems: true,
    supportsPreviewOnly: false,
    supportsFullExport: true,     // slot: real stems ZIP
    supportsPolling: true,
    supportsRealtime: false,
    supportsCustomLyrics: false,
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function getCapabilities(category: ProviderCategory): ProviderCapabilities {
  return CAPABILITY_PROFILES[category];
}

export function listAllCapabilities(): Record<ProviderCategory, ProviderCapabilities> {
  return CAPABILITY_PROFILES;
}
