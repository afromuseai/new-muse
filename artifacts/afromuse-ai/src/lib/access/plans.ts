/**
 * AfroMuse Access Control — Plan Definitions
 *
 * All plan configs live here. Adding a new plan means adding one entry to PLANS.
 *
 * Plans:
 *   free        → basic lyric generation, limited rewrites, instrumental preview
 *   creator-pro → full lyric controls, rewrite stack, full Audio Studio V2, exports, saves
 *   artist-pro  → Creator Pro + Artist DNA, voice clone, persistent memory, advanced demos
 */

import type { Plan, PlanId } from "./types";

// ─── Plan Definitions ─────────────────────────────────────────────────────────

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    label: "Free",
    badgeLabel: "FREE",
    description: "Preview generation and basic session building.",
    features: {
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
    },
    limits: {
      sessionsPerDay:                   3,
      instrumentalGenerationsPerDay:    3,
      vocalGenerationsPerDay:           3,
      exportsPerDay:                    0,
      rewritesPerDay:                   0,
    },
  },

  "creator-pro": {
    id: "creator-pro",
    label: "Creator Pro",
    badgeLabel: "CREATOR PRO",
    description: "Full studio access — exports, stems, lyric controls, pro tools, and unlimited sessions.",
    features: {
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
    },
    limits: {
      sessionsPerDay:                   null,
      instrumentalGenerationsPerDay:    null,
      vocalGenerationsPerDay:           null,
      exportsPerDay:                    null,
      rewritesPerDay:                   null,
    },
  },

  "artist-pro": {
    id: "artist-pro",
    label: "Artist Pro",
    badgeLabel: "ARTIST PRO",
    description: "Everything in Creator Pro + Artist DNA, voice clone, persistent memory, and advanced demos.",
    features: {
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
    },
    limits: {
      sessionsPerDay:                   null,
      instrumentalGenerationsPerDay:    null,
      vocalGenerationsPerDay:           null,
      exportsPerDay:                    null,
      rewritesPerDay:                   null,
    },
  },
};

export function getPlan(planId: PlanId): Plan {
  return PLANS[planId];
}

export function getAllPlans(): Plan[] {
  return Object.values(PLANS);
}

// ─── Plan Name Bridge ─────────────────────────────────────────────────────────
// Maps the server plan strings to our internal PlanId.

export function resolveServerPlan(serverPlan: string): PlanId {
  const lower = serverPlan?.toLowerCase().trim() ?? "free";
  if (lower === "creator pro" || lower === "pro") return "creator-pro";
  if (lower === "artist pro" || lower === "gold") return "artist-pro";
  return "free";
}
