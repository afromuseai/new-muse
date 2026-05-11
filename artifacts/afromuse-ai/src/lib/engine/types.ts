/**
 * AfroMuse Client Engine Types
 *
 * Client-side mirror of the backend normalized response contract.
 * The UI reads from these shapes — provider specifics stay behind the service layer.
 */

// ─── Job Lifecycle ────────────────────────────────────────────────────────────

export type JobStatus = "queued" | "processing" | "completed" | "failed";

export type ProviderCategory = "instrumental" | "vocal" | "mastering" | "stems";

export type ProviderFailureReason =
  | "missing_response"
  | "failed_generation"
  | "unsupported_mode"
  | "timeout"
  | "unknown";

// ─── Normalized Response ──────────────────────────────────────────────────────

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

export interface ProviderError {
  reason: ProviderFailureReason;
  message: string;
}

// ─── Session Blueprint Data ───────────────────────────────────────────────────

export interface SessionBlueprintData {
  // Metadata
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

  // Instrumental
  beatSummary?: string;
  arrangementMap?: string;
  producerNotes?: string;
  hookFocus?: string;
  arrangementStyle?: string;
  sonicIdentity?: { coreBounce: string; atmosphere: string; mainTexture: string };
  sessionBrief?: string;

  // Vocal / Lead Vocal
  vocalBrief?: string;
  phrasingGuide?: string;
  emotionalArc?: string;
  syncNotes?: string;
  performanceDirection?: string;
  deliveryStyle?: string;
  vocalProcessingNotes?: string;

  // Mix & Master
  mixBrief?: string;
  levelBalancing?: string;
  eqNotes?: string;
  compressionNotes?: string;
  spatialEffects?: string;
  masteringChain?: string;
  outputNotes?: string;
  stemsNotes?: string | null;

  // Stem Extraction
  extractionBrief?: string;
  stems?: Array<{ name: string; extractionNotes: string; gainLevel: string; fileSpec: string }>;
  phaseAlignmentNotes?: string;
  dawImportGuide?: string;
  recommendedTool?: string;
}

// ─── Output Registry ──────────────────────────────────────────────────────────

export interface OutputRegistryMap {
  instrumentalPreview: string | null;
  vocalPreview: string | null;
  arrangementBlueprint: string | null;
  masteredMp3: string | null;
  masteredWav: string | null;
  stemsZip: string | null;
}

// ─── Job Request Configs ──────────────────────────────────────────────────────

export interface InstrumentalRequest {
  title?: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  key?: string;
  songLength?: string;
  energy?: string;
  hitmakerMode?: boolean;
  hookRepeatLevel?: string;
  soundReference?: string;
  mixFeel?: string;
  styleReference?: string;
  productionNotes?: { chordVibe?: string; melodyDirection?: string; arrangement?: string };
  introBehavior?: string;
  chorusLift?: string;
  drumDensity?: string;
  bassWeight?: string;
}

export interface VocalRequest {
  title?: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  key?: string;
  songLength?: string;
  hitmakerMode?: boolean;
  lyrics?: { hook?: string[]; verse1?: string[]; chorus?: string[] };
  keeperLine?: string;
  melodyDirection?: string;
  productionNotes?: { chordVibe?: string; melodyDirection?: string; arrangement?: string };
}

export interface LeadVocalRequest {
  lyrics?: string;
  instrumentalUrl?: string;
  gender?: string;
  performanceFeel?: string;
  vocalStyle?: string;
  emotionalTone?: string;
  buildMode?: string;
  genre?: string;
  bpm?: number;
  key?: string;
}

export interface MasterRequest {
  instrumentalUrl?: string;
  vocalUrl?: string;
  mixFeel?: string;
  genre?: string;
  bpm?: number;
  key?: string;
  includeStems?: boolean;
}

export interface StemRequest {
  masteredUrl?: string;
  stems?: string[];
  genre?: string;
  bpm?: number;
  key?: string;
}

// ─── Job Dispatch Result ──────────────────────────────────────────────────────

export interface JobDispatchResult {
  jobId: string;
  status: JobStatus;
}
