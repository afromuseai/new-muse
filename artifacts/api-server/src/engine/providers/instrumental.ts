/**
 * AfroMuse Instrumental Provider
 *
 * Supports two execution modes resolved at runtime by the engine control layer:
 *
 *   mock — AI session brief (NVIDIA) + null audio placeholders (current default)
 *   live — real beat-generation API call + AI brief enrichment + real audio URLs
 *
 * Mode is resolved by resolveProviderMode("instrumental") which reads:
 *   → runtime overrides → environment config → registry status → safety guards
 *
 * Live path is structurally complete and ready for a real provider to be
 * dropped in. See: callLiveInstrumentalProvider() below.
 *
 * Fallback behavior (live → mock or live → clean failure) is driven by the
 * environment config's fallbackToMock flag for the instrumental category.
 *
 * ─── Live Provider Drop-in Checklist ──────────────────────────────────────────
 *   [ ] Set registry status → "live-ready", isLive → true  (providers/registry.ts)
 *   [ ] Set env config mode → "live"                       (engineConfig.ts)
 *   [ ] Set env vars: INSTRUMENTAL_API_KEY, INSTRUMENTAL_API_ENDPOINT,
 *                     INSTRUMENTAL_MODEL, INSTRUMENTAL_TIMEOUT_MS
 *   [ ] Implement the body of callLiveInstrumentalProvider() below
 *   [ ] Nothing in routes, adapters, or the UI changes
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { logger } from "../../lib/logger.js";
import type { NormalizedResponse, SessionBlueprintData } from "../types.js";
import { adaptInstrumental, type RawInstrumentalResponse } from "../adapters.js";
import { resolveProviderMode } from "../providerResolver.js";
import { executeFallback, buildFailureResponse } from "../fallback.js";
import { getProviderCredentials } from "../providerCredentials.js";
import { resolveModelAndClient } from "../nvidiaClient.js";
import { analyzeLyricsSignal, resolveLyricsInfluence, buildLyricsAiContext } from "../lyricsSignal.js";
import { registerTask, getCallbackResult, clearTask } from "../callbackStore.js";

// ─── Payload ──────────────────────────────────────────────────────────────────

export interface InstrumentalPayload {
  title?: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  key?: string;
  songLength?: string;
  energy?: string;
  hitmakerMode?: boolean;
  lyricalDepth?: string;
  hookRepeatLevel?: string;
  soundReference?: string;
  mixFeel?: string;
  styleReference?: string;
  productionNotes?: { chordVibe?: string; melodyDirection?: string; arrangement?: string };
  introBehavior?: string;
  chorusLift?: string;
  drumDensity?: string;
  bassWeight?: string;
  transitionStyle?: string;
  outroStyle?: string;
  // Extended session intelligence fields
  buildMode?: string;
  emotionalTone?: string;
  theme?: string;
  // Beat DNA — premium musical personality controls
  bounceStyle?: string;
  melodyDensity?: string;
  drumCharacter?: string;
  hookLift?: string;
  // Direct production style override — free-form text prepended to the auto-generated
  // style string so the user's exact production intent reaches the model without dilution.
  productionStyle?: string;
  // Lyrics intelligence — raw lyrics text for signal derivation
  // Used to shape the AI Music API prompt and NVIDIA AI brief without exposing raw text in the prompt
  lyricsText?: string;
  // Structured lyrics sections for full-song mode.
  // When present with content, AI Music API generates a full song with AI vocals
  // singing the exact lyrics instead of an instrumental-only beat.
  lyricsSections?: {
    intro?:  string[];
    hook?:   string[];
    verse1?: string[];
    verse2?: string[];
    bridge?: string[];
    outro?:  string[];
  };
  // AI Music API generation controls
  gender?: string;             // "male" | "female" — vocal gender preference
  styleWeight?: number;        // 0–1, adherence to style description
  weirdnessConstraint?: number;// 0–1, creative deviation amount
  audioWeight?: number;        // 0–1, audio feature balance
  aiMusicModel?: string;       // chirp-v4-5 | chirp-v4-5-plus | chirp-v5 | chirp-v4-0
  negativeTags?: string;       // comma-separated tags to avoid in generation
}

// ─── Live Provider Response Shape ─────────────────────────────────────────────
// This represents the expected raw response from a real beat-generation API.
// When integrating a real provider (Udio, Suno, Stability Audio, etc.),
// map its response fields into this shape inside callLiveInstrumentalProvider().

export interface LiveInstrumentalProviderResponse {
  /** The primary audio preview URL returned by the real provider (MP3/stream). */
  previewUrl: string | null;
  /** Full-quality WAV download URL, if the provider returns one. */
  wavUrl: string | null;
  /** The provider's own internal track/job ID for reference and polling. */
  externalJobId: string | null;
  /** Human-readable title or name the provider assigned to this generation. */
  generationTitle: string | null;
  /** Any sonic or generation notes the provider returns (e.g. model used, tags). */
  sonicNotes: string | null;
  /** Duration string if the provider returns it (e.g. "3:22"). */
  duration: string | null;
  /** Cover art URL if the provider generates one. */
  coverArtUrl: string | null;
  /**
   * Optional waveform-ready metadata for future UI waveform rendering.
   * Shape is intentionally flexible — populate once a real provider is connected.
   */
  waveformMeta?: {
    peaks?: number[];
    durationSeconds?: number;
    sampleRate?: number;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseBpm(chordVibe: string, genre: string): number {
  const m = chordVibe?.match(/(\d{2,3})\s*BPM/i);
  if (m) return parseInt(m[1], 10);
  const defaults: Record<string, number> = {
    Afrobeats: 98, Afropop: 104, Amapiano: 112, Dancehall: 90,
    "R&B": 75, "Afro-fusion": 96, "Street Anthem": 100, Spiritual: 72,
  };
  return defaults[genre] ?? 96;
}

function parseKey(chordVibe: string, mood: string): string {
  const minorM = chordVibe?.match(/\b([A-G][b#]?)m\b/);
  const majorM = chordVibe?.match(/\b([A-G][b#]?)\s*(?:maj(?:or)?)?[-–\s,]/);
  if (minorM) return `${minorM[1]} Minor`;
  if (majorM) return `${majorM[1]} Major`;
  const byMood: Record<string, string> = {
    Sad: "D Minor", Uplifting: "G Major", Romantic: "A♭ Major",
    Energetic: "E Minor", Spiritual: "F Major", Confident: "B♭ Major",
  };
  return byMood[mood] ?? "F♯ Minor";
}

function getEnergy(mood: string): string {
  if (["Energetic", "Confident"].includes(mood)) return "High";
  if (["Sad", "Spiritual"].includes(mood)) return "Low";
  return "Mid";
}

function getDuration(songLength?: string): string {
  if (songLength === "Short") return "2:15";
  if (songLength === "Full") return "4:30";
  return "3:20";
}

function buildBaseMetadata(p: InstrumentalPayload): Partial<SessionBlueprintData> {
  const genre = p.genre ?? "Afrobeats";
  const mood = p.mood ?? "Uplifting";
  const chordVibe = p.productionNotes?.chordVibe ?? "";
  return {
    genre,
    mood,
    bpm: p.bpm ?? parseBpm(chordVibe, genre),
    key: p.key ?? parseKey(chordVibe, mood),
    energy: p.energy ?? getEnergy(mood),
    duration: getDuration(p.songLength),
    hitmakerMode: p.hitmakerMode ?? false,
    hookRepeatLevel: p.hookRepeatLevel ?? "Medium",
    audioType: "Instrumental Preview",
  };
}

// ─── AI Session Brief (NVIDIA) ────────────────────────────────────────────────
// Always runs in both mock and live modes to enrich the blueprint data.
// Gracefully skipped if NVIDIA_API_KEY is not set.

const AI_SYSTEM_PROMPT = `You are AfroMuse Audio Intelligence — a specialist AI producer brain for Afro-inspired music genres (Afrobeats, Amapiano, Dancehall, Gospel, Afro-fusion).

You receive a session configuration and return a detailed instrumental session brief as structured JSON.
Your output shapes the sonic direction for real studio sessions and beat builds.

Rules:
- Write like a top-tier record producer, not a text generator
- Be genre-specific, culturally grounded, and musically precise
- Every description must be actionable in a real studio session
- ALWAYS return valid JSON only — no markdown, no explanation, no code fences`;

function buildAiPrompt(p: InstrumentalPayload): string {
  const genre = p.genre ?? "Afrobeats";
  const mood = p.mood ?? "Uplifting";
  const energy = p.energy ?? "Medium";
  const bpm = p.bpm ?? 96;
  const key = p.key ?? "F# Minor";
  const style = p.soundReference ?? p.styleReference ?? "";
  const mixFeel = p.mixFeel ?? "Balanced";
  const introBehavior = p.introBehavior ?? "Build up";
  const chorusLift = p.chorusLift ?? "Gradual swell";
  const drumDensity = p.drumDensity ?? "Mid";
  const bassWeight = p.bassWeight ?? "Punchy sub";

  const bounceStyle   = (p.bounceStyle   ?? "").trim() || "default";
  const melodyDensity = (p.melodyDensity ?? "").trim() || "Balanced";
  const drumCharacter = (p.drumCharacter ?? "").trim() || "Punchy";
  const hookLift      = (p.hookLift      ?? "").trim() || "Balanced";

  // Lyrics-aware context block — only included when lyrics are present
  const lyricsSignal = p.lyricsText?.trim() ? analyzeLyricsSignal(p.lyricsText) : null;
  const lyricsAiBlock = lyricsSignal ? buildLyricsAiContext(lyricsSignal) + "\n\n" : "";

  return `Generate an instrumental session brief for this configuration:

GENRE: ${genre}
BPM: ${bpm}
KEY: ${key}
ENERGY: ${energy}
MOOD/ATMOSPHERE: ${mood}
SOUND / ARTIST REFERENCE: ${style || "original AfroMuse direction — no specific reference"}
MIX FEEL: ${mixFeel}
INTRO BEHAVIOR: ${introBehavior}
CHORUS LIFT: ${chorusLift}
DRUM DENSITY: ${drumDensity}
BASS WEIGHT: ${bassWeight}
BEAT DNA:
  Bounce Style: ${bounceStyle}
  Melody Density: ${melodyDensity}
  Drum Character: ${drumCharacter}
  Hook Lift: ${hookLift}

${lyricsAiBlock}Return ONLY this JSON object with no markdown, no code fences, no extra text:
{
  "beatSummary": "One compelling line (max 20 words) describing this beat's groove character and feel — be specific to genre + BPM",
  "arrangementMap": "Full arrangement breakdown with specific producer notes for each section: Intro → Verse → Chorus/Hook → Bridge → Outro. 3-4 sentences total.",
  "producerNotes": "Detailed production direction — instruments, layering approach, sonic signature, recording tips. 4-6 sentences. Write as if handing notes to a session engineer.",
  "hookFocus": "One sentence on where the hook hits hardest and how to engineer maximum replay value for this specific genre at this energy level",
  "arrangementStyle": "One sentence describing the overall arrangement philosophy and structural feel of this track",
  "sonicIdentity": {
    "coreBounce": "The exact rhythmic feel and groove pocket — be specific to ${genre} at ${bpm} BPM with ${energy} energy",
    "atmosphere": "The tonal and spatial atmosphere — reverb depth, density, emotional temperature of the mix",
    "mainTexture": "Primary sonic texture — list 2-3 key layered ingredients that define this session's sound identity"
  },
  "sessionBrief": "2-3 sentence quick producer brief written as if handing notes to a session engineer walking into the studio right now for this exact record"
}`;
}

async function fetchAiSessionBrief(
  p: InstrumentalPayload,
  jobId: string,
): Promise<Partial<SessionBlueprintData> | null> {
  const { model, client: ai } = resolveModelAndClient("GENERATE_INSTRUMENTAL_MODEL");
  if (!ai) {
    logger.warn({ jobId }, "NVIDIA_API_KEY not set — skipping instrumental AI brief");
    return null;
  }

  const res = await ai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: AI_SYSTEM_PROMPT },
      { role: "user", content: buildAiPrompt(p) },
    ],
    temperature: 0.75,
    max_tokens: 1200,
  });

  const raw = res.choices[0]?.message?.content ?? "";
  const cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in instrumental brief response");

  return JSON.parse(cleaned.slice(start, end + 1)) as Partial<SessionBlueprintData>;
}

// ─── Mock Execution Path ──────────────────────────────────────────────────────
// Current default for all environments. Generates an AI session brief and
// returns null audio URLs (structural placeholders for when real audio arrives).

async function runMock(jobId: string, p: InstrumentalPayload): Promise<NormalizedResponse> {
  const metadata = buildBaseMetadata(p);

  let aiBrief: Partial<SessionBlueprintData> | null = null;
  try {
    aiBrief = await fetchAiSessionBrief(p, jobId);
  } catch (err) {
    logger.warn({ err, jobId }, "Instrumental AI brief failed — using metadata only");
  }

  const blueprintData: Partial<SessionBlueprintData> = { ...metadata, ...(aiBrief ?? {}) };

  const raw: RawInstrumentalResponse = {
    jobId,
    status: "completed",
    audioUrl: "/demo-beat.wav",  // demo beat — replaced by Llama-4-Maverick / live provider when active
    wavUrl: null,          // slot: WAV download URL
    blueprintData,
    externalJobId: null,   // slot: provider's own track/job ID
    previewUrl: null,      // slot: short beat preview clip URL
    coverArt: null,        // slot: generated cover art URL
  };

  logger.info({ jobId, genre: p.genre, mood: p.mood }, "Instrumental mock execution complete");
  return adaptInstrumental(raw);
}

// ─── AI Music API — AfroMuse Prompt Intelligence ─────────────────────────────
// Translates AfroMuse session fields into a rich, musical producer brief.
// The goal is a prompt that reads like a confident creative direction for a
// commercially viable Afro-inspired record — not a keyword-stuffed list.

// ── Genre groove vocabulary ────────────────────────────────────────────────────

const GENRE_GROOVE: Record<string, string> = {
  Afrobeats:      "syncopated Afrobeats groove",
  Amapiano:       "log drum-driven Amapiano groove",
  Afropop:        "bright, melodic Afropop feel",
  "Afro-fusion":  "hybrid Afro-fusion pocket",
  Dancehall:      "steppers Dancehall pattern",
  "R&B":          "smooth R&B pocket",
  "Street Anthem":"raw street-energy bounce",
  Spiritual:      "reverent spiritual groove",
  Gospel:         "uplifting Gospel swing",
};

const GENRE_DEFAULTS: Record<string, number> = {
  Afrobeats: 98, Afropop: 104, Amapiano: 112, Dancehall: 90,
  "R&B": 78, "Afro-fusion": 96, "Street Anthem": 100, Spiritual: 72, Gospel: 76,
};

// ── Mood / emotional lane vocabulary ──────────────────────────────────────────

interface MoodProfile {
  lane: string;
  texture: string;
  space: string;
}

const MOOD_PROFILES: Record<string, MoodProfile> = {
  Uplifting:  { lane: "uplifting and forward-moving", texture: "warm melodic layers with rhythmic brightness", space: "open and anthemic" },
  Romantic:   { lane: "intimate and warm", texture: "soft guitar runs, silky pads, and gentle melodic phrases", space: "spacious with breathing room" },
  Energetic:  { lane: "high-energy and driven", texture: "punchy transients, dense rhythmic movement", space: "tight and forward" },
  Confident:  { lane: "bold and assured", texture: "powerful chord stabs, assertive low end, sharp percussive hits", space: "commanding and crisp" },
  Sad:        { lane: "reflective and melancholic", texture: "minor-key piano or guitar, restrained percussion, emotional space", space: "slow-release and intimate" },
  Spiritual:  { lane: "reverent and elevated", texture: "choir pads, warm bass, light percussion", space: "vast and ethereal" },
  Playful:    { lane: "light and infectious", texture: "bright melodic stabs, swinging hi-hat patterns", space: "bouncy and open" },
  Aggressive: { lane: "intense and driving", texture: "hard-hitting drums, gritty synths, edgy low end", space: "compressed and punchy" },
};

function getMoodProfile(mood: string): MoodProfile {
  return MOOD_PROFILES[mood] ?? {
    lane: `${mood.toLowerCase()} and intentional`,
    texture: "balanced melodic and rhythmic layers",
    space: "well-balanced",
  };
}

// ── Energy modifiers ───────────────────────────────────────────────────────────

function resolveEnergyDescriptor(energy: string, mood: string): string {
  const e = energy.toLowerCase();
  if (e === "high" || e === "hard") {
    return "high-energy, club-ready intensity";
  }
  if (e === "low" || e === "soft") {
    return "low-key, laid-back groove";
  }
  // Mid — check mood for colour
  if (["Romantic", "Sad", "Spiritual"].includes(mood)) return "measured, emotive energy";
  return "mid-level, steady groove energy";
}

// ── Percussion character ───────────────────────────────────────────────────────

function resolvePercussionLine(
  drumDensity: string,
  bassWeight: string,
  genre: string,
  energy: string,
): string {
  const density = drumDensity.toLowerCase();
  const bass    = bassWeight.toLowerCase();
  const isAfro  = ["Afrobeats", "Afropop", "Afro-fusion"].includes(genre);
  const isAmapiano = genre === "Amapiano";
  const highEnergy = ["high", "hard"].includes(energy.toLowerCase());

  // Build percussion description
  let drumDesc: string;
  if (isAmapiano) {
    if (density.includes("heavy") || density.includes("dense")) {
      drumDesc = "dense log drum rolls with layered percussion";
    } else if (density.includes("light") || density.includes("minimal")) {
      drumDesc = "sparse log drum placement with open hi-hats";
    } else {
      drumDesc = "rolling log drum patterns with organic percussion texture";
    }
  } else if (density.includes("heavy") || density.includes("dense")) {
    drumDesc = isAfro
      ? "heavy layered Afro drums with tight snare and stacked percussion"
      : "dense, driving drum arrangement with layered hits";
  } else if (density.includes("light") || density.includes("minimal")) {
    drumDesc = "minimal, tasteful drum placement with room to breathe";
  } else {
    drumDesc = isAfro
      ? `syncopated ${genre} drum pattern with clean snare placement`
      : "balanced drum arrangement with natural movement";
  }

  // Build bass description
  let bassDesc: string;
  if (bass.includes("heavy") || bass.includes("sub") || bass.includes("deep")) {
    bassDesc = highEnergy
      ? "deep sub bass driving the low end with club-ready weight"
      : "warm sub-heavy bass grounding the mix";
  } else if (bass.includes("light") || bass.includes("thin")) {
    bassDesc = "clean, restrained bass sitting behind the groove";
  } else if (bass.includes("punchy")) {
    bassDesc = "punchy, well-defined bass with tight transient attack";
  } else {
    bassDesc = "solid, well-balanced low end";
  }

  return `${drumDesc.charAt(0).toUpperCase()}${drumDesc.slice(1)}, with ${bassDesc}.`;
}

// ── Mix feel character ─────────────────────────────────────────────────────────

function resolveMixFeel(mixFeel: string): string {
  const mf = mixFeel.toLowerCase();
  if (mf.includes("bright") || mf.includes("crisp")) {
    return "bright, airy mix with clear transient definition and open high end";
  }
  if (mf.includes("dark") || mf.includes("gritty")) {
    return "dark, gritty mix with textured low-mids and raw sonic edge";
  }
  if (mf.includes("warm") || mf.includes("analog")) {
    return "warm, analog-feeling mix with rich midrange and gentle saturation";
  }
  if (mf.includes("club") || mf.includes("loud")) {
    return "loud, punchy club mix with heavy limiting and forward impact";
  }
  if (mf.includes("cinematic") || mf.includes("wide")) {
    return "wide, cinematic mix with deep stereo imaging and spatial reverb";
  }
  return "balanced, clean mix with natural space and clarity";
}

// ── Sound reference interpreter ────────────────────────────────────────────────
// Translates artist/style references into sonic direction without imitating
// specific copyrighted songs. Describes the lane, not the track.

const ARTIST_LANES: Record<string, string> = {
  "burna":   "Afrofusion lane — evolving sonic layers, deep cultural groove, and international crossover feel",
  "burna boy": "Afrofusion lane — evolving sonic layers, deep cultural groove, and international crossover feel",
  "wizkid":  "smooth, melodic Afrobeats lane — effortless groove, intimate atmosphere, and understated percussion",
  "asake":   "high-energy Afropop/Amapiano lane — log-drum movement, call-and-response melody, and raw street energy",
  "tems":    "atmospheric Afro-soul lane — expansive space, emotional warmth, and slow-building tension",
  "davido":  "anthem-ready Afrobeats lane — commercial hook structure, punchy percussion, and celebratory energy",
  "ayra starr": "cool Afropop lane — smooth melodic lines, light percussion, and modern production clarity",
  "omah lay": "introspective Afropop lane — intimate vocal space, soft guitar runs, and laid-back groove",
  "shallipopi": "street-energy Amapiano lane — raw bounce, log drum pressure, and working-class spirit",
  "ckay":    "melodic Afrobeats lane — emotional chord progressions, romantic energy, and international softness",
  "fireboy": "Afro-RnB lane — lush melodies, smooth bass, and emotional lyrical space",
};

function interpretSoundReference(soundRef: string): string | null {
  if (!soundRef.trim()) return null;
  const lower = soundRef.toLowerCase();
  for (const [key, desc] of Object.entries(ARTIST_LANES)) {
    if (lower.includes(key)) return `${desc}`;
  }
  // Generic reference — describe the direction, not the artist
  return `${soundRef.trim()} sonic lane and production aesthetic`;
}

// ── Build mode awareness ───────────────────────────────────────────────────────

function resolveBuildModeIntent(buildMode: string): string | null {
  const bm = buildMode.toLowerCase();
  if (bm.includes("instrumental") || bm === "producer") {
    return "Focus entirely on the beat arrangement, harmonic movement, and percussive dynamics — no vocal accommodation needed";
  }
  if (bm.includes("vocal demo") || bm.includes("demo setup")) {
    return "Leave consistent pocket and breathing room for a vocalist — melodic leads should support, not compete";
  }
  if (bm.includes("full") || bm.includes("session")) {
    return "Arrange with hook lift, verse build, and vocal space in mind — the track should breathe and support full song structure";
  }
  if (bm.includes("artist")) {
    return "Build for artist performance — leave room for lead vocal delivery with strong hook arrangement";
  }
  return null;
}

// ── Hitmaker mode additions ────────────────────────────────────────────────────

function resolveHitmakerAdditions(hitmaker: boolean, genre: string, energy: string): string | null {
  if (!hitmaker) return null;
  const highEnergy = ["high", "hard"].includes((energy ?? "").toLowerCase());
  if (genre === "Amapiano") {
    return "Engineered for commercial impact — peak log drum movement, singable melodic hook, and radio-ready arrangement";
  }
  if (highEnergy) {
    return "Hitmaker mode — maximum replay value, strong hook architecture, and club-tested rhythm dynamics";
  }
  return "Hitmaker mode — commercially balanced production with strong melodic identity and replay-engineered arrangement";
}

// ── Production notes weaver ────────────────────────────────────────────────────

function extractProductionContext(notes?: { chordVibe?: string; melodyDirection?: string; arrangement?: string }): string | null {
  if (!notes) return null;
  const parts: string[] = [];
  if (notes.chordVibe?.trim())       parts.push(notes.chordVibe.trim());
  if (notes.melodyDirection?.trim()) parts.push(notes.melodyDirection.trim());
  // Skip arrangement — it can be verbose and conflict with prompt intent
  if (!parts.length) return null;
  // Keep brief — one sentence worth of context only
  const combined = parts.join("; ");
  return combined.length > 120 ? combined.slice(0, 117) + "…" : combined;
}

// ── Beat DNA resolvers ────────────────────────────────────────────────────────
// These translate the four Beat DNA personality controls into concrete prompt
// language that meaningfully shapes ElevenLabs generation.

function resolveBounceStyle(bounceStyle: string): string | null {
  const style = bounceStyle.toLowerCase().trim();
  const map: Record<string, string> = {
    "smooth glide":     "smooth, gliding rhythmic motion with seamless groove flow and effortless pocket",
    "club bounce":      "kinetic club-ready bounce with strong rhythmic momentum and dancefloor pull",
    "street bounce":    "raw street-energy bounce with gritty rhythmic drive and working-class grit",
    "late night swing": "relaxed late-night pocket with sensual swing placement and slow-burning rhythm feel",
    "festival lift":    "uplifting festival-ready momentum with anthemic crowd energy and wide open groove",
    "slow wine":        "slow, deliberate wine rhythm with deep groove weight and sensual pocket authority",
    "log drum drive":   "log drum-powered Amapiano groove drive with rolling rhythmic authority and deep bounce",
  };
  for (const [key, desc] of Object.entries(map)) {
    if (style === key || style.includes(key.split(" ")[0])) return desc;
  }
  return null;
}

function resolveMelodyDensityLayer(melodyDensity: string): string | null {
  const density = melodyDensity.toLowerCase().trim();
  if (density === "minimal")   return "sparse, restrained melodic presence — air and space take priority over layering";
  if (density === "balanced")  return "balanced melodic layering — clear harmonic hooks without overcrowding";
  if (density === "rich")      return "rich, textured melodic arrangement with warm harmonic depth and layered expression";
  if (density === "lush")      return "lush, dense melodic environment — stacked harmonic layers and full sonic warmth";
  if (density === "cinematic") return "expansive cinematic melodic language — wide emotional sweep, orchestral ambition, and moving harmonic arcs";
  return null;
}

function resolveDrumCharacterLayer(drumCharacter: string): string | null {
  const char = drumCharacter.toLowerCase().trim();
  if (char === "clean")        return "tight transients and clean pocket — polished engineering with precise drum placement";
  if (char === "punchy")       return "punchy hit attack with forward drum placement and snappy transient energy";
  if (char === "raw")          return "raw, gritty rhythm texture with rough character and unpolished street edge";
  if (char === "dusty")        return "dusty, lo-fi textured drums with vintage character and worn analog patina";
  if (char === "percussive")   return "percussion-forward arrangement with layered rhythmic complexity and poly-rhythmic depth";
  if (char === "heavy groove") return "heavy, pressure-building groove with commanding low-end drum weight and authoritative presence";
  return null;
}

function resolveHookLiftLayer(hookLift: string): string | null {
  const lift = hookLift.toLowerCase().trim();
  if (lift === "subtle")    return "Restrained chorus energy — the hook is felt, not forced; understatement drives replay";
  if (lift === "balanced")  return "Natural chorus payoff with clean arrangement lift and satisfying hook resolution";
  if (lift === "big")       return "Strong hook drop with clear arrangement escalation, high replay draw and audience lock";
  if (lift === "anthemic")  return "Anthem-level chorus payoff — maximum replay architecture, crowd-building energy, and hook dominance";
  if (lift === "explosive") return "Explosive chorus release — full arrangement detonation, massive drop payoff, and electric crowd momentum";
  return null;
}

// ── Main prompt builder ────────────────────────────────────────────────────────

export interface BuiltPrompt {
  /** Natural-language description used as gpt_description_prompt (inspiration mode) or style base */
  prompt: string;
  /** Compact comma-separated style string for AI Music API custom mode */
  styleString: string;
  /** Human-readable brief for debug/diagnostic logging */
  brief: string;
}

export function buildInstrumentalDescription(p: InstrumentalPayload): BuiltPrompt {
  const genre      = p.genre       ?? "Afrobeats";
  const mood       = p.mood        ?? "Uplifting";
  const bpm        = p.bpm         ?? (GENRE_DEFAULTS[genre] ?? 96);
  const key        = p.key         ?? "F♯ Minor";
  const energy     = p.energy      ?? "Mid";
  const soundRef   = (p.soundReference ?? "").trim();
  const mixFeel    = (p.mixFeel    ?? "").trim();
  const drumDens   = (p.drumDensity ?? "Mid").trim();
  const bassWt     = (p.bassWeight  ?? "Balanced").trim();
  const hitmaker   = p.hitmakerMode ?? false;
  const buildMode  = (p.buildMode   ?? "").trim();

  // ── Beat DNA field extraction ─────────────────────────────────────────────────
  const bounceStyleRaw  = (p.bounceStyle   ?? "").trim();
  const melodyDensRaw   = (p.melodyDensity ?? "").trim();
  const drumCharRaw     = (p.drumCharacter ?? "").trim();
  const hookLiftRaw     = (p.hookLift      ?? "").trim();

  const moodProfile     = getMoodProfile(mood);
  const grooveWord      = GENRE_GROOVE[genre] ?? `${genre} groove`;
  const energyDesc      = resolveEnergyDescriptor(energy, mood);
  const percLine        = resolvePercussionLine(drumDens, bassWt, genre, energy);
  const soundLane       = interpretSoundReference(soundRef);
  const mixDesc         = mixFeel ? resolveMixFeel(mixFeel) : null;
  const buildIntent     = buildMode ? resolveBuildModeIntent(buildMode) : null;
  const hitmakerLine    = resolveHitmakerAdditions(hitmaker, genre, energy);
  const productionCtx   = extractProductionContext(p.productionNotes);

  // ── Beat DNA resolved descriptors ────────────────────────────────────────────
  const bounceDesc  = bounceStyleRaw  ? resolveBounceStyle(bounceStyleRaw)        : null;
  const melodyDesc  = melodyDensRaw   ? resolveMelodyDensityLayer(melodyDensRaw)  : null;
  const drumCharDesc = drumCharRaw    ? resolveDrumCharacterLayer(drumCharRaw)    : null;
  const hookLiftDesc = hookLiftRaw    ? resolveHookLiftLayer(hookLiftRaw)         : null;

  // ── Sentence 1: Core musical identity + Bounce Style ─────────────────────────
  // Bounce Style blends into the groove motion description for the core identity.
  const sentence1 = bounceDesc
    ? `A ${energyDesc} ${grooveWord} in ${key} at ${bpm} BPM — ${bounceDesc}.`
    : `A ${energyDesc} ${grooveWord} in ${key} at ${bpm} BPM.`;

  // ── Sentence 2: Emotional lane + texture + space + Melody Density ─────────────
  // Melody Density modifies the texture layer to reflect how sparse or busy the
  // melodic content should feel — from minimal air to cinematic sweep.
  const textureLayer = melodyDesc ?? moodProfile.texture;
  const sentence2 =
    `${moodProfile.lane.charAt(0).toUpperCase()}${moodProfile.lane.slice(1)} emotional lane` +
    ` — ${textureLayer}, ${moodProfile.space} sonic space.`;

  // ── Sentence 3: Percussion + low end + Drum Character ────────────────────────
  // Drum Character appends a precise engineering descriptor to the percussion line,
  // defining the texture and feel of the rhythm section.
  const sentence3 = drumCharDesc
    ? `${percLine.replace(/\.$/, "")} — ${drumCharDesc}.`
    : percLine;

  // ── Sentence 4: Mix feel / sound lane / production context ───────────────────
  const sentence4Parts: string[] = [];
  if (mixDesc)        sentence4Parts.push(mixDesc.charAt(0).toUpperCase() + mixDesc.slice(1));
  if (soundLane)      sentence4Parts.push(`Direction: ${soundLane}`);
  if (productionCtx)  sentence4Parts.push(productionCtx);
  const sentence4 = sentence4Parts.length ? sentence4Parts.join(". ") + "." : null;

  // ── Sentence 5: Build mode / hitmaker / Hook Lift intent ─────────────────────
  // Hook Lift drives the chorus payoff and replay-engineering intent of the track.
  const sentence5Parts: string[] = [];
  if (buildIntent)   sentence5Parts.push(buildIntent);
  if (hitmakerLine)  sentence5Parts.push(hitmakerLine);
  if (hookLiftDesc)  sentence5Parts.push(hookLiftDesc);
  const sentence5 = sentence5Parts.length ? sentence5Parts.join(". ") + "." : null;

  // ── Sentence 6: Lyrics-aware direction ───────────────────────────────────────
  // When lyrics are present, derive a signal and inject a beat-shaping sentence.
  // The signal is deterministic and does not expose raw lyric content in the prompt.
  const lyricsSignal = p.lyricsText?.trim() ? analyzeLyricsSignal(p.lyricsText) : null;
  const sentence6 = lyricsSignal ? resolveLyricsInfluence(lyricsSignal) : null;

  // ── Assemble final prompt ─────────────────────────────────────────────────────
  const sentences = [sentence1, sentence2, sentence3, sentence4, sentence5, sentence6]
    .filter((s): s is string => Boolean(s?.trim()));

  const prompt = sentences.join(" ") + " Instrumental only, no vocals.";

  // Compact style string for AI Music API custom mode (max 1000 chars for chirp-v4-5+)
  const styleTagParts: string[] = [
    genre,
    `${bpm} BPM`,
    key,
    mood,
    resolveEnergyDescriptor(energy, mood),
    bounceDesc   ? bounceDesc   : null,
    melodyDesc   ? melodyDesc   : null,
    drumCharDesc ? drumCharDesc : null,
    soundRef     ? `inspired by ${soundRef}` : null,
    mixFeel      ? resolveMixFeel(mixFeel)   : null,
    p.productionStyle?.trim() || null,
  ].filter((s): s is string => Boolean(s));
  const styleString = styleTagParts.join(", ").slice(0, 950);

  // Brief for diagnostic logging (stored in sonicNotes)
  const brief = [
    `Genre: ${genre} | BPM: ${bpm} | Key: ${key} | Energy: ${energy} | Mood: ${mood}`,
    soundRef        ? `Sound ref: ${soundRef}`           : null,
    mixFeel         ? `Mix feel: ${mixFeel}`             : null,
    hitmaker        ? "Hitmaker: ON"                     : null,
    buildMode       ? `Build mode: ${buildMode}`         : null,
    bounceStyleRaw  ? `Bounce: ${bounceStyleRaw}`        : null,
    melodyDensRaw   ? `Melody: ${melodyDensRaw}`         : null,
    drumCharRaw     ? `Drum char: ${drumCharRaw}`        : null,
    hookLiftRaw     ? `Hook lift: ${hookLiftRaw}`        : null,
    lyricsSignal    ? `Lyrics: ${lyricsSignal.summary}`  : null,
  ].filter(Boolean).join(" · ");

  return { prompt, styleString, brief };
}

// ─── AI Music API — Lyrics Text Builder ───────────────────────────────────────
// Formats AfroMuse's structured lyrics sections into a single lyrics text block
// for the AI Music API `prompt` field (Custom Mode).
// Section markers ([Verse 1], [Chorus], etc.) help the model understand structure.

/**
 * Formats AfroMuse lyricsSections into a single lyrics block for AI Music API `prompt`.
 * Section markers like [Verse 1], [Chorus] help the model understand song structure.
 */
function buildLyricsText(secs: NonNullable<InstrumentalPayload["lyricsSections"]>): string {
  const parts: string[] = [];
  if (secs.intro?.length)  parts.push("[Intro]\n"   + secs.intro.join("\n"));
  if (secs.verse1?.length) parts.push("[Verse 1]\n" + secs.verse1.join("\n"));
  if (secs.hook?.length)   parts.push("[Chorus]\n"  + secs.hook.join("\n"));
  if (secs.verse2?.length) parts.push("[Verse 2]\n" + secs.verse2.join("\n"));
  if (secs.hook?.length)   parts.push("[Chorus]\n"  + secs.hook.join("\n"));
  if (secs.bridge?.length) parts.push("[Bridge]\n"  + secs.bridge.join("\n"));
  if (secs.hook?.length)   parts.push("[Outro Chorus]\n" + secs.hook.join("\n"));
  if (secs.outro?.length)  parts.push("[Outro]\n"   + secs.outro.join("\n"));
  return parts.join("\n\n").slice(0, 4800); // chirp-v4-5+ supports up to 5000 chars
}



// ─── AI Music API — Live Provider ─────────────────────────────────────────────
// POST /api/v2/generate → receive task_id → poll /api/v2/query?task_id= → audio URL
//
// Two generation modes (mirror the AI Music API doc):
//   Custom Mode      — lyricsSections present  → prompt (lyrics) + style + title
//   Inspiration Mode — no lyrics sections      → gpt_description_prompt + make_instrumental: true
//
// Required env var: AI_MUSIC_API_KEY
// Optional env var: AI_MUSIC_MODEL (default: chirp-v4-5)

const AI_MUSIC_API_BASE = "https://aimusicapi.org";

/**
 * Build the publicly accessible callback URL that AI Music API will POST to
 * when a generation job completes. Falls back to null if the host is unknown
 * (callback will be omitted from the request, polling alone handles completion).
 *
 * Override with CALLBACK_BASE_URL env var for production deployments:
 *   CALLBACK_BASE_URL=https://my-app.replit.app
 */
function buildCallbackUrl(): string | null {
  // Only use a callback URL when CALLBACK_BASE_URL is explicitly set.
  // Auto-generating from REPLIT_DEV_DOMAIN appends :8080 which external
  // services cannot reach through Replit's SSL proxy — causing callbacks
  // to fail silently. Polling alone reliably completes every job.
  const override = process.env.CALLBACK_BASE_URL?.replace(/\/$/, "");
  if (override) return `${override}/api/instrumental/callback`;
  return null;
}

async function callLiveInstrumentalProvider(
  p: InstrumentalPayload,
  jobId: string,
): Promise<LiveInstrumentalProviderResponse> {
  const apiKey = process.env.AI_MUSIC_API_KEY ?? process.env.INSTRUMENTAL_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AI_MUSIC_API_KEY is not configured. Set the secret to enable live music generation.",
    );
  }

  const model = p.aiMusicModel ?? process.env.AI_MUSIC_MODEL ?? "chirp-v4-5";
  const secs  = p.lyricsSections ?? {};
  const hasLyrics =
    (secs.hook?.length   ?? 0) > 0 ||
    (secs.verse1?.length ?? 0) > 0;

  const { prompt: descPrompt, styleString, brief } = buildInstrumentalDescription(p);

  const base = process.env.CALLBACK_BASE_URL?.replace(/\/$/, "");

  const callbackUrl = base
    ? `${base}/api/instrumental/callback`
    : null;

  console.log("CALLBACK BASE:", process.env.CALLBACK_BASE_URL);
  console.log("FINAL CALLBACK URL:", callbackUrl);
  let requestBody: Record<string, unknown>;

  let lyricsText: string | null = null;

  if (hasLyrics) {
    lyricsText = buildLyricsText(secs);

    // ✅ Custom Mode (WITH lyrics)
    requestBody = {
      model,
      prompt: lyricsText,
      style: styleString,
      title: p.title ?? `${p.genre ?? "Afrobeats"} — ${p.mood ?? "Uplifting"}`,
      make_instrumental: false,
      gender: p.gender ?? "male",

      ...(callbackUrl && { callback_url: callbackUrl }),

      ...(p.styleWeight != null && { style_weight: p.styleWeight }),
      ...(p.weirdnessConstraint != null && { weirdness_constraint: p.weirdnessConstraint }),
      ...(p.audioWeight != null && { audio_weight: p.audioWeight }),
      ...(p.negativeTags?.trim() && { tags: p.negativeTags.trim() }),
    };

    logger.info({
      jobId,
      model,
      style: styleString.slice(0, 80),
      lyricsChars: lyricsText?.length ?? 0,
      callbackUrl
    }, "AI Music API — Custom Mode");

  } else {
    // ✅ Inspiration Mode (NO lyrics)
    requestBody = {
      model,
      gpt_description_prompt: descPrompt,
      make_instrumental: true,

      ...(callbackUrl && { callback_url: callbackUrl }),

      ...(p.styleWeight != null && { style_weight: p.styleWeight }),
      ...(p.weirdnessConstraint != null && { weirdness_constraint: p.weirdnessConstraint }),
      ...(p.audioWeight != null && { audio_weight: p.audioWeight }),
      ...(p.negativeTags?.trim() && { tags: p.negativeTags.trim() }),
    };

    logger.info({
      jobId,
      model,
      prompt: descPrompt.slice(0, 100),
      callbackUrl
    }, "AI Music API — Inspiration Mode");
  }

  // ── Step 1: Submit generation job ─────────────────────────────────────────
  const genRes = await fetch(`${AI_MUSIC_API_BASE}/api/v2/generate`, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type":  "application/json",
    },
    body:   JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30_000),
  });

  if (!genRes.ok) {
    const errText = await genRes.text().catch(() => genRes.statusText);
    throw new Error(`AI Music API generate failed: ${genRes.status} — ${errText.slice(0, 300)}`);
  }

  const genData = (await genRes.json()) as { workId?: string; data?: { task_id?: string } };
  const taskId  = genData.data?.task_id ?? genData.workId;
  if (!taskId) throw new Error("AI Music API: no task_id in generate response");

  // Register task in callback store so the webhook handler can deliver results early.
  registerTask(taskId);

  logger.info({ jobId, taskId, callbackUrl },
    "AI Music API — generation submitted, polling for result (callback also active)");

  // ── Step 2: Poll /api/v2/query?task_id= until completed ───────────────────
  // The callback endpoint delivers results faster when callback_url is set.
  // We check the callback store on each iteration to short-circuit polling.
  const POLL_URL           = `${AI_MUSIC_API_BASE}/api/v2/query?task_id=${taskId}`;
  const POLL_INTERVAL_MS   = 6_000;   // 6 s between polls
  const MAX_POLLS          = 20;      // up to 5 minutes total (aimusicapi.org can take 3–4 min)

  let audioUrl: string | null = null;
  let generationTitle: string | null = null;
  let coverArtUrl:     string | null = null;

  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    logger.info({ jobId, attempt }, "Polling AI Music API...");

    const cbResult = getCallbackResult(taskId);
    if (cbResult) {
      audioUrl        = cbResult.audioUrl;
      generationTitle = cbResult.title ?? null;
      coverArtUrl     = cbResult.imageUrl ?? null;

      logger.info({ jobId, taskId, attempt, audioUrl: (audioUrl ?? "").slice(0, 60) },
        "AI Music API — result delivered via callback");
      break;
    }

    const pollRes = await fetch(POLL_URL, {
      headers: { "Authorization": `Bearer ${apiKey}` },
      signal:  AbortSignal.timeout(15_000),
    }).catch((err) => {
      logger.warn({ jobId, attempt, err }, "AI Music API poll request error — retrying");
      return null;
    });

    if (pollRes?.ok) {
      const pollData = (await pollRes.json()) as { code?: number; data?: unknown };
      const data = pollData.data;
      const tracks: Array<Record<string, unknown>> = Array.isArray(data)
        ? data as Array<Record<string, unknown>>
        : data && typeof data === "object"
          ? [data as Record<string, unknown>]
          : [];

      const failed = tracks.find((t) =>
        t.status === "failed" || t.status === "error" || Boolean(t.error),
      );
      if (failed) {
        clearTask(taskId);
        logger.error({ jobId, taskId, failed }, "AI Music API generation failed");
        throw new Error(`AI Music API generation failed (task_id: ${taskId})`);
      }

      const done = tracks.find((t) =>
        t.status === "completed" || t.status === "succeed" || Boolean(t.audio_url),
      );
      if (done) {
        audioUrl        = typeof done.audio_url === "string" ? done.audio_url : typeof done.stream_audio_url === "string" ? done.stream_audio_url : null;
        generationTitle = typeof done.title === "string" ? done.title : null;
        coverArtUrl     = typeof done.image_url === "string" ? done.image_url : typeof done.cover_url === "string" ? done.cover_url : null;
        logger.info({ jobId, taskId, attempt, audioUrl: audioUrl?.slice(0, 60) },
          "AI Music API — generation complete (poll)");
        break;
      }
    }

    logger.info({ jobId, taskId, attempt }, "AI Music API — still processing, polling again");
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  clearTask(taskId);

  if (!audioUrl) {
    throw new Error(`AI Music API: timed out after ${MAX_POLLS} polls (task_id: ${taskId})`);
  }

  const sonicNotes = `[AfroMuse Brief] ${brief}`;

  return {
    previewUrl:      audioUrl,
    wavUrl:          null,
    externalJobId:   taskId,
    generationTitle: generationTitle ?? `${p.genre ?? "Afrobeats"} ${hasLyrics ? "Full Song" : "Instrumental"}`,
    sonicNotes,
    duration:        null,
    coverArtUrl,
    waveformMeta:    null,
  };
}

// ─── Live Execution Path ──────────────────────────────────────────────────────
// Calls the real provider, enriches the response with the AI session brief,
// maps everything into RawInstrumentalResponse, and normalizes through the adapter.

async function runLive(jobId: string, p: InstrumentalPayload): Promise<NormalizedResponse> {
  logger.info({ jobId, genre: p.genre, mood: p.mood }, "Instrumental live execution starting");

  // Call the real beat-generation provider
  const liveResponse = await callLiveInstrumentalProvider(p, jobId);

  // Base metadata from the payload
  const metadata = buildBaseMetadata(p);

  // Overlay the provider's duration if it returned one
  if (liveResponse.duration) {
    metadata.duration = liveResponse.duration;
  }

  // Enrich with AI session brief (runs alongside live audio — always attempted)
  let aiBrief: Partial<SessionBlueprintData> | null = null;
  try {
    aiBrief = await fetchAiSessionBrief(p, jobId);
  } catch (err) {
    logger.warn({ err, jobId }, "Instrumental AI brief failed during live run — continuing without enrichment");
  }

  const blueprintData: Partial<SessionBlueprintData> = { ...metadata, ...(aiBrief ?? {}) };

  // Map the live response into the RawInstrumentalResponse shape
  const raw: RawInstrumentalResponse = {
    jobId,
    status: "completed",
    audioUrl: liveResponse.previewUrl,          // real beat audio URL from provider
    wavUrl: liveResponse.wavUrl,                // WAV download URL from provider
    blueprintData,
    externalJobId: liveResponse.externalJobId,  // provider's own track/job ID
    previewUrl: liveResponse.previewUrl,         // short preview clip (same as audioUrl here)
    coverArt: liveResponse.coverArtUrl,          // generated cover art from provider
  };

  logger.info(
    {
      jobId,
      hasAudio: !!raw.audioUrl,
      externalJobId: raw.externalJobId,
      hasAiBrief: !!aiBrief,
    },
    "Instrumental live execution complete",
  );

  return adaptInstrumental(raw);
}

// ─── Provider Entry Point ─────────────────────────────────────────────────────
// Resolves the engine mode and dispatches to the correct execution path.
// Routes and the UI always call this function — they never see mock vs live.

export async function run(jobId: string, p: InstrumentalPayload): Promise<NormalizedResponse> {
  const resolved = resolveProviderMode("instrumental");

  logger.info(
    {
      jobId,
      resolvedMode: resolved.resolvedMode,
      modeSource: resolved.source,
      canRun: resolved.canRun,
    },
    "Instrumental provider resolved",
  );

  // ── Disabled ─────────────────────────────────────────────────────────────────
  if (!resolved.canRun || resolved.resolvedMode === "disabled") {
    const reason = resolved.disabledReason ?? "Instrumental provider is disabled";
    logger.warn({ jobId, reason }, "Instrumental provider disabled — returning clean failure");
    return buildFailureResponse(jobId, "instrumental", "unsupported_mode", reason);
  }

  // ── Live ──────────────────────────────────────────────────────────────────────
  if (resolved.resolvedMode === "live") {
    try {
      return await runLive(jobId, p);
    } catch (err) {
      logger.error({ err, jobId }, "Instrumental live provider failed — evaluating fallback");
      const fallback = await executeFallback(
        jobId,
        "instrumental",
        err,
        () => runMock(jobId, p),
      );
      if (!fallback.usedFallback) {
        logger.warn({ jobId, reason: fallback.reason }, "Instrumental: clean failure (no fallback)");
      } else {
        logger.info({ jobId }, "Instrumental: fell back to mock successfully");
      }
      return fallback.response;
    }
  }

  // ── Mock (default) ───────────────────────────────────────────────────────────
  return runMock(jobId, p);
}
