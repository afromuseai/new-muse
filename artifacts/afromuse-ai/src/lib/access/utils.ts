/**
 * AfroMuse Access Control — Utilities
 *
 * Clean helper functions for UI code, future backend checks, and any logic
 * that needs to reason about plans and features without touching plan internals.
 */

import { getPlan, getAllPlans } from "./plans";
import { checkFeatureAccess } from "./featureGate";
import type { FeatureKey, GateState, PlanId, ProToolAccessState, UsageState } from "./types";

// ─── isFeatureAvailable ───────────────────────────────────────────────────────

/**
 * Returns true if the given plan has access to the feature (optionally
 * accounting for current usage limits).
 */
export function isFeatureAvailable(
  planId: PlanId,
  feature: FeatureKey,
  usage?: UsageState,
): boolean {
  return checkFeatureAccess(planId, feature, usage).allowed;
}

// ─── getUpgradeReason ─────────────────────────────────────────────────────────

/**
 * Returns a human-readable reason why a feature is locked for the given plan,
 * or null if the feature is available.
 */
export function getUpgradeReason(
  planId: PlanId,
  feature: FeatureKey,
  usage?: UsageState,
): string | null {
  const result = checkFeatureAccess(planId, feature, usage);
  return result.allowed ? null : result.reason;
}

// ─── getPlanBadgeLabel ────────────────────────────────────────────────────────

/**
 * Returns the short badge label for a plan (e.g. "FREE", "PRO").
 */
export function getPlanBadgeLabel(planId: PlanId): string {
  return getPlan(planId).badgeLabel;
}

// ─── getPlanLabel ─────────────────────────────────────────────────────────────

export function getPlanLabel(planId: PlanId): string {
  return getPlan(planId).label;
}

// ─── getProToolAccessState ────────────────────────────────────────────────────

/**
 * Returns the access state for a Pro Tools card — used to render the card
 * in available / locked / upcoming state without redesigning the card.
 */
export function getProToolAccessState(
  planId: PlanId,
  feature: FeatureKey,
): ProToolAccessState {
  const result = checkFeatureAccess(planId, feature);

  if (result.gateState === "upcoming") {
    return { state: "upcoming", label: "In Development", reason: null };
  }

  if (!result.allowed) {
    return {
      state: "locked",
      label: "Pro Only",
      reason: result.reason,
    };
  }

  return { state: "available", label: "Available", reason: null };
}

// ─── getGateBadge ─────────────────────────────────────────────────────────────

/**
 * Returns a short badge string for a given gate state.
 * Used to render inline lock / unlock indicators on cards.
 */
export function getGateBadge(state: GateState): string {
  if (state === "available") return "Included";
  if (state === "upcoming") return "In Development";
  return "Pro";
}

// ─── canUserExport ────────────────────────────────────────────────────────────

/**
 * Convenience: returns whether the user can export in any format.
 */
export function canUserExport(planId: PlanId, usage?: UsageState): boolean {
  return (
    isFeatureAvailable(planId, "canExportMp3", usage) ||
    isFeatureAvailable(planId, "canExportWav", usage) ||
    isFeatureAvailable(planId, "canExportStems", usage)
  );
}

// ─── getNextPlan ──────────────────────────────────────────────────────────────

/**
 * Returns the next plan up from the current one, or null if already on the
 * highest plan. Used for upgrade prompts.
 */
export function getNextPlan(planId: PlanId): PlanId | null {
  const order: PlanId[] = ["free", "pro"];
  const idx = order.indexOf(planId);
  if (idx === -1 || idx === order.length - 1) return null;
  return order[idx + 1];
}

// ─── getFeaturesForPlan ───────────────────────────────────────────────────────

/**
 * Returns all features and their access status for a plan — useful for
 * rendering a plan comparison table.
 */
export function getFeaturesForPlan(
  planId: PlanId,
): Array<{ feature: FeatureKey; allowed: boolean }> {
  const plan = getPlan(planId);
  return (Object.keys(plan.features) as FeatureKey[]).map((feature) => ({
    feature,
    allowed: plan.features[feature],
  }));
}

// ─── getAllPlansInfo ──────────────────────────────────────────────────────────

export { getAllPlans };
