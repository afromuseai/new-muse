/**
 * AfroMuse Backend Access Control — Plan Definitions
 *
 * Server-side plan feature maps.
 * Mirrors the client-side plans.ts — both must stay in sync.
 *
 * Plans:
 *   Free        → basic lyric generation, limited rewrites, instrumental preview
 *   Creator Pro → full lyric controls, rewrite stack, full Audio Studio V2, exports, saves
 *   Artist Pro  → Creator Pro + Artist DNA, voice clone, persistent memory, advanced demos
 */

import type { FeatureAccessMap, ServerPlanId } from "./types.js";

const FREE_FEATURES: FeatureAccessMap = {
  canGenerateInstrumental:  true,
  canGenerateVocals:        true,
  canGenerateBlueprint:     true,
  canExportMp3:             false,
  canExportWav:             false,
  canExportStems:           false,
  canUsePremiumMixFeels:    false,
  canUseProTools:           false,
  canSaveProjects:          false,
  canGenerateLeadVocals:    true,
  canUseMixMaster:          false,
  canUseHitmakerMode:       false,
  canRewriteLyrics:         false,
  canUseLyricalDepth:       false,
  canUseHookRepeat:         false,
  canUseGenderVoice:        false,
  canUsePerformanceFeel:    false,
  canUseVoiceClone:         false,
  canUseArtistDna:          false,
  canUsePersistentMemory:   false,
  canUseAdvancedDemos:      false,
};

const CREATOR_PRO_FEATURES: FeatureAccessMap = {
  canGenerateInstrumental:  true,
  canGenerateVocals:        true,
  canGenerateBlueprint:     true,
  canExportMp3:             true,
  canExportWav:             true,
  canExportStems:           true,
  canUsePremiumMixFeels:    true,
  canUseProTools:           true,
  canSaveProjects:          true,
  canGenerateLeadVocals:    true,
  canUseMixMaster:          true,
  canUseHitmakerMode:       true,
  canRewriteLyrics:         true,
  canUseLyricalDepth:       true,
  canUseHookRepeat:         true,
  canUseGenderVoice:        true,
  canUsePerformanceFeel:    true,
  canUseVoiceClone:         false,
  canUseArtistDna:          false,
  canUsePersistentMemory:   false,
  canUseAdvancedDemos:      false,
};

const ARTIST_PRO_FEATURES: FeatureAccessMap = {
  canGenerateInstrumental:  true,
  canGenerateVocals:        true,
  canGenerateBlueprint:     true,
  canExportMp3:             true,
  canExportWav:             true,
  canExportStems:           true,
  canUsePremiumMixFeels:    true,
  canUseProTools:           true,
  canSaveProjects:          true,
  canGenerateLeadVocals:    true,
  canUseMixMaster:          true,
  canUseHitmakerMode:       true,
  canRewriteLyrics:         true,
  canUseLyricalDepth:       true,
  canUseHookRepeat:         true,
  canUseGenderVoice:        true,
  canUsePerformanceFeel:    true,
  canUseVoiceClone:         true,
  canUseArtistDna:          true,
  canUsePersistentMemory:   true,
  canUseAdvancedDemos:      true,
};

export const PLAN_FEATURES: Record<ServerPlanId, FeatureAccessMap> = {
  "free":         FREE_FEATURES,
  "creator-pro":  CREATOR_PRO_FEATURES,
  "artist-pro":   ARTIST_PRO_FEATURES,
};

/**
 * Resolve a raw DB/JWT plan string to the internal ServerPlanId.
 * - "Creator Pro" / "Pro" → "creator-pro"
 * - "Artist Pro" / "Gold" → "artist-pro"
 * - anything else         → "free"
 * Admins always get "artist-pro" regardless of stored plan.
 */
export function resolveServerPlan(rawPlan: string, role?: string): ServerPlanId {
  if (role === "admin") return "artist-pro";
  const lower = rawPlan?.toLowerCase().trim() ?? "free";
  if (lower === "creator pro" || lower === "pro") return "creator-pro";
  if (lower === "artist pro" || lower === "gold") return "artist-pro";
  return "free";
}

export function getPlanFeatures(planId: ServerPlanId): FeatureAccessMap {
  return PLAN_FEATURES[planId];
}
