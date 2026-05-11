/**
 * /api/rewrite-lyrics — Creator Pro feature
 *
 * Takes existing lyrics and a rewrite mode, returns improved lyrics.
 * Modes: "humanize" | "catchier" | "harder" | "custom"
 */

import { Router } from "express";
import OpenAI from "openai";
import { requireAuth, attachPlanFromDb, requireFeature, trackUsage } from "../access/middleware.js";
import { logger } from "../lib/logger.js";

const router = Router();

function getOpenAI(): OpenAI {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey: key });
}

const LINE_COUNT_RULE = `
CRITICAL — LINE COUNT PRESERVATION (MANDATORY):
You MUST return EXACTLY the same number of lines per section as the original.
Count the lines in each section of the input before rewriting. Match that count exactly in your output.
- If a section has 8 lines → your rewrite MUST have exactly 8 lines.
- If a section has 4 lines → your rewrite MUST have exactly 4 lines.
- NEVER merge two lines into one. NEVER split one line into two. NEVER add or remove lines.
- Every single input line maps to exactly one rewritten output line — one-for-one, no exceptions.
- Preserve all section headers exactly as written (e.g. [HOOK], [VERSE 1], [BRIDGE]).
Failure to preserve line counts is a failed rewrite. Count carefully before responding.`;

const REWRITE_PROMPTS: Record<string, string> = {
  humanize: `You are AfroMuse AI's lyric humanizer. Take the provided lyrics and make them feel more natural, conversational, and emotionally authentic. Remove anything that sounds robotic, generic, or forced. Keep the same structure, theme, and language flavor but make every line feel like it came from a real person living that moment.
${LINE_COUNT_RULE}
Return ONLY the rewritten lyrics with no commentary.`,

  catchier: `You are AfroMuse AI's hook engineer. Take the provided lyrics and punch up every hook, chorus, and memorable line. Make the chorus impossible to forget — it should be something a crowd screams back at a concert. Sharpen every rhyme. Add more rhythm and bounce. Keep the language flavor intact.
${LINE_COUNT_RULE}
Return ONLY the rewritten lyrics with no commentary.`,

  harder: `You are AfroMuse AI's street energy engineer. Take the provided lyrics and amplify the grit, confidence, and rawness. Make every line hit harder — more swagger, more attitude, more cultural authenticity. For Afrobeats: more Pidgin punch. For Dancehall: more patois confidence. For Amapiano: smoother but deeper.
${LINE_COUNT_RULE}
Return ONLY the rewritten lyrics with no commentary.`,

  custom: `You are AfroMuse AI's lyric refiner. Rewrite the provided lyrics based on the custom instructions given. Honor the genre, language flavor, and emotional world of the original while applying the user's specific direction.
${LINE_COUNT_RULE}
Return ONLY the rewritten lyrics with no commentary.`,
};

router.post(
  "/rewrite-lyrics",
  requireAuth,
  attachPlanFromDb,
  requireFeature("canRewriteLyrics"),
  trackUsage("canRewriteLyrics"),
  async (req, res) => {
    const { lyrics, mode = "humanize", genre, languageFlavor, customInstruction } = req.body as {
      lyrics?: string;
      mode?: string;
      genre?: string;
      languageFlavor?: string;
      customInstruction?: string;
    };

    if (!lyrics?.trim()) {
      res.status(400).json({ error: "Lyrics are required." });
      return;
    }

    const validModes = ["humanize", "catchier", "harder", "custom"];
    if (!validModes.includes(mode)) {
      res.status(400).json({ error: `Invalid mode. Must be one of: ${validModes.join(", ")}` });
      return;
    }

    if (mode === "custom" && !customInstruction?.trim()) {
      res.status(400).json({ error: "Custom instruction is required for custom mode." });
      return;
    }

    try {
      const openai = getOpenAI();

      const systemPrompt = REWRITE_PROMPTS[mode] ?? REWRITE_PROMPTS.humanize;

      const lineCount = lyrics.trim().split("\n").length;
      const userPrompt = [
        genre ? `Genre: ${genre}` : null,
        languageFlavor ? `Language Flavor: ${languageFlavor}` : null,
        mode === "custom" ? `Custom Instructions: ${customInstruction}` : null,
        `ORIGINAL LINE COUNT: ${lineCount} lines total — your rewrite MUST also have exactly ${lineCount} lines.`,
        "",
        "LYRICS TO REWRITE:",
        lyrics,
      ].filter(Boolean).join("\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 2000,
      });

      const rewritten = completion.choices[0]?.message?.content?.trim();

      if (!rewritten) {
        res.status(500).json({ error: "Failed to rewrite lyrics. Please try again." });
        return;
      }

      res.json({ rewrittenLyrics: rewritten, mode });
    } catch (err) {
      logger.error({ err }, "Lyric rewrite failed");
      res.status(500).json({ error: "Lyric rewrite failed. Please try again." });
    }
  }
);

export default router;
