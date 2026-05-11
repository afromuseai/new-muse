/**
 * callbackStore.ts
 *
 * In-memory store for AI Music API callback results.
 *
 * When a generation job is submitted, we register the task_id here.
 * The AI Music API POSTs results to /api/instrumental/callback which
 * writes into this store. The polling loop checks here first and
 * short-circuits as soon as a result arrives via callback.
 *
 * Entries auto-expire after 10 minutes to prevent unbounded growth.
 */

export interface CallbackResult {
  audioUrl:   string;
  imageUrl:   string | null;
  title:      string | null;
  receivedAt: number;
}

interface CallbackEntry {
  result:    CallbackResult | null;
  resolvers: Array<(r: CallbackResult) => void>;
  expiresAt: number;
}

const TTL_MS = 10 * 60 * 1000; // 10 minutes

const store = new Map<string, CallbackEntry>();

function pruneExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(key);
  }
}

/** Register a task_id so the callback handler knows to accept it. */
export function registerTask(taskId: string): void {
  pruneExpired();
  if (!store.has(taskId)) {
    store.set(taskId, { result: null, resolvers: [], expiresAt: Date.now() + TTL_MS });
  }
}

/** Called by the callback route when AI Music API POSTs a result. */
export function deliverCallback(taskId: string, result: CallbackResult): boolean {
  const entry = store.get(taskId);
  if (!entry) return false;
  entry.result = result;
  entry.expiresAt = Date.now() + TTL_MS;
  for (const resolve of entry.resolvers) resolve(result);
  entry.resolvers = [];
  return true;
}

/** Returns the already-delivered result for a task_id, or null if not yet arrived. */
export function getCallbackResult(taskId: string): CallbackResult | null {
  return store.get(taskId)?.result ?? null;
}

/** Returns a Promise that resolves when the callback is delivered, or null after timeoutMs. */
export function waitForCallback(taskId: string, timeoutMs: number): Promise<CallbackResult | null> {
  const entry = store.get(taskId);
  if (!entry) return Promise.resolve(null);
  if (entry.result) return Promise.resolve(entry.result);
  return new Promise<CallbackResult | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    entry.resolvers.push((r) => {
      clearTimeout(timer);
      resolve(r);
    });
  });
}

/** Remove a task entry after the job completes. */
export function clearTask(taskId: string): void {
  store.delete(taskId);
}
