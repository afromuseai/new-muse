/**
 * AfroMuse V2 Project Library Context
 *
 * Provides CRUD operations and state for the session library backed by the database.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { SongDraft } from "@/lib/songGenerator";
import type { OutputRegistryEntry } from "@/lib/engine/outputRegistry";
import {
  type SavedSession,
  type SaveSessionParams,
  loadSessionsFromDB,
  saveSessionToDB,
  deleteSessionFromDB,
  duplicateSessionInDB,
} from "@/lib/projectLibrary";

// ─── Context Shape ────────────────────────────────────────────────────────────

interface ProjectLibraryContextValue {
  sessions: SavedSession[];
  isLoading: boolean;

  /** Save (or update) the current session. Returns the persisted session. */
  saveCurrentSession: (params: SaveSessionParams) => Promise<SavedSession>;

  /** Remove a session by ID. */
  deleteSession: (sessionId: string) => Promise<void>;

  /** Clone a session with a new ID. Returns the clone. */
  duplicateSession: (sessionId: string) => Promise<SavedSession | null>;

  /** Refresh sessions from the server. */
  refresh: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ProjectLibraryContext = createContext<ProjectLibraryContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ProjectLibraryProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await loadSessionsFromDB();
      setSessions(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveCurrentSession = useCallback(async (params: SaveSessionParams): Promise<SavedSession> => {
    const saved = await saveSessionToDB(params);
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.sessionId === saved.sessionId);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    return saved;
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    await deleteSessionFromDB(sessionId);
    setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
  }, []);

  const duplicateSession = useCallback(
    async (sessionId: string): Promise<SavedSession | null> => {
      const clone = await duplicateSessionInDB(sessions, sessionId);
      if (clone) setSessions((prev) => [clone, ...prev]);
      return clone;
    },
    [sessions],
  );

  return (
    <ProjectLibraryContext.Provider
      value={{ sessions, isLoading, saveCurrentSession, deleteSession, duplicateSession, refresh }}
    >
      {children}
    </ProjectLibraryContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProjectLibrary() {
  const ctx = useContext(ProjectLibraryContext);
  if (!ctx) throw new Error("useProjectLibrary must be used inside ProjectLibraryProvider");
  return ctx;
}

// ─── Resume Helper Type ───────────────────────────────────────────────────────

/** All state that Studio.tsx needs to restore when resuming a session. */
export interface ResumedSessionState {
  topic: string;
  genre: string;
  mood: string;
  songLength: string;
  lyricsSource: string;
  languageFlavor: string;
  customFlavor: string;
  style: string;
  notes: string;
  commercialMode: boolean;
  lyricalDepth: string;
  hookRepeat: string;
  genderVoiceModel: string;
  performanceFeel: string;
  draft: SongDraft | null;
  outputRegistry: Partial<OutputRegistryEntry> | null;
  sessionId: string;
  sessionTitle: string;
  bounceStyle?: string;
  melodyDensity?: string;
  drumCharacter?: string;
  hookLift?: string;
  dialectStyle?: string;
}

export function extractResumeState(session: SavedSession): ResumedSessionState {
  return {
    topic: session.topic,
    genre: session.genre,
    mood: session.mood,
    songLength: session.songLength,
    lyricsSource: session.lyricsSource,
    languageFlavor: session.languageFlavor,
    customFlavor: session.customFlavor,
    style: session.style,
    notes: session.notes,
    commercialMode: session.commercialMode,
    lyricalDepth: session.lyricalDepth,
    hookRepeat: session.hookRepeat,
    genderVoiceModel: session.genderVoiceModel,
    performanceFeel: session.performanceFeel,
    draft: session.draft,
    outputRegistry: session.outputRegistry,
    sessionId: session.sessionId,
    sessionTitle: session.sessionTitle,
    bounceStyle: session.bounceStyle,
    melodyDensity: session.melodyDensity,
    drumCharacter: session.drumCharacter,
    hookLift: session.hookLift,
    dialectStyle: session.dialectStyle,
  };
}
