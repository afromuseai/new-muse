/**
 * AfroMuse Client Output Registry
 *
 * Maps normalized engine responses into the output registry surface that
 * the Studio UI and downstream consumers read from.
 *
 * When a real audio provider is connected and begins returning actual URLs,
 * this file is the single place to update the mapping logic.
 */

import type { NormalizedResponse, OutputRegistryMap, SessionBlueprintData } from "./types";

// ─── Registry Entry ───────────────────────────────────────────────────────────

export interface OutputRegistryEntry {
  // Audio file URLs — null until a real provider is live
  instrumentalPreview: string | null;
  vocalPreview: string | null;
  arrangementBlueprint: string | null;
  masteredMp3: string | null;
  masteredWav: string | null;
  stemsZip: string | null;

  // Rich session data for display
  sessionBrief: string | null;
  producerNotes: string | null;
  beatSummary: string | null;
  arrangementMap: string | null;
  vocalBrief: string | null;
  mixBrief: string | null;
  extractionBrief: string | null;
}

// ─── Empty Registry ───────────────────────────────────────────────────────────

export function emptyOutputRegistry(): OutputRegistryEntry {
  return {
    instrumentalPreview: null,
    vocalPreview: null,
    arrangementBlueprint: null,
    masteredMp3: null,
    masteredWav: null,
    stemsZip: null,
    sessionBrief: null,
    producerNotes: null,
    beatSummary: null,
    arrangementMap: null,
    vocalBrief: null,
    mixBrief: null,
    extractionBrief: null,
  };
}

// ─── Registry Builder ─────────────────────────────────────────────────────────

/**
 * Build a populated output registry from a normalized engine response.
 * Audio URLs remain null until a real provider is live; text content is
 * populated immediately from the AI session brief.
 */
export function buildOutputRegistry(r: NormalizedResponse): OutputRegistryEntry {
  const urls: OutputRegistryMap = r.outputRegistry;
  const bp: SessionBlueprintData = r.blueprintData ?? {};

  return {
    // Audio URLs from the normalized output registry
    instrumentalPreview: urls.instrumentalPreview,
    vocalPreview: urls.vocalPreview,
    arrangementBlueprint: urls.arrangementBlueprint ?? bp.arrangementMap ?? null,
    masteredMp3: urls.masteredMp3,
    masteredWav: urls.masteredWav,
    stemsZip: urls.stemsZip,

    // Rich content from the session blueprint
    sessionBrief: bp.sessionBrief ?? null,
    producerNotes: bp.producerNotes ?? null,
    beatSummary: bp.beatSummary ?? null,
    arrangementMap: bp.arrangementMap ?? null,
    vocalBrief: bp.vocalBrief ?? null,
    mixBrief: bp.mixBrief ?? null,
    extractionBrief: bp.extractionBrief ?? null,
  };
}

// ─── Merge Helper ─────────────────────────────────────────────────────────────

/**
 * Merge multiple registry entries (e.g. instrumental + vocal + master)
 * into one unified registry. Later entries take priority for non-null fields.
 */
export function mergeOutputRegistries(
  ...entries: (OutputRegistryEntry | null | undefined)[]
): OutputRegistryEntry {
  const base = emptyOutputRegistry();

  for (const entry of entries) {
    if (!entry) continue;
    for (const key of Object.keys(base) as (keyof OutputRegistryEntry)[]) {
      if (entry[key] !== null && entry[key] !== undefined) {
        (base as Record<string, unknown>)[key] = entry[key];
      }
    }
  }

  return base;
}
