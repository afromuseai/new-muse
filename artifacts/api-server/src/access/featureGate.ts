/**
 * AfroMuse Backend Access Control — Feature Gate
 *
 * Server-side feature checks. Use these in route handlers to guard
 * premium endpoints.
 */

import { resolveServerPlan, getPlanFeatures } from "./plans.js";
import type { AccessCheckResult, FeatureKey, ServerPlanId } from "./types.js";

const FEATURE_LABELS: Record<FeatureKey, string> = {
  canGenerateInstrumental:  "Instrumental Generation",
  canGenerateVocals:        "Vocal Generation",
  canGenerateBlueprint:     "Arrangement Blueprint",
  canExportMp3:             "MP3 Export",
  canExportWav:             "WAV Export",
  canExportStems:           "Stems Export",
  canUsePremiumMixFeels:    "Premium Mix Feels",
  canUseProTools:           "Pro Tools",
  canSaveProjects:          "Project Saving",
  canGenerateLeadVocals:    "Lead Vocal Generation",
  canUseMixMaster:          "Mix & Master",
  canUseHitmakerMode:       "Hitmaker Mode",
  canRewriteLyrics:         "Lyric Rewrite",
  canUseLyricalDepth:       "Lyrical Depth Control",
  canUseHookRepeat:         "Hook Repeat Control",
  canUseGenderVoice:        "Gender/Voice Control",
  canUsePerformanceFeel:    "Performance Feel Control",
  canUseVoiceClone:         "Voice Clone",
  canUseArtistDna:          "Artist DNA",
  canUsePersistentMemory:   "Persistent Memory",
  canUseAdvancedDemos:      "Advanced Demos",
};

const FEATURE_REQUIRED_PLAN: Record<FeatureKey, ServerPlanId> = {
  canGenerateInstrumental:  "free",
  canGenerateVocals:        "free",
  canGenerateBlueprint:     "free",
  canGenerateLeadVocals:    "free",
  canExportMp3:             "creator-pro",
  canExportWav:             "creator-pro",
  canExportStems:           "creator-pro",
  canUsePremiumMixFeels:    "creator-pro",
  canUseProTools:           "creator-pro",
  canSaveProjects:          "creator-pro",
  canUseMixMaster:          "creator-pro",
  canUseHitmakerMode:       "creator-pro",
  canRewriteLyrics:         "creator-pro",
  canUseLyricalDepth:       "creator-pro",
  canUseHookRepeat:         "creator-pro",
  canUseGenderVoice:        "creator-pro",
  canUsePerformanceFeel:    "creator-pro",
  canUseVoiceClone:         "artist-pro",
  canUseArtistDna:          "artist-pro",
  canUsePersistentMemory:   "artist-pro",
  canUseAdvancedDemos:      "artist-pro",
};

const PLAN_LABEL: Record<ServerPlanId, string> = {
  "free":         "Free",
  "creator-pro":  "Creator Pro",
  "artist-pro":   "Artist Pro",
};

/**
 * Check whether a raw plan string (from JWT/DB) has access to a feature.
 */
export function checkAccess(rawPlan: string, feature: FeatureKey, role?: string): AccessCheckResult {
  const planId = resolveServerPlan(rawPlan, role);
  const features = getPlanFeatures(planId);
  const allowed = features[feature] ?? false;

  if (!allowed) {
    const requiredPlan = FEATURE_REQUIRED_PLAN[feature] ?? "creator-pro";
    return {
      allowed: false,
      reason: `${FEATURE_LABELS[feature]} requires the ${PLAN_LABEL[requiredPlan]} plan.`,
      upgradeRequired: true,
      requiredPlan,
    };
  }

  return { allowed: true, reason: null, upgradeRequired: false };
}

/**
 * Simple boolean check for inline guards.
 */
export function isAllowed(rawPlan: string, feature: FeatureKey, role?: string): boolean {
  return checkAccess(rawPlan, feature, role).allowed;
}
