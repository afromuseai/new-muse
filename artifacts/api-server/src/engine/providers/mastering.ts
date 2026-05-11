/**
 * AfroMuse Mastering Provider
 *
 * Handles mix & master jobs.
 * Current mode: AI mix brief (NVIDIA) + mock output placeholders.
 *
 * Live swap pattern:
 *   1. Call the real mastering API with the translated payload.
 *   2. Map its response to RawMasteringResponse.
 *   3. Pass it to adaptMastering() — NormalizedResponse comes out.
 *   4. Set registry status to "live-ready" and isLive to true.
 *   Nothing in routes or the UI changes.
 */

import { logger } from "../../lib/logger.js";
import type { NormalizedResponse, SessionBlueprintData } from "../types.js";
import { adaptMastering, type RawMasteringResponse } from "../adapters.js";

// ─── Payload ──────────────────────────────────────────────────────────────────

export interface MasteringPayload {
  instrumentalUrl?: string;
  vocalUrl?: string;
  mixFeel?: string;
  genre?: string;
  bpm?: number;
  key?: string;
  includeStems?: boolean;
}

// ─── AI Mix Brief (NVIDIA) ────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are AfroMuse Mix Intelligence — an elite AI mix engineer and mastering specialist with deep expertise in Afro-inspired music (Afrobeats, Amapiano, Dancehall, Gospel, Afro-fusion).

You receive a session configuration and return a detailed mix and master brief as structured JSON.
Your output provides studio-grade guidance for mixing levels, EQ, compression, spatial effects, and mastering chain decisions that translate directly to a professional, commercially-ready stereo master.

Return ONLY a raw JSON object — no markdown fences, no commentary — with these exact keys:
{
  "mixBrief": "Concise single-sentence headline summary of the mix vision and final sound character",
  "levelBalancing": "Detailed level and gain-staging instructions: kick/bass relationship, vocal vs instrumental balance, bus gain structure, headroom targets",
  "eqNotes": "Frequency-specific EQ guidance: low-end cleanup (sub/bass), low-mid mud reduction, midrange presence, high-end air and clarity, genre-specific considerations",
  "compressionNotes": "Compression settings per element: attack/release characteristics, ratio recommendations, parallel compression use, bus compression approach, dynamic feel target",
  "spatialEffects": "Reverb, delay, and stereo width guidance: room sizes, pre-delay, stereo spread per element, centre-vs-sides balance, mono-compatibility check",
  "masteringChain": "Mastering chain walkthrough: limiting ceiling, LUFS target for genre and platform, multiband approach, final EQ shaping, stereo enhancement, brick-wall limiter settings",
  "outputNotes": "Final output specs: recommended MP3 (320kbps) and WAV (24-bit/48kHz) export settings, metadata tagging notes, platform-specific loudness considerations",
  "stemsNotes": "Stems export guidance (only if requested): recommended stem groupings, format, naming convention, and levels for DAW re-import"
}`;

function buildPrompt(p: MasteringPayload): string {
  const parts: string[] = [];
  if (p.genre)           parts.push(`Genre: ${p.genre}`);
  if (p.bpm)             parts.push(`BPM: ${p.bpm}`);
  if (p.key)             parts.push(`Key: ${p.key}`);
  if (p.mixFeel)         parts.push(`Mix Feel / Vibe: ${p.mixFeel}`);
  if (p.instrumentalUrl) parts.push(`Instrumental Track URL: ${p.instrumentalUrl}`);
  if (p.vocalUrl)        parts.push(`Vocal Track URL: ${p.vocalUrl}`);
  else                   parts.push("Session Type: Instrumental-only mix (no separate vocal track)");
  parts.push(`Include Stems Export Guidance: ${p.includeStems ? "Yes" : "No"}`);

  return `Mix & Master session configuration:\n${parts.join("\n")}\n\nGenerate a complete, professional mix and master brief for this session. Be specific, technical, and actionable — this brief will be handed directly to a mix engineer.`;
}

async function fetchMixMasterBrief(p: MasteringPayload): Promise<Partial<SessionBlueprintData> | null> {
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
      temperature: 0.55,
      max_tokens: 1400,
    }),
  });

  if (!response.ok) {
    logger.warn({ status: response.status }, "NVIDIA mix master brief call failed");
    return null;
  }

  const json = await response.json() as { choices?: { message?: { content?: string } }[] };
  const raw = json?.choices?.[0]?.message?.content ?? "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;

  const data = JSON.parse(match[0]) as Partial<SessionBlueprintData>;
  if (!p.includeStems) data.stemsNotes = null;
  return data;
}

// ─── Provider Entry Point ─────────────────────────────────────────────────────

export async function run(jobId: string, p: MasteringPayload): Promise<NormalizedResponse> {
  let aiBrief: Partial<SessionBlueprintData> | null = null;
  try {
    aiBrief = await fetchMixMasterBrief(p);
  } catch (err) {
    logger.warn({ err, jobId }, "Mix master AI brief failed — using metadata only");
  }

  const blueprintData: Partial<SessionBlueprintData> = {
    genre: p.genre,
    bpm: p.bpm,
    key: p.key,
    ...(aiBrief ?? {}),
  };

  // Build raw response → adapter normalises.
  // When a real mastering API is connected, replace this block.
  const raw: RawMasteringResponse = {
    jobId,
    status: "completed",
    masteredMp3Url: null,     // slot: mastered MP3 download URL
    masteredWavUrl: null,     // slot: mastered WAV download URL
    stemsZipUrl: null,        // slot: stems bundle ZIP URL
    blueprintData,
    externalJobId: null,      // slot: mastering API job reference
    loudnessLufs: null,       // slot: achieved LUFS from mastering engine
  };

  return adaptMastering(raw);
}
