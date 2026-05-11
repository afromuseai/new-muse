/**
 * AfroMuse Engine Diagnostics
 *
 * Provides a complete internal snapshot of the engine's operational state.
 * Designed for admin readiness, internal tooling, and debug inspection.
 *
 * What it exposes:
 *   - Current environment (development / staging / production)
 *   - Per-provider resolved modes and their sources
 *   - Provider registry statuses and live-capability flags
 *   - Credential readiness (without leaking actual values)
 *   - Capability profiles for each provider
 *   - Fallback configuration
 *   - Overall engine mode classification
 *   - Safety settings in effect
 *
 * This module is READ-ONLY — it observes and reports, never mutates.
 * Expose via GET /engine/diagnostics for internal / admin use only.
 * Do NOT expose this endpoint publicly in production without auth gating.
 */

import type { ProviderCategory } from "./types.js";
import type { EngineMode, EngineEnvironmentConfig } from "./engineConfig.js";
import { getActiveEngineConfig, getActiveEnvironment } from "./engineConfig.js";
import { resolveAllProviders, type ResolvedProviderMode } from "./providerResolver.js";
import { getProvider } from "./providers/registry.js";
import { getCredentialSummary } from "./providerCredentials.js";
import { getCapabilities } from "./capabilities.js";

// ─── Diagnostic Shapes ────────────────────────────────────────────────────────

export interface ProviderDiagnostic {
  category: ProviderCategory;
  /** Operational status from the provider registry. */
  registryStatus: string;
  /** Whether the registry marks this provider ready for live calls. */
  isLiveCapable: boolean;
  /** The effective mode this provider is currently running in. */
  resolvedMode: EngineMode;
  /** Where the resolved mode decision came from. */
  modeSource: string;
  /** Credential slot summary (no actual secret values). */
  credentials: ReturnType<typeof getCredentialSummary>;
  /** Whether the provider can currently accept and process jobs. */
  canRun: boolean;
  /** If canRun is false, the human-readable reason. */
  disabledReason: string | null;
  /** Whether mock fallback is enabled if this provider's live call fails. */
  fallbackToMock: boolean;
  /** Full capability profile for this provider. */
  capabilities: ReturnType<typeof getCapabilities>;
}

export interface EngineDiagnostics {
  /** ISO 8601 timestamp of when this snapshot was taken. */
  timestamp: string;
  /** Active environment (development | staging | production). */
  environment: string;
  /**
   * High-level engine mode classification:
   *   all-mock         — all providers are running in mock mode
   *   partial-live     — some providers are live, some are mock or disabled
   *   all-live         — all active (non-disabled) providers are running live
   *   all-disabled     — every provider is disabled
   */
  engineMode: "all-mock" | "partial-live" | "all-live" | "all-disabled";
  /** Whether any provider has mock fallback enabled. */
  anyFallbackEnabled: boolean;
  /** Per-provider diagnostic detail. */
  providers: ProviderDiagnostic[];
  /** Active safety settings from the engine config. */
  safety: EngineEnvironmentConfig["safety"];
  /** Capability summary across all providers. */
  capabilitySummary: {
    anyLiveCapable: boolean;
    anyCredentialsReady: boolean;
    totalProviders: number;
    mockCount: number;
    liveCount: number;
    disabledCount: number;
  };
}

// ─── Diagnostics Builder ──────────────────────────────────────────────────────

export function getEngineDiagnostics(): EngineDiagnostics {
  const config      = getActiveEngineConfig();
  const environment = getActiveEnvironment();
  const resolved    = resolveAllProviders();

  const categories: ProviderCategory[] = ["instrumental", "vocal", "mastering", "stems"];

  // Build per-provider diagnostic entries
  const providers: ProviderDiagnostic[] = categories.map((category) => {
    const res: ResolvedProviderMode = resolved[category];
    const reg = getProvider(category);
    const modeConfig = config.providerModes[category];

    return {
      category,
      registryStatus:   reg.status,
      isLiveCapable:    res.isLiveCapable,
      resolvedMode:     res.resolvedMode,
      modeSource:       res.source,
      credentials:      getCredentialSummary(category),
      canRun:           res.canRun,
      disabledReason:   res.disabledReason,
      fallbackToMock:   modeConfig.fallbackToMock,
      capabilities:     getCapabilities(category),
    };
  });

  // Aggregate counts
  const mockCount     = providers.filter((p) => p.resolvedMode === "mock").length;
  const liveCount     = providers.filter((p) => p.resolvedMode === "live").length;
  const disabledCount = providers.filter((p) => p.resolvedMode === "disabled").length;
  const anyFallbackEnabled = categories.some((c) => config.providerModes[c].fallbackToMock);

  // Classify overall engine mode
  let engineMode: EngineDiagnostics["engineMode"];
  if (disabledCount === categories.length) {
    engineMode = "all-disabled";
  } else if (liveCount === 0) {
    engineMode = "all-mock";
  } else if (liveCount === categories.length - disabledCount) {
    engineMode = "all-live";
  } else {
    engineMode = "partial-live";
  }

  return {
    timestamp:   new Date().toISOString(),
    environment,
    engineMode,
    anyFallbackEnabled,
    providers,
    safety: config.safety,
    capabilitySummary: {
      anyLiveCapable:      providers.some((p) => p.isLiveCapable),
      anyCredentialsReady: providers.some((p) => p.credentials.apiKeySet && p.credentials.endpointSet),
      totalProviders:      categories.length,
      mockCount,
      liveCount,
      disabledCount,
    },
  };
}
