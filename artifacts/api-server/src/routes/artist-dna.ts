/**
 * /api/artist-dna — Artist Pro feature
 *
 * Save, load, and generate Artist DNA — a personalized style profile
 * used to make all generations sound like the specific artist.
 */

import { Router } from "express";
import OpenAI from "openai";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, attachPlanFromDb, requireFeature, trackUsage, type AuthRequest } from "../access/middleware.js";
import { logger } from "../lib/logger.js";

const router = Router();

function getOpenAI(): OpenAI {
  const key = process.env["OPENAI_API_KEY"];
  if (!key) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey: key });
}

interface ArtistDna {
  artistName?: string;
  primaryGenre?: string;
  subGenres?: string[];
  primaryLanguage?: string;
  languageFlavors?: string[];
  vocalStyle?: string;
  lyricStyle?: string;
  signatureThemes?: string[];
  signaturePhrases?: string[];
  referenceArtists?: string[];
  bpmRange?: string;
  energyLevel?: string;
  generatedSummary?: string;
  createdAt?: string;
  updatedAt?: string;
}

router.get(
  "/artist-dna",
  requireAuth,
  attachPlanFromDb,
  requireFeature("canUseArtistDna"),
  async (req: AuthRequest, res) => {
    try {
      const [user] = await db
        .select({ artistDna: usersTable.artistDna })
        .from(usersTable)
        .where(eq(usersTable.id, req.userId!))
        .limit(1);

      res.json({ artistDna: user?.artistDna ?? null });
    } catch (err) {
      logger.error({ err }, "Failed to load Artist DNA");
      res.status(500).json({ error: "Failed to load Artist DNA." });
    }
  }
);

router.put(
  "/artist-dna",
  requireAuth,
  attachPlanFromDb,
  requireFeature("canUseArtistDna"),
  async (req: AuthRequest, res) => {
    const dna = req.body as ArtistDna;

    if (!dna || typeof dna !== "object") {
      res.status(400).json({ error: "Artist DNA data is required." });
      return;
    }

    try {
      const now = new Date().toISOString();
      const updated: ArtistDna = {
        ...dna,
        updatedAt: now,
        createdAt: dna.createdAt ?? now,
      };

      await db
        .update(usersTable)
        .set({ artistDna: updated })
        .where(eq(usersTable.id, req.userId!));

      res.json({ success: true, artistDna: updated });
    } catch (err) {
      logger.error({ err }, "Failed to save Artist DNA");
      res.status(500).json({ error: "Failed to save Artist DNA." });
    }
  }
);

router.post(
  "/artist-dna/generate",
  requireAuth,
  attachPlanFromDb,
  requireFeature("canUseArtistDna"),
  trackUsage("canUseArtistDna"),
  async (req: AuthRequest, res) => {
    const {
      artistName,
      primaryGenre,
      subGenres = [],
      primaryLanguage,
      languageFlavors = [],
      vocalStyle,
      lyricStyle,
      signatureThemes = [],
      signaturePhrases = [],
      referenceArtists = [],
      bpmRange,
      energyLevel,
      sampleLyrics,
    } = req.body as {
      artistName?: string;
      primaryGenre?: string;
      subGenres?: string[];
      primaryLanguage?: string;
      languageFlavors?: string[];
      vocalStyle?: string;
      lyricStyle?: string;
      signatureThemes?: string[];
      signaturePhrases?: string[];
      referenceArtists?: string[];
      bpmRange?: string;
      energyLevel?: string;
      sampleLyrics?: string;
    };

    if (!artistName?.trim() || !primaryGenre?.trim()) {
      res.status(400).json({ error: "Artist name and primary genre are required." });
      return;
    }

    try {
      const openai = getOpenAI();

      const prompt = `
You are AfroMuse AI's Artist DNA engine. Based on the artist profile below, generate a concise but powerful artist style summary (200-300 words) that captures their unique sonic and lyrical identity. This summary will be injected into all future generations to personalize the output to their style.

Artist Name: ${artistName}
Primary Genre: ${primaryGenre}
Sub-genres: ${subGenres.join(", ") || "None"}
Primary Language: ${primaryLanguage || "English"}
Language Flavors: ${languageFlavors.join(", ") || "None"}
Vocal Style: ${vocalStyle || "Not specified"}
Lyric Style: ${lyricStyle || "Not specified"}
Signature Themes: ${signatureThemes.join(", ") || "None"}
Signature Phrases: ${signaturePhrases.join(", ") || "None"}
Reference Artists: ${referenceArtists.join(", ") || "None"}
BPM Range: ${bpmRange || "Not specified"}
Energy Level: ${energyLevel || "Not specified"}
${sampleLyrics ? `Sample Lyrics:\n${sampleLyrics}` : ""}

Generate a concise, third-person Artist DNA summary that captures their unique style. Focus on: lyrical voice, language patterns, emotional world, genre authenticity, and what makes them sound distinctly themselves.
      `.trim();

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500,
      });

      const generatedSummary = completion.choices[0]?.message?.content?.trim();

      const now = new Date().toISOString();
      const artistDna: ArtistDna = {
        artistName,
        primaryGenre,
        subGenres,
        primaryLanguage,
        languageFlavors,
        vocalStyle,
        lyricStyle,
        signatureThemes,
        signaturePhrases,
        referenceArtists,
        bpmRange,
        energyLevel,
        generatedSummary,
        createdAt: now,
        updatedAt: now,
      };

      await db
        .update(usersTable)
        .set({ artistDna })
        .where(eq(usersTable.id, req.userId!));

      res.json({ success: true, artistDna });
    } catch (err) {
      logger.error({ err }, "Failed to generate Artist DNA");
      res.status(500).json({ error: "Failed to generate Artist DNA. Please try again." });
    }
  }
);

export default router;
