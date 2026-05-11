import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export interface EngineStatus {
  instrumental: {
    apiKeySet:   boolean;
    endpointSet: boolean;
    isLive:      boolean;
  };
}

export interface UseEngineStatus {
  status:    EngineStatus | null;
  loading:   boolean;
  refresh:   () => void;
  setApiKey: (key: string) => Promise<{ ok: boolean; error?: string }>;
  saving:    boolean;
}

export function useEngineStatus(): UseEngineStatus {
  const [status,  setStatus]  = useState<EngineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/admin/engine-status`, {
        credentials: "include",
      });
      if (res.ok) {
        setStatus(await res.json());
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setApiKey = useCallback(async (key: string): Promise<{ ok: boolean; error?: string }> => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/set-api-key`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ provider: "instrumental", key }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus((prev) =>
          prev
            ? { ...prev, instrumental: { ...prev.instrumental, apiKeySet: data.apiKeySet, isLive: data.apiKeySet && prev.instrumental.endpointSet } }
            : prev,
        );
        return { ok: true };
      }
      return { ok: false, error: data.error ?? "Failed to save key." };
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : "Network error." };
    } finally {
      setSaving(false);
    }
  }, []);

  return { status, loading, refresh, setApiKey, saving };
}
