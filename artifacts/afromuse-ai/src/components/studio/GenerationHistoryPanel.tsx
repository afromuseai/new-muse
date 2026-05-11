import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, X, ChevronDown, Trash2, Clock } from "lucide-react";
import type { HistoryEntry } from "@/hooks/useGenerationHistory";
import type { SongDraft } from "@/lib/songGenerator";

interface Props {
  history: HistoryEntry[];
  onLoad: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getViralScore(draft: SongDraft): string | null {
  const raw = draft.hitPrediction?.viralPotential ?? draft.songQualityReport?.viralScore;
  if (raw == null) return null;
  const n = Number(raw);
  return isNaN(n) ? String(raw) : `${n}%`;
}

function getDnaMode(draft: SongDraft): string | null {
  return draft.diversityReport?.dnaMode ?? null;
}

const DNA_MODE_COLORS: Record<string, string> = {
  "STORY MODE": "text-sky-400 bg-sky-500/10 border-sky-500/20",
  "CHAOS MODE": "text-orange-400 bg-orange-500/10 border-orange-500/20",
  "BOUNCE MODE": "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "EMOTION MODE": "text-pink-400 bg-pink-500/10 border-pink-500/20",
  "ANTHEM MODE": "text-violet-400 bg-violet-500/10 border-violet-500/20",
  "GROOVE MODE": "text-green-400 bg-green-500/10 border-green-500/20",
};

export default function GenerationHistoryPanel({ history, onLoad, onRemove, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">History</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-400">
            {history.length}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/25 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1.5 max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {history.map((entry) => {
                const viral = getViralScore(entry.draft);
                const dna = getDnaMode(entry.draft);
                const dnaColor = dna ? (DNA_MODE_COLORS[dna] ?? "text-white/40 bg-white/5 border-white/10") : null;

                return (
                  <div
                    key={entry.id}
                    className="group relative rounded-xl bg-white/3 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => onLoad(entry)}
                      className="w-full text-left px-3 py-2.5 pr-8"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-[12px] font-semibold text-white/80 leading-tight line-clamp-1 flex-1">
                          {entry.draft.title || entry.topic || "Untitled"}
                        </p>
                        {viral && (
                          <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded-full shrink-0">
                            {viral}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-amber-400/80 bg-amber-500/8 border border-amber-500/15 px-1.5 py-0.5 rounded-full">
                          {entry.genre}
                        </span>
                        <span className="text-[10px] text-white/30 bg-white/4 border border-white/8 px-1.5 py-0.5 rounded-full">
                          {entry.mood}
                        </span>
                        {dna && dnaColor && (
                          <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${dnaColor}`}>
                            {dna.replace(" MODE", "")}
                          </span>
                        )}
                        <div className="flex items-center gap-1 ml-auto">
                          <Clock className="w-2.5 h-2.5 text-white/20" />
                          <span className="text-[9px] text-white/25">{timeAgo(entry.generatedAt)}</span>
                        </div>
                      </div>
                      {entry.topic && (
                        <p className="text-[10px] text-white/25 mt-1 line-clamp-1 italic">"{entry.topic}"</p>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(entry.id)}
                      className="absolute top-2 right-2 w-5 h-5 rounded-lg flex items-center justify-center text-white/0 group-hover:text-white/30 hover:!text-white/70 hover:bg-white/8 transition-all"
                      title="Remove from history"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="px-3 pb-3 pt-1 border-t border-white/5">
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40 flex-1">Clear all history?</span>
                  <button
                    type="button"
                    onClick={() => { onClear(); setConfirmClear(false); setOpen(false); }}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                  >
                    Yes, clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="text-[10px] font-bold text-white/30 hover:text-white/60 px-2 py-1 rounded-lg hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 text-[10px] text-white/20 hover:text-white/40 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear history
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
