/**
 * AfroMuse Access Control — Public API
 *
 * Single import point for the access layer.
 *
 * Usage:
 *   import { useAccess } from "@/lib/access";
 *   import { checkFeatureAccess, isFeatureAvailable } from "@/lib/access";
 */

export * from "./types";
export * from "./plans";
export * from "./featureGate";
export * from "./usage";
export * from "./utils";
export { useAccess } from "./useAccess";
export type { AccessAPI } from "./useAccess";
