/**
 * AfroMuse External Engine Connector — Core Types
 *
 * These types form the internal contract between the generation engine and
 * the routes/UI layer. Swapping a provider only requires changing the provider
 * module — nothing in routes or the frontend needs to change.
 */

// ─── Provider Categories ──────────────────────────────────────────────────────

export type ProviderCategory =
  | "instrumental"
  | "vocal"
  | "mastering"
  | "stems";

// ─── Provider Status ──────────────────────────────────────────────────────────

/**
 * Describes the operational state of a provider.
 *   mock        — AI brief / mock audio mode (current default)
 *   live-ready  — real API integrated, ready to activate (isLive = true)
 *   unavailable — intended provider is temporarily down or rate-limited
 *   disabled    — deliberately turned off; will not dispatch jobs
 */
export type ProviderStatus = "mock" | "live-ready" | "unavailable" | "disabled";

// ─── Engine Mode ──────────────────────────────────────────────────────────────

/**
 * The engine-level control mode for a provider category.
 * Set via engineConfig.ts per-environment or via runtime override.
 *   mock     — AI brief generation only; no real audio API calls
 *   live     — calls the real external audio API (requires credentials + live-ready registry)
 *   disabled — completely off; jobs fail cleanly at dispatch
 */
export type EngineMode = "mock" | "live" | "disabled";

// ─── Provider Capability Profile ──────────────────────────────────────────────

/**
 * Declares exactly what a provider can and cannot do.
 * Used by compatibility checks before dispatching jobs.
 */
export interface ProviderCapabilities {
  supportsInstrumental: boolean;
  supportsVocals: boolean;
  supportsBlueprint: boolean;
  supportsMastering: boolean;
  supportsStems: boolean;
  supportsPreviewOnly: boolean;
  supportsFullExport: boolean;
  supportsPolling: boolean;
  supportsRealtime: boolean;
  supportsCustomLyrics: boolean;
}

// ─── AfroMuse Session State ───────────────────────────────────────────────────

/**
 * The canonical internal session representation that the translators accept.
 * This is the single source of truth for what the Studio knows about a session.
 * Translators convert this into each provider's specific payload shape.
 */
export interface AfroMuseSessionState {
  title?: string;
  topic?: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  key?: string;
  energy?: string;
  songLength?: string;
  lyricsText?: string;
  hitmakerMode?: boolean;
  lyricalDepth?: string;
  hookRepeatLevel?: string;
  soundReference?: string;
  mixFeel?: string;
  styleReference?: string;
  introBehavior?: string;
  chorusLift?: string;
  drumDensity?: string;
  bassWeight?: string;
  productionNotes?: { chordVibe?: string; melodyDirection?: string; arrangement?: string };
  // Vocal identity
  gender?: string;
  performanceFeel?: string;
  vocalStyle?: string;
  emotionalTone?: string;
  buildMode?: string;
  instrumentalUrl?: string;
  vocalUrl?: string;
  // Lyric sections (vocal demo)
  lyrics?: { hook?: string[]; verse1?: string[]; chorus?: string[] };
  keeperLine?: string;
  melodyDirection?: string;
  // Mastering
  includeStems?: boolean;
  // Stems
  stems?: string[];
  masteredUrl?: string;
}

// ─── Job Lifecycle ────────────────────────────────────────────────────────────

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type AudioJobType =
  | "instrumental"
  | "vocal"
  | "lead-vocal"
  | "voice-clone-sing"
  | "mix-master"
  | "stem-extraction";

// ─── Engine Job ───────────────────────────────────────────────────────────────

export interface EngineJob {
  jobId: string;
  provider: ProviderCategory;
  type: AudioJobType;
  status: JobStatus;
  createdAt: number;
  response: NormalizedResponse | null;
}

// ─── Normalized Response ──────────────────────────────────────────────────────
// All providers return this shape — the UI and output registry never see raw
// provider-specific payloads.

export interface NormalizedResponse {
  status: JobStatus;
  jobId: string;
  provider: ProviderCategory;
  audioUrl: string | null;
  wavUrl: string | null;
  stemsUrl: string | null;
  blueprintData: SessionBlueprintData | null;
  notes: string | null;
  error: ProviderError | null;
  outputRegistry: OutputRegistryMap;
}

// ─── Provider Error ───────────────────────────────────────────────────────────

export type ProviderFailureReason =
  | "missing_response"
  | "failed_generation"
  | "unsupported_mode"
  | "timeout"
  | "unknown";

export interface ProviderError {
  reason: ProviderFailureReason;
  message: string;
}

// ─── Session Blueprint Data ───────────────────────────────────────────────────
// Unified shape covering all AI session brief types. Fields are optional because
// each provider only populates the subset relevant to its category.

export interface SessionBlueprintData {
  // Shared metadata
  bpm?: number;
  key?: string;
  genre?: string;
  mood?: string;
  energy?: string;
  duration?: string;
  audioType?: string;
  hitmakerMode?: boolean;
  hookRepeatLevel?: string;
  vocalStyle?: string;

  // Instrumental brief fields
  beatSummary?: string;
  arrangementMap?: string;
  producerNotes?: string;
  hookFocus?: string;
  arrangementStyle?: string;
  sonicIdentity?: {
    coreBounce: string;
    atmosphere: string;
    mainTexture: string;
  };
  sessionBrief?: string;

  // Vocal / Lead Vocal brief fields
  vocalBrief?: string;
  phrasingGuide?: string;
  emotionalArc?: string;
  syncNotes?: string;
  performanceDirection?: string;
  deliveryStyle?: string;
  vocalProcessingNotes?: string;

  // Mix & Master brief fields
  mixBrief?: string;
  levelBalancing?: string;
  eqNotes?: string;
  compressionNotes?: string;
  spatialEffects?: string;
  masteringChain?: string;
  outputNotes?: string;
  stemsNotes?: string | null;

  // Stem Extraction brief fields
  extractionBrief?: string;
  stems?: Array<{
    name: string;
    extractionNotes: string;
    gainLevel: string;
    fileSpec: string;
  }>;
  phaseAlignmentNotes?: string;
  dawImportGuide?: string;
  recommendedTool?: string;

  // Voice Engine personalization metadata
  voiceMetadata?: {
    gender: string;
    performanceFeel: string;
    voiceTexture: string;
    accentDepth: string;
    singingStyle: string;
    songMood: string;
    keeperLines: string;
    artistReference: string;
  };
  adLibSuggestions?: string[];

  // Voice Clone Singing Engine brief fields
  singingBrief?: string;
  voiceAnalysis?: string;
  singingDirection?: string;
  performanceNotes?: string;
  stemConfig?: string;
  voiceCloneProcessingChain?: string;
  voiceCloneMetadata?: {
    performanceFeel: string;
    dialectDepth: string;
    voiceTexture: string;
    hitmakerMode: boolean;
    recordingDuration: number;
    genre: string;
    bpm?: number;
    key?: string;
  };
}

// ─── Output Registry Map ──────────────────────────────────────────────────────
// The canonical output surface that the UI and downstream consumers read from.
// URLs are null until a real audio provider is connected.

export interface OutputRegistryMap {
  instrumentalPreview: string | null;
  vocalPreview: string | null;
  arrangementBlueprint: string | null;
  masteredMp3: string | null;
  masteredWav: string | null;
  stemsZip: string | null;
}
