import { useState, useCallback, useEffect } from "react";
import type { SongDraft } from "@/lib/songGenerator";

const STORAGE_KEY = "afromuse_gen_history";
const MAX_ENTRIES = 25;

export interface HistoryEntry {
  id: string;
  title: string;
  genre: string;
  mood: string;
  languageFlavor: string;
  topic: string;
  draft: SongDraft;
  generatedAt: string;
}

function loadFromStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveToStorage(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
  }
}

export function useGenerationHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadFromStorage());

  useEffect(() => {
    saveToStorage(history);
  }, [history]);

  const addEntry = useCallback(
    (params: { title: string; genre: string; mood: string; languageFlavor: string; topic: string; draft: SongDraft }) => {
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        generatedAt: new Date().toISOString(),
        ...params,
      };
      setHistory((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));
    },
    [],
  );

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, addEntry, removeEntry, clearHistory };
}
