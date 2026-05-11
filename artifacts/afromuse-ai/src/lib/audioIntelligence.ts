/**
 * AfroMuse Audio Intelligence Engine
 * Provides genre-aware, section-aware, energy-aware, and lyrics-aware
 * content for the Audio Studio V2 result cards.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type LyricsTone =
  | "spiritual"  // pray, god, jah, faith, spirit, bless
  | "intimate"   // love, heart, miss, feel, tears, longing
  | "street"     // hustle, money, grind, flex, road, block
  | "party"      // dance, night, vibe, move, club, lit
  | "defiant"    // rise, fight, free, stand, overcome
  | "neutral";

export type StyleInfluence =
  | "lagos-warm"        // Burna, WizKid — groove pocket, minimal, melodic ease
  | "street-anthem"     // Davido, Shallipopi — anthemic, crowd energy, big hooks
  | "afro-trap"         // Asake, Shatta Wale — sparse space, rhythmic, patois-lean
  | "soul-intimacy"     // Omah Lay, Tems — moody, soft RnB, smooth transitions
  | "spiritual-lift"    // church, gospel, worship references
  | "club-pressure"     // banger, club, turn up, lit
  | "chill-groove"      // mellow, slow, chill, relaxed
  | "neutral";

export interface StemDef {
  label: string;
  color: string;
  note: string;
  pct: number; // 0–100 visual fill weight
}

export interface VocalSection {
  label: string;
  note: string;
  color: string;
}

export interface AudioIntelligence {
  stems: StemDef[];
  vocalSections: VocalSection[];
  arrangementStyle: string;
  hookFocus: string;
  producerNotes: string;
  sectionFocus: string;
  lyricsTone: LyricsTone;
  styleInfluence: StyleInfluence;
  beatSummary: string;        // one-line beat description for Artist mode
  arrangementMap: string;     // section map string for Producer mode
}

// ─────────────────────────────────────────────────────────────────────────────
// Genre Profiles
// ─────────────────────────────────────────────────────────────────────────────

interface GenreProfile {
  character: string;
  kick: { low: string; medium: string; high: string };
  snare: { low: string; medium: string; high: string };
  bass: { low: string; medium: string; high: string };
  pads: string;
  melody: string;
  perc: string;
  hookStyle: string;
  verseStyle: string;
  bridgeStyle: string;
  arrangement: string;
  vocalCharacter: string;
  transitionFeel: string;
  stemWeights: { kick: number; bass: number; pads: number; melody: number; perc: number };
}

const GENRE_PROFILES: Record<string, GenreProfile> = {
  Afrobeats: {
    character: "groove pocket, bounce, melodic ease",
    kick: {
      low:    "Soft kick on beat 1 only — breathes with the bass",
      medium: "Syncopated kick with light ghost on the 2-and — drives the groove",
      high:   "Heavy syncopated kick, layered with a punchy sub-hit on off-beats",
    },
    snare: {
      low:    "Clap sits lightly on beat 3 — open, airy feel",
      medium: "Tight snare on beat 3 with a shaker ghost on the 2-and-4",
      high:   "Snare doubled with rim — maximum crack, shaker locked into pocket",
    },
    bass: {
      low:    "Warm melodic sub — single note holds, moves every 4 bars",
      medium: "Melodic pocket bass — moves with the hook, F# root with slides",
      high:   "Deep rolling melodic bass — aggressive pocket movement, side-chained to kick",
    },
    pads: "Warm major 7th chords, light reverb, wide stereo image, slight filter movement on the chorus lift",
    melody: "Pluck or thumb piano lead — carries the hook melodically, sits just above the vocal",
    perc: "Shaker on the 2-and-4 is non-negotiable. Add light conga on the off-beats for cultural texture",
    hookStyle: "Melodic lift — the hook should float, feel effortless, repeat without fatigue",
    verseStyle: "Conversational, easy-ride cadence — verse breathes, gives room before the hook explodes",
    bridgeStyle: "Strip the arrangement — kick and bass only, let the vocal carry",
    arrangement: "Intro pads only → Verse bass + kick → Pre-chorus adds shaker + melody → Chorus full layering",
    vocalCharacter: "Smooth chest voice, melodic phrasing, ad-libs float above the hook",
    transitionFeel: "Smooth filter sweep into chorus, no hard cuts — let the energy build naturally",
    stemWeights: { kick: 72, bass: 80, pads: 65, melody: 78, perc: 70 },
  },
  Dancehall: {
    character: "rhythm aggression, drum attack, chant energy",
    kick: {
      low:    "One-drop kick on beat 1 — traditional roots feel, sparse space",
      medium: "Steppers pattern — kick on every beat, mid-weight attack",
      high:   "Hard steppers or flying cymbal — aggressive 4-on-the-floor with cymbal crash weight",
    },
    snare: {
      low:    "Rimshot on beat 3 — dry, authentic one-drop texture",
      medium: "Crisp rimshot with ghost notes rolling on the off-beats",
      high:   "Full snare crack on 3 with rolling hi-hat aggression — maximum pressure",
    },
    bass: {
      low:    "Dark, deep sub — holds the root, slow melodic fill every 8 bars",
      medium: "Rolling ragga bass — bouncing pattern locked to the kick with aggressive sub pressure",
      high:   "Maximum sub pressure — chest-rumble bass, heavy sidechain, fills on the 4",
    },
    pads: "Stab organ or skank guitar on the off-beats — 2-and-4, dry, punchy, wide pan",
    melody: "Synth horn or brass stab on the chorus hit-points — punchy, short, aggressive",
    perc: "Rim-click rhythm track, authentic dancehall snare roll fills before section transitions",
    hookStyle: "Chant-ready — crowd call-and-response pocket, aggressive repetition, punch on the 1",
    verseStyle: "Toast-style delivery — rhythmic, almost spoken, locked into the drum pocket",
    bridgeStyle: "Bass and rimshot only — strip everything, then full blast back for the final chorus",
    arrangement: "Hard intro beat → Verse toast over bass + drums → Chorus maximum pressure → Bridge stripped → Finale full",
    vocalCharacter: "Gritty chest voice, slight rasp, patois cadence — verses punch, hook screams",
    transitionFeel: "Hard cut transitions — no fade, no sweep, straight impact",
    stemWeights: { kick: 88, bass: 85, pads: 58, melody: 60, perc: 75 },
  },
  Amapiano: {
    character: "log drum movement, sparse space, groove repetition",
    kick: {
      low:    "Log drum sits alone — sparse, deliberate, lounge feel",
      medium: "Mid-weight log drum pattern — the groove repeats, locks into the bass",
      high:   "Full log drum with additional kick layer — club-ready, hypnotic weight",
    },
    snare: {
      low:    "Clap on beat 3 only — wide reverb tail, spacious",
      medium: "Clap with snare rim — moderate punch, space preserved",
      high:   "Snare roll fills before the drop — builds tension before the log drum resets",
    },
    bass: {
      low:    "Piano bass — sparse, melodic, single notes breathe",
      medium: "Rolling piano bass with sub-bass under it — melodic movement, hypnotic",
      high:   "Heavy sub + piano bass layered — maximum low-end groove, club-pressure bass",
    },
    pads: "Jazzy piano chords — loose, slightly behind the beat, warm Rhodes feel with slow decay",
    melody: "Log drum IS the melody hook — flute or synth over the top for lift, sparsely placed",
    perc: "Shaker and tambourine — light, airy, fills the space without crowding the log drum",
    hookStyle: "Groove repetition — the hook builds through repetition and layering, not melody alone",
    verseStyle: "Spoken-word or laid-back delivery over the piano groove — space is the feature",
    bridgeStyle: "Piano solo only — maximum space, let the log drum breathe alone",
    arrangement: "Sparse piano intro → Bass enters → Log drum locks in → Melody layer added → Drop and repeat",
    vocalCharacter: "Airy, breathy delivery — no aggression, melodic phrasing, lounge feel on verses",
    transitionFeel: "Filter sweep up — long, atmospheric build before the log drum drops back",
    stemWeights: { kick: 65, bass: 70, pads: 85, melody: 60, perc: 68 },
  },
  Gospel: {
    character: "emotional lift, spacious harmony, reverent warmth",
    kick: {
      low:    "Light kick — space and breath, lets the harmony carry the weight",
      medium: "Moderate kick on 1 and 3 — supportive, not dominant, choir breathes above it",
      high:   "Full gospel kick — driving, joyful energy, church-dance ready",
    },
    snare: {
      low:    "Brushed snare — soft, reverent, barely there",
      medium: "Snare on beat 2 and 4 — classic gospel feel, supportive warmth",
      high:   "Cracking snare with full gospel energy — clap-driven, full congregation feel",
    },
    bass: {
      low:    "Organ bass — warm, sustained root notes, very minimal movement",
      medium: "Walking bass line — melodic gospel movement, follows the chord progression",
      high:   "Full bass + bass guitar layered — rich, warm, drives the congregation lift",
    },
    pads: "Lush gospel organ or choir pad — wide, warm, full harmony stack, reverb-soaked",
    melody: "Piano lead — hymn-style melodic movement that rises with the vocal phrasing",
    perc: "Tambourine on the 2-and-4 — essential gospel percussion, keeps the joy alive",
    hookStyle: "Emotional lift — the hook rises, builds, gives space for congregational response",
    verseStyle: "Intimate, prayerful storytelling — verse speaks before the chorus rises",
    bridgeStyle: "Choir only — vocals stripped bare, emotional peak, let the harmony carry",
    arrangement: "Intro piano → Verse bass + keys → Pre-chorus choir enters → Chorus full glory → Bridge stripped vocal",
    vocalCharacter: "Full chest voice on the chorus, intimate and raw on verses, choir layer on hook",
    transitionFeel: "Gradual swell — let the harmony build, no hard cuts, reverence in every transition",
    stemWeights: { kick: 55, bass: 68, pads: 92, melody: 78, perc: 60 },
  },
  "Afro-fusion": {
    character: "intimacy, melodic smoothness, emotional phrasing",
    kick: {
      low:    "Very soft kick — almost felt not heard, space is the priority",
      medium: "Mid-weight kick with subtle afro bounce — groove without aggression",
      high:   "Warmer kick with some punch — afro-RnB feel, still smooth",
    },
    snare: {
      low:    "Snare barely whispers — brush technique, wide reverb",
      medium: "Soft snare on beat 3 — smooth, non-intrusive",
      high:   "Crisp snare with light echo — punchy enough for the drop, still intimate",
    },
    bass: {
      low:    "Fretless bass — melodic, smooth, holds root notes long",
      medium: "Melodic bass movement — follows the vocal phrasing, warm and close",
      high:   "Full melodic bass with sub layer — rich groove, still smooth",
    },
    pads: "Moody minor 9th or sus4 chords — atmospheric, cinematic, wide with slow filter movement",
    melody: "Guitar plucks or marimba — delicate, emotional, sits in the space between vocal phrases",
    perc: "Very light shaker, light bongo — keeps pulse without cluttering the intimacy",
    hookStyle: "Smooth melodic pull — hook feels inevitable, emotional, never forced",
    verseStyle: "Intimate phrasing — close-mic feel, emotional storytelling, wide dynamic range",
    bridgeStyle: "Minimal — one instrument and voice, maximum vulnerability",
    arrangement: "Slow intro with atmospheric pad → Verse bass + light drums → Chorus opens wide → Bridge back to minimal",
    vocalCharacter: "Breathy and raw on verses, full emotional swell on the chorus, delicate control throughout",
    transitionFeel: "Reverb trail — let sounds decay into each other, no hard edges",
    stemWeights: { kick: 52, bass: 72, pads: 88, melody: 82, perc: 48 },
  },
  "R&B Afro": {
    character: "intimacy, melodic smoothness, moody textures",
    kick: {
      low:    "808 sub-kick — felt more than heard, spacious and modern",
      medium: "Mid-808 with snap — modern RnB pocket, controlled",
      high:   "Full 808 with layered acoustic kick — punchy, trap-influenced RnB energy",
    },
    snare: {
      low:    "Clap with long reverb — spacious, modern RnB feel",
      medium: "Snare with clap layer — balanced, sits in the groove",
      high:   "Hard snare with rim — maximum punch for the hook section",
    },
    bass: {
      low:    "Sub-only bass — pure low-end, minimal movement, moody",
      medium: "808 bass with melodic movement — modern RnB groove, follows the melody",
      high:   "Full 808 + melodic bass — heavy, emotional, aggressive for the genre",
    },
    pads: "Moody synthesizer chords — soft attack, warm decay, minor or diminished feel",
    melody: "Soft guitar or synth lead — stays behind the vocal, fills space without dominating",
    perc: "Hi-hat rolls and traps — modern RnB trap-lite percussion, sits light in the mix",
    hookStyle: "Smooth emotional pull — hook must feel personal, almost spoken to one person",
    verseStyle: "Intimate conversational delivery — close to the listener, vulnerable phrasing",
    bridgeStyle: "Drop everything except pads — raw emotional peak, voice and atmosphere",
    arrangement: "Minimal intro → Verse 808 + light percussion → Pre-chorus melody builds → Chorus full warmth",
    vocalCharacter: "Smooth and breathy on verse, full melisma on hook, ad-libs trail the main vocal",
    transitionFeel: "Smooth filter + reverb swell — no jarring cuts, everything bleeds together",
    stemWeights: { kick: 62, bass: 78, pads: 82, melody: 74, perc: 65 },
  },
  "Street Pop": {
    character: "energy, street confidence, big hooks",
    kick: {
      low:    "Mid-punch kick — confident, not heavy, controlled street feel",
      medium: "Punchy kick with slight distortion — modern street energy, locked to the bass",
      high:   "Heavy distorted kick — maximum street pressure, aggressive",
    },
    snare: {
      low:    "Tight snare, dry — punchy but not overwhelming",
      medium: "Full snare with clap layer — street anthem feel",
      high:   "Hard snare with reverb snap — aggressive, anthem-coded",
    },
    bass: {
      low:    "Punchy sub — tight, controlled, defines the groove",
      medium: "Rolling bass with sub layer — street groove, melodic fills",
      high:   "Heavy distorted bass + sub — maximum street pressure",
    },
    pads: "Urban synthesizer — wide stereo, slightly aggressive chord voicings, energetic movement",
    melody: "Synth hook or guitar — sharp, catchy, easily hummed after one listen",
    perc: "Hi-hat patterns — rolling, energetic, 16th-note trap-influenced fills",
    hookStyle: "Anthemic crowd-ready — hook must work over a speaker at a street party",
    verseStyle: "Confident, punchy delivery — rhythm matters, every line lands",
    bridgeStyle: "Half-time feel — drop the tempo feel, build tension, then back to full force",
    arrangement: "Hard intro with hook preview → Verse bass + drums → Chorus full blast → Bridge half-time → Final chorus maximum",
    vocalCharacter: "Confident, punchy verses — hook is full chest, street-festival ready",
    transitionFeel: "Riser + impact — fill before every major section, hard landing on the 1",
    stemWeights: { kick: 82, bass: 84, pads: 65, melody: 72, perc: 78 },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Lyrics Tone Analyzer
// ─────────────────────────────────────────────────────────────────────────────

const TONE_KEYWORDS: Record<LyricsTone, string[]> = {
  spiritual: ["pray", "god", "jah", "lord", "faith", "spirit", "bless", "heaven", "holy", "grace", "worship", "church", "amen", "zion", "divine"],
  intimate:  ["love", "heart", "miss", "feel", "longing", "tears", "hold", "close", "baby", "darling", "tender", "touch", "kiss", "forever", "alone"],
  street:    ["hustle", "money", "grind", "flex", "road", "block", "trap", "shine", "boss", "gang", "loyalty", "bread", "real", "gutter", "survive"],
  party:     ["dance", "night", "vibe", "move", "club", "lit", "turn up", "body", "groove", "fire", "celebrate", "sip", "energy", "crowd", "dj"],
  defiant:   ["rise", "fight", "free", "stand", "overcome", "refuse", "never give up", "stronger", "break", "chains", "truth", "power", "voice", "loud"],
  neutral:   [],
};

export function analyzeLyricsTone(lyrics: string): LyricsTone {
  if (!lyrics || lyrics.trim().length < 20) return "neutral";
  const lower = lyrics.toLowerCase();
  const scores: Record<LyricsTone, number> = {
    spiritual: 0, intimate: 0, street: 0, party: 0, defiant: 0, neutral: 0,
  };
  for (const [tone, words] of Object.entries(TONE_KEYWORDS) as [LyricsTone, string[]][]) {
    if (tone === "neutral") continue;
    for (const word of words) {
      // count occurrences
      let pos = lower.indexOf(word);
      while (pos !== -1) {
        scores[tone]++;
        pos = lower.indexOf(word, pos + 1);
      }
    }
  }
  let best: LyricsTone = "neutral";
  let bestScore = 0;
  for (const [t, s] of Object.entries(scores) as [LyricsTone, number][]) {
    if (t !== "neutral" && s > bestScore) { bestScore = s; best = t; }
  }
  return bestScore >= 1 ? best : "neutral";
}

// ─────────────────────────────────────────────────────────────────────────────
// Style Reference Parser
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_KEYWORDS: Array<{ keys: string[]; influence: StyleInfluence; desc: string }> = [
  { keys: ["burna", "wizkid", "wiz kid", "made in lagos"], influence: "lagos-warm",     desc: "Lagos-warm pocket — groove-forward, minimal, effortless melodic ease" },
  { keys: ["davido", "shallipopi", "portable", "anthem"],   influence: "street-anthem", desc: "Street anthem energy — crowd-coded, big hook moment, festival-ready" },
  { keys: ["asake", "poco lee", "olamide", "street"],       influence: "afro-trap",     desc: "Afro-trap lean — sparse rhythmic space, patois feel, aggressive cadence" },
  { keys: ["omah lay", "tems", "fireboy", "simi", "moody", "soft", "chill"], influence: "soul-intimacy",  desc: "Soul-intimacy texture — moody RnB warmth, delicate transitions, close feel" },
  { keys: ["church", "gospel", "worship", "spiritual", "jah", "prayerful"], influence: "spiritual-lift", desc: "Spiritual-lift atmosphere — reverent warmth, wide choir texture, uplifting arc" },
  { keys: ["club", "banger", "turn up", "lit", "trap"],     influence: "club-pressure", desc: "Club-pressure signal — heavy drops, punchy hooks, maximum dancefloor energy" },
  { keys: ["mellow", "slow", "relax", "easy", "laid back"], influence: "chill-groove",  desc: "Chill-groove sensibility — understated, warm, unhurried arrangement" },
];

export function parseStyleReference(ref: string): { influence: StyleInfluence; desc: string } {
  if (!ref || ref.trim().length < 2) return { influence: "neutral", desc: "" };
  const lower = ref.toLowerCase();
  for (const entry of STYLE_KEYWORDS) {
    if (entry.keys.some((k) => lower.includes(k))) {
      return { influence: entry.influence, desc: entry.desc };
    }
  }
  return { influence: "neutral", desc: `Production feel adapted from: "${ref.trim()}"` };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stem Builder
// ─────────────────────────────────────────────────────────────────────────────

export function buildStemData(
  genre: string,
  energy: string,
  section: string,
  isProducer: boolean,
  drumDensityOverride?: string,
  bassWeightOverride?: string,
): StemDef[] {
  const profile = GENRE_PROFILES[genre] ?? GENRE_PROFILES["Afrobeats"];
  const e = energy.toLowerCase() as "low" | "medium" | "high";
  const w = profile.stemWeights;

  // Energy scale factor: low=0.65, medium=1.0, high=1.25 (capped at 95)
  const scale = energy === "Low" ? 0.65 : energy === "High" ? 1.18 : 1.0;
  const scaled = (base: number) => Math.min(95, Math.round(base * scale));

  // Section focus: hook/chorus push melody high; verse pushes bass; hook pushes kick
  const sectionKick   = section === "hook"   ? 1.15 : section === "verse" ? 0.88 : 1.0;
  const sectionBass   = section === "verse"  ? 1.12 : section === "hook"  ? 0.90 : 1.0;
  const sectionMelody = section === "chorus" || section === "hook" ? 1.2 : section === "verse" ? 0.80 : 1.0;

  const kickNote  = drumDensityOverride
    ? `${drumDensityOverride} density — ${profile.kick[e]}`
    : profile.kick[e];
  const bassNote  = bassWeightOverride
    ? `${bassWeightOverride} — ${profile.bass[e]}`
    : profile.bass[e];

  return [
    {
      label: "Kick & Percussion",
      color: "bg-amber-400",
      note: kickNote,
      pct: Math.min(96, Math.round(scaled(w.kick) * sectionKick)),
    },
    {
      label: "Bass & Sub",
      color: "bg-violet-500",
      note: bassNote,
      pct: Math.min(96, Math.round(scaled(w.bass) * sectionBass)),
    },
    {
      label: "Pads & Chords",
      color: "bg-sky-500",
      note: profile.pads,
      pct: scaled(w.pads),
    },
    {
      label: "Lead Melody",
      color: "bg-green-400",
      note: profile.melody,
      pct: Math.min(96, Math.round(scaled(w.melody) * sectionMelody)),
    },
    {
      label: "Percussion Layer",
      color: "bg-orange-400",
      note: profile.perc,
      pct: scaled(w.perc),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Vocal Guide Builder
// ─────────────────────────────────────────────────────────────────────────────

function vocalIntensity(energy: string): string {
  return energy === "Low" ? "intimate, restrained" : energy === "High" ? "full power, no holding back" : "balanced projection";
}

function toneTag(tone: LyricsTone): string {
  const map: Record<LyricsTone, string> = {
    spiritual: "prayerful and uplifting",
    intimate:  "vulnerable and close",
    street:    "confident and punchy",
    party:     "energetic and crowd-ready",
    defiant:   "raw and powerful",
    neutral:   "melodically centered",
  };
  return map[tone];
}

export function buildVocalSections(opts: {
  genre: string;
  energy: string;
  section: string;
  vocalGender: string;
  chorusLift: string;
  outroStyle: string;
  isProducer: boolean;
  lyricsTone: LyricsTone;
  styleInfluence: StyleInfluence;
}): VocalSection[] {
  const { genre, energy, section, chorusLift, outroStyle, isProducer, lyricsTone } = opts;
  const profile = GENRE_PROFILES[genre] ?? GENRE_PROFILES["Afrobeats"];
  const intensity = vocalIntensity(energy);
  const tone = toneTag(lyricsTone);

  const chorusNote = isProducer && chorusLift !== "Sudden drop"
    ? `${chorusLift} — ${profile.hookStyle}`
    : profile.hookStyle;

  const outroNote = isProducer
    ? `${outroStyle} — ${profile.vocalCharacter.split(",")[0].trim()}`
    : `Chant layer fades — crowd response closes the song`;

  // Section-filtered views
  if (section === "hook") {
    return [
      { label: "Hook Delivery",   note: `${intensity}, ${tone} — ${profile.hookStyle}`,                                               color: "text-violet-300/75" },
      { label: "Chant Layer",     note: "Audience response layer — doubled and panned wide, short reverb",                             color: "text-violet-400/65" },
      { label: "Ad-lib Support",  note: "High-energy ad-libs lock into hook gaps — not over the main line",                           color: "text-violet-400/55" },
    ];
  }

  if (section === "verse") {
    return [
      { label: "Verse Cadence",   note: `${profile.verseStyle} — delivery: ${intensity}`,                                             color: "text-violet-300/75" },
      { label: "Phrasing Pocket", note: `Lock every line to the ${genre.toLowerCase()} rhythm grid — breath after bar 4`,             color: "text-violet-400/65" },
      { label: "Emotional Read",  note: `Tone reads ${tone} — lean into it, let it guide the delivery weight`,                        color: "text-violet-400/55" },
    ];
  }

  if (section === "chorus") {
    return [
      { label: "Chorus Lift",     note: chorusNote,                                                                                   color: "text-violet-300/75" },
      { label: "Double Track",    note: "Layer a tight double — same take, slight timing variation, panned ±20L/R",                   color: "text-violet-400/65" },
      { label: "Replay Hook",     note: "The chorus line must be immediately hummable — if it's not, rework it before tracking",      color: "text-violet-400/55" },
    ];
  }

  // Full song
  return [
    { label: "Verse Delivery",  note: `${profile.verseStyle} — ${intensity}, ${tone} read`,                                           color: "text-violet-300/70" },
    { label: "Hook Lift",       note: chorusNote,                                                                                      color: "text-violet-300/80" },
    { label: "Bridge Turn",     note: `${profile.bridgeStyle} — maximum emotional exposure, no safety net`,                           color: "text-violet-400/65" },
    { label: "Ad-lib Layer",    note: `${profile.vocalCharacter.split(",")[0]} — ad-libs ghost the main line, wide stereo position`,   color: "text-violet-400/55" },
    { label: "Outro Close",     note: outroNote,                                                                                       color: "text-violet-400/50" },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Lyrics Beat Direction
// Maps a LyricsTone to specific beat-shaping language for arrangement and
// producer notes — making the beat feel built around the song.
// ─────────────────────────────────────────────────────────────────────────────

export interface LyricsDirection {
  arrangementHint: string;
  percussionHint: string;
  melodicHint: string;
  spaceHint: string;
  hookHint: string;
}

const LYRICS_DIRECTION_MAP: Record<LyricsTone, LyricsDirection> = {
  spiritual: {
    arrangementHint: "Restraint and openness — emotional space is the arrangement decision.",
    percussionHint:  "Light percussion — spiritual songs breathe; avoid aggressive drum attack.",
    melodicHint:     "Warm harmonic pads and ambient lift — melody serves reverence, not dominance.",
    spaceHint:       "Wide, reverb-soaked mix — the space itself carries emotion.",
    hookHint:        "Congregational hook architecture — the hook must be immediately singable back.",
  },
  intimate: {
    arrangementHint: "Arrangement breathes for vocal intimacy — space around the vocal at all times.",
    percussionHint:  "Soft, understated drums — the groove supports, never competes with the vocal.",
    melodicHint:     "Soft guitar runs, silky pads, and gentle melodic phrases in the space.",
    spaceHint:       "Spacious, close-mic mix feel — warm, personal, never wide or distant.",
    hookHint:        "Vulnerable hook delivery — protect the emotional weight, no over-production.",
  },
  street: {
    arrangementHint: "Percussion-forward arrangement — the groove carries the confidence of the lyrics.",
    percussionHint:  "Stronger drum attitude, firmer assertive low end, sharp transient energy.",
    melodicHint:     "Confident chord stabs and assertive melodic movement — swagger in the texture.",
    spaceHint:       "Punchy, forward mix — the vocal and the beat share the same authority.",
    hookHint:        "Hook must land hard on the 1 — crowd-chant ready, works on any speaker.",
  },
  party: {
    arrangementHint: "High-replay arrangement — chorus payoff engineered for movement and return.",
    percussionHint:  "Full rhythmic momentum — energetic hi-hat patterns, crowd-coded groove.",
    melodicHint:     "Bright melodic stabs, infectious hook phrases, wide stereo celebration.",
    spaceHint:       "Open, bright, club-translated mix — the energy should fill a room.",
    hookHint:        "Repeat-coded hook — the chorus must work on its 3rd repeat as well as its 1st.",
  },
  defiant: {
    arrangementHint: "Bold, raw arrangement — minimum polish, maximum truth in the production.",
    percussionHint:  "Gritty drum texture with rough character — unpolished confidence.",
    melodicHint:     "Forward, assertive melodic voice — melody doesn't decorate, it pushes back.",
    spaceHint:       "Compressed, punchy mix — no retreat in the sound design.",
    hookHint:        "Raw, powerful hook — protect the rawness, don't over-produce the emotion out of it.",
  },
  neutral: {
    arrangementHint: "",
    percussionHint:  "",
    melodicHint:     "",
    spaceHint:       "",
    hookHint:        "",
  },
};

export function deriveLyricsDirection(tone: LyricsTone): LyricsDirection {
  return LYRICS_DIRECTION_MAP[tone] ?? LYRICS_DIRECTION_MAP.neutral;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lyrics Signal System
// Deep lyrical analysis that shapes beat intelligence from song content
// ─────────────────────────────────────────────────────────────────────────────

export interface LyricsSignal {
  tone: LyricsTone;
  energyLevel: "low" | "medium" | "high";
  hookPotential: "high" | "medium" | "low";
  pacingFeel: "slow" | "medium" | "fast";
  intimacyScale: "intimate" | "performance";
  writingLead: "storytelling" | "vibe";
  beatShapingHints: string[];
  diagnosticSummary: string;
}

const ENERGY_HIGH_WORDS = ["fire","energy","bounce","jump","turn up","lit","run","power","loud","rise","fight","scream","rage","wild","crazy","hype","anthem","thunder","blast","explode","massive"];
const ENERGY_LOW_WORDS  = ["slow","quiet","wait","breathe","hold","miss","alone","soft","tender","cry","tears","still","calm","peace","whisper","gentle","rest","fade","silent"];
const STORYTELLING_WORDS = ["was","when","then","because","remember","after","before","every time","years","days","nights","since","until","while","suddenly","realized","thought","knew"];

function detectEnergyLevel(lyrics: string): "low" | "medium" | "high" {
  const lower = lyrics.toLowerCase();
  let high = 0, low = 0;
  ENERGY_HIGH_WORDS.forEach(w => { if (lower.includes(w)) high++; });
  ENERGY_LOW_WORDS.forEach(w  => { if (lower.includes(w)) low++;  });
  high += (lyrics.match(/!/g) ?? []).length * 0.5;
  high += (lyrics.match(/\b[A-Z]{3,}\b/g) ?? []).length * 0.5;
  if (high >= low + 2) return "high";
  if (low  >= high + 2) return "low";
  return "medium";
}

function detectHookPotential(lyrics: string): "high" | "medium" | "low" {
  const lines = lyrics.split("\n").map(l => l.trim()).filter(l => l.length > 2 && !l.startsWith("["));
  if (lines.length < 2) return "low";
  const counts = new Map<string, number>();
  for (const line of lines) counts.set(line.toLowerCase(), (counts.get(line.toLowerCase()) ?? 0) + 1);
  const maxRepeat = Math.max(...counts.values());
  const shortRatio = lines.filter(l => l.split(" ").length <= 6).length / lines.length;
  if (maxRepeat >= 3 || shortRatio >= 0.5) return "high";
  if (maxRepeat >= 2 || shortRatio >= 0.3) return "medium";
  return "low";
}

function detectPacingFeel(lyrics: string): "slow" | "medium" | "fast" {
  const lines = lyrics.split("\n").map(l => l.trim()).filter(Boolean);
  if (!lines.length) return "medium";
  const avg = lines.reduce((s, l) => s + l.split(/\s+/).length, 0) / lines.length;
  if (avg <= 4.5) return "slow";
  if (avg >= 8)   return "fast";
  return "medium";
}

function detectWritingLead(lyrics: string): "storytelling" | "vibe" {
  const lower = lyrics.toLowerCase();
  let score = 0;
  STORYTELLING_WORDS.forEach(w => { if (lower.includes(w)) score++; });
  const lines = lyrics.split("\n").filter(l => l.trim().length > 2);
  const uniqueRatio = new Set(lines.map(l => l.trim().toLowerCase())).size / Math.max(lines.length, 1);
  return score >= 2 || uniqueRatio >= 0.85 ? "storytelling" : "vibe";
}

function buildBeatShapingHints(
  tone: LyricsTone,
  energyLevel: "low" | "medium" | "high",
  hookPotential: "high" | "medium" | "low",
  pacingFeel: "slow" | "medium" | "fast",
  intimacyScale: "intimate" | "performance",
  writingLead: "storytelling" | "vibe",
): string[] {
  const dir = deriveLyricsDirection(tone);
  const hints: string[] = [];
  if (dir.percussionHint) hints.push(dir.percussionHint);
  if (dir.melodicHint)    hints.push(dir.melodicHint);
  if (dir.spaceHint)      hints.push(dir.spaceHint);
  if (energyLevel === "high") hints.push("High lyrical energy — groove can be more assertive, percussion sits further forward.");
  if (energyLevel === "low")  hints.push("Low lyrical energy — restrain the arrangement; give space for the emotional weight.");
  if (hookPotential === "high") hints.push("Strong hook repetition — engineer maximum replay energy into the chorus drop.");
  if (hookPotential === "low")  hints.push("Non-repetitive structure — support with a smooth arc rather than a hook-first approach.");
  if (pacingFeel === "fast") hints.push("Fast lyrical pacing — hi-hat movement and groove density should match the syllable rate.");
  if (pacingFeel === "slow") hints.push("Slow lyrical pacing — the groove should breathe; space is part of the rhythm.");
  if (intimacyScale === "intimate")    hints.push("Intimate scale — keep the mix close; avoid wide spatial processing on lead elements.");
  if (intimacyScale === "performance") hints.push("Performance-coded lyrics — the arrangement should feel large and crowd-ready.");
  if (writingLead === "storytelling") hints.push("Storytelling lyrics — smooth arrangement support; avoid chaotic movement that competes with the narrative.");
  if (writingLead === "vibe")         hints.push("Vibe-led lyrics — the groove IS the song; engineer for feel and replay over narrative support.");
  return hints;
}

export function deriveLyricsSignal(lyrics: string): LyricsSignal {
  if (!lyrics || lyrics.trim().length < 20) {
    return {
      tone: "neutral", energyLevel: "medium", hookPotential: "medium",
      pacingFeel: "medium", intimacyScale: "performance", writingLead: "vibe",
      beatShapingHints: [],
      diagnosticSummary: "No lyrics — beat shaped by genre and Beat DNA controls only.",
    };
  }
  const tone          = analyzeLyricsTone(lyrics);
  const energyLevel   = detectEnergyLevel(lyrics);
  const hookPotential = detectHookPotential(lyrics);
  const pacingFeel    = detectPacingFeel(lyrics);
  const intimacyScale = (tone === "intimate" || tone === "spiritual") ? "intimate" : "performance" as const;
  const writingLead   = detectWritingLead(lyrics);
  const beatShapingHints = buildBeatShapingHints(tone, energyLevel, hookPotential, pacingFeel, intimacyScale, writingLead);
  const diagnosticSummary = `Tone: ${tone} | Energy: ${energyLevel} | Hook: ${hookPotential} | Pacing: ${pacingFeel} | Scale: ${intimacyScale} | Writing: ${writingLead}`;
  return { tone, energyLevel, hookPotential, pacingFeel, intimacyScale, writingLead, beatShapingHints, diagnosticSummary };
}

// ─────────────────────────────────────────────────────────────────────────────
// Blueprint Builder
// ─────────────────────────────────────────────────────────────────────────────

export function buildArrangementStyle(opts: {
  genre: string;
  section: string;
  isInstrumentalMode: boolean;
  isProducer: boolean;
  introBehavior?: string;
  transitionStyle?: string;
  outroStyle?: string;
  lyricsTone?: LyricsTone;
}): string {
  const { genre, section, isInstrumentalMode, isProducer, introBehavior, transitionStyle, outroStyle, lyricsTone } = opts;
  const profile = GENRE_PROFILES[genre] ?? GENRE_PROFILES["Afrobeats"];

  // Lyrics-aware arrangement modifier — appended to the base arrangement string
  const lyricsDir = lyricsTone && lyricsTone !== "neutral" ? deriveLyricsDirection(lyricsTone) : null;
  const lyricsArrangementSuffix = lyricsDir?.arrangementHint ? ` ${lyricsDir.arrangementHint}` : "";

  if (isInstrumentalMode) return `Pure instrumental — no vocal layer. ${profile.arrangement}${lyricsArrangementSuffix}`;

  if (section === "hook")   return `Hook-only scope — ${profile.hookStyle}. Max repetition, chant pocket, crowd energy coded in.${lyricsArrangementSuffix}`;
  if (section === "verse")  return `Verse scope — ${profile.verseStyle}. Cadence and phrasing are the priority.${lyricsArrangementSuffix}`;
  if (section === "chorus") return `Chorus scope — ${profile.hookStyle}. Lift, replay value, and section energy are the focus.${lyricsArrangementSuffix}`;

  // Full song
  if (isProducer) {
    const intro = introBehavior ?? "Build up";
    const trans = transitionStyle ?? "Filter sweep";
    const outro = outroStyle ?? "Fade out";
    return `Full arrangement: ${intro} → ${profile.arrangement} → ${outro}. Transitions: ${trans}. ${profile.transitionFeel}.${lyricsArrangementSuffix}`;
  }

  return `${profile.arrangement}. ${profile.transitionFeel}.${lyricsArrangementSuffix}`;
}

const HOOK_LIFT_LANGUAGE: Record<string, string> = {
  "Subtle":    "understated lift — the payoff is felt not forced, arrangement restraint is intentional",
  "Balanced":  "measured chorus payoff — clear lift without overbuilding the arrangement",
  "Big":       "strong drop energy — clear arrangement contrast, hook section commands the room",
  "Anthemic":  "anthemic payoff — crowd-sing-along ready, hook section built for replay and stadiums",
  "Explosive": "maximum drop energy — full arrangement detonation at the chorus, festival-level impact coded in",
};

export function buildHookFocus(opts: {
  genre: string;
  useHitmakerHookPriority: boolean;
  isProducer: boolean;
  lyricsTone: LyricsTone;
  styleInfluence: StyleInfluence;
  section: string;
  energy: string;
  hookLift?: string;
}): string {
  const { genre, useHitmakerHookPriority, isProducer, lyricsTone, styleInfluence, section, energy, hookLift } = opts;
  const profile = GENRE_PROFILES[genre] ?? GENRE_PROFILES["Afrobeats"];

  const base = profile.hookStyle;
  const tone = toneTag(lyricsTone);
  const energyMod = energy === "High" ? "maximum replay energy" : energy === "Low" ? "intimate replay gravity" : "balanced replay pull";
  const liftDesc = hookLift && HOOK_LIFT_LANGUAGE[hookLift] ? ` Hook lift: ${HOOK_LIFT_LANGUAGE[hookLift]}.` : "";

  if (useHitmakerHookPriority) {
    return isProducer
      ? `Hitmaker-engineered: ${base}. Layer stack coded, hard-contrast verse energy. ${energyMod}. Hook tone: ${tone}.${liftDesc}`
      : `Hitmaker priority: ${base}. First-listen memorability, ${energyMod}, crowd-chant ready.${liftDesc}`;
  }

  if (section === "hook" || section === "chorus") {
    return `Section-focused lift: ${base}. ${energyMod}. Tone reads ${tone}${styleInfluence !== "neutral" ? " — production feel adapted" : ""}.${liftDesc}`;
  }

  return isProducer
    ? `Arrangement-first: timed lift engineered at bar 8. ${base}. Hook tone: ${tone}, ${energyMod}.${liftDesc}`
    : `Balanced: ${base}. ${energyMod}${styleInfluence !== "neutral" ? ", production feel adapted" : ""}.${liftDesc}`;
}

const BOUNCE_STYLE_LANGUAGE: Record<string, string> = {
  "Smooth Glide":      "effortless groove pocket — melodic ease, no aggression, movement flows naturally with the bass",
  "Club Bounce":       "kinetic dancefloor movement, stronger syncopated groove energy, designed for floor response",
  "Street Bounce":     "raw rhythmic tension, aggressive pocket feel, street-coded percussive energy in every bar",
  "Late Night Swing":  "relaxed pocket, sensual timing, late-to-the-beat feel — groove is seductive not urgent",
  "Festival Lift":     "arena-coded rhythm, wide dynamic range, groove engineered for maximum crowd response",
  "Slow Wine":         "Caribbean-influenced rhythmic sway, body-movement priority, slow deliberate cadence",
  "Log Drum Drive":    "Amapiano-influenced log drum pulse as rhythmic backbone, deep percussive centre of gravity",
};

const MELODY_DENSITY_LANGUAGE: Record<string, string> = {
  "Minimal":    "restrained melodic layer — space and silence are intentional, less is more, breathe between phrases",
  "Balanced":   "moderate melodic presence — hooks supported without overcrowding the harmonic space",
  "Rich":       "full melodic layering — additional instruments and counter-melodies fill the arrangement",
  "Lush":       "dense melodic environment — every frequency band has melodic content, immersive and full",
  "Cinematic":  "wide emotional sweep, film-score-influenced melodic language, orchestral texture and dynamics",
};

const DRUM_CHARACTER_LANGUAGE: Record<string, string> = {
  "Clean":        "tighter transient control, pristine mix-ready percussion, surgical and polished",
  "Punchy":       "impact-first drum sound, forward kick and snare, sits upfront and centre in the mix",
  "Raw":          "unprocessed feel, less polish more authenticity, gritty rougher rhythm texture",
  "Dusty":        "lo-fi texture in the percussion, warm tape-influenced drum character, vintage feel",
  "Percussive":   "rhythm section leads the session — drums are the most prominent mix element, perc-forward",
  "Heavy Groove": "maximum low-end weight in the rhythm section, deep kick, wide snare, dense groove",
};

export function buildProducerNotes(opts: {
  genre: string;
  bpm: string;
  key: string;
  energy: string;
  section: string;
  vocalLabel: string;
  isInstrumentalMode: boolean;
  isProducer: boolean;
  includeArrangementNotes: boolean;
  includeStemsBreakdown: boolean;
  introBehavior?: string;
  chorusLift?: string;
  drumDensity?: string;
  bassWeight?: string;
  transitionStyle?: string;
  outroStyle?: string;
  lyricsTone: LyricsTone;
  styleInfluence: StyleInfluence;
  styleDesc: string;
  bounceStyle?: string;
  melodyDensity?: string;
  drumCharacter?: string;
  hookLift?: string;
  lyricsSignal?: LyricsSignal;
}): string {
  const {
    genre, bpm, key, energy, section, vocalLabel, isInstrumentalMode, isProducer,
    includeArrangementNotes, includeStemsBreakdown,
    introBehavior, chorusLift, drumDensity, bassWeight, transitionStyle, outroStyle,
    lyricsTone, styleInfluence, styleDesc,
    bounceStyle, melodyDensity, drumCharacter, hookLift, lyricsSignal,
  } = opts;
  const profile = GENRE_PROFILES[genre] ?? GENRE_PROFILES["Afrobeats"];
  const e = energy.toLowerCase() as "low" | "medium" | "high";

  const parts: string[] = [];

  // Core session info
  parts.push(`Session: ${bpm} BPM | ${key} | ${genre}.`);

  // Genre-specific drum and bass note — optionally layered with Beat DNA character
  const drumCharDesc = drumCharacter && DRUM_CHARACTER_LANGUAGE[drumCharacter]
    ? ` Beat DNA drum character: ${DRUM_CHARACTER_LANGUAGE[drumCharacter]}.`
    : "";
  parts.push(`Drums: ${profile.kick[e]}. Bass: ${profile.bass[e]}.${drumCharDesc}`);

  // Beat DNA groove layer
  if (bounceStyle && BOUNCE_STYLE_LANGUAGE[bounceStyle]) {
    parts.push(`Groove motion (Beat DNA): ${BOUNCE_STYLE_LANGUAGE[bounceStyle]}.`);
  }
  if (melodyDensity && MELODY_DENSITY_LANGUAGE[melodyDensity]) {
    parts.push(`Melody layer (Beat DNA): ${MELODY_DENSITY_LANGUAGE[melodyDensity]}.`);
  }
  if (hookLift && HOOK_LIFT_LANGUAGE[hookLift]) {
    parts.push(`Hook energy (Beat DNA): ${HOOK_LIFT_LANGUAGE[hookLift]}.`);
  }

  // Producer-specific arrangement detail
  if (isProducer && introBehavior) {
    parts.push(`Intro: ${introBehavior}. Chorus lift: ${chorusLift ?? "Gradual swell"}. Drum density: ${drumDensity ?? "Mid"}. Bass weight: ${bassWeight ?? "Punchy sub"}.`);
    parts.push(`Transitions: ${transitionStyle ?? "Filter sweep"}. Outro: ${outroStyle ?? "Fade out"}.`);
  }

  // Section-specific note
  if (section === "hook") {
    parts.push(`Hook-only session — focus all energy on replay: ${profile.hookStyle}`);
  } else if (section === "verse") {
    parts.push(`Verse-only session — arrangement serves the cadence: ${profile.verseStyle}`);
  } else if (section === "chorus") {
    parts.push(`Chorus scope — every arrangement decision serves the lift: ${profile.hookStyle}`);
  } else {
    if (includeArrangementNotes) parts.push(`Full arrangement: ${profile.arrangement}.`);
  }

  // Stems
  if (includeStemsBreakdown) parts.push(`Stems: kick, snare, bass, melody, pads, perc${isInstrumentalMode ? "" : ", lead vocal, harmony, ad-libs"} — exported separately.`);

  // Vocal or instrumental
  if (isInstrumentalMode) {
    parts.push(`Instrumental-only session — no vocal booth needed. ${profile.pads}`);
  } else {
    parts.push(`Vocal: ${vocalLabel} — ${profile.vocalCharacter}. Booth setup: close-mic dynamic, minimal tracking reverb, leave 6dB headroom.`);
  }

  // Lyrics-aware beat shaping — use signal if available, fall back to basic tone note
  if (lyricsSignal && lyricsSignal.beatShapingHints.length) {
    const topHints = lyricsSignal.beatShapingHints.slice(0, 3);
    parts.push(`Lyrics-aware beat shaping: ${topHints.join(" | ")}`);
  } else if (lyricsTone !== "neutral") {
    const toneNotes: Record<LyricsTone, string> = {
      spiritual: "Lyrics carry a spiritual tone — space and reverb should feel reverent, not loud.",
      intimate:  "Lyrics read intimate — keep the mix close, avoid wide reverb on verses.",
      street:    "Lyrics carry street confidence — punchy mix, forward vocal, minimal verb on verses.",
      party:     "Lyrics are party-coded — bright mix, wide stereo hooks, energetic hi-end presence.",
      defiant:   "Lyrics read defiant — bold, raw vocal sound, forward in the mix, not polished.",
      neutral:   "",
    };
    parts.push(toneNotes[lyricsTone]);
  }

  // Style reference
  if (styleInfluence !== "neutral" && styleDesc) {
    parts.push(`Style reference signals: ${styleDesc}.`);
  }

  return parts.filter(Boolean).join(" ");
}

export function buildBeatSummary(opts: {
  genre: string;
  bpm: string;
  key: string;
  energy: string;
  section: string;
  styleInfluence: StyleInfluence;
  lyricsTone: LyricsTone;
  bounceStyle?: string;
  melodyDensity?: string;
  drumCharacter?: string;
  hookLift?: string;
}): string {
  const { genre, bpm, key, energy, section, styleInfluence, lyricsTone, bounceStyle, melodyDensity, drumCharacter, hookLift } = opts;
  const profile = GENRE_PROFILES[genre] ?? GENRE_PROFILES["Afrobeats"];

  const sectionFeel = section === "hook"   ? `hook-only pocket — ${profile.hookStyle.split(" — ")[0]}`
    : section === "verse"  ? `verse arrangement — ${profile.verseStyle.split(" — ")[0]}`
    : section === "chorus" ? `chorus-scope arrangement — lift-coded, replay priority`
    : profile.character;

  const energyWord = energy === "Low" ? "understated" : energy === "High" ? "high-octane" : "balanced";
  const styleHint  = styleInfluence !== "neutral" ? ` Production adapted for ${styleInfluence.replace("-", " ")}.` : "";
  const toneHint   = lyricsTone !== "neutral" ? ` Lyrics tone: ${toneTag(lyricsTone)}.` : "";

  const dnaHints: string[] = [];
  if (bounceStyle)   dnaHints.push(`Bounce: ${bounceStyle}`);
  if (melodyDensity) dnaHints.push(`Melody: ${melodyDensity}`);
  if (drumCharacter) dnaHints.push(`Drums: ${drumCharacter}`);
  if (hookLift)      dnaHints.push(`Hook Lift: ${hookLift}`);
  const dnaHint = dnaHints.length ? ` Beat DNA — ${dnaHints.join(" · ")}.` : "";

  return `${genre} | ${bpm} BPM | ${key} — ${energyWord} ${sectionFeel}.${styleHint}${toneHint}${dnaHint}`;
}

export function buildArrangementMap(opts: {
  genre: string;
  introBehavior: string;
  chorusLift: string;
  outroStyle: string;
  transitionStyle: string;
}): string {
  const { genre, introBehavior, chorusLift, outroStyle, transitionStyle } = opts;
  const profile = GENRE_PROFILES[genre] ?? GENRE_PROFILES["Afrobeats"];
  return `${introBehavior} → Verse (${profile.verseStyle.split(" —")[0]}) → Chorus (${chorusLift}) → Bridge → Outro (${outroStyle}). Transitions: ${transitionStyle}.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Studio Export Notes Builder
// ─────────────────────────────────────────────────────────────────────────────

export interface ExportNoteItem {
  label: string;
  value: string;
}

export interface ExportNoteBlock {
  title: string;
  items: ExportNoteItem[];
}

export interface StudioExportNotes {
  artist: ExportNoteBlock;
  producer: ExportNoteBlock;
  recording: ExportNoteBlock;
  session: ExportNoteBlock;
  producerDeep?: ExportNoteBlock;
}

function emotionalDirection(tone: LyricsTone, genre: string): string {
  const toneMap: Record<LyricsTone, string> = {
    spiritual:  "Carry reverence through every phrase — this song lifts, it doesn't just play. The emotional arc should feel like prayer answered.",
    intimate:   "This is a song for one person. The emotional direction is closeness — keep the delivery private, like you're speaking only to them.",
    street:     "Confidence is the emotion here — not aggression, not sadness, just the quiet power of someone who has survived and is still standing.",
    party:      "Pure joy and collective energy. The emotion is release — freedom on the dancefloor, bodies moving, no thinking needed.",
    defiant:    "This song pushes back. The emotional direction is resilience — let every line feel like it cost something to say.",
    neutral:    `Stay true to the ${genre} emotional palette — let the genre carry the feeling where the lyrics leave space.`,
  };
  return toneMap[tone];
}

function hookProtection(tone: LyricsTone, genre: string, styleInfluence: StyleInfluence): string {
  const base: Record<LyricsTone, string> = {
    spiritual:  "Protect the simplicity of the hook — a worship hook should be easy for a congregation to sing back immediately.",
    intimate:   "Protect the vulnerability of the hook — if it sounds too polished, it loses its emotional weight.",
    street:     "Protect the punch of the hook — it must land on the 1, sound confident on a phone speaker, and work in a crowd.",
    party:      "Protect the repetition — a party hook lives on its chant-ability, not lyrical depth.",
    defiant:    "Protect the rawness — don't over-produce the hook or you'll lose what makes it powerful.",
    neutral:    "Protect the melodic identity of the hook — it should be immediately identifiable after one listen.",
  };
  const styleExtra = styleInfluence !== "neutral"
    ? ` The ${styleInfluence.replace("-", " ")} production direction adds context — honor that feel when finalising the hook.`
    : "";
  return base[tone] + styleExtra;
}

function genreHarmonyIdea(genre: string): string {
  const map: Record<string, string> = {
    Afrobeats:    "Double-track the hook at the unison — same key, slight timing drift. Harmony a 3rd above on the long notes only.",
    Dancehall:    "Harmony is rare in Dancehall — use it sparingly, only on sustained hook notes. A detuned layer panned wide creates space without crowding.",
    Amapiano:     "Keep the vocal dry and isolated. Harmony arrives late — a 4th above, fading in at the second chorus only.",
    Gospel:       "Stack a full choir — soprano, alto, and tenor layers. Spread across the stereo field. The harmony IS the song.",
    "Afro-fusion": "Tight harmony a 3rd above the hook. Keep it intimate — no wide stacks, the intimacy must stay intact.",
    "R&B Afro":   "Ad-lib harmony: call-and-response between the lead and a double a semitone above. Keeps it modern and personal.",
    "Street Pop": "Double-track for thickness — same line, tight double. Harmony a 5th above on the biggest hook word only.",
  };
  return map[genre] ?? "Harmonise the hook a major third above — keep the double-track tight and panned within ±15L/R.";
}

function genreStereoWidth(genre: string, isProducer: boolean): string {
  const map: Record<string, string> = {
    Afrobeats:    "Kick and bass stay mono. Pad spread: ±60L/R. Percussion: ±40. Melody at ±25. Keep the low end tight for system translation.",
    Dancehall:    "Everything below 200Hz stays mono. Skank guitar: hard pan ±70L/R. Rim clicks: center. Hi-hats: ±35.",
    Amapiano:     "Piano at ±55L/R. Log drum: center with slight room reverb. Melody fills: ±45. Preserve the club mono compatibility.",
    Gospel:       "Choir spread: full ±90L/R for the outer layers. Inner choir: ±45. Piano: center. Reverb tails: wide and long.",
    "Afro-fusion": "Everything stays intimate — max ±50L/R. Reverb tails handle the width, not hard panning. Mid-heavy mix.",
    "R&B Afro":   "808 and bass: mono. Synth pads: ±65. Melody: ±30. Ad-libs: wide ±75 for depth. Modern RnB width profile.",
    "Street Pop": "Bass mono. Synth chords: ±60. Hi-hats and percussion: ±45. Hook doubles: ±25. Mastering limiter at -1.5 LUFS.",
  };
  return map[genre] ?? "Keep bass and kick mono. Spread pads and melody across the stereo field. Check mono compatibility before mixing.";
}

function tensionRelease(genre: string, transitionStyle: string, chorusLift: string, energy: string): string {
  const energyWord = energy === "Low" ? "subtle" : energy === "High" ? "maximum" : "measured";
  return `Tension builds in the pre-chorus — ${energyWord} layering toward the drop. ` +
    `Release arrives at the chorus with "${chorusLift}" approach. ` +
    `Section transitions handled via ${transitionStyle} — this is the track's main tension arc.`;
}

function introBehaviorDetail(introBehavior: string, genre: string): string {
  const profile = GENRE_PROFILES[genre] ?? GENRE_PROFILES["Afrobeats"];
  const map: Record<string, string> = {
    "Cold open":           `No build — the first bar hits immediately with the main groove. ${profile.arrangement.split("→")[0].trim()}. Hook-first energy.`,
    "Build up":            `Gradual layering from a single element — ${profile.arrangement.split("→")[0].trim()}. Layers stack over 8 bars before the verse locks in.`,
    "Atmospheric fade-in": `Reverb-soaked pad opens — the first 4 bars exist purely in atmosphere. Groove enters at bar 5 without warning.`,
    "Drum roll in":        `Snare roll or percussion build for 2 bars, then the main groove lands on the 1. Creates immediate physical impact.`,
    "Acapella intro":      `Vocal opens alone — no music for the first 4–8 bars. The arrangement enters only after the hook is established vocally.`,
  };
  return map[introBehavior] ?? `Intro behavior: ${introBehavior}. Follow the ${genre} arrangement convention.`;
}

function dropBehaviorDetail(chorusLift: string, energy: string, genre: string): string {
  const profile = GENRE_PROFILES[genre] ?? GENRE_PROFILES["Afrobeats"];
  const map: Record<string, string> = {
    "Sudden drop":          `The chorus hits with zero build — full arrangement immediately on the 1. The impact IS the drop. ${energy === "High" ? "Maximum weight." : "Controlled impact."}`,
    "Gradual swell":        `Layers stack over 4 bars — pads, then melody, then bass, then kick. The chorus arrives feeling inevitable.`,
    "Strip-back & explode": `Pre-chorus strips everything to a single element, then the chorus detonates on the 1. The silence creates the impact.`,
    "Key change lift":      `A half-step or whole-step key change at the chorus entry. The pitch shift carries the emotional lift. ${profile.hookStyle}.`,
    "Layer stack":          `Each chorus adds one new layer — first chorus minimal, second chorus half-stack, final chorus full arrangement.`,
  };
  return map[chorusLift] ?? `Chorus drop: ${chorusLift}. Follow the natural ${genre} lift convention.`;
}

function outroLandingDetail(outroStyle: string, genre: string): string {
  const map: Record<string, string> = {
    "Fade out":       "Traditional fade — the groove continues, volume drops over 8–16 bars. Works for streaming and radio formats.",
    "Cold cut":       "The track ends on a specific beat — no tail, no fade. Intentional and impactful. Common in modern Afrobeats and Dancehall.",
    "Loop decay":     "The last 4 bars loop while layers are progressively removed. The kick is always the last element to leave.",
    "Outro chant":    "The hook line repeats as a chant — stripped of the main arrangement. Ad-libs and crowd response fill the space.",
    "Breakdown end":  "Full strip-down in the final 8 bars — minimal arrangement, raw vocal or percussion, then a clean cut.",
  };
  return map[outroStyle] ?? `Outro: ${outroStyle}. Consider how this landing feels in the context of the full session.`;
}

export function buildStudioExportNotes(opts: {
  genre: string;
  bpm: string;
  key: string;
  energy: string;
  section: string;
  vocalLabel: string;
  isInstrumentalMode: boolean;
  isProducer: boolean;
  lyricsTone: LyricsTone;
  styleInfluence: StyleInfluence;
  styleDesc: string;
  hookFocus: string;
  arrangementStyle: string;
  introBehavior?: string;
  chorusLift?: string;
  drumDensity?: string;
  bassWeight?: string;
  transitionStyle?: string;
  outroStyle?: string;
  bounceStyle?: string;
  melodyDensity?: string;
  drumCharacter?: string;
  hookLift?: string;
  lyricsSignal?: LyricsSignal;
}): StudioExportNotes {
  const {
    genre, bpm, key, energy, section, vocalLabel, isInstrumentalMode, isProducer,
    lyricsTone, styleInfluence, styleDesc, hookFocus, arrangementStyle,
    introBehavior, chorusLift, drumDensity, bassWeight, transitionStyle, outroStyle,
    bounceStyle, melodyDensity, drumCharacter, hookLift, lyricsSignal,
  } = opts;

  const profile = GENRE_PROFILES[genre] ?? GENRE_PROFILES["Afrobeats"];
  const e = energy.toLowerCase() as "low" | "medium" | "high";
  const tone = toneTag(lyricsTone);
  const intensity = vocalIntensity(energy);
  const cl = chorusLift ?? "Gradual swell";
  const ts = transitionStyle ?? "Filter sweep";
  const os = outroStyle ?? "Fade out";
  const ib = introBehavior ?? "Build up";
  const dd = drumDensity ?? "Mid";
  const bw = bassWeight ?? "Punchy sub";

  const sectionGoal = section === "hook"   ? "Nail the hook — one take, maximum replay energy, crowd-chant ready"
    : section === "verse"  ? "Get the verse pocket locked — cadence, phrasing, and rhythm over everything"
    : section === "chorus" ? "Build the chorus — lift, emotion, and replay value are the only priorities"
    : "Full production session — track, arrange, and lock the complete song structure";

  const strongestSection = section === "hook" || section === "chorus"
    ? `The hook is engineered as the centrepiece — ${profile.hookStyle}`
    : energy === "High"
    ? `Chorus and final drop — high energy coded in, these sections carry the most impact`
    : `The verse and hook together — the phrasing and melodic lift are where this session shines`;

  const replaySection = lyricsTone === "party" || styleInfluence === "club-pressure"
    ? "The drop/chorus — replay-coded for dancefloor context. Loop it 3x in the session to feel if it holds."
    : lyricsTone === "spiritual" || styleInfluence === "spiritual-lift"
    ? "The bridge — the emotional peak of the arrangement. This is what listeners will return to."
    : "The hook — protect it, replay it, and ask yourself after every take: would a stranger hum this?";

  const artistBlock: ExportNoteBlock = {
    title: "Artist Notes",
    items: [
      { label: "Emotional Direction",   value: emotionalDirection(lyricsTone, genre) },
      { label: "Vocal Delivery Summary",value: `${vocalLabel} — ${profile.vocalCharacter}. Delivery intensity: ${intensity}.` },
      { label: "Hook Focus",            value: hookFocus },
      { label: "Ad-lib Behavior",       value: `${profile.vocalCharacter.split(",")[0].trim()} — ad-libs should ghost the main line, sitting just above it in the pocket. ${lyricsTone === "party" ? "High-energy crowd chants encouraged." : lyricsTone === "spiritual" ? "Keep ad-libs reverent — no performative runs." : "Let the ad-libs breathe, never overcrowd the hook."}` },
    ],
  };

  const beatDNAItems: { label: string; value: string }[] = [];
  if (bounceStyle && BOUNCE_STYLE_LANGUAGE[bounceStyle]) {
    beatDNAItems.push({ label: "Bounce Style",    value: BOUNCE_STYLE_LANGUAGE[bounceStyle] });
  }
  if (melodyDensity && MELODY_DENSITY_LANGUAGE[melodyDensity]) {
    beatDNAItems.push({ label: "Melody Density",  value: MELODY_DENSITY_LANGUAGE[melodyDensity] });
  }
  if (drumCharacter && DRUM_CHARACTER_LANGUAGE[drumCharacter]) {
    beatDNAItems.push({ label: "Drum Character",  value: DRUM_CHARACTER_LANGUAGE[drumCharacter] });
  }
  if (hookLift && HOOK_LIFT_LANGUAGE[hookLift]) {
    beatDNAItems.push({ label: "Hook Lift",       value: HOOK_LIFT_LANGUAGE[hookLift] });
  }

  const producerBlock: ExportNoteBlock = {
    title: "Producer Notes",
    items: [
      { label: "Groove Pocket",         value: `${profile.kick[e]} — ${profile.snare[e]}` },
      { label: "Drum Behavior",         value: `${dd} density. ${profile.kick[e]}. Snare: ${profile.snare[e]}.` },
      { label: "Bass Movement",         value: `${bw} weight. ${profile.bass[e]}` },
      { label: "Texture Suggestions",   value: profile.pads },
      { label: "Arrangement Build",     value: arrangementStyle },
      { label: "Percussion Layer",      value: profile.perc },
      ...beatDNAItems,
      ...(styleInfluence !== "neutral" ? [{ label: "Style Reference Signal", value: styleDesc }] : []),
    ],
  };

  const recordingBlock: ExportNoteBlock = {
    title: "Recording Notes",
    items: [
      { label: "Verse Delivery",        value: `${profile.verseStyle} — tone reads ${tone}. ${intensity} delivery.` },
      { label: "Chorus Stack",          value: `${profile.hookStyle} — chorus approach: ${cl}. Push to full projection.` },
      { label: "Harmony & Double Ideas",value: genreHarmonyIdea(genre) },
      { label: "Vocal Tone",            value: `${profile.vocalCharacter}. ${isInstrumentalMode ? "No vocal booth session needed." : `Booth setup: close-mic dynamic, minimal tracking reverb, leave 6dB headroom.`}` },
    ],
  };

  const lyricsSignalItems: { label: string; value: string }[] = [];
  if (lyricsSignal && lyricsSignal.tone !== "neutral") {
    lyricsSignalItems.push({ label: "Lyrics Intelligence",  value: lyricsSignal.diagnosticSummary });
    if (lyricsSignal.beatShapingHints.length) {
      lyricsSignalItems.push({ label: "Beat Shaping Derived", value: lyricsSignal.beatShapingHints.slice(0, 2).join(" | ") });
    }
    const dir = deriveLyricsDirection(lyricsSignal.tone);
    if (dir.hookHint) lyricsSignalItems.push({ label: "Hook Direction",     value: dir.hookHint });
    if (dir.arrangementHint) lyricsSignalItems.push({ label: "Arrangement Signal", value: dir.arrangementHint });
  }

  const sessionBlock: ExportNoteBlock = {
    title: "Session Notes",
    items: [
      { label: "Ideal Session Goal",    value: sectionGoal },
      { label: "Strongest Section",     value: strongestSection },
      { label: "Replay Section",        value: replaySection },
      { label: "What to Protect",       value: hookProtection(lyricsTone, genre, styleInfluence) },
      ...lyricsSignalItems,
    ],
  };

  let producerDeepBlock: ExportNoteBlock | undefined;
  if (isProducer) {
    producerDeepBlock = {
      title: "Engineering Deep Notes",
      items: [
        { label: "Intro Bar Feel",          value: introBehaviorDetail(ib, genre) },
        { label: "Drop Behavior",           value: dropBehaviorDetail(cl, energy, genre) },
        { label: "Bridge Strip-down",       value: `${profile.bridgeStyle}. This is the emotional vulnerability point — protect the space here.` },
        { label: "Outro Landing",           value: outroLandingDetail(os, genre) },
        { label: "Stereo Width",            value: genreStereoWidth(genre, isProducer) },
        { label: "Tension / Release",       value: tensionRelease(genre, ts, cl, energy) },
      ],
    };
  }

  return {
    artist: artistBlock,
    producer: producerBlock,
    recording: recordingBlock,
    session: sessionBlock,
    producerDeep: producerDeepBlock,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Full Intelligence Builder — called once on generate, returns all card data
// ─────────────────────────────────────────────────────────────────────────────

export interface FullIntelligence {
  stems: StemDef[];
  vocalSections: VocalSection[];
  arrangementStyle: string;
  hookFocus: string;
  producerNotes: string;
  beatSummary: string;
  arrangementMap: string;
  lyricsTone: LyricsTone;
  styleInfluence: StyleInfluence;
  styleDesc: string;
  exportNotes: StudioExportNotes;
  lyricsSignal: LyricsSignal;
}

export function buildFullIntelligence(opts: {
  genre: string;
  bpm: string;
  key: string;
  energy: string;
  section: string;
  vocalGender: string;
  vocalLabel: string;
  isInstrumentalMode: boolean;
  isProducer: boolean;
  useHitmakerHookPriority: boolean;
  includeArrangementNotes: boolean;
  includeStemsBreakdown: boolean;
  lyrics: string;
  styleReference: string;
  introBehavior?: string;
  chorusLift?: string;
  drumDensity?: string;
  bassWeight?: string;
  transitionStyle?: string;
  outroStyle?: string;
  bounceStyle?: string;
  melodyDensity?: string;
  drumCharacter?: string;
  hookLift?: string;
}): FullIntelligence {
  const {
    genre, bpm, key, energy, section, vocalGender, vocalLabel,
    isInstrumentalMode, isProducer, useHitmakerHookPriority,
    includeArrangementNotes, includeStemsBreakdown,
    lyrics, styleReference,
    introBehavior, chorusLift, drumDensity, bassWeight, transitionStyle, outroStyle,
    bounceStyle, melodyDensity, drumCharacter, hookLift,
  } = opts;

  const lyricsSignal = deriveLyricsSignal(lyrics);
  const lyricsTone = lyricsSignal.tone;
  const { influence: styleInfluence, desc: styleDesc } = parseStyleReference(styleReference);

  const stems = buildStemData(genre, energy, section, isProducer, drumDensity, bassWeight);

  const vocalSections = buildVocalSections({
    genre, energy, section, vocalGender,
    chorusLift: chorusLift ?? "Gradual swell",
    outroStyle: outroStyle ?? "Fade out",
    isProducer, lyricsTone, styleInfluence,
  });

  const arrangementStyle = buildArrangementStyle({
    genre, section, isInstrumentalMode, isProducer, introBehavior, transitionStyle, outroStyle,
    lyricsTone,
  });

  const hookFocus = buildHookFocus({
    genre, useHitmakerHookPriority, isProducer, lyricsTone, styleInfluence, section, energy, hookLift,
  });

  const producerNotes = buildProducerNotes({
    genre, bpm, key, energy, section, vocalLabel, isInstrumentalMode, isProducer,
    includeArrangementNotes, includeStemsBreakdown,
    introBehavior, chorusLift, drumDensity, bassWeight, transitionStyle, outroStyle,
    lyricsTone, styleInfluence, styleDesc,
    bounceStyle, melodyDensity, drumCharacter, hookLift,
    lyricsSignal,
  });

  const beatSummary = buildBeatSummary({ genre, bpm, key, energy, section, styleInfluence, lyricsTone, bounceStyle, melodyDensity, drumCharacter, hookLift });

  const arrangementMap = buildArrangementMap({
    genre,
    introBehavior: introBehavior ?? "Build up",
    chorusLift: chorusLift ?? "Gradual swell",
    outroStyle: outroStyle ?? "Fade out",
    transitionStyle: transitionStyle ?? "Filter sweep",
  });

  const exportNotes = buildStudioExportNotes({
    genre, bpm, key, energy, section, vocalLabel,
    isInstrumentalMode, isProducer,
    lyricsTone, styleInfluence, styleDesc, hookFocus, arrangementStyle,
    ...(isProducer
      ? { introBehavior, chorusLift, drumDensity, bassWeight, transitionStyle, outroStyle }
      : {}),
    bounceStyle, melodyDensity, drumCharacter, hookLift,
    lyricsSignal,
  });

  return {
    stems, vocalSections, arrangementStyle, hookFocus, producerNotes,
    beatSummary, arrangementMap, lyricsTone, styleInfluence, styleDesc, exportNotes,
    lyricsSignal,
  };
}
