/**
 * AfroMuse Access Control — Usage Tracking
 *
 * Lightweight client-side usage state. Persisted in localStorage so counters
 * survive page refreshes and reset daily. When a real backend quota system is
 * added, replace the localStorage calls here — nothing in the UI changes.
 */

import type { UsageState } from "./types";

const STORAGE_KEY = "afromuse_usage_v1";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function defaultUsage(): UsageState {
  return {
    sessionsBuiltToday:          0,
    instrumentalGenerationsUsed: 0,
    vocalGenerationsUsed:        0,
    exportsUsed:                 0,
    lastResetDate:               todayIso(),
  };
}

// ─── Read / Write ─────────────────────────────────────────────────────────────

export function readUsage(): UsageState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultUsage();

    const parsed = JSON.parse(raw) as UsageState;

    // Reset counters if a new day has started
    if (parsed.lastResetDate !== todayIso()) {
      const reset = defaultUsage();
      writeUsage(reset);
      return reset;
    }

    return parsed;
  } catch {
    return defaultUsage();
  }
}

function writeUsage(state: UsageState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable — degrade gracefully
  }
}

// ─── Increment Helpers ────────────────────────────────────────────────────────

export function trackSessionBuilt(): void {
  const usage = readUsage();
  writeUsage({ ...usage, sessionsBuiltToday: usage.sessionsBuiltToday + 1 });
}

export function trackInstrumentalGeneration(): void {
  const usage = readUsage();
  writeUsage({ ...usage, instrumentalGenerationsUsed: usage.instrumentalGenerationsUsed + 1 });
}

export function trackVocalGeneration(): void {
  const usage = readUsage();
  writeUsage({ ...usage, vocalGenerationsUsed: usage.vocalGenerationsUsed + 1 });
}

export function trackExport(): void {
  const usage = readUsage();
  writeUsage({ ...usage, exportsUsed: usage.exportsUsed + 1 });
}

// ─── Reset (for testing / admin) ─────────────────────────────────────────────

export function resetUsage(): void {
  writeUsage(defaultUsage());
}
