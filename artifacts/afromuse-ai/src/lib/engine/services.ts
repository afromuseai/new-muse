/**
 * AfroMuse Client Engine Services
 *
 * Modular request functions for each generation type.
 * All functions return a jobId that can be polled with pollJobResult().
 *
 * To connect a future real-time API (e.g. WebSocket, SSE), only this file
 * needs updating — nothing in the UI layer changes.
 */

import type {
  InstrumentalRequest,
  VocalRequest,
  LeadVocalRequest,
  MasterRequest,
  StemRequest,
  JobDispatchResult,
  NormalizedResponse,
  JobStatus,
} from "./types";

// ─── Shared fetch helper ──────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[${res.status}] ${path}: ${text}`);
  }

  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`[${res.status}] ${path}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// ─── Generation Request Functions ────────────────────────────────────────────

/**
 * Request an instrumental session brief generation job.
 * Resolves immediately with a jobId — poll with pollJobResult().
 */
export async function requestInstrumentalGeneration(
  req: InstrumentalRequest,
): Promise<JobDispatchResult> {
  return post<JobDispatchResult>("/api/generate-instrumental-preview", req);
}

/**
 * Request a vocal demo session brief generation job.
 * Resolves immediately with a jobId — poll with pollJobResult().
 */
export async function requestVocalGeneration(
  req: VocalRequest,
): Promise<JobDispatchResult> {
  return post<JobDispatchResult>("/api/generate-vocal-demo", req);
}

/**
 * Request a lead vocal session brief generation job.
 * Resolves immediately with a jobId — poll with pollJobResult().
 */
export async function requestLeadVocalGeneration(
  req: LeadVocalRequest,
): Promise<JobDispatchResult> {
  return post<JobDispatchResult>("/api/generate-lead-vocals", req);
}

/**
 * Request a mix & master session brief generation job.
 * Resolves immediately with a jobId — poll with pollJobResult().
 */
export async function requestMasterExport(
  req: MasterRequest,
): Promise<JobDispatchResult> {
  return post<JobDispatchResult>("/api/mix-master", req);
}

/**
 * Request a stem extraction brief generation job.
 * Resolves immediately with a jobId — poll with pollJobResult().
 */
export async function requestBlueprintGeneration(
  req: StemRequest,
): Promise<JobDispatchResult> {
  return post<JobDispatchResult>("/api/extract-stems", req);
}

// ─── Job Polling ──────────────────────────────────────────────────────────────

interface RawJobResponse {
  jobId: string;
  status: JobStatus;
  error?: string;
  normalizedResponse?: NormalizedResponse;
  // Legacy fields (still supported)
  audioUrl?: string | null;
  duration?: string | null;
  metadata?: Record<string, unknown> | null;
  sessionData?: Record<string, unknown> | null;
  leadVocalSessionData?: Record<string, unknown> | null;
  mixMasterSessionData?: Record<string, unknown> | null;
  stemExtractionSessionData?: Record<string, unknown> | null;
}

/**
 * Poll a job by ID. Returns the current status and, when complete, the
 * normalized response plus the legacy fields the existing UI reads.
 */
export async function pollJobResult(jobId: string): Promise<RawJobResponse> {
  return get<RawJobResponse>(`/api/audio-job/${jobId}`);
}

/**
 * Wait for a job to reach a terminal status (completed or failed).
 * Polls at the given interval (default 1.5 s) until done or timeout.
 */
export async function awaitJob(
  jobId: string,
  options: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<RawJobResponse> {
  const { intervalMs = 1500, timeoutMs = 120_000 } = options;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await pollJobResult(jobId);
    if (result.status === "completed" || result.status === "failed") return result;
    await new Promise<void>((r) => setTimeout(r, intervalMs));
  }

  throw new Error(`Job ${jobId} timed out after ${timeoutMs}ms`);
}
