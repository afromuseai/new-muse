/**
 * AfroMuse Provider Fallback Layer
 *
 * Defines clean, structured fallback behavior for when a provider fails.
 * The system supports two patterns per provider, controlled by the environment config:
 *
 *   1. "fail cleanly"      — return a normalized failure response with a structured error.
 *                            No silent swallowing. Recommended for production.
 *
 *   2. "fall back to mock" — if the live provider fails, attempt the mock runner instead.
 *                            Recommended for development / staging.
 *
 * This module does NOT make the decision — that comes from the environment config
 * (fallbackToMock flag). It only executes the chosen strategy and returns a
 * normalized FallbackResult that the caller can use to complete the job.
 *
 * DO NOT surface fake failures in the UI — the fallback result slots cleanly
 * into the existing NormalizedResponse shape so the UI flow is unaffected.
 */

import type { ProviderCategory, NormalizedResponse, ProviderFailureReason } from "./types.js";
import { getProviderModeConfig } from "./engineConfig.js";
import { emptyOutputRegistry } from "./jobStore.js";
import { logger } from "../lib/logger.js";

// ─── Fallback Result ──────────────────────────────────────────────────────────

export interface FallbackResult {
  /** Whether the mock runner was used as a fallback. */
  usedFallback: boolean;
  /** Human-readable summary of what happened (for logging and diagnostics). */
  reason: string;
  /** The normalized response to commit to the job store. */
  response: NormalizedResponse;
}

// ─── Clean Failure Builder ────────────────────────────────────────────────────

/**
 * Builds a normalized failure response.
 * Use this to cleanly terminate a job when no fallback is available or configured.
 * The response fits the NormalizedResponse shape — the UI handles it gracefully.
 */
export function buildFailureResponse(
  jobId: string,
  category: ProviderCategory,
  reason: ProviderFailureReason,
  message: string,
): NormalizedResponse {
  return {
    status: "failed",
    jobId,
    provider: category,
    audioUrl: null,
    wavUrl: null,
    stemsUrl: null,
    blueprintData: null,
    notes: null,
    error: { reason, message },
    outputRegistry: emptyOutputRegistry(),
  };
}

// ─── Fallback Executor ────────────────────────────────────────────────────────

/**
 * Called when a live provider has failed.
 * Reads the fallback config for the category and either:
 *   a) Runs the mock runner as a fallback and returns its response, or
 *   b) Returns a clean normalized failure.
 *
 * @param jobId          The job being processed
 * @param category       The provider category that failed
 * @param originalError  The error thrown by the live provider
 * @param mockRunner     A function that runs the mock version of this provider
 */
export async function executeFallback(
  jobId: string,
  category: ProviderCategory,
  originalError: unknown,
  mockRunner: () => Promise<NormalizedResponse>,
): Promise<FallbackResult> {
  const modeConfig = getProviderModeConfig(category);
  const errMessage = originalError instanceof Error
    ? originalError.message
    : String(originalError);

  logger.warn(
    { jobId, category, errMessage },
    "Live provider failed — evaluating fallback strategy",
  );

  // ── Strategy A: Fall back to mock ─────────────────────────────────────────
  if (modeConfig.fallbackToMock) {
    logger.info({ jobId, category }, "Fallback strategy: mock provider");
    try {
      const mockResponse = await mockRunner();
      logger.info({ jobId, category }, "Mock fallback succeeded");
      return {
        usedFallback: true,
        reason: `Live provider failed (${errMessage}). Fell back to mock provider.`,
        response: {
          ...mockResponse,
          // Annotate the notes field so diagnostics can see a fallback occurred
          notes: mockResponse.notes
            ? `[Mock fallback] ${mockResponse.notes}`
            : "[Mock fallback active]",
        },
      };
    } catch (mockErr) {
      const mockErrMessage = mockErr instanceof Error ? mockErr.message : String(mockErr);
      logger.error({ jobId, category, mockErrMessage }, "Mock fallback also failed");
      return {
        usedFallback: false,
        reason: `Both live and mock providers failed. Live error: ${errMessage}. Mock error: ${mockErrMessage}`,
        response: buildFailureResponse(jobId, category, "failed_generation", mockErrMessage),
      };
    }
  }

  // ── Strategy B: Fail cleanly ──────────────────────────────────────────────
  logger.warn(
    { jobId, category },
    "Fallback strategy: clean failure (fallbackToMock is false for this environment)",
  );
  return {
    usedFallback: false,
    reason: `Live provider failed. Fallback not configured for '${category}' in this environment.`,
    response: buildFailureResponse(jobId, category, "failed_generation", errMessage),
  };
}
