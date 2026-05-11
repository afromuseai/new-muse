/**
 * AfroMuse Stem Extraction Provider
 *
 * Handles stem extraction jobs.
 * Current mode: AI extraction brief (NVIDIA) + mock placeholders.
 *
 * Live swap pattern:
 *   1. Call the real stem-splitter API with the translated payload.
 *   2. Map its response to RawStemExtractionResponse.
 *   3. Pass it to adaptStems() — NormalizedResponse comes out.
 *   4. Set registry status to "live-ready" and isLive to true.
 *   Nothing in routes or the UI changes.
 */

import { logger } from "../../lib/logger.js";
import type { NormalizedResponse, SessionBlueprintData } from "../types.js";
import { adaptStems, type RawStemExtractionResponse } from "../adapters.js";

// ─── Payload ──────────────────────────────────────────────────────────────────

export interface StemExtractionPayload {
  masteredUrl?: string;
  stems?: string[];
  genre?: string;
  bpm?: number;
  key?: string;
}

// ─── AI Stem Brief (NVIDIA) ───────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are AfroMuse Stem Intelligence — an elite AI stem engineer specialising in Afro-inspired music production (Afrobeats, Amapiano, Dancehall, Gospel, Afro-fusion).

You receive a session configuration and return a detailed stem extraction brief as structured JSON.
Your output gives precise, phase-aware extraction guidance for each requested stem so the result is clean, phase-aligned, and ready for DAW import.

Return ONLY a raw JSON object — no markdown fences, no commentary — with these exact keys:
{
  "extractionBrief": "Concise one-sentence overview of the extraction approach and session character",
  "stems": [
    {
      "name": "Drums",
      "extractionNotes": "Specific guidance for isolating this stem: source grouping, frequency emphasis, bleed reduction, and separation quality expectations",
      "gainLevel": "Target output gain in dBFS and any trimming notes for DAW headroom",
      "fileSpec": "Exact file spec: bit depth, sample rate, format, naming convention"
    }
  ],
  "phaseAlignmentNotes": "How to verify and ensure all stems are phase-aligned after export: null-test technique, time alignment check, mono-compatibility validation",
  "dawImportGuide": "Step-by-step guide to importing all stems into a DAW session: track naming, routing, tempo/grid alignment, and colour-coding recommendation",
  "recommendedTool": "Best-in-class tool(s) for this extraction with brief rationale"
}

The "stems" array must contain one entry per requested stem (Drums, Bass, Synths, Vocals, Effects — only those requested).`;

function buildPrompt(p: StemExtractionPayload): string {
  const parts: string[] = [];
  if (p.masteredUrl) parts.push(`Mastered Track URL: ${p.masteredUrl}`);
  if (p.genre)       parts.push(`Genre: ${p.genre}`);
  if (p.bpm)         parts.push(`BPM: ${p.bpm}`);
  if (p.key)         parts.push(`Key: ${p.key}`);
  const stemList = p.stems && p.stems.length > 0 ? p.stems : ["Drums", "Bass", "Synths", "Vocals", "Effects"];
  parts.push(`Stems requested: ${stemList.join(", ")}`);

  return `Stem extraction session configuration:\n${parts.join("\n")}\n\nGenerate a complete, technically precise stem extraction brief. Each stem entry must be specific to the genre and session characteristics described. The guidance should be actionable for both AI-assisted stem splitters and traditional multi-track extraction from a DAW session.`;
}

async function fetchStemBrief(p: StemExtractionPayload): Promise<Partial<SessionBlueprintData> | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "qwen/qwen3.5-122b-a10b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(p) },
      ],
      temperature: 0.5,
      max_tokens: 1600,
    }),
  });

  if (!response.ok) {
    logger.warn({ status: response.status }, "NVIDIA stem extraction brief call failed");
    return null;
  }

  const json = await response.json() as { choices?: { message?: { content?: string } }[] };
  const raw = json?.choices?.[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;

  return JSON.parse(match[0]) as Partial<SessionBlueprintData>;
}

// ─── Provider Entry Point ─────────────────────────────────────────────────────

export async function run(jobId: string, p: StemExtractionPayload): Promise<NormalizedResponse> {
  let aiBrief: Partial<SessionBlueprintData> | null = null;
  try {
    aiBrief = await fetchStemBrief(p);
  } catch (err) {
    logger.warn({ err, jobId }, "Stem extraction AI brief failed — using metadata only");
  }

  const blueprintData: Partial<SessionBlueprintData> = {
    genre: p.genre,
    bpm: p.bpm,
    key: p.key,
    ...(aiBrief ?? {}),
  };

  // Build raw response → adapter normalises.
  // When a real stem splitter is connected, replace this block.
  const raw: RawStemExtractionResponse = {
    jobId,
    status: "completed",
    stemsZipUrl: null,        // slot: stems ZIP archive URL
    blueprintData,
    externalJobId: null,      // slot: stem splitter job reference
    stemTrackUrls: null,      // slot: individual per-stem audio URLs
    qualityScore: null,       // slot: extraction quality score (0–100)
  };

  return adaptStems(raw);
}
