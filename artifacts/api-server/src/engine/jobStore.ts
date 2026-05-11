/**
 * AfroMuse Engine Job Store
 *
 * Centralised in-memory store for the engine job lifecycle.
 * Structured so that a persistent store (Redis, DB) can be swapped in later
 * by replacing only this module.
 */

import { randomUUID } from "crypto";
import type { EngineJob, AudioJobType, ProviderCategory, JobStatus, NormalizedResponse } from "./types.js";

const JOB_TTL_MS = 30 * 60 * 1000; // 30 minutes
const store = new Map<string, EngineJob>();

// Prune expired jobs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of store) {
    if (now - job.createdAt > JOB_TTL_MS) store.delete(id);
  }
}, 5 * 60 * 1000).unref();

export function createEngineJob(type: AudioJobType, provider: ProviderCategory): EngineJob {
  const job: EngineJob = {
    jobId: randomUUID(),
    provider,
    type,
    status: "queued",
    createdAt: Date.now(),
    response: null,
  };
  store.set(job.jobId, job);
  return job;
}

export function getEngineJob(jobId: string): EngineJob | undefined {
  return store.get(jobId);
}

export function advanceJob(jobId: string, status: JobStatus, response?: NormalizedResponse): void {
  const job = store.get(jobId);
  if (!job) return;
  job.status = status;
  if (response !== undefined) job.response = response;
}

export function failJob(jobId: string, message: string): void {
  const job = store.get(jobId);
  if (!job) return;
  job.status = "failed";
  job.response = {
    status: "failed",
    jobId,
    provider: job.provider,
    audioUrl: null,
    wavUrl: null,
    stemsUrl: null,
    blueprintData: null,
    notes: null,
    error: { reason: "failed_generation", message },
    outputRegistry: emptyOutputRegistry(),
  };
}

export function emptyOutputRegistry() {
  return {
    instrumentalPreview: null,
    vocalPreview: null,
    arrangementBlueprint: null,
    masteredMp3: null,
    masteredWav: null,
    stemsZip: null,
  };
}
