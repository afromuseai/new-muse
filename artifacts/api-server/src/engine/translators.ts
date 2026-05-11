/**
 * AfroMuse Payload Translation Layer
 *
 * Translates the internal AfroMuseSessionState into provider-specific
 * request payloads. Every provider gets its own translator function so
 * their payload shapes can diverge freely without affecting the rest of
 * the codebase.
 *
 * When a new real provider is connected with a different request shape,
 * update only the relevant translator here — routes and the UI are untouched.
 *
 * Usage:
 *   const payload = toInstrumentalPayload(session);
 *   const response = await runInstrumental(jobId, payload);
 */

import type { AfroMuseSessionState } from "./types.js";
import type { InstrumentalPayload } from "./providers/instrumental.js";
import type { VocalDemoPayload, LeadVocalPayload } from "./providers/vocal.js";
import type { MasteringPayload } from "./providers/mastering.js";
import type { StemExtractionPayload } from "./providers/stems.js";

// ─── Instrumental ─────────────────────────────────────────────────────────────

/**
 * Translates a session state into an instrumental beat-generation payload.
 * Covers: genre, mood, BPM, key, energy, song length, production aesthetics.
 */
export function toInstrumentalPayload(session: AfroMuseSessionState): InstrumentalPayload {
  return {
    title: session.title,
    genre: session.genre,
    mood: session.mood,
    bpm: session.bpm,
    key: session.key,
    songLength: session.songLength,
    energy: session.energy,
    hitmakerMode: session.hitmakerMode,
    lyricalDepth: session.lyricalDepth,
    hookRepeatLevel: session.hookRepeatLevel,
    soundReference: session.soundReference,
    mixFeel: session.mixFeel,
    styleReference: session.styleReference,
    productionNotes: session.productionNotes,
    introBehavior: session.introBehavior,
    chorusLift: session.chorusLift,
    drumDensity: session.drumDensity,
    bassWeight: session.bassWeight,
    // Extended intelligence fields forwarded to the prompt builder
    buildMode: session.buildMode,
    emotionalTone: session.emotionalTone,
    theme: session.topic,
  };
}

// ─── Vocal Demo ───────────────────────────────────────────────────────────────

/**
 * Translates a session state into a vocal demo request payload.
 * Carries lyric sections and melody direction for demo staging.
 */
export function toVocalDemoPayload(session: AfroMuseSessionState): VocalDemoPayload {
  return {
    title: session.title,
    genre: session.genre,
    mood: session.mood,
    bpm: session.bpm,
    key: session.key,
    songLength: session.songLength,
    hitmakerMode: session.hitmakerMode,
    lyrics: session.lyrics,
    keeperLine: session.keeperLine,
    melodyDirection: session.melodyDirection,
    productionNotes: session.productionNotes,
  };
}

// ─── Lead Vocal ───────────────────────────────────────────────────────────────

/**
 * Translates a session state into a lead vocal synthesis payload.
 * Carries the full lyric text, vocal identity, and instrumental context.
 */
export function toLeadVocalPayload(session: AfroMuseSessionState): LeadVocalPayload {
  return {
    lyrics: session.lyricsText,
    instrumentalUrl: session.instrumentalUrl,
    gender: session.gender,
    performanceFeel: session.performanceFeel,
    vocalStyle: session.vocalStyle,
    emotionalTone: session.emotionalTone,
    buildMode: session.buildMode,
    genre: session.genre,
    bpm: session.bpm,
    key: session.key,
  };
}

// ─── Mastering ────────────────────────────────────────────────────────────────

/**
 * Translates a session state into a mix & master request payload.
 * Carries track URLs, mix feel, and stems export flag.
 */
export function toMasteringPayload(session: AfroMuseSessionState): MasteringPayload {
  return {
    instrumentalUrl: session.instrumentalUrl,
    vocalUrl: session.vocalUrl,
    mixFeel: session.mixFeel,
    genre: session.genre,
    bpm: session.bpm,
    key: session.key,
    includeStems: session.includeStems,
  };
}

// ─── Stem Extraction ──────────────────────────────────────────────────────────

/**
 * Translates a session state into a stem extraction request payload.
 * Carries the mastered track URL and the list of stems to extract.
 */
export function toStemExtractionPayload(session: AfroMuseSessionState): StemExtractionPayload {
  return {
    masteredUrl: session.masteredUrl,
    stems: session.stems,
    genre: session.genre,
    bpm: session.bpm,
    key: session.key,
  };
}
