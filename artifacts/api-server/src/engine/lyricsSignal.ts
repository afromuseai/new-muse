/**
 * AfroMuse Lyrics Signal Analyzer (Server-side)
 *
 * Derives a compact musical intelligence signal from lyrics text.
 * Used to shape both the ElevenLabs Music API prompt and the NVIDIA AI brief
 * without exposing raw lyric content or cluttering the API contract.
 *
 * Signals are lightweight, deterministic, and produce actionable musical
 * direction — not a verbose description of the lyrics themselves.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type LyricsEmotionalLane =
  | "romantic"      // love, intimacy, warmth, vulnerability
  | "street"        // hustle, confidence, grind, survival, swagger
  | "spiritual"     // faith, prayer, worship, transcendence
  | "celebratory"   // party, dance, joy, collective release
  | "reflective"    // introspection, longing, memory, loss
  | "neutral";

export interface LyricsSignal {
  /** Dominant emotional lane detected from the lyrics */
  emotionalLane: LyricsEmotionalLane;
  /** Overall energy the lyrics imply for the beat */
  energyModifier: "soft" | "mid" | "driven";
  /** Melodic texture density the lyrics suggest */
  melodicWeight: "gentle" | "balanced" | "intense";
  /** Strength of hook/chorus payoff potential */
  hookPotential: "high" | "medium" | "low";
  /** How repetitive and mantra-like the lyrics are */
  repetitionLevel: "high" | "medium" | "low";
  /** Scale of the lyrical world: intimate vs. performance */
  intimacyScale: "intimate" | "mid-scale" | "performance";
  /** Whether the lyrics lean narrative or vibe-led */
  storytellingWeight: "narrative" | "vibe-led" | "balanced";
  /** Compact one-line summary for diagnostics and logging */
  summary: string;
}

// ─── Keyword Banks ────────────────────────────────────────────────────────────

const LANE_KEYWORDS: Record<LyricsEmotionalLane, string[]> = {
  romantic: [
    "love", "heart", "miss", "feel", "baby", "darling", "kiss", "hold me",
    "close to", "tender", "forever", "together", "need you", "want you",
    "your touch", "your eyes", "night with you", "missing you", "skin", "warmth",
  ],
  street: [
    "hustle", "money", "grind", "flex", "road", "block", "trap", "shine",
    "boss", "loyalty", "bread", "survive", "real", "streets", "gang", "never fold",
    "came from", "started from", "grind", "no days off", "paid", "drip",
  ],
  spiritual: [
    "pray", "god", "lord", "faith", "spirit", "bless", "heaven", "holy",
    "grace", "worship", "church", "amen", "zion", "divine", "jesus", "jah",
    "altar", "kneel", "miracle", "hallelujah", "savior", "mercy",
  ],
  celebratory: [
    "dance", "night", "vibe", "move", "club", "lit", "turn up", "groove",
    "fire", "celebrate", "energy", "crowd", "party", "dj", "sip", "feel good",
    "we out", "tonight", "let loose", "vibes only",
  ],
  reflective: [
    "remember", "used to", "yesterday", "miss", "gone", "lost", "alone",
    "thinking", "wondering", "wish", "if only", "looking back", "changed",
    "still", "what could have been", "far away", "without you",
  ],
  neutral: [],
};

const ENERGY_HIGH_SIGNALS = [
  "fire", "turn up", "let's go", "run it", "energy", "lit", "hustle",
  "grind", "fight", "push", "power", "loud", "never stop", "go hard",
];

const ENERGY_SOFT_SIGNALS = [
  "slow", "gentle", "soft", "quiet", "peace", "still", "calm", "breathe",
  "lay", "whisper", "light", "easy", "tender", "hush", "drift",
];

const HOOK_PHONETIC_SIGNALS = [
  "oh oh", "na na", "la la", "hey hey", "yeah yeah", "aye", "eh eh",
  "wo wo", "no no", "come on", "feel it", "say it", "uh uh", "hmm",
];

// ─── Analyzer ─────────────────────────────────────────────────────────────────

export function analyzeLyricsSignal(lyricsText: string): LyricsSignal | null {
  if (!lyricsText || lyricsText.trim().length < 30) return null;

  const lower = lyricsText.toLowerCase();
  const lines = lyricsText.split(/\n/).filter((l) => l.trim().length > 0);
  const totalWords = lower.split(/\s+/).length;

  // ── Emotional lane detection ────────────────────────────────────────────────
  const scores: Record<LyricsEmotionalLane, number> = {
    romantic: 0, street: 0, spiritual: 0, celebratory: 0, reflective: 0, neutral: 0,
  };

  for (const [lane, keywords] of Object.entries(LANE_KEYWORDS) as [LyricsEmotionalLane, string[]][]) {
    if (lane === "neutral") continue;
    for (const kw of keywords) {
      let pos = lower.indexOf(kw);
      while (pos !== -1) {
        scores[lane]++;
        pos = lower.indexOf(kw, pos + kw.length);
      }
    }
  }

  let emotionalLane: LyricsEmotionalLane = "neutral";
  let bestScore = 0;
  for (const [lane, score] of Object.entries(scores) as [LyricsEmotionalLane, number][]) {
    if (lane !== "neutral" && score > bestScore) { bestScore = score; emotionalLane = lane; }
  }

  // ── Energy modifier ─────────────────────────────────────────────────────────
  let highCount = 0;
  let softCount = 0;
  for (const sig of ENERGY_HIGH_SIGNALS) {
    if (lower.includes(sig)) highCount++;
  }
  for (const sig of ENERGY_SOFT_SIGNALS) {
    if (lower.includes(sig)) softCount++;
  }
  const energyModifier: "soft" | "mid" | "driven" =
    highCount > softCount + 1 ? "driven"
    : softCount > highCount + 1 ? "soft"
    : "mid";

  // ── Melodic weight ──────────────────────────────────────────────────────────
  const melodicWeight: "gentle" | "balanced" | "intense" =
    (emotionalLane === "spiritual" || emotionalLane === "reflective") && energyModifier !== "driven"
      ? "gentle"
    : (emotionalLane === "street" || emotionalLane === "celebratory") && energyModifier === "driven"
      ? "intense"
    : "balanced";

  // ── Hook potential ──────────────────────────────────────────────────────────
  let hookSignalCount = 0;
  for (const sig of HOOK_PHONETIC_SIGNALS) {
    if (lower.includes(sig)) hookSignalCount++;
  }
  const hookPotential: "high" | "medium" | "low" =
    hookSignalCount >= 2 ? "high" : hookSignalCount === 1 ? "medium" : "low";

  // ── Repetition level ────────────────────────────────────────────────────────
  const lineSet = new Set(lines.map((l) => l.trim().toLowerCase()));
  const uniqueRatio = lineSet.size / Math.max(1, lines.length);
  const repetitionLevel: "high" | "medium" | "low" =
    uniqueRatio < 0.5 ? "high" : uniqueRatio < 0.75 ? "medium" : "low";

  // ── Intimacy scale ──────────────────────────────────────────────────────────
  const intimacyScale: "intimate" | "mid-scale" | "performance" =
    emotionalLane === "romantic" || emotionalLane === "reflective" ? "intimate"
    : (emotionalLane === "celebratory" || (emotionalLane === "street" && energyModifier === "driven"))
      ? "performance"
    : "mid-scale";

  // ── Storytelling weight ─────────────────────────────────────────────────────
  const storytellingWeight: "narrative" | "vibe-led" | "balanced" =
    hookSignalCount >= 2 && repetitionLevel === "high" ? "vibe-led"
    : uniqueRatio > 0.85 && totalWords > 80 ? "narrative"
    : "balanced";

  // ── Summary ─────────────────────────────────────────────────────────────────
  const summary = [
    emotionalLane !== "neutral" ? `${emotionalLane} lane` : "neutral lane",
    `${energyModifier} energy`,
    `${melodicWeight} melodic weight`,
    hookPotential !== "low" ? `${hookPotential} hook potential` : null,
    repetitionLevel === "high" ? "high repetition" : null,
    storytellingWeight !== "balanced" ? storytellingWeight : null,
  ].filter(Boolean).join(", ");

  return {
    emotionalLane, energyModifier, melodicWeight,
    hookPotential, repetitionLevel, intimacyScale,
    storytellingWeight, summary,
  };
}

// ─── Prompt Influence Builder ─────────────────────────────────────────────────
// Translates a LyricsSignal into a concrete ElevenLabs prompt sentence.

export function resolveLyricsInfluence(signal: LyricsSignal): string | null {
  const parts: string[] = [];

  // Emotional lane → texture, space, and attitude
  const laneInfluence: Record<LyricsEmotionalLane, string | null> = {
    romantic:    "softer melodic textures, warmer harmonic space, and consistent vocal breathing room throughout",
    street:      "stronger percussion attitude, firmer assertive low end, and confident swagger in the groove",
    spiritual:   "restraint and openness — ambient harmonic lift, emotional breathing space, and reverent warmth",
    celebratory: "bright high-replay chorus energy, wide festive arrangement, and rhythmic momentum built for movement",
    reflective:  "smooth, understated arrangement support with emotional pacing and quiet melodic movement",
    neutral:     null,
  };

  const laneStr = laneInfluence[signal.emotionalLane];
  if (laneStr) parts.push(laneStr);

  // Hook potential and repetition → chorus lift architecture
  if (signal.hookPotential === "high" || signal.repetitionLevel === "high") {
    parts.push("chorus payoff and replay energy engineered for maximum hook retention");
  }

  // Storytelling → arrangement smoothness
  if (signal.storytellingWeight === "narrative") {
    parts.push("smooth steady arrangement that serves lyrical storytelling without competing movement");
  }

  if (!parts.length) return null;

  return `Lyrics-aware direction: ${parts.join(" — ")}.`;
}

// ─── AI Brief Lyrics Context Builder ─────────────────────────────────────────
// Formats the lyrics signal into producer-voice context for the NVIDIA AI prompt.

export function buildLyricsAiContext(signal: LyricsSignal): string {
  const lines: string[] = [
    `LYRICS SIGNAL: ${signal.summary}`,
    `LYRICAL LANE: ${signal.emotionalLane}`,
    `LYRICAL ENERGY: ${signal.energyModifier}`,
    `MELODIC WEIGHT: ${signal.melodicWeight}`,
    `HOOK POTENTIAL: ${signal.hookPotential}`,
    `STORYTELLING STYLE: ${signal.storytellingWeight}`,
    `INTIMACY SCALE: ${signal.intimacyScale}`,
    ``,
    `Use this lyrical signal to shape the "arrangementMap", "producerNotes", "sessionBrief", and "sonicIdentity" fields.`,
    `The beat should feel built around this song — not separate from it.`,
    `If the lane is romantic: leave melodic breathing room. If street: strengthen the low end confidence. If spiritual: prioritize space over density.`,
    `If hook potential is high: engineer maximum chorus replay architecture.`,
  ];
  return lines.join("\n");
}
