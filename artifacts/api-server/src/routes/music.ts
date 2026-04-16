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
router.get("/status/:workId", async (req, res) => {
  try {
    const { workId } = req.params;

    const response = await fetch(
      `https://aimusicapi.org/api/v2/feed?workId=${workId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AI_MUSIC_API_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const tracks =
      data?.response_data?.map((item: any) => ({
        id: item.id,
        audioUrl: item.audio_url,
        imageUrl: item.image_url,
        title: item.title,
        duration: item.duration,
        status: item.status,
      })) || [];

    return res.json({
      status: data.type === "SUCCESS" ? "complete" : "processing",
      tracks,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch status",
    });
  }
});

export default router;