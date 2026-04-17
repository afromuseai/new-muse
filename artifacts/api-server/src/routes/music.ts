import { Router } from "express";
import { buildPrompt } from "../lib/promptEngine";
import { getAllowedModels } from "../lib/planGuard";
const router = Router();

/**
 * 1. GENERATE MUSIC
 */
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

    const safeModel =
      allowedModels.includes(model)
        ? model
        : allowedModels[allowedModels.length - 1];

    const response = await fetch("https://aimusicapi.org/api/v2/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_MUSIC_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        style,
        title,
        model: safeModel,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.json({
      workId: data.workId,
      status: "processing",
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to generate music",
    });
  }
});

/**
 * 2. GET STATUS (REAL FEED)
 */
router.get("/status/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    const response = await fetch(
      `https://aimusicapi.org/api/v2/feed?workId=${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AI_MUSIC_API_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (data.data?.type !== "SUCCESS") {
      return res.json({
        status: "processing",
      });
    }

    // 🔥 THIS IS THE KEY PART
    const tracks = data.data.response_data.map((track: any) => ({
      audioUrl: track.audio_url,
    }));

    res.json({
      status: "complete",
      tracks,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "failed",
      error: "Failed to fetch music",
    });
  }
});

export default router;