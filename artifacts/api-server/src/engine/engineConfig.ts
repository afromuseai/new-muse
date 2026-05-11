/**
 * AfroMuse Engine Configuration Layer
 *
 * Defines per-environment defaults for provider modes and safety behavior.
 * This is the single source of truth for what mode each provider runs in
 * across development, staging, and production environments.
 *
 * To activate a live provider:
 *   1. Set its mode to "live" in the environment config below.
 *   2. Ensure its credentials are configured in providerCredentials.ts.
 *   3. Ensure the provider registry status is "live-ready" and isLive is true.
 *   4. Nothing in routes or the UI needs to change.
 *
 * To override a mode at runtime (admin ops / feature flagging):
 *   Use setProviderModeOverride(category, mode) — does not persist across restarts.
 */

import type { ProviderCategory } from "./types.js";

// ─── AI Music API Instrumental Mode Resolution ────────────────────────────────
// Reads AI_MUSIC_API_PROVIDER_MODE (explicit override) and AI_MUSIC_API_ENABLED
// (convenience toggle) to determine the instrumental engine mode at startup.
// If neither is set, defaults to "mock" so existing behaviour is unchanged.

function resolveAiMusicInstrumentalMode(): EngineMode {
  const explicit = (process.env.AI_MUSIC_API_PROVIDER_MODE ?? "").trim().toLowerCase();
  if (explicit === "live" || explicit === "mock" || explicit === "disabled") {
    return explicit as EngineMode;
  }
  const enabled = (process.env.AI_MUSIC_API_ENABLED ?? "").trim().toLowerCase();
  if (enabled === "true" || enabled === "1" || enabled === "yes") return "live";
  // Also activate live mode whenever AI_MUSIC_API_KEY is present.
  if (process.env.AI_MUSIC_API_KEY) return "live";
  return "mock";
}

const AI_MUSIC_INSTRUMENTAL_MODE: EngineMode = resolveAiMusicInstrumentalMode();
const AI_MUSIC_ALLOW_LIVE_IN_DEV: boolean = AI_MUSIC_INSTRUMENTAL_MODE === "live";

// ─── Engine Mode ──────────────────────────────────────────────────────────────

/**
 * The operational mode for a provider:
 *   mock     — AI brief generation only; no real audio API calls
 *   live     — calls the real external audio API (requires credentials + live-ready registry entry)
 *   disabled — completely off; jobs will fail cleanly at dispatch
 */
export type EngineMode = "mock" | "live" | "disabled";

// ─── Engine Environment ───────────────────────────────────────────────────────

export type EngineEnvironment = "development" | "staging" | "production";

// ─── Per-Provider Mode Config ─────────────────────────────────────────────────

export interface ProviderModeConfig {
  /** The operational mode to run this provider in. */
  mode: EngineMode;
  /**
   * Whether to fall back to mock generation if the live provider fails.
   * Recommended: true in development/staging, false in production.
   */
  fallbackToMock: boolean;
}

// ─── Safety Config ────────────────────────────────────────────────────────────

export interface EngineSafetyConfig {
  /**
   * Whether to allow live provider calls in the development environment.
   * Defaults to false — live providers require staging or production.
   */
  allowLiveInDev: boolean;
  /**
   * When true, provider errors are not silently absorbed — they propagate
   * as clean failures to the job system. Recommended for production.
   */
  strictMode: boolean;
}

// ─── Full Environment Config ──────────────────────────────────────────────────

export interface EngineEnvironmentConfig {
  environment: EngineEnvironment;
  providerModes: Record<ProviderCategory, ProviderModeConfig>;
  safety: EngineSafetyConfig;
}

// ─── Environment Definitions ──────────────────────────────────────────────────

const DEVELOPMENT_CONFIG: EngineEnvironmentConfig = {
  environment: "development",
  providerModes: {
    instrumental: { mode: AI_MUSIC_INSTRUMENTAL_MODE, fallbackToMock: true },
    vocal:        { mode: "mock",                     fallbackToMock: true },
    mastering:    { mode: "mock",                     fallbackToMock: true },
    stems:        { mode: "mock",                     fallbackToMock: true },
  },
  safety: {
    allowLiveInDev: AI_MUSIC_ALLOW_LIVE_IN_DEV,
    strictMode: false,
  },
};

const STAGING_CONFIG: EngineEnvironmentConfig = {
  environment: "staging",
  providerModes: {
    instrumental: { mode: AI_MUSIC_INSTRUMENTAL_MODE, fallbackToMock: true },
    vocal:        { mode: "mock",                     fallbackToMock: true },
    mastering:    { mode: "mock",                     fallbackToMock: true },
    stems:        { mode: "mock",                     fallbackToMock: true },
  },
  safety: {
    allowLiveInDev: true,
    strictMode: false,
  },
};

const PRODUCTION_CONFIG: EngineEnvironmentConfig = {
  environment: "production",
  providerModes: {
    instrumental: { mode: AI_MUSIC_INSTRUMENTAL_MODE, fallbackToMock: true },
    vocal:        { mode: "mock",                     fallbackToMock: false },
    mastering:    { mode: "mock",                     fallbackToMock: false },
    stems:        { mode: "mock",                     fallbackToMock: false },
  },
  safety: {
    allowLiveInDev: false,
    strictMode: true,
  },
};

const ENV_CONFIGS: Record<EngineEnvironment, EngineEnvironmentConfig> = {
  development: DEVELOPMENT_CONFIG,
  staging:     STAGING_CONFIG,
  production:  PRODUCTION_CONFIG,
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function getActiveEnvironment(): EngineEnvironment {
  const env = process.env.NODE_ENV ?? "development";
  if (env === "production") return "production";
  if (env === "staging") return "staging";
  return "development";
}

export function getActiveEngineConfig(): EngineEnvironmentConfig {
  return ENV_CONFIGS[getActiveEnvironment()];
}

export function getProviderModeConfig(category: ProviderCategory): ProviderModeConfig {
  return getActiveEngineConfig().providerModes[category];
}

// ─── Runtime Mode Overrides ───────────────────────────────────────────────────
// In-memory overrides for admin operations. These take precedence over env
// config defaults but are cleared on server restart.

const _modeOverrides: Partial<Record<ProviderCategory, EngineMode>> = {};

/** Override the engine mode for a specific provider at runtime. */
export function setProviderModeOverride(category: ProviderCategory, mode: EngineMode): void {
  _modeOverrides[category] = mode;
}

/** Clear a previously set runtime override. */
export function clearProviderModeOverride(category: ProviderCategory): void {
  delete _modeOverrides[category];
}

/** Returns any active runtime override for this category, or undefined if none. */
export function getProviderModeOverride(category: ProviderCategory): EngineMode | undefined {
  return _modeOverrides[category];
}
