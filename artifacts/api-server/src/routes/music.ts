import { Router } from "express";
import crypto from "crypto";
import { buildPrompt } from "../lib/promptEngine";
import { getAllowedModels } from "../lib/planGuard";

const router = Router();

// ======================
// JOB STORAGE (SIMPLE + SAFE)
// ======================
const jobStore = new Map<
  string,
  {
    status: "processing" | "complete" | "failed";
    tracks: { audioUrl: string }[];
  }
>();

// ======================
// 1. GENERATE MUSIC
// ======================
router.post("/generate", async (req, res) => {
  try {
    const {
      prompt,
      style,
      title,
      model,
      beatDNA,
      sectionIdentity,
      vocalIdentity,
    } = req.body;

    const jobId = crypto.randomUUID();

    // create empty job first
    jobStore.set(jobId, {
      status: "processing",
      tracks: [],
    });

    const finalPrompt = buildPrompt(
      {
        prompt,
        beatDNA,
        sectionIdentity,
        vocalIdentity,
      },
      req.user.plan
    );

    const allowedModels = getAllowedModels(req.user.plan);

    const safeModel = allowedModels.includes(model)
      ? model
      : allowedModels[allowedModels.length - 1];

    const response = await fetch(
      "https://aimusicapi.org/api/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AI_MUSIC_API_KEY}`,
        },
        body: JSON.stringify({
          gpt_description_prompt: finalPrompt,
          style,
          title: title || "Untitled Track",
          model: safeModel,

          callback_url: "https://new-muse--reposit.replit.app/api/music/callback",

          make_instrumental: false,
          gender: vocalIdentity === "female" ? "female" : "male",

          style_weight: beatDNA ? 0.8 : 0.5,
          weirdness_constraint: 0.6,
          audio_weight: 0.7,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      jobStore.set(jobId, {
        status: "failed",
        tracks: [],
      });

      return res.status(response.status).json(data);
    }

    return res.json({
      workId: jobId,
      status: "processing",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to generate music",
    });
  }
});

// ======================
// 2. CALLBACK (AI RESULT)
// ======================
router.post("/callback", (req, res) => {
  try {
    const jobId = req.query.jobId as string;
    const payload = req.body;

    const results = payload?.data || payload || [];

    const tracks = results.map((t: any) => ({
      audioUrl: t.audio_url,
    }));

    if (!jobId) {
      return res.status(400).json({
        error: "Missing jobId",
      });
    }

    jobStore.set(jobId, {
      status: "complete",
      tracks,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("Callback error:", err);

    return res.status(500).json({
      error: "callback failed",
    });
  }
});

// ======================
// 3. GET RESULT (FRONTEND USES THIS)
// ======================
router.get("/result/:workId", (req, res) => {
  const job = jobStore.get(req.params.workId);

  if (!job) {
    return res.json({
      status: "processing",
      tracks: [],
    });
  }

  return res.json(job);
});

export default router;