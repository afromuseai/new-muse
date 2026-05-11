import { Router } from "express";
import { logger } from "../lib/logger.js";
import { deliverCallback } from "../engine/callbackStore.js";

const router = Router();

router.post("/instrumental/callback", (req, res) => {
  try {
    console.log("🔥 CALLBACK RECEIVED:", JSON.stringify(req.body, null, 2));

    const data = req.body?.data;
    const track = Array.isArray(data) ? data[0] : data;

    const audioUrl = track?.audio_url || track?.stream_audio_url || null;
    const title = track?.title ?? "Untitled";
    const imageUrl = track?.image_url ?? track?.cover_url ?? null;

    const jobId = track?.task_id || track?.id;

    if (!jobId) {
      console.log("⚠️ Missing jobId/task_id");
      return res.status(200).json({ received: true });
    }

    if (!audioUrl) {
      console.log("⚠️ Missing audioUrl");
      return res.status(200).json({ received: true });
    }

    console.log("✅ Delivering callback for job:", jobId);

    deliverCallback(jobId, {
      audioUrl,
      title,
      imageUrl,
      receivedAt: Date.now(),
    });

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ CALLBACK ERROR:", err);
    return res.status(500).json({ error: "callback failed" });
  }
});

export default router;