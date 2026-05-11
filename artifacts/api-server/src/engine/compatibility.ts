/**
 * AfroMuse Provider Compatibility Checks
 *
 * Helpers that ask "can this provider handle this session mode or feature?"
 * before a job is dispatched. This keeps the dispatch logic clean — instead
 * of scattered if/else branches in routes, all capability gating lives here.
 *
 * Usage (in routes or dispatch logic):
 *   if (!canProviderHandleBuildMode("vocal", session.buildMode)) {
 *     return res.status(400).json({ error: "Provider does not support this build mode" });
 *   }
 *
 * When a new real provider is connected with different capability constraints,
 * update its capability profile in capabilities.ts — these helpers stay stable.
 */

import { getCapabilities } from "./capabilities.js";
import type { ProviderCategory, ProviderCapabilities } from "./types.js";

// ─── Build Mode Compatibility ─────────────────────────────────────────────────

/**
 * Returns true if the provider can handle the requested build mode.
 *   "demo"  — requires supportsPreviewOnly or supportsVocals
 *   "full"  — requires supportsFullExport, supportsInstrumental, or supportsVocals
 *   other   — passes through (real validation happens at the provider level)
 */
export function canProviderHandleBuildMode(
  category: ProviderCategory,
  buildMode: string,
): boolean {
  const caps = getCapabilities(category);
  if (buildMode === "demo") {
    return caps.supportsPreviewOnly || caps.supportsVocals;
  }
  if (buildMode === "full") {
    return caps.supportsFullExport || caps.supportsInstrumental || caps.supportsVocals;
  }
  return true;
}

// ─── Feature Compatibility ────────────────────────────────────────────────────

/**
 * Returns true if the provider can produce a mastered export (MP3/WAV).
 */
export function canProviderHandleMasteredExport(category: ProviderCategory): boolean {
  return getCapabilities(category).supportsMastering;
}

/**
 * Returns true if the provider accepts custom user-supplied lyrics.
 */
export function canProviderHandleCustomLyrics(category: ProviderCategory): boolean {
  return getCapabilities(category).supportsCustomLyrics;
}

/**
 * Returns true if the provider can extract or produce separate audio stems.
 */
export function canProviderHandleStems(category: ProviderCategory): boolean {
  return getCapabilities(category).supportsStems;
}

/**
 * Returns true if the provider supports real-time streaming output.
 * (Currently false for all providers — slot for future SSE/WebSocket engines.)
 */
export function canProviderHandleRealtime(category: ProviderCategory): boolean {
  return getCapabilities(category).supportsRealtime;
}

/**
 * Returns true if the provider can produce a polling-based async job.
 * All current providers use the fire-and-poll pattern.
 */
export function canProviderHandlePolling(category: ProviderCategory): boolean {
  return getCapabilities(category).supportsPolling;
}

// ─── Generic Capability Gate ──────────────────────────────────────────────────

/**
 * Generic capability check — useful for dynamic feature flags or admin tooling.
 * Pass any key from ProviderCapabilities to check it for a given provider.
 *
 * Example:
 *   checkCapability("mastering", "supportsFullExport") // true
 *   checkCapability("vocal", "supportsMastering")      // false
 */
export function checkCapability(
  category: ProviderCategory,
  capability: keyof ProviderCapabilities,
): boolean {
  return getCapabilities(category)[capability];
}
