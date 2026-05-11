/**
 * AfroMuse Backend Access Control — Types
 *
 * Server-side plan and feature types — mirrors the client-side access layer.
 * Keep in sync with artifacts/afromuse-ai/src/lib/access/types.ts.
 */

export type ServerPlanId = "free" | "creator-pro" | "artist-pro";

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

export interface AccessCheckResult {
  allowed: boolean;
  reason: string | null;
  upgradeRequired: boolean;
  requiredPlan?: ServerPlanId;
}
