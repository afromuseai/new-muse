/**
 * AfroMuse V2 Project Library
 *
 * Database-backed persistence layer. All CRUD operations call the API server.
 * The local `localStorage` fallback is kept only for unauthenticated guests.
 */

import type { SongDraft } from "./songGenerator";
import type { OutputRegistryEntry } from "./engine/outputRegistry";

// ─── Session Status ───────────────────────────────────────────────────────────

export type SessionStatus =
  | "Draft"
  | "In Progress"
  | "Beat Ready"
  | "Live Audio Ready"
  | "Vocal Ready"
  | "Export Ready";

// ─── Saved Session Model ──────────────────────────────────────────────────────

export interface SavedSession {
  sessionId: string;
  sessionTitle: string;

  topic: string;
  genre: string;
  mood: string;
  songLength: string;
  lyricsSource: string;
  lyricsText: string;
  languageFlavor: string;
  customFlavor: string;
  style: string;
  notes: string;
  commercialMode: boolean;
  lyricalDepth: string;
  hookRepeat: string;
  genderVoiceModel: string;
  performanceFeel: string;

  bpm: string | null;
  key: string | null;
  energy: string | null;
  atmosphere: string | null;
  leadVoice: string | null;
  mixFeel: string | null;

  bounceStyle?: string;
  melodyDensity?: string;
  drumCharacter?: string;
  hookLift?: string;
  dialectStyle?: string;

  buildMode: "artist" | "producer" | null;
  currentStage: SessionStatus;
  exportStatus: "none" | "partial" | "ready";

  draft: SongDraft | null;
  outputRegistry: Partial<OutputRegistryEntry> | null;

  createdAt: string;
  updatedAt: string;
}

// ─── Status Intelligence ──────────────────────────────────────────────────────

export function deriveSessionStatus(
  draft: SongDraft | null,
  outputRegistry: Partial<OutputRegistryEntry> | null,
): SessionStatus {
  if (!draft) return "Draft";
  const reg = outputRegistry ?? {};
  if (reg.masteredMp3 || reg.masteredWav) return "Export Ready";
  if (reg.vocalPreview || reg.vocalBrief) return "Vocal Ready";
  if (
    typeof reg.instrumentalPreview === "string" &&
    reg.instrumentalPreview.startsWith("data:audio/")
  ) {
    return "Live Audio Ready";
  }
  if (reg.sessionBrief || reg.producerNotes || reg.beatSummary || reg.instrumentalPreview) {
    return "Beat Ready";
  }
  if (reg.arrangementMap || reg.mixBrief || reg.extractionBrief) return "In Progress";
  return "Draft";
}

export function deriveExportStatus(
  outputRegistry: Partial<OutputRegistryEntry> | null,
): SavedSession["exportStatus"] {
  const reg = outputRegistry ?? {};
  if (reg.masteredMp3 || reg.masteredWav || reg.stemsZip) return "ready";
  if (reg.instrumentalPreview || reg.vocalPreview) return "partial";
  return "none";
}

// ─── ID Generator ────────────────────────────────────────────────────────────

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Save Params ─────────────────────────────────────────────────────────────

export interface SaveSessionParams {
  sessionId?: string;
  sessionTitle?: string;
  topic: string;
  genre: string;
  mood: string;
  songLength: string;
  lyricsSource: string;
  lyricsText?: string;
  languageFlavor: string;
  customFlavor?: string;
  style?: string;
  notes?: string;
  commercialMode?: boolean;
  lyricalDepth?: string;
  hookRepeat?: string;
  genderVoiceModel?: string;
  performanceFeel?: string;
  buildMode?: "artist" | "producer" | null;
  mixFeel?: string;
  bounceStyle?: string;
  melodyDensity?: string;
  drumCharacter?: string;
  hookLift?: string;
  dialectStyle?: string;
  draft: SongDraft | null;
  outputRegistry?: Partial<OutputRegistryEntry> | null;
}

// ─── API helpers ─────────────────────────────────────────────────────────────

const API_BASE = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const token = localStorage.getItem("afromuse_auth_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {}
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers,
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

// ─── API CRUD Operations ─────────────────────────────────────────────────────

export async function loadSessionsFromDB(): Promise<SavedSession[]> {
  try {
    const data = await apiFetch<{ sessions: SavedSession[] }>("/projects");
    return data.sessions;
  } catch {
    return [];
  }
}

export async function saveSessionToDB(params: SaveSessionParams): Promise<SavedSession> {
  const draft = params.draft;
  const outputRegistry = params.outputRegistry ?? null;
  const now = new Date().toISOString();

  const session: SavedSession = {
    sessionId: params.sessionId ?? generateSessionId(),
    sessionTitle:
      params.sessionTitle ??
      draft?.title ??
      (params.topic
        ? `${params.topic.slice(0, 32)} — ${params.genre}`
        : `Untitled · ${params.genre}`),
    topic: params.topic,
    genre: params.genre,
    mood: params.mood,
    songLength: params.songLength,
    lyricsSource: params.lyricsSource,
    lyricsText: params.lyricsText ?? "",
    languageFlavor: params.languageFlavor,
    customFlavor: params.customFlavor ?? "",
    style: params.style ?? "",
    notes: params.notes ?? "",
    commercialMode: params.commercialMode ?? false,
    lyricalDepth: params.lyricalDepth ?? "Balanced",
    hookRepeat: params.hookRepeat ?? "Medium",
    genderVoiceModel: params.genderVoiceModel ?? "Random",
    performanceFeel: params.performanceFeel ?? "Smooth",
    bpm: draft?.productionNotes?.bpm ?? null,
    key: draft?.productionNotes?.key ?? null,
    energy: draft?.productionNotes?.energy ?? null,
    atmosphere: draft?.sonicIdentity?.atmosphere ?? null,
    leadVoice: draft?.vocalIdentity?.leadType ?? null,
    mixFeel: params.mixFeel ?? null,
    bounceStyle: params.bounceStyle,
    melodyDensity: params.melodyDensity,
    drumCharacter: params.drumCharacter,
    hookLift: params.hookLift,
    dialectStyle: params.dialectStyle,
    buildMode: params.buildMode ?? null,
    currentStage: deriveSessionStatus(draft, outputRegistry),
    exportStatus: deriveExportStatus(outputRegistry),
    draft,
    outputRegistry,
    createdAt: now,
    updatedAt: now,
  };

  const data = await apiFetch<{ session: SavedSession }>("/projects", {
    method: "POST",
    body: JSON.stringify(session),
  });

  return data.session as SavedSession;
}

export async function deleteSessionFromDB(sessionId: string): Promise<void> {
  await apiFetch(`/projects/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
}

export async function duplicateSessionInDB(
  sessions: SavedSession[],
  sessionId: string,
): Promise<SavedSession | null> {
  const original = sessions.find((s) => s.sessionId === sessionId);
  if (!original) return null;
  const now = new Date().toISOString();
  const clone: SavedSession = {
    ...original,
    sessionId: generateSessionId(),
    sessionTitle: `Copy of ${original.sessionTitle}`,
    createdAt: now,
    updatedAt: now,
  };
  const data = await apiFetch<{ session: SavedSession }>("/projects", {
    method: "POST",
    body: JSON.stringify(clone),
  });
  return data.session as SavedSession;
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Legacy localStorage stubs (kept for backward compatibility) ──────────────
// These are no longer called internally — the context uses the DB functions above.

const STORAGE_KEY = "afromuse_v2_project_library";

export function loadSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedSession[];
  } catch {
    return [];
  }
}

export function saveSession(params: SaveSessionParams): SavedSession {
  const draft = params.draft;
  const outputRegistry = params.outputRegistry ?? null;
  const now = new Date().toISOString();
  return {
    sessionId: params.sessionId ?? generateSessionId(),
    sessionTitle: params.sessionTitle ?? draft?.title ?? `Untitled · ${params.genre}`,
    topic: params.topic,
    genre: params.genre,
    mood: params.mood,
    songLength: params.songLength,
    lyricsSource: params.lyricsSource,
    lyricsText: params.lyricsText ?? "",
    languageFlavor: params.languageFlavor,
    customFlavor: params.customFlavor ?? "",
    style: params.style ?? "",
    notes: params.notes ?? "",
    commercialMode: params.commercialMode ?? false,
    lyricalDepth: params.lyricalDepth ?? "Balanced",
    hookRepeat: params.hookRepeat ?? "Medium",
    genderVoiceModel: params.genderVoiceModel ?? "Random",
    performanceFeel: params.performanceFeel ?? "Smooth",
    bpm: draft?.productionNotes?.bpm ?? null,
    key: draft?.productionNotes?.key ?? null,
    energy: draft?.productionNotes?.energy ?? null,
    atmosphere: draft?.sonicIdentity?.atmosphere ?? null,
    leadVoice: draft?.vocalIdentity?.leadType ?? null,
    mixFeel: params.mixFeel ?? null,
    dialectStyle: params.dialectStyle,
    buildMode: params.buildMode ?? null,
    currentStage: deriveSessionStatus(draft, outputRegistry),
    exportStatus: deriveExportStatus(outputRegistry),
    draft,
    outputRegistry,
    createdAt: now,
    updatedAt: now,
  };
}

export function deleteSessionById(sessionId: string): SavedSession[] {
  return loadSessions().filter((s) => s.sessionId !== sessionId);
}

export function duplicateSessionById(sessionId: string): SavedSession | null {
  const sessions = loadSessions();
  const original = sessions.find((s) => s.sessionId === sessionId);
  if (!original) return null;
  const now = new Date().toISOString();
  return { ...original, sessionId: generateSessionId(), sessionTitle: `Copy of ${original.sessionTitle}`, createdAt: now, updatedAt: now };
}

export function updateSessionOutputRegistry(
  sessionId: string,
  outputRegistry: Partial<OutputRegistryEntry>,
): void {
  // No-op: context handles this via saveSessionToDB
  void sessionId;
  void outputRegistry;
}
