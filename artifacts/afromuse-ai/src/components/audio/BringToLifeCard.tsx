import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music2, Mic2, Zap, Sparkles, Download, FileText, RefreshCw,
  ChevronRight, AlertCircle, Clock, Radio, ShieldCheck, Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AudioPlayer from "./AudioPlayer";
import { formatDraftForClipboard, type SongDraft } from "@/lib/songGenerator";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AudioStatus = "idle" | "loading" | "ready" | "error";

export interface InstrumentalMetadata {
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  energy: string;
  duration: string;
  hitmakerMode: boolean;
  hookRepeatLevel: string;
  audioType: "Project Result";
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

type JobPollResponse =
  | { jobId: string; status: "processing" }
  | {
      jobId: string;
      status: "completed";
      audioUrl: string | null;
      duration: string;
      metadata: InstrumentalMetadata | VocalMetadata;
      isLive: boolean;
      isFallback: boolean;
      provider: string;
    }
  | { jobId: string; status: "failed"; error: string };

interface BringToLifeCardProps {
  draft: SongDraft;
  genre: string;
  mood: string;
  topic: string;
  songLength: string;
  languageFlavor: string;
  style: string;
  commercialMode: boolean;
  lyricalDepth: string;
  hookRepeat: string;
  customFlavor: string;
}

// ─── Loading step labels ────────────────────────────────────────────────────────

const INSTRUMENTAL_STEPS = [
  "Building your groove...",
  "Shaping the rhythm...",
  "Arranging your vibe...",
  "Engineering the sound...",
  "Rendering preview...",
];

const VOCAL_STEPS = [
  "Finding the melody pocket...",
  "Laying the vocal guide...",
  "Shaping the chorus lift...",
  "Blending the harmonies...",
  "Rendering vocal preview...",
];

// ─── Job polling hook ──────────────────────────────────────────────────────────
// Polls GET /api/audio-job/:jobId every 3 seconds until completed or failed.
// Swapping the audio provider only requires changes on the server — this hook
// remains identical regardless of which engine produces the audio.

const POLL_INTERVAL_MS = 3000;

function useAudioJobPoller() {
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (
      jobId: string,
      onCompleted: (data: Extract<JobPollResponse, { status: "completed" }>) => void,
      onFailed: (error: string) => void,
    ) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/audio-job/${jobId}`);
          if (!res.ok) {
            stopPolling();
            onFailed("Status check failed");
            return;
          }
          const data = (await res.json()) as JobPollResponse;
          if (data.status === "completed") {
            stopPolling();
            onCompleted(data);
          } else if (data.status === "failed") {
            stopPolling();
            onFailed(data.error ?? "Generation failed");
          }
        } catch {
          stopPolling();
          onFailed("Network error during generation");
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  useEffect(() => stopPolling, [stopPolling]);

  return { startPolling, stopPolling };
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function MetaChip({ label, value }: { label: string; value: string | number | boolean }) {
  const display = typeof value === "boolean" ? (value ? "On" : "Off") : String(value);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-bold tracking-widest uppercase text-white/25">{label}</span>
      <span className="text-xs font-semibold text-white/65">{display}</span>
    </div>
  );
}

function AudioMetadataPanel({
  metadata,
  jobId,
  isLive,
}: {
  metadata: InstrumentalMetadata | VocalMetadata;
  jobId?: string | null;
  isLive?: boolean;
}) {
  const isInstrumental = metadata.audioType === "Project Result";
  return (
    <div className="rounded-xl border border-white/6 bg-white/[0.025] px-5 py-4 mt-3">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[9px] font-bold tracking-widest uppercase text-white/30">Audio Specs</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-6 gap-y-4">
        <MetaChip label="BPM" value={metadata.bpm} />
        <MetaChip label="Key" value={metadata.key} />
        {metadata.duration && <MetaChip label="Duration" value={metadata.duration} />}
        <MetaChip label="Genre" value={metadata.genre} />
        <MetaChip label="Mood" value={metadata.mood} />
        {isInstrumental && (
          <>
            <MetaChip label="Energy" value={(metadata as InstrumentalMetadata).energy} />
            <MetaChip label="Hook Repeat" value={(metadata as InstrumentalMetadata).hookRepeatLevel} />
          </>
        )}
        {!isInstrumental && (
          <MetaChip label="Vocal Style" value={(metadata as VocalMetadata).vocalStyle} />
        )}
        <MetaChip label="Hitmaker" value={metadata.hitmakerMode} />
        <MetaChip label="Build Mode" value={isLive ? "Live" : "Session"} />
        {jobId && (
          <div className="flex flex-col gap-0.5 col-span-2">
            <span className="text-[9px] font-bold tracking-widest uppercase text-white/25">Job ID</span>
            <span className="text-[10px] font-mono text-white/30 truncate">{jobId.slice(0, 16)}…</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EngineBadge({ isLive, provider }: { isLive: boolean; provider?: string }) {
  if (isLive) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/25 bg-primary/8">
        <Radio className="w-3 h-3 text-primary" />
        <span className="text-[9px] font-bold tracking-widest uppercase text-primary">
          {provider === "instrumental" ? "ElevenLabs Music" : "Live Engine"}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[9px] font-bold tracking-widest uppercase text-primary/70">Live</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/[0.03]">
      <Info className="w-3 h-3 text-white/30" />
      <span className="text-[9px] font-bold tracking-widest uppercase text-white/30">Session Preview</span>
    </div>
  );
}

function FallbackNotice() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/[0.025] px-4 py-3 mt-3">
      <ShieldCheck className="w-3.5 h-3.5 text-white/30 shrink-0 mt-0.5" />
      <div>
        <p className="text-[11px] font-semibold text-white/50">Session Preview · Blueprint Mode</p>
        <p className="text-[10px] text-white/25 mt-0.5 leading-relaxed">
          This is an AI-generated session guide, not a rendered audio file. Live generation was unavailable — your blueprint is ready to proceed.
        </p>
      </div>
    </div>
  );
}

function LiveSuccessNotice() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 mt-3">
      <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
      <p className="text-[11px] font-semibold text-primary/80">
        Real audio generated — this is a true rendered preview from ElevenLabs.
      </p>
    </div>
  );
}

function LoadingCard({
  steps,
  activeStep,
  label,
  accent,
}: {
  steps: string[];
  activeStep: number;
  label: string;
  accent: "amber" | "violet";
}) {
  const dotColor = accent === "violet" ? "bg-violet-400" : "bg-primary";
  const labelColor = accent === "violet" ? "text-violet-400/80" : "text-primary/80";
  const borderColor = accent === "violet" ? "border-violet-500/12 bg-violet-500/4" : "border-primary/12 bg-primary/4";
  const progressGradient =
    accent === "violet"
      ? "bg-gradient-to-r from-violet-500 to-violet-300"
      : "bg-gradient-to-r from-primary to-amber-400";

  return (
    <div className={`rounded-2xl border ${borderColor}`}>
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full animate-pulse ${dotColor}`} />
        <span className={`text-xs font-semibold ${labelColor}`}>{label}</span>
      </div>
      <div className="flex flex-col items-center py-10 gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-[2px] border-white/5 border-t-primary/70 animate-spin" />
          <div className="absolute inset-2 rounded-full border-[2px] border-white/5 border-b-amber-400/50 animate-[spin_2s_linear_infinite_reverse]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Music2 className="w-5 h-5 text-primary/70 animate-pulse" />
          </div>
        </div>
        <div className="h-6 flex items-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-white/50 font-medium"
            >
              {steps[activeStep]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="w-40 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${progressGradient}`}
            animate={{ width: ["0%", "100%"] }}
            transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-500/15 bg-red-500/5 px-5 py-4 flex items-center gap-3">
      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-white/60">{message}</p>
        <p className="text-[11px] text-white/30 mt-0.5">Check your connection and try again.</p>
      </div>
      <button
        onClick={onRetry}
        className="text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-all"
      >
        Retry
      </button>
    </div>
  );
}

function AudioResultCard({
  label,
  dotColor,
  borderColor,
  gradientFrom,
  headerBorder,
  metadata,
  audioUrl,
  draft,
  onRegenerate,
  onDownload,
  isLive,
  isFallback,
  jobId,
  provider,
}: {
  label: string;
  dotColor: string;
  borderColor: string;
  gradientFrom: string;
  headerBorder: string;
  metadata: InstrumentalMetadata | VocalMetadata;
  audioUrl: string | null;
  draft: SongDraft;
  onRegenerate: () => void;
  onDownload: () => void;
  isLive: boolean;
  isFallback: boolean;
  jobId?: string | null;
  provider?: string;
}) {
  const successLabel = isLive ? "Generated Successfully" : label;

  const isInstrumental = metadata.audioType === "Project Result";
  const sessionMeta = {
    genre: metadata.genre,
    bpm: metadata.bpm,
    key: metadata.key,
    energy: isInstrumental ? (metadata as InstrumentalMetadata).energy : undefined,
    buildMode: isLive ? "Live" : "Session",
    hitmakerMode: metadata.hitmakerMode,
  };

  return (
    <div className={`rounded-2xl border overflow-hidden ${borderColor} bg-gradient-to-b ${gradientFrom} to-transparent`}>
      <div className={`px-5 pt-4 pb-3 flex items-center justify-between border-b ${headerBorder}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColor}${isLive ? " animate-pulse" : ""}`} />
          <span className="text-xs font-bold text-white/70">{successLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <EngineBadge isLive={isLive} provider={provider} />
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerate
          </button>
        </div>
      </div>

      {/* Session context strip */}
      {isLive && (
        <div className="px-5 pt-3 pb-0">
          <p className="text-[10px] text-white/25 font-medium">
            Generated from your AfroMuse session blueprint
          </p>
        </div>
      )}

      <div className="p-4">
        <AudioPlayer
          audioUrl={audioUrl}
          duration={metadata.duration}
          title={draft.title}
          audioType={metadata.audioType}
          onRegenerate={onRegenerate}
          onDownload={onDownload}
          isLive={isLive}
          sessionMeta={sessionMeta}
        />
        {isLive && <LiveSuccessNotice />}
        {isFallback && <FallbackNotice />}
        <AudioMetadataPanel metadata={metadata} jobId={isLive ? jobId : null} isLive={isLive} />
      </div>
    </div>
  );
}

function ExportSection({
  draft,
  genre,
  mood,
  instrumentalMeta,
  vocalMeta,
  instrumentalAudioUrl,
  instrumentalIsLive,
}: {
  draft: SongDraft;
  genre: string;
  mood: string;
  instrumentalMeta: InstrumentalMetadata | null;
  vocalMeta: VocalMetadata | null;
  instrumentalAudioUrl: string | null;
  instrumentalIsLive: boolean;
}) {
  const { toast } = useToast();
  const [isDownloadingMp3, setIsDownloadingMp3] = useState(false);

  const downloadLyrics = () => {
    const text = formatDraftForClipboard(draft, genre, mood);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.title.toLowerCase().replace(/\s+/g, "_")}_lyrics.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Lyrics saved", description: `${draft.title} · lyrics.txt` });
  };

  const downloadProductionNotes = () => {
    const chordVibe = (draft as Record<string, unknown>).chordVibe as string | undefined;
    const melodyDirection = (draft as Record<string, unknown>).melodyDirection as string | undefined;
    const arrangement = (draft as Record<string, unknown>).arrangement as string | undefined;
    const lines = [
      `Song: ${draft.title}`,
      `Genre: ${genre} | Mood: ${mood}`,
      ``,
      ...(chordVibe ? [`CHORD / VIBE`, chordVibe, ``] : []),
      ...(melodyDirection ? [`MELODY DIRECTION`, melodyDirection, ``] : []),
      ...(arrangement ? [`ARRANGEMENT`, arrangement, ``] : []),
      ...(draft.hook ? [`HOOK`, draft.hook, ``] : []),
      `─ Created with AfroMuse AI ─`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.title.toLowerCase().replace(/\s+/g, "_")}_production_notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Production notes saved" });
  };

  const downloadInstrumentalMp3 = () => {
    if (!instrumentalAudioUrl || isDownloadingMp3) return;
    setIsDownloadingMp3(true);
    const a = document.createElement("a");
    a.href = instrumentalAudioUrl;
    a.download = `${draft.title.toLowerCase().replace(/\s+/g, "_")}_instrumental_preview.mp3`;
    a.click();
    toast({ title: "Saving Instrumental Preview", description: `${draft.title} · MP3 · Rendered by ElevenLabs` });
    setTimeout(() => setIsDownloadingMp3(false), 2000);
  };

  const notifyMp3Coming = (type: "instrumental" | "vocal") => {
    toast({
      title: `${type === "instrumental" ? "Instrumental" : "Vocal Demo"} Export — Live Generation Required`,
      description: "Generate a live audio preview first to unlock MP3 export.",
    });
  };

  const hasRealInstrumental =
    instrumentalIsLive &&
    typeof instrumentalAudioUrl === "string" &&
    instrumentalAudioUrl.startsWith("data:audio/");

  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.018] p-5 mt-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Download className="w-3.5 h-3.5 text-white/30" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-white/30">Save & Export</span>
        </div>
        {hasRealInstrumental && (
          <span className="text-[9px] font-medium text-primary/50 bg-primary/8 border border-primary/15 px-2 py-0.5 rounded-full">
            Live audio available
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={downloadLyrics}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-white/10 text-xs text-white/50 hover:text-white hover:border-white/25 hover:bg-white/5 transition-all"
        >
          <FileText className="w-3 h-3" />
          Save Lyrics
        </button>
        <button
          onClick={downloadProductionNotes}
          className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-white/10 text-xs text-white/50 hover:text-white hover:border-white/25 hover:bg-white/5 transition-all"
        >
          <FileText className="w-3 h-3" />
          Save Production Notes
        </button>
        {instrumentalMeta && hasRealInstrumental && (
          <button
            onClick={downloadInstrumentalMp3}
            disabled={isDownloadingMp3}
            className={`flex items-center gap-1.5 h-9 px-4 rounded-xl border text-xs font-semibold transition-all ${
              isDownloadingMp3
                ? "border-primary/15 bg-primary/4 text-primary/40 cursor-default"
                : "border-primary/25 text-primary/80 hover:text-primary hover:border-primary/50 hover:bg-primary/8"
            }`}
          >
            {isDownloadingMp3 ? (
              <>
                <motion.div
                  className="w-3 h-3 rounded-full border-2 border-primary/20 border-t-primary/60"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                Saving…
              </>
            ) : (
              <>
                <Download className="w-3 h-3" />
                Save Instrumental Preview
                <span className="ml-1 text-[9px] text-primary/50 font-bold tracking-wider uppercase">MP3</span>
              </>
            )}
          </button>
        )}
        {instrumentalMeta && !hasRealInstrumental && (
          <button
            onClick={() => notifyMp3Coming("instrumental")}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-white/8 text-xs text-white/25 hover:text-white/40 hover:border-white/15 transition-all"
          >
            <Clock className="w-3 h-3" />
            Instrumental Preview
            <span className="ml-1 text-[9px] text-white/20 font-bold tracking-wider uppercase">Needs Live</span>
          </button>
        )}
        {vocalMeta && (
          <button
            onClick={() => notifyMp3Coming("vocal")}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-violet-500/15 text-xs text-violet-400/50 hover:text-violet-300/70 hover:border-violet-500/30 transition-all"
          >
            <Clock className="w-3 h-3" />
            Vocal Demo
            <span className="ml-1 text-[9px] text-violet-400/35 font-bold tracking-wider uppercase">Coming</span>
          </button>
        )}
      </div>
    </div>
  );
}

function TriggerButton({
  onClick,
  disabled,
  status,
  icon,
  label,
  sublabel,
  accent,
}: {
  onClick: () => void;
  disabled: boolean;
  status: AudioStatus;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  accent: "amber" | "violet";
}) {
  const isLoading = status === "loading";
  const isReady = status === "ready";

  const borderReady = accent === "violet"
    ? "border-violet-500/25 bg-violet-500/8 text-violet-300 hover:border-violet-500/40 hover:bg-violet-500/12"
    : "border-primary/25 bg-primary/8 text-primary hover:border-primary/40 hover:bg-primary/12";
  const borderLoading = accent === "violet"
    ? "border-violet-500/30 bg-violet-500/8 text-violet-400/60 cursor-wait"
    : "border-primary/30 bg-primary/8 text-primary/60 cursor-wait";
  const iconReady = accent === "violet" ? "bg-violet-500/15 border-violet-500/25" : "bg-primary/15 border-primary/25";
  const iconReadyText = accent === "violet" ? "text-violet-400" : "text-primary";
  const spinnerColor = accent === "violet" ? "border-violet-500/30 border-t-violet-400" : "border-primary/30 border-t-primary";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden group flex items-center justify-between gap-3 h-16 rounded-2xl border px-5 text-sm font-semibold transition-all ${
        isLoading
          ? borderLoading
          : isReady
          ? borderReady
          : "border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${isReady ? iconReady : "bg-white/5 border-white/10"}`}>
          <span className={isReady ? iconReadyText : "text-white/40"}>{icon}</span>
        </div>
        <div className="text-left">
          <div className="text-sm font-semibold text-white/80">
            {isReady ? `Regenerate ${label}` : `Generate ${label}`}
          </div>
          <div className="text-[10px] text-white/30 mt-0.5">{sublabel}</div>
        </div>
      </div>
      {!isLoading && (
        <ChevronRight className="w-4 h-4 text-white/20 shrink-0 group-hover:text-white/50 transition-colors" />
      )}
      {isLoading && (
        <div className={`shrink-0 w-4 h-4 rounded-full border-2 animate-spin ${spinnerColor}`} />
      )}
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function BringToLifeCard({
  draft,
  genre,
  mood,
  topic,
  songLength,
  languageFlavor,
  style,
  commercialMode,
  lyricalDepth,
  hookRepeat,
  customFlavor,
}: BringToLifeCardProps) {
  const { toast } = useToast();

  const [instrumentalStatus, setInstrumentalStatus] = useState<AudioStatus>("idle");
  const [instrumentalStep, setInstrumentalStep] = useState(0);
  const [instrumentalMeta, setInstrumentalMeta] = useState<InstrumentalMetadata | null>(null);
  const [instrumentalAudioUrl, setInstrumentalAudioUrl] = useState<string | null>(null);
  const [instrumentalIsLive, setInstrumentalIsLive] = useState(false);
  const [instrumentalIsFallback, setInstrumentalIsFallback] = useState(false);
  const [instrumentalJobId, setInstrumentalJobId] = useState<string | null>(null);
  const [instrumentalProvider, setInstrumentalProvider] = useState<string | undefined>(undefined);

  const [vocalStatus, setVocalStatus] = useState<AudioStatus>("idle");
  const [vocalStep, setVocalStep] = useState(0);
  const [vocalMeta, setVocalMeta] = useState<VocalMetadata | null>(null);
  const [vocalAudioUrl, setVocalAudioUrl] = useState<string | null>(null);

  // Step label cycling timers for loading UI
  const instrStepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vocalStepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Abort controllers for the initial POST requests
  const instrAbortRef = useRef<AbortController | null>(null);
  const vocalAbortRef = useRef<AbortController | null>(null);

  // Independent poller instances for each track type
  const instrPoller = useAudioJobPoller();
  const vocalPoller = useAudioJobPoller();

  const clearInstrStepTimer = useCallback(() => {
    if (instrStepTimerRef.current) { clearInterval(instrStepTimerRef.current); instrStepTimerRef.current = null; }
  }, []);
  const clearVocalStepTimer = useCallback(() => {
    if (vocalStepTimerRef.current) { clearInterval(vocalStepTimerRef.current); vocalStepTimerRef.current = null; }
  }, []);

  useEffect(() => {
    if (instrumentalStatus === "loading") {
      instrStepTimerRef.current = setInterval(() => {
        setInstrumentalStep((s) => (s + 1) % INSTRUMENTAL_STEPS.length);
      }, 900);
    } else {
      clearInstrStepTimer();
    }
    return clearInstrStepTimer;
  }, [instrumentalStatus, clearInstrStepTimer]);

  useEffect(() => {
    if (vocalStatus === "loading") {
      vocalStepTimerRef.current = setInterval(() => {
        setVocalStep((s) => (s + 1) % VOCAL_STEPS.length);
      }, 900);
    } else {
      clearVocalStepTimer();
    }
    return clearVocalStepTimer;
  }, [vocalStatus, clearVocalStepTimer]);

  useEffect(() => {
    return () => {
      instrAbortRef.current?.abort();
      vocalAbortRef.current?.abort();
    };
  }, []);

  const buildPayload = useCallback(
    () => ({
      genre,
      mood,
      theme: topic,
      soundReference: style,
      songLength,
      languageFlavor: languageFlavor === "Custom" ? customFlavor || languageFlavor : languageFlavor,
      hitmakerMode: commercialMode,
      lyricalDepth,
      hookRepeatLevel: hookRepeat,
      title: draft.title,
      lyrics: {
        intro: draft.intro,
        hook: draft.hook,
        verse1: draft.verse1,
        verse2: draft.verse2,
        bridge: draft.bridge,
        outro: draft.outro,
      },
      productionNotes: {
        chordVibe: draft.chordVibe,
        melodyDirection: draft.melodyDirection,
        arrangement: draft.arrangement,
      },
    }),
    [genre, mood, topic, style, songLength, languageFlavor, customFlavor, commercialMode, lyricalDepth, hookRepeat, draft],
  );

  // ── Instrumental generation ────────────────────────────────────────────────

  const generateInstrumental = useCallback(async () => {
    if (instrumentalStatus === "loading") return;

    instrAbortRef.current?.abort();
    instrPoller.stopPolling();

    const controller = new AbortController();
    instrAbortRef.current = controller;

    setInstrumentalStatus("loading");
    setInstrumentalStep(0);
    setInstrumentalMeta(null);
    setInstrumentalAudioUrl(null);
    setInstrumentalIsLive(false);
    setInstrumentalIsFallback(false);
    setInstrumentalJobId(null);
    setInstrumentalProvider(undefined);

    try {
      const res = await fetch("/api/generate-instrumental-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Failed to start generation");

      const { jobId } = (await res.json()) as { jobId: string; status: string };

      instrPoller.startPolling(
        jobId,
        (data) => {
          const meta = data.metadata as InstrumentalMetadata;
          const live = data.isLive ?? false;
          const fallback = data.isFallback ?? false;
          setInstrumentalMeta(meta);
          setInstrumentalAudioUrl(data.audioUrl);
          setInstrumentalIsLive(live);
          setInstrumentalIsFallback(fallback);
          setInstrumentalJobId(data.jobId);
          setInstrumentalProvider(data.provider);
          setInstrumentalStatus("ready");
          const toastTitle = live
            ? "Instrumental Generated — Live Audio Ready"
            : fallback
            ? "Session Preview Ready"
            : "Instrumental Preview Ready";
          toast({ title: toastTitle, description: `${meta.bpm} BPM · ${meta.key}` });
        },
        (error) => {
          setInstrumentalStatus("error");
          toast({ title: "Instrumental generation failed", description: error, variant: "destructive" });
        },
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setInstrumentalStatus("error");
      toast({ title: "Could not start generation", description: "Please try again.", variant: "destructive" });
    }
  }, [instrumentalStatus, buildPayload, instrPoller, toast]);

  // ── Vocal generation ───────────────────────────────────────────────────────

  const generateVocal = useCallback(async () => {
    if (vocalStatus === "loading") return;

    vocalAbortRef.current?.abort();
    vocalPoller.stopPolling();

    const controller = new AbortController();
    vocalAbortRef.current = controller;

    setVocalStatus("loading");
    setVocalStep(0);
    setVocalMeta(null);
    setVocalAudioUrl(null);

    try {
      const res = await fetch("/api/generate-vocal-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Failed to start generation");

      const { jobId } = (await res.json()) as { jobId: string; status: string };

      vocalPoller.startPolling(
        jobId,
        (data) => {
          const meta = data.metadata as VocalMetadata;
          setVocalMeta(meta);
          setVocalAudioUrl(data.audioUrl);
          setVocalStatus("ready");
          toast({ title: "Vocal Demo Ready", description: `${meta.vocalStyle} · ${meta.key}` });
        },
        (error) => {
          setVocalStatus("error");
          toast({ title: "Vocal demo generation failed", description: error, variant: "destructive" });
        },
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setVocalStatus("error");
      toast({ title: "Could not start generation", description: "Please try again.", variant: "destructive" });
    }
  }, [vocalStatus, buildPayload, vocalPoller, toast]);

  const anyReady = instrumentalStatus === "ready" || vocalStatus === "ready";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-3xl border border-white/8 bg-gradient-to-b from-[#0b0b18] to-[#07070f] overflow-hidden shadow-2xl"
    >
      <div className="px-6 pt-6 pb-5 border-b border-white/6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl bg-primary/12 border border-primary/20 flex items-center justify-center">
                <Music2 className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-primary/70">
                AfroMuse Studio V2
              </span>
              {commercialMode && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary">
                  <Zap className="w-2.5 h-2.5" /> Hitmaker Audio
                </span>
              )}
            </div>
            <h3 className="text-xl font-display font-bold text-white">Bring It To Life</h3>
            <p className="text-sm text-white/35 mt-0.5">Turn this draft into a playable demo.</p>
          </div>
          <div className="shrink-0 inline-flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Sparkles className="w-2.5 h-2.5" /> Pro
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TriggerButton
            onClick={generateInstrumental}
            disabled={instrumentalStatus === "loading"}
            status={instrumentalStatus}
            icon={<Music2 className="w-4 h-4" />}
            label="Instrumental Preview"
            sublabel="Beat · Rhythm · Arrangement"
            accent="amber"
          />
          <TriggerButton
            onClick={generateVocal}
            disabled={vocalStatus === "loading"}
            status={vocalStatus}
            icon={<Mic2 className="w-4 h-4" />}
            label="Vocal Demo"
            sublabel="Melody · Guide Vocal · Style"
            accent="violet"
          />
        </div>

        {/* Instrumental track */}
        <AnimatePresence>
          {instrumentalStatus === "loading" && (
            <motion.div
              key="instr-loading"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <LoadingCard
                steps={INSTRUMENTAL_STEPS}
                activeStep={instrumentalStep}
                label="Building Project"
                accent="amber"
              />
            </motion.div>
          )}

          {instrumentalStatus === "ready" && instrumentalMeta && (
            <motion.div
              key="instr-ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AudioResultCard
                label="Project Result Ready"
                dotColor="bg-primary"
                borderColor={instrumentalIsLive ? "border-primary/20" : "border-primary/15"}
                gradientFrom="from-primary/5"
                headerBorder="border-primary/8"
                metadata={instrumentalMeta}
                audioUrl={instrumentalAudioUrl}
                draft={draft}
                onRegenerate={generateInstrumental}
                onDownload={() => {
                  if (
                    instrumentalIsLive &&
                    typeof instrumentalAudioUrl === "string" &&
                    instrumentalAudioUrl.startsWith("data:audio/")
                  ) {
                    const a = document.createElement("a");
                    a.href = instrumentalAudioUrl;
                    a.download = `${draft.title.toLowerCase().replace(/\s+/g, "_")}_instrumental_preview.mp3`;
                    a.click();
                    toast({ title: "Downloading Project Result", description: `${draft.title} · MP3` });
                  } else {
                    toast({ title: "Project Result", description: "A real audio file will be downloadable once live generation is active." });
                  }
                }}
                isLive={instrumentalIsLive}
                isFallback={instrumentalIsFallback}
                jobId={instrumentalJobId}
                provider={instrumentalProvider}
              />
            </motion.div>
          )}

          {instrumentalStatus === "error" && (
            <motion.div key="instr-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ErrorCard message="Project generation failed." onRetry={generateInstrumental} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vocal track */}
        <AnimatePresence>
          {vocalStatus === "loading" && (
            <motion.div
              key="vocal-loading"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <LoadingCard
                steps={VOCAL_STEPS}
                activeStep={vocalStep}
                label="Building Vocal Demo"
                accent="violet"
              />
            </motion.div>
          )}

          {vocalStatus === "ready" && vocalMeta && (
            <motion.div
              key="vocal-ready"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <AudioResultCard
                label="Vocal Demo Ready"
                dotColor="bg-violet-400"
                borderColor="border-violet-500/15"
                gradientFrom="from-violet-500/5"
                headerBorder="border-violet-500/8"
                metadata={vocalMeta}
                audioUrl={vocalAudioUrl}
                draft={draft}
                onRegenerate={generateVocal}
                onDownload={() =>
                  toast({ title: "Vocal MP3 — Awaiting Engine", description: "Vocal MP3 export will be ready once the vocal render engine is fully live." })
                }
                isLive={false}
                isFallback={false}
              />
            </motion.div>
          )}

          {vocalStatus === "error" && (
            <motion.div key="vocal-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ErrorCard message="Vocal demo generation failed." onRetry={generateVocal} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Export */}
        <AnimatePresence>
          {anyReady && (
            <motion.div
              key="export"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ExportSection
                draft={draft}
                genre={genre}
                mood={mood}
                instrumentalMeta={instrumentalMeta}
                vocalMeta={vocalMeta}
                instrumentalAudioUrl={instrumentalAudioUrl}
                instrumentalIsLive={instrumentalIsLive}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}
