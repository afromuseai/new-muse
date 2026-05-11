/**
 * AfroMuse Audio Routes
 *
 * All generation logic lives in src/engine/providers/*.
 * Routes here are thin: create job → dispatch to provider → return jobId.
 * The polling endpoint (/audio-job/:jobId) serves the normalized response
 * and maps it back to the legacy shape so existing UI clients continue to work.
 */

import { Router } from "express";
import { logger } from "../lib/logger.js";

// Engine layer
import { createEngineJob, getEngineJob, advanceJob, failJob } from "../engine/jobStore.js";
import { run as runInstrumental, type InstrumentalPayload } from "../engine/providers/instrumental.js";
import { runVocalDemo, runLeadVocal, type VocalDemoPayload, type LeadVocalPayload } from "../engine/providers/vocal.js";
import { run as runMastering, type MasteringPayload } from "../engine/providers/mastering.js";
import { run as runStems, type StemExtractionPayload } from "../engine/providers/stems.js";
import { listProviders, isProviderActive } from "../engine/providers/registry.js";
import {
  canProviderHandleBuildMode,
  canProviderHandleCustomLyrics,
  canProviderHandleStems,
  canProviderHandleMasteredExport,
} from "../engine/compatibility.js";
import { getEngineDiagnostics } from "../engine/diagnostics.js";

// Re-export legacy types so any downstream code that imports them continues to work
export type { InstrumentalPayload };
export type {
  AiSessionData,
  LeadVocalSessionData,
  MixMasterSessionData,
  StemExtractionSessionData,
  StemTrackData,
  InstrumentalMetadata,
  VocalMetadata,
} from "./generate-audio.legacy-types.js";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dispatch(
  jobId: string,
  runner: () => Promise<import("../engine/types.js").NormalizedResponse>,
  errorMessage: string,
): void {
  advanceJob(jobId, "processing");
  runner()
    .then((response) => advanceJob(jobId, "completed", response))
    .catch((err) => {
      logger.error({ err, jobId }, errorMessage);
      failJob(jobId, errorMessage);
    });
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post("/generate-instrumental-preview", (req, res) => {
  const payload = req.body as InstrumentalPayload;
  const job = createEngineJob("instrumental", "instrumental");

  dispatch(job.jobId, () => runInstrumental(job.jobId, payload), "Instrumental generation failed");

  const secs = payload.lyricsSections ?? {};
  logger.info({
    jobId: job.jobId,
    genre: payload.genre,
    mood: payload.mood,
    bounceStyle: payload.bounceStyle,
    melodyDensity: payload.melodyDensity,
    drumCharacter: payload.drumCharacter,
    hookLift: payload.hookLift,
    buildMode: payload.buildMode,
    hasLyricsSections: !!(payload.lyricsSections),
    hookLines: secs.hook?.length ?? 0,
    verse1Lines: secs.verse1?.length ?? 0,
    lyricsTextLength: payload.lyricsText?.length ?? 0,
  }, "Instrumental job created — payload summary");
  res.json({ success: true, jobId: job.jobId, status: "queued" });
});

router.post("/generate-vocal-demo", (req, res) => {
  const payload = req.body as VocalDemoPayload;
  const job = createEngineJob("vocal", "vocal");

  dispatch(job.jobId, () => runVocalDemo(job.jobId, payload), "Vocal demo generation failed");

  logger.info({ jobId: job.jobId, genre: payload.genre, mood: payload.mood }, "Vocal demo job created");
  res.json({ success: true, jobId: job.jobId, status: "queued" });
});

router.post("/generate-lead-vocals", (req, res) => {
  const payload = req.body as LeadVocalPayload;

  if (!canProviderHandleCustomLyrics("vocal")) {
    res.status(400).json({ error: "Vocal provider does not support custom lyrics in this mode" });
    return;
  }

  if (payload.buildMode && !canProviderHandleBuildMode("vocal", payload.buildMode)) {
    res.status(400).json({ error: `Vocal provider does not support build mode: ${payload.buildMode}` });
    return;
  }

  const job = createEngineJob("lead-vocal", "vocal");

  dispatch(job.jobId, () => runLeadVocal(job.jobId, payload), "Lead vocal generation failed");

  logger.info({ jobId: job.jobId, gender: payload.gender, feel: payload.performanceFeel }, "Lead vocal job created");
  res.json({ success: true, jobId: job.jobId, status: "queued" });
});

router.post("/mix-master", (req, res) => {
  const payload = req.body as MasteringPayload;

  if (!canProviderHandleMasteredExport("mastering")) {
    res.status(400).json({ error: "Mastering provider is not available for this operation" });
    return;
  }

  const job = createEngineJob("mix-master", "mastering");

  dispatch(job.jobId, () => runMastering(job.jobId, payload), "Mix master generation failed");

  logger.info({ jobId: job.jobId, feel: payload.mixFeel, genre: payload.genre }, "Mix master job created");
  res.json({ success: true, jobId: job.jobId, status: "queued" });
});

router.post("/extract-stems", (req, res) => {
  const payload = req.body as StemExtractionPayload;

  if (!canProviderHandleStems("stems")) {
    res.status(400).json({ error: "Stems provider is not available for this operation" });
    return;
  }

  const job = createEngineJob("stem-extraction", "stems");

  dispatch(job.jobId, () => runStems(job.jobId, payload), "Stem extraction failed");

  logger.info({ jobId: job.jobId, stems: payload.stems, genre: payload.genre }, "Stem extraction job created");
  res.json({ success: true, jobId: job.jobId, status: "queued" });
});

// ─── Job Status Polling ───────────────────────────────────────────────────────

router.get("/audio-job/:jobId", (req, res) => {
  // Always send fresh data — never let a proxy or browser cache a 304
  res.setHeader("Cache-Control", "no-store");

  const job = getEngineJob(req.params.jobId);

  if (!job) {
    res.status(404).json({ error: "Job not found or expired" });
    return;
  }

  if (job.status === "queued" || job.status === "processing") {
    res.json({ jobId: job.jobId, status: job.status });
    return;
  }

  if (job.status === "failed") {
    res.json({
      jobId: job.jobId,
      status: "failed",
      error: job.response?.error?.message ?? "Unknown error",
    });
    return;
  }

  // Completed — serve normalized response mapped to the legacy UI contract
  const r = job.response!;
  const bp = r.blueprintData ?? {};

  // Derive live/fallback flags from the normalized response.
  // Any non-empty audioUrl (data: URL from ElevenLabs, or a public path from
  // the mock fallback) is considered playable / live from the UI's perspective.
  // fallback.ts annotates notes as "[Mock fallback] ..." — check for that prefix
  // to surface the "fallback" badge in the UI.
  const isFallback = r.notes?.includes("[Mock fallback]") ?? false;
  const isLive = typeof r.audioUrl === "string" && r.audioUrl.length > 0;

  res.json({
    jobId: job.jobId,
    status: "completed",

    // Engine trust signals — consumed by the UI to distinguish live vs mock
    isLive,
    isFallback,
    provider: r.provider,

    // Legacy fields the UI currently reads
    audioUrl: r.audioUrl,
    duration: bp.duration ?? null,
    metadata: bp.audioType ? {
      genre: bp.genre,
      mood: bp.mood,
      bpm: bp.bpm,
      key: bp.key,
      energy: bp.energy,
      duration: bp.duration,
      hitmakerMode: bp.hitmakerMode,
      hookRepeatLevel: bp.hookRepeatLevel,
      audioType: bp.audioType,
      vocalStyle: bp.vocalStyle,
    } : null,
    sessionData: bp.beatSummary ? {
      beatSummary: bp.beatSummary,
      arrangementMap: bp.arrangementMap,
      producerNotes: bp.producerNotes,
      hookFocus: bp.hookFocus,
      arrangementStyle: bp.arrangementStyle,
      sonicIdentity: bp.sonicIdentity,
      sessionBrief: bp.sessionBrief,
    } : null,
    leadVocalSessionData: bp.vocalBrief ? {
      vocalBrief: bp.vocalBrief,
      phrasingGuide: bp.phrasingGuide,
      emotionalArc: bp.emotionalArc,
      syncNotes: bp.syncNotes,
      performanceDirection: bp.performanceDirection,
      deliveryStyle: bp.deliveryStyle,
      vocalProcessingNotes: bp.vocalProcessingNotes,
      voiceMetadata: bp.voiceMetadata ?? null,
      adLibSuggestions: bp.adLibSuggestions ?? null,
    } : null,
    mixMasterSessionData: bp.mixBrief ? {
      mixBrief: bp.mixBrief,
      levelBalancing: bp.levelBalancing,
      eqNotes: bp.eqNotes,
      compressionNotes: bp.compressionNotes,
      spatialEffects: bp.spatialEffects,
      masteringChain: bp.masteringChain,
      outputNotes: bp.outputNotes,
      stemsNotes: bp.stemsNotes ?? null,
    } : null,
    stemExtractionSessionData: bp.extractionBrief ? {
      extractionBrief: bp.extractionBrief,
      stems: bp.stems ?? [],
      phaseAlignmentNotes: bp.phaseAlignmentNotes,
      dawImportGuide: bp.dawImportGuide,
      recommendedTool: bp.recommendedTool,
    } : null,

    // New normalized fields
    normalizedResponse: r,
  });
});

// ─── Provider Info & Engine Status ───────────────────────────────────────────

/**
 * GET /download-audio
 * Proxies an external audio file through the server so the browser can
 * trigger a proper file download regardless of cross-origin restrictions.
 *
 * Query params:
 *   url      — the external audio URL to fetch (must be an aimusicapi.org URL)
 *   filename — the suggested filename for the download (e.g. "afrobeats_beat.mp3")
 */
router.get("/download-audio", async (req, res) => {
  const { url, filename } = req.query as Record<string, string>;

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "url query parameter is required" });
    return;
  }

  // Safety: only allow proxying aimusicapi.org CDN and similar trusted audio hosts
  const allowedHosts = ["aimusicapi.org", "cdn.aimusicapi.org", "suno.ai", "cdn.suno.ai"];
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  const isAllowed = allowedHosts.some((h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith(`.${h}`));
  if (!isAllowed) {
    res.status(403).json({ error: "URL host not allowed for proxy download" });
    return;
  }

  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!upstream.ok) {
      res.status(502).json({ error: `Upstream responded with ${upstream.status}` });
      return;
    }

    const contentType = upstream.headers.get("content-type") ?? "audio/mpeg";
    const safeFilename = (filename ?? "generated_track.mp3").replace(/[^a-zA-Z0-9._\-]/g, "_");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
    res.setHeader("Cache-Control", "no-store");

    const buffer = await upstream.arrayBuffer();
    res.end(Buffer.from(buffer));
  } catch (err) {
    logger.warn({ err, url }, "Audio proxy download failed");
    res.status(502).json({ error: "Failed to fetch audio from upstream" });
  }
});

/**
 * GET /engine/providers
 * Returns all provider configs, capability profiles, and live-activation state.
 * Useful for admin tooling, feature flags, and future provider management UI.
 */
router.get("/engine/providers", (_req, res) => {
  const providers = listProviders();
  const anyLive = providers.some((p) => isProviderActive(p.category));
  res.json({
    providers,
    engineMode: anyLive ? "partial-live" : "mock",
  });
});

/**
 * GET /engine/diagnostics
 * Full internal engine state snapshot for admin readiness and debug inspection.
 *
 * Returns:
 *   - Current environment
 *   - Resolved mode per provider (and the source of that decision)
 *   - Provider registry statuses and live-capability flags
 *   - Credential slot readiness (no actual secret values exposed)
 *   - Provider capability profiles
 *   - Fallback configuration
 *   - Overall engine mode classification
 *   - Active safety settings
 *
 * NOTE: This endpoint is for internal / admin use only.
 * In production, protect this route with auth middleware before exposing it.
 */
router.get("/engine/diagnostics", (_req, res) => {
  const diagnostics = getEngineDiagnostics();
  res.json(diagnostics);
});

export default router;
