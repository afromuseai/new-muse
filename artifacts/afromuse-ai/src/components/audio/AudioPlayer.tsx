import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Download, RefreshCw } from "lucide-react";

interface SessionMeta {
  genre?: string;
  bpm?: number;
  key?: string;
  energy?: string;
  buildMode?: string;
  hitmakerMode?: boolean;
}

interface AudioPlayerProps {
  audioUrl: string | null;
  duration: string;
  title: string;
  audioType: "Instrumental Preview" | "Vocal Demo";
  onRegenerate?: () => void;
  onDownload?: () => void;
  isLive?: boolean;
  sessionMeta?: SessionMeta;
}

function durationToSeconds(dur: string): number {
  const parts = dur.split(":").map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

function secondsToDisplay(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const BAR_COUNT = 48;

function useSimulatedBars() {
  return useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const base = 18 + Math.sin(i * 0.5) * 14 + Math.sin(i * 1.3) * 9 + Math.sin(i * 2.4) * 4;
      const frames = [
        Math.max(6, Math.min(90, base)),
        Math.max(6, Math.min(90, base + (((i * 19 + 5) % 40) - 20))),
        Math.max(6, Math.min(90, base + (((i * 13 + 3) % 28) - 14))),
        Math.max(6, Math.min(90, base + (((i * 7  + 2) % 22) - 11))),
        Math.max(6, Math.min(90, base)),
      ];
      return { base: Math.max(6, Math.min(90, base)), frames };
    });
  }, []);
}

function Waveform({
  playing,
  accent,
  progress,
  realBars,
}: {
  playing: boolean;
  accent: "amber" | "violet";
  progress: number;
  realBars: number[];
}) {
  const simBars = useSimulatedBars();
  const useReal = realBars.length === BAR_COUNT;

  const playedColor  = accent === "violet" ? "#a78bfa" : "#f59e0b";
  const pendingColor = "rgba(255,255,255,0.10)";

  return (
    <div className="flex items-end gap-[2px] h-14 w-full">
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const played = i / BAR_COUNT <= progress;
        const heightPct = useReal
          ? realBars[i]
          : simBars[i]?.base ?? 20;

        return (
          <motion.div
            key={i}
            className="flex-1 rounded-full"
            style={{
              backgroundColor: played ? playedColor : pendingColor,
              minWidth: 2,
            }}
            animate={{ height: `${heightPct}%` }}
            transition={
              useReal
                ? { duration: 0.05, ease: "linear" }
                : playing
                  ? {
                      duration: 0.5 + (i % 7) * 0.06,
                      repeat: Infinity,
                      repeatType: "mirror",
                      delay: i * 0.015,
                      ease: "easeInOut",
                    }
                  : { duration: 0.25 }
            }
          />
        );
      })}
    </div>
  );
}

function SessionMetaBar({ meta, accent }: { meta: SessionMeta; accent: "amber" | "violet" }) {
  const items: string[] = [
    meta.genre,
    meta.bpm ? `${meta.bpm} BPM` : undefined,
    meta.key,
    meta.energy,
    meta.buildMode,
    meta.hitmakerMode ? "Hitmaker" : undefined,
  ].filter((v): v is string => Boolean(v));

  if (items.length === 0) return null;

  const dotColor = accent === "violet" ? "bg-violet-400/50" : "bg-primary/50";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5 text-[10px] font-medium text-white/35">
          {i > 0 && <span className={`w-1 h-1 rounded-full ${dotColor} opacity-60`} />}
          {item}
        </span>
      ))}
    </div>
  );
}

export default function AudioPlayer({
  audioUrl,
  duration,
  title,
  audioType,
  onRegenerate,
  onDownload,
  isLive = false,
  sessionMeta,
}: AudioPlayerProps) {
  const [playing, setPlaying]         = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [realBars, setRealBars]       = useState<number[]>([]);

  const totalSeconds = durationToSeconds(duration);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const progressRef  = useRef<HTMLDivElement>(null);

  // Web Audio API refs
  const audioCtxRef  = useRef<AudioContext | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const sourceRef    = useRef<MediaElementAudioSourceNode | null>(null);
  const freqDataRef  = useRef<Uint8Array | null>(null);
  const rafRef       = useRef<number | null>(null);

  const accent = audioType === "Vocal Demo" ? "violet" : "amber";

  const accentPlayBtn =
    accent === "violet"
      ? "bg-violet-600 hover:bg-violet-500 shadow-[0_4px_20px_rgba(139,92,246,0.25)] hover:shadow-[0_4px_28px_rgba(139,92,246,0.38)]"
      : "bg-primary hover:bg-primary/90 shadow-[0_4px_20px_rgba(245,158,11,0.22)] hover:shadow-[0_4px_28px_rgba(245,158,11,0.35)]";

  const accentProgressBar =
    accent === "violet"
      ? "bg-gradient-to-r from-violet-500 to-violet-300"
      : "bg-gradient-to-r from-primary to-amber-400";

  const accentScrubber =
    accent === "violet"
      ? "bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]"
      : "bg-primary shadow-[0_0_8px_rgba(245,158,11,0.6)]";

  // ── Fake timer (fallback when Web Audio isn't available) ──────────────────
  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startFakeTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= totalSeconds) { clearTimer(); setPlaying(false); return 0; }
        return prev + 0.25;
      });
    }, 250);
  }, [totalSeconds, clearTimer]);

  // ── Web Audio API visualiser ──────────────────────────────────────────────
  const stopRAF = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setRealBars([]);
  }, []);

  const startRAF = useCallback(() => {
    if (!analyserRef.current || !freqDataRef.current) return;
    const analyser = analyserRef.current;
    const data     = freqDataRef.current;
    const binCount = analyser.frequencyBinCount;

    const loop = () => {
      analyser.getByteFrequencyData(data);
      const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
        const start = Math.floor(i * binCount / BAR_COUNT);
        const end   = Math.max(start + 1, Math.floor((i + 1) * binCount / BAR_COUNT));
        let sum = 0;
        for (let j = start; j < end; j++) sum += data[j] ?? 0;
        const avg = sum / (end - start);
        // Apply a slight frequency curve — boost mids, calm the highs
        const curve = 1 + Math.sin((i / BAR_COUNT) * Math.PI) * 0.4;
        return Math.max(6, Math.min(96, (avg / 255) * 90 * curve + 6));
      });
      setRealBars(bars);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const connectAnalyser = useCallback(() => {
    if (!audioRef.current || sourceRef.current) return;
    try {
      const ctx      = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;
      const source   = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      audioCtxRef.current  = ctx;
      analyserRef.current  = analyser;
      sourceRef.current    = source;
    } catch {
      /* Web Audio unavailable (e.g. CORS) — fall back to simulated bars */
    }
  }, []);

  // ── Play / pause logic ────────────────────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current || !audioUrl) {
      if (playing) startFakeTimer();
      else clearTimer();
      return clearTimer;
    }
    if (playing) {
      connectAnalyser();
      if (audioCtxRef.current?.state === "suspended") void audioCtxRef.current.resume();
      audioRef.current.play().catch(() => { startFakeTimer(); });
      startRAF();
    } else {
      audioRef.current.pause();
      clearTimer();
      stopRAF();
    }
    return clearTimer;
  }, [playing, audioUrl, connectAnalyser, startFakeTimer, clearTimer, startRAF, stopRAF]);

  // Clean up on unmount
  useEffect(() => () => {
    clearTimer();
    stopRAF();
    sourceRef.current?.disconnect();
    audioCtxRef.current?.close();
  }, [clearTimer, stopRAF]);

  const togglePlay = () => setPlaying((p) => !p);

  const replay = () => {
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
    setPlaying(true);
  };

  const seekToRatio = useCallback(
    (ratio: number) => {
      const newTime = Math.max(0, Math.min(1, ratio)) * totalSeconds;
      setCurrentTime(newTime);
      if (audioRef.current) audioRef.current.currentTime = newTime;
    },
    [totalSeconds],
  );

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const seek = (clientX: number) => {
      const rect = progressRef.current!.getBoundingClientRect();
      seekToRatio((clientX - rect.left) / rect.width);
    };
    seek(e.clientX);
    const onMove = (ev: MouseEvent) => seek(ev.clientX);
    const onUp   = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = totalSeconds * 0.05;
    if (e.key === "ArrowRight") seekToRatio((currentTime + step) / totalSeconds);
    if (e.key === "ArrowLeft")  seekToRatio((currentTime - step) / totalSeconds);
    if (e.key === " ") { e.preventDefault(); togglePlay(); }
  };

  const handleDownload = async () => {
    if (!onDownload || isDownloading) return;
    setIsDownloading(true);
    try { await Promise.resolve(onDownload()); }
    finally { setTimeout(() => setIsDownloading(false), 1200); }
  };

  const progress = totalSeconds > 0 ? Math.min(1, currentTime / totalSeconds) : 0;

  return (
    <div className="rounded-2xl border border-white/8 bg-gradient-to-b from-[#0c0c1a] to-[#080810] p-5 md:p-6">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          crossOrigin="anonymous"
          onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
          onEnded={() => { setPlaying(false); setCurrentTime(0); stopRAF(); }}
        />
      )}

      {/* Session metadata */}
      {sessionMeta && <SessionMetaBar meta={sessionMeta} accent={accent} />}

      {/* ── Waveform visualiser — always shown ── */}
      <div className="mb-3">
        <Waveform playing={playing} accent={accent} progress={progress} realBars={realBars} />
      </div>

      {/* ── Label row above progress bar ── */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono text-white/35 tabular-nums">
          {secondsToDisplay(currentTime)}
        </span>
        <span className={`text-[9px] font-bold tracking-widest uppercase ${
          realBars.length > 0 ? (accent === "violet" ? "text-violet-400/60" : "text-amber-400/60") : "text-white/18"
        }`}>
          {realBars.length > 0 ? "● Live Analysis" : isLive ? "LIVE PREVIEW" : "PREVIEW"}
        </span>
        <span className="text-[10px] font-mono text-white/25 tabular-nums">{duration}</span>
      </div>

      {/* ── Progress track ── */}
      <div
        ref={progressRef}
        role="slider"
        aria-label="Playback position"
        aria-valuemin={0}
        aria-valuemax={totalSeconds}
        aria-valuenow={Math.floor(currentTime)}
        tabIndex={0}
        className="relative h-1.5 rounded-full bg-white/8 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 mb-5"
        onMouseDown={handleProgressMouseDown}
        onKeyDown={handleProgressKeyDown}
      >
        <motion.div
          className={`absolute top-0 left-0 h-full rounded-full ${accentProgressBar}`}
          style={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.15 }}
        />
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity ${accentScrubber}`}
          style={{ left: `calc(${progress * 100}% - 6px)` }}
        />
      </div>

      {/* ── Playback controls ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={replay}
          aria-label="Replay from start"
          className="w-9 h-9 rounded-xl border border-white/8 flex items-center justify-center text-white/35 hover:text-white/70 hover:border-white/20 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play preview"}
          className={`flex-1 h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all ${accentPlayBtn}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={playing ? "pause" : "play"}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {playing ? "Pause" : "Play Preview"}
            </motion.div>
          </AnimatePresence>
        </button>

        {onDownload && isLive && audioUrl && (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            aria-label="Download audio"
            title="Save MP3"
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
              isDownloading
                ? "border-white/6 text-white/20 cursor-default"
                : "border-white/8 text-white/35 hover:text-white/70 hover:border-white/20"
            }`}
          >
            {isDownloading ? (
              <motion.div
                className="w-3.5 h-3.5 rounded-full border-2 border-white/15 border-t-white/50"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {onRegenerate && (
          <button
            onClick={onRegenerate}
            aria-label="Regenerate"
            className="w-9 h-9 rounded-xl border border-white/8 flex items-center justify-center text-white/35 hover:text-white/70 hover:border-white/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Footer copy */}
      {isLive && audioUrl && (
        <p className="text-[10px] text-white/18 text-center mt-4 leading-relaxed">
          Shaped from your Beat DNA · {title}
        </p>
      )}
      {!audioUrl && (
        <p className="text-[10px] text-white/18 text-center mt-4 leading-relaxed">
          Preview mode · Real audio engine integration ready
        </p>
      )}
    </div>
  );
}
