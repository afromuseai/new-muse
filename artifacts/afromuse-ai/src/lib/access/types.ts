/**
 * AfroMuse Access Control — Core Types
 *
 * Defines the plan model, feature keys, and access shapes used across
 * the entire access layer. Keep this the source of truth for any plan-
 * or feature-related type reference.
 */

// ─── Plans ────────────────────────────────────────────────────────────────────

export type PlanId = "free" | "creator-pro" | "artist-pro";

export interface Plan {
  id: PlanId;
  label: string;
  badgeLabel: string;
  description: string;
  features: FeatureAccessMap;
  limits: UsageLimits;
}

// ─── Feature Keys ─────────────────────────────────────────────────────────────

export type FeatureKey =
  | "canGenerateInstrumental"
  | "canGenerateVocals"
  | "canGenerateBlueprint"
  | "canExportMp3"
  | "canExportWav"
  | "canExportStems"
  | "canUsePremiumMixFeels"
  | "canUseProTools"
  | "canSaveProjects"
  | "canGenerateLeadVocals"
  | "canUseMixMaster"
  | "canUseHitmakerMode"
  | "canRewriteLyrics"
  | "canUseLyricalDepth"
  | "canUseHookRepeat"
  | "canUseGenderVoice"
  | "canUsePerformanceFeel"
  | "canUseVoiceClone"
  | "canUseArtistDna"
  | "canUsePersistentMemory"
  | "canUseAdvancedDemos";

export type FeatureAccessMap = Record<FeatureKey, boolean>;

// ─── Usage Limits ─────────────────────────────────────────────────────────────

export interface UsageLimits {
  /** Max session builds per day. null = unlimited */
  sessionsPerDay: number | null;
  /** Max instrumental generations per day. null = unlimited */
  instrumentalGenerationsPerDay: number | null;
  /** Max vocal generations per day. null = unlimited */
  vocalGenerationsPerDay: number | null;
  /** Max exports per day. null = unlimited */
  exportsPerDay: number | null;
  /** Max lyric rewrites per day. null = unlimited */
  rewritesPerDay: number | null;
}

// ─── Usage State ──────────────────────────────────────────────────────────────

export interface UsageState {
  sessionsBuiltToday: number;
  instrumentalGenerationsUsed: number;
  vocalGenerationsUsed: number;
  exportsUsed: number;
  rewritesUsed: number;
  /** ISO date string of when usage counters were last reset */
  lastResetDate: string;
}

// ─── Access Check Result ──────────────────────────────────────────────────────

export type GateState = "available" | "locked" | "upcoming";

export interface AccessCheckResult {
  allowed: boolean;
  gateState: GateState;
  reason: string | null;
  upgradeRequired: boolean;
  requiredPlan?: PlanId;
}

// ─── Pro Tool Card State ──────────────────────────────────────────────────────

export interface ProToolAccessState {
  state: GateState;
  label: string;
  reason: string | null;
}
