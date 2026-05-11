/**
 * AfroMuse useAccess Hook
 *
 * Bridge between the existing PlanContext ("Free"/"Pro"/"Gold") and the new
 * feature gate layer. Import this in any component that needs to check access.
 *
 * Usage:
 *   const { canExportWav, canUseProTools, getUpgradeReason } = useAccess();
 */

import { useMemo } from "react";
import { usePlan } from "@/context/PlanContext";
import { resolveServerPlan } from "./plans";
import { checkFeatureAccess, getGateState } from "./featureGate";
import { isFeatureAvailable, getUpgradeReason, getPlanBadgeLabel, getProToolAccessState } from "./utils";
import { readUsage } from "./usage";
import type { FeatureKey, PlanId, GateState, ProToolAccessState } from "./types";

export interface AccessAPI {
  /** Resolved internal plan id ("free" | "pro") */
  planId: PlanId;

  // ── Quick boolean checks ──────────────────────────────────────────────────
  canGenerateInstrumental: boolean;
  canGenerateVocals: boolean;
  canGenerateBlueprint: boolean;
  canExportMp3: boolean;
  canExportWav: boolean;
  canExportStems: boolean;
  canUsePremiumMixFeels: boolean;
  canUseProTools: boolean;
  canUseMixMaster: boolean;
  canUseHitmakerMode: boolean;
  canSaveProjects: boolean;
  canGenerateLeadVocals: boolean;

  // ── Generic helpers ───────────────────────────────────────────────────────
  /** Returns true if the feature is accessible under the current plan */
  isAvailable: (feature: FeatureKey) => boolean;
  /** Returns a human-readable reason the feature is locked, or null if available */
  upgradeReason: (feature: FeatureKey) => string | null;
  /** Returns the visual gate state for a feature ("available" | "locked" | "upcoming") */
  gateState: (feature: FeatureKey) => GateState;
  /** Returns the Pro Tools access state for a feature */
  proToolState: (feature: FeatureKey) => ProToolAccessState;
  /** Returns the short plan badge label e.g. "FREE", "PRO" */
  badgeLabel: string;
  /** True if the user is on any paid plan */
  isPro: boolean;
}

export function useAccess(): AccessAPI {
  const { plan } = usePlan();
  const planId = resolveServerPlan(plan);
  const usage = readUsage();

  return useMemo<AccessAPI>(() => {
    const check = (f: FeatureKey) => checkFeatureAccess(planId, f, usage).allowed;

    return {
      planId,
      canGenerateInstrumental:  check("canGenerateInstrumental"),
      canGenerateVocals:        check("canGenerateVocals"),
      canGenerateBlueprint:     check("canGenerateBlueprint"),
      canExportMp3:             check("canExportMp3"),
      canExportWav:             check("canExportWav"),
      canExportStems:           check("canExportStems"),
      canUsePremiumMixFeels:    check("canUsePremiumMixFeels"),
      canUseProTools:           check("canUseProTools"),
      canUseMixMaster:          check("canUseMixMaster"),
      canUseHitmakerMode:       check("canUseHitmakerMode"),
      canSaveProjects:          check("canSaveProjects"),
      canGenerateLeadVocals:    check("canGenerateLeadVocals"),
      isAvailable:              (f) => isFeatureAvailable(planId, f, usage),
      upgradeReason:            (f) => getUpgradeReason(planId, f, usage),
      gateState:                (f) => getGateState(planId, f),
      proToolState:             (f) => getProToolAccessState(planId, f),
      badgeLabel:               getPlanBadgeLabel(planId),
      isPro:                    planId === "pro",
    };
  }, [planId, usage]);
}
