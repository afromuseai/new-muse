/**
 * AfroMuse Audio Buffer Store
 *
 * Holds raw audio buffers (e.g. ElevenLabs TTS output) in-memory keyed by jobId.
 * Buffers expire after 30 minutes — same TTL as the job store.
 * Served to the frontend by GET /api/voice-clone/audio/:jobId.
 *
 * When persistent storage (S3, GCS, Cloudflare R2) is added, swap out
 * storeAudioBuffer() and getAudioBuffer() with CDN-backed equivalents.
 * The route and the vocal provider only call these two functions.
 */

const BUFFER_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface AudioEntry {
  buffer: Buffer;
  contentType: string;
  createdAt: number;
}

const store = new Map<string, AudioEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now - entry.createdAt > BUFFER_TTL_MS) store.delete(id);
  }
}, 5 * 60 * 1000).unref();

export function storeAudioBuffer(
  jobId: string,
  buffer: Buffer,
  contentType = "audio/mpeg",
): void {
  store.set(jobId, { buffer, contentType, createdAt: Date.now() });
}

export function getAudioBuffer(jobId: string): AudioEntry | null {
  return store.get(jobId) ?? null;
}

export function deleteAudioBuffer(jobId: string): void {
  store.delete(jobId);
}
