/**
 * Legacy type aliases — kept for backward compatibility with any code that
 * imports these shapes directly from the routes layer.
 * These are now superseded by SessionBlueprintData in the engine types.
 */

export interface AiSessionData {
  beatSummary: string;
  arrangementMap: string;
  producerNotes: string;
  hookFocus: string;
  arrangementStyle: string;
  sonicIdentity: { coreBounce: string; atmosphere: string; mainTexture: string };
  sessionBrief: string;
}

export interface LeadVocalSessionData {
  vocalBrief: string;
  phrasingGuide: string;
  emotionalArc: string;
  syncNotes: string;
  performanceDirection: string;
  deliveryStyle: string;
  vocalProcessingNotes: string;
}

export interface MixMasterSessionData {
  mixBrief: string;
  levelBalancing: string;
  eqNotes: string;
  compressionNotes: string;
  spatialEffects: string;
  masteringChain: string;
  outputNotes: string;
  stemsNotes: string | null;
}

export interface StemTrackData {
  name: string;
  extractionNotes: string;
  gainLevel: string;
  fileSpec: string;
}

export interface StemExtractionSessionData {
  extractionBrief: string;
  stems: StemTrackData[];
  phaseAlignmentNotes: string;
  dawImportGuide: string;
  recommendedTool: string;
}

export interface InstrumentalMetadata {
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  energy: string;
  duration: string;
  hitmakerMode: boolean;
  hookRepeatLevel: string;
  audioType: "Instrumental Preview";
}

export interface VocalMetadata {
  vocalStyle: string;
  bpm: number;
  key: string;
  duration: string;
  genre: string;
  mood: string;
  hitmakerMode: boolean;
  audioType: "Vocal Demo";
}
