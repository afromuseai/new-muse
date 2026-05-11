/**
 * AfroMuse Access Control — Feature Gate
 *
 * Central check functions for all feature-gated behaviour.
 * Import these anywhere in the UI to check access cleanly — no plan logic
 * should be scattered across components.
 */

import { getPlan } from "./plans";
import type { AccessCheckResult, FeatureKey, GateState, PlanId, UsageLimits, UsageState } from "./types";

// ─── Feature → Human Label ────────────────────────────────────────────────────

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
};

// ─── Core Access Check ────────────────────────────────────────────────────────

/**
 * Check whether a feature is accessible for a given plan.
 * Optionally pass current usage to enforce daily limits.
 */
export function checkFeatureAccess(
  planId: PlanId,
  feature: FeatureKey,
  usage?: UsageState,
): AccessCheckResult {
  const plan = getPlan(planId);
  const featureAllowed = plan.features[feature];

  if (!featureAllowed) {
    return {
      allowed: false,
      gateState: "locked",
      reason: `${FEATURE_LABELS[feature]} requires a Pro plan.`,
      upgradeRequired: true,
    };
  }

  // Check usage limits if usage is provided
  if (usage) {
    const limitHit = checkUsageLimit(feature, plan.limits, usage);
    if (limitHit) {
      return {
        allowed: false,
        gateState: "locked",
        reason: limitHit,
        upgradeRequired: planId === "free",
      };
    }
  }

  return {
    allowed: true,
    gateState: "available",
    reason: null,
    upgradeRequired: false,
  };
}

function checkUsageLimit(
  feature: FeatureKey,
  limits: UsageLimits,
  usage: UsageState,
): string | null {
  if (
    feature === "canGenerateInstrumental" &&
    limits.instrumentalGenerationsPerDay !== null &&
    usage.instrumentalGenerationsUsed >= limits.instrumentalGenerationsPerDay
  ) {
    return `Daily instrumental generation limit reached (${limits.instrumentalGenerationsPerDay}). Upgrade to Pro for unlimited.`;
  }

  if (
    feature === "canGenerateVocals" &&
    limits.vocalGenerationsPerDay !== null &&
    usage.vocalGenerationsUsed >= limits.vocalGenerationsPerDay
  ) {
    return `Daily vocal generation limit reached (${limits.vocalGenerationsPerDay}). Upgrade to Pro for unlimited.`;
  }

  if (
    (feature === "canExportMp3" || feature === "canExportWav" || feature === "canExportStems") &&
    limits.exportsPerDay !== null &&
    usage.exportsUsed >= limits.exportsPerDay
  ) {
    return "Export limit reached for today. Upgrade to Pro for unlimited exports.";
  }

  return null;
}

// ─── Simple Boolean Checks ────────────────────────────────────────────────────
// Convenience wrappers — use these in components for clean, readable checks.

export function canGenerateInstrumental(planId: PlanId, usage?: UsageState): boolean {
  return checkFeatureAccess(planId, "canGenerateInstrumental", usage).allowed;
}

export function canGenerateVocals(planId: PlanId, usage?: UsageState): boolean {
  return checkFeatureAccess(planId, "canGenerateVocals", usage).allowed;
}

export function canGenerateBlueprint(planId: PlanId, usage?: UsageState): boolean {
  return checkFeatureAccess(planId, "canGenerateBlueprint", usage).allowed;
}

export function canExportMp3(planId: PlanId, usage?: UsageState): boolean {
  return checkFeatureAccess(planId, "canExportMp3", usage).allowed;
}

export function canExportWav(planId: PlanId, usage?: UsageState): boolean {
  return checkFeatureAccess(planId, "canExportWav", usage).allowed;
}

export function canExportStems(planId: PlanId, usage?: UsageState): boolean {
  return checkFeatureAccess(planId, "canExportStems", usage).allowed;
}

export function canUsePremiumMixFeels(planId: PlanId): boolean {
  return checkFeatureAccess(planId, "canUsePremiumMixFeels").allowed;
}

export function canUseProTools(planId: PlanId): boolean {
  return checkFeatureAccess(planId, "canUseProTools").allowed;
}

export function canUseMixMaster(planId: PlanId): boolean {
  return checkFeatureAccess(planId, "canUseMixMaster").allowed;
}

export function canUseHitmakerMode(planId: PlanId): boolean {
  return checkFeatureAccess(planId, "canUseHitmakerMode").allowed;
}

// ─── Gate State for UI ────────────────────────────────────────────────────────

/**
 * Returns the visual gate state for a feature on a given plan.
 * "available" = full access, "locked" = plan upgrade needed,
 * "upcoming" = feature not yet live for anyone.
 */
export function getGateState(planId: PlanId, feature: FeatureKey): GateState {
  return checkFeatureAccess(planId, feature).gateState;
}
