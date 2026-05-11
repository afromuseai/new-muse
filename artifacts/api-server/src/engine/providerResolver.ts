/**
 * AfroMuse Provider Resolver
 *
 * Determines the effective engine mode for a given provider request based on:
 *   1. Any active runtime override (set via setProviderModeOverride)
 *   2. The environment config default mode for this category
 *   3. The provider registry status (disabled state always wins)
 *   4. Safety guards (e.g. live mode blocked in development unless explicitly permitted)
 *
 * The resolver is the single decision point for "what should this provider do?"
 * Nothing in routes or providers should make this decision independently.
 *
 * Future live provider activation checklist (per category):
 *   [ ] Set registry status → "live-ready", isLive → true (registry.ts)
 *   [ ] Set environment config mode → "live" (engineConfig.ts)
 *   [ ] Configure credential env vars (providerCredentials.ts)
 *   [ ] Implement the live run() logic in the provider module
 *   [ ] The resolver will automatically enable it — nothing else changes
 */

import type { ProviderCategory } from "./types.js";
import type { EngineMode } from "./engineConfig.js";
import {
  getActiveEngineConfig,
  getProviderModeConfig,
  getProviderModeOverride,
} from "./engineConfig.js";
import { getProvider, isProviderActive } from "./providers/registry.js";
import { isCredentialReady } from "./providerCredentials.js";

// ─── Resolved Provider Mode ───────────────────────────────────────────────────

export interface ResolvedProviderMode {
  category: ProviderCategory;
  /** The effective mode this provider will run in. */
  resolvedMode: EngineMode;
  /** Where this decision came from. */
  source: "runtime-override" | "env-config" | "registry-forced-disabled" | "safety-guard";
  /** Whether the registry marks this provider as live-capable. */
  isLiveCapable: boolean;
  /** Whether the required API credentials are populated. */
  credentialsReady: boolean;
  /** Whether this provider can accept and run a job right now. */
  canRun: boolean;
  /** If canRun is false, the human-readable reason why. */
  disabledReason: string | null;
}

// ─── Core Resolver ────────────────────────────────────────────────────────────

/**
 * Resolves the effective engine mode for a provider category.
 *
 * @param category        The provider to resolve (instrumental | vocal | mastering | stems)
 * @param requestedMode   Optional caller-specified override (e.g. from an admin action)
 */
export function resolveProviderMode(
  category: ProviderCategory,
  requestedMode?: EngineMode,
): ResolvedProviderMode {
  const registryEntry  = getProvider(category);
  const envModeConfig  = getProviderModeConfig(category);
  const runtimeOverride = getProviderModeOverride(category);
  const engineConfig   = getActiveEngineConfig();

  // ── Step 1: Determine initial mode and source ───────────────────────────────
  let resolvedMode: EngineMode;
  let source: ResolvedProviderMode["source"];

  if (requestedMode !== undefined) {
    resolvedMode = requestedMode;
    source = "runtime-override";
  } else if (runtimeOverride !== undefined) {
    resolvedMode = runtimeOverride;
    source = "runtime-override";
  } else {
    resolvedMode = envModeConfig.mode;
    source = "env-config";
  }

  // ── Step 2: Registry disabled always wins ───────────────────────────────────
  if (registryEntry.status === "disabled") {
    resolvedMode = "disabled";
    source = "registry-forced-disabled";
  }

  // ── Step 3: Safety guard — block live mode in development ───────────────────
  if (
    resolvedMode === "live" &&
    engineConfig.environment === "development" &&
    !engineConfig.safety.allowLiveInDev
  ) {
    resolvedMode = "mock";
    source = "safety-guard";
  }

  // ── Step 4: Determine capability and runnability ────────────────────────────
  const isLiveCapable   = isProviderActive(category);
  const credentialsReady = isCredentialReady(category);

  let canRun = true;
  let disabledReason: string | null = null;

  if (resolvedMode === "disabled") {
    canRun = false;
    disabledReason = `Provider '${category}' is disabled`;
  } else if (resolvedMode === "live" && !isLiveCapable) {
    canRun = false;
    disabledReason =
      `Provider '${category}' is set to live but registry status is not 'live-ready'. ` +
      `Set registry status → "live-ready" and isLive → true to activate.`;
  } else if (resolvedMode === "live" && !credentialsReady) {
    canRun = false;
    disabledReason =
      `Provider '${category}' is set to live but API credentials are not configured. ` +
      `Set the required env vars (${category.toUpperCase()}_API_KEY, ${category.toUpperCase()}_API_ENDPOINT).`;
  }

  return {
    category,
    resolvedMode,
    source,
    isLiveCapable,
    credentialsReady,
    canRun,
    disabledReason,
  };
}

// ─── Bulk Resolver ────────────────────────────────────────────────────────────

/** Resolves all four provider categories at once. Useful for diagnostics. */
export function resolveAllProviders(): Record<ProviderCategory, ResolvedProviderMode> {
  const categories: ProviderCategory[] = ["instrumental", "vocal", "mastering", "stems"];
  return Object.fromEntries(
    categories.map((cat) => [cat, resolveProviderMode(cat)]),
  ) as Record<ProviderCategory, ResolvedProviderMode>;
}
