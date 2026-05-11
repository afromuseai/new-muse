/**
 * /api/voice-clone — Personal Voice Clone Singing Engine
 *
 * Accepts the user's 30-second voice recording (base64) as the SOLE reference.
 * Uses NVIDIA AI to generate a complete singing engine session directive
 * describing exactly how to perform the given lyrics in the user's own voice.
 *
 * POST /api/voice-clone/sing  — Create a singing session job
 * GET  /api/voice-clone/job/:jobId — Poll job status + result
 * GET  /api/voice-clone/status — Feature availability
 */

import { Router } from "express";
import { requireAuth, attachPlanFromDb } from "../access/middleware.js";
import { logger } from "../lib/logger.js";
import { createEngineJob, getEngineJob, advanceJob, failJob } from "../engine/jobStore.js";
import { runVoiceCloneSing, type VoiceClonePayload } from "../engine/providers/vocal.js";
import { getAudioBuffer } from "../engine/audioBufferStore.js";

const router = Router();

// ─── Helper: fire-and-forget job dispatch ─────────────────────────────────────

function dispatch(
  jobId: string,
  runner: () => Promise<import("../engine/types.js").NormalizedResponse>,
  errorMessage: string,
): void {
  advanceJob(jobId, "processing");
  runner()
    .then((response) => advanceJob(jobId, "completed", response))
    .catch((err: unknown) => {
      logger.error({ err, jobId }, errorMessage);
      failJob(jobId, errorMessage);
    });
}

// ─── POST /api/voice-clone/sing ───────────────────────────────────────────────

router.post(
  "/voice-clone/sing",
  requireAuth,
  attachPlanFromDb,
  (req, res) => {
    const body = req.body as {
      voiceSampleBase64?: string;
      lyrics?: string;
      instrumentalUrl?: string;
      genre?: string;
      bpm?: number;
      key?: string;
      performanceFeel?: string;
      dialectDepth?: string;
      voiceTexture?: string;
      hitmakerMode?: boolean;
      keeperLines?: string;
      recordingDuration?: number;
    };

    if (!body.voiceSampleBase64) {
      res.status(400).json({ error: "voiceSampleBase64 is required — please record your voice first." });
      return;
    }

    const payload: VoiceClonePayload = {
      lyrics:             body.lyrics,
      instrumentalUrl:    body.instrumentalUrl,
      genre:              body.genre ?? "Afrobeats",
      bpm:                body.bpm,
      key:                body.key,
      performanceFeel:    body.performanceFeel ?? "Smooth",
      dialectDepth:       body.dialectDepth   ?? "Medium",
      voiceTexture:       body.voiceTexture   ?? "Warm",
      hitmakerMode:       body.hitmakerMode   ?? false,
      keeperLines:        body.keeperLines,
      recordingDuration:  body.recordingDuration ?? 30,
      voiceSampleBase64:  body.voiceSampleBase64,
    };

    const job = createEngineJob("voice-clone-sing", "vocal");

    dispatch(
      job.jobId,
      () => runVoiceCloneSing(job.jobId, payload),
      "Voice clone singing brief generation failed",
    );

    logger.info(
      { jobId: job.jobId, feel: payload.performanceFeel, genre: payload.genre, hitmaker: payload.hitmakerMode },
      "Voice clone singing job created",
    );

    res.json({ success: true, jobId: job.jobId, status: "queued" });
  },
);

// ─── GET /api/voice-clone/job/:jobId ─────────────────────────────────────────

router.get("/voice-clone/job/:jobId", requireAuth, (req, res) => {
  const job = getEngineJob(String(req.params.jobId));

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

  const bp = job.response?.blueprintData ?? {};

  res.json({
    jobId: job.jobId,
    status: "completed",
    audioUrl: job.response?.audioUrl ?? null,
    voiceCloneSingData: bp.singingBrief ? {
      singingBrief:              bp.singingBrief,
      voiceAnalysis:             bp.voiceAnalysis,
      singingDirection:          bp.singingDirection,
      performanceNotes:          bp.performanceNotes,
      voiceCloneProcessingChain: bp.voiceCloneProcessingChain,
      stemConfig:                bp.stemConfig,
      adLibSuggestions:          bp.adLibSuggestions ?? [],
      voiceCloneMetadata:        bp.voiceCloneMetadata ?? null,
    } : null,
  });
});

// ─── GET /api/voice-clone/audio/:jobId ───────────────────────────────────────
// Streams the generated MP3 audio buffer back to the frontend AudioPlayer.
// The buffer is stored in-memory by the vocal provider after ElevenLabs TTS.
// Expires after 30 minutes (same TTL as the job store).

router.get("/voice-clone/audio/:jobId", requireAuth, (req, res) => {
  const jobId = String(req.params.jobId);
  const entry = getAudioBuffer(jobId);

  if (!entry) {
    res.status(404).json({ error: "Audio not found or expired — regenerate the demo to get a fresh link." });
    return;
  }

  res.set({
    "Content-Type": entry.contentType,
    "Content-Length": String(entry.buffer.byteLength),
    "Cache-Control": "private, max-age=1800",
    "Accept-Ranges": "bytes",
  });

  res.send(entry.buffer);
});

// ─── GET /api/voice-clone/status ─────────────────────────────────────────────

router.get("/voice-clone/status", requireAuth, (_req, res) => {
  res.json({
    available: true,
    status: "active",
    mode: "ai-brief",
    audioEnabled: false,
    message: "Voice Clone Singing Engine is active (AI brief mode). A vocal synthesis provider will be added in a future update.",
  });
});

export default router;
