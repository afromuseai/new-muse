/**
 * AfroMuse V2 — Project Library Panel
 *
 * A compact, premium "Recent Sessions" panel for the Studio sidebar.
 * Keeps the aesthetic of the existing V2 UI language.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, FolderOpen, Play, Copy, Trash2, Clock,
  Music, Mic2, Package, Download, FileText, Radio,
} from "lucide-react";
import { type SavedSession, type SessionStatus, formatRelativeTime } from "@/lib/projectLibrary";
import { useProjectLibrary } from "@/context/ProjectLibraryContext";

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; dot: string }> = {
  Draft:              { label: "Draft",            color: "text-white/35 border-white/10 bg-white/3",                dot: "bg-white/25" },
  "In Progress":      { label: "In Progress",      color: "text-amber-400 border-amber-500/20 bg-amber-500/8",       dot: "bg-amber-400 animate-pulse" },
  "Beat Ready":       { label: "Beat Ready",       color: "text-sky-400 border-sky-500/20 bg-sky-500/8",             dot: "bg-sky-400" },
  "Live Audio Ready": { label: "Live Audio Ready", color: "text-primary border-primary/25 bg-primary/8",             dot: "bg-primary animate-pulse" },
  "Vocal Ready":      { label: "Vocal Ready",      color: "text-violet-400 border-violet-500/20 bg-violet-500/8",    dot: "bg-violet-400" },
  "Export Ready":     { label: "Export Ready",     color: "text-green-400 border-green-500/20 bg-green-500/8",       dot: "bg-green-400" },
};

const STATUS_ICON: Record<SessionStatus, typeof Music> = {
  Draft:              FileText,
  "In Progress":      Music,
  "Beat Ready":       Package,
  "Live Audio Ready": Radio,
  "Vocal Ready":      Mic2,
  "Export Ready":     Download,
};

function StatusBadge({ status }: { status: SessionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────

interface SessionRowProps {
  session: SavedSession;
  onResume: (session: SavedSession) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function SessionRow({ session, onResume, onDuplicate, onDelete }: SessionRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(session.sessionId);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const StatusIcon = STATUS_ICON[session.currentStage];

  const isLiveAudio = session.currentStage === "Live Audio Ready";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className={`group relative rounded-2xl border transition-all p-3.5 ${
        isLiveAudio
          ? "border-primary/18 bg-primary/[0.03] hover:bg-primary/[0.05] hover:border-primary/28"
          : "border-white/6 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 ${
          isLiveAudio
            ? "bg-primary/12 border border-primary/25"
            : "bg-primary/8 border border-primary/15"
        }`}>
          <StatusIcon className={`w-3.5 h-3.5 ${isLiveAudio ? "text-primary/80" : "text-primary/60"}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5 mb-1">
            <p className="text-[13px] font-semibold text-white/80 leading-snug truncate pr-1">
              {session.sessionTitle}
            </p>
            {isLiveAudio && (
              <span className="shrink-0 inline-flex items-center gap-1 text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-full border border-primary/25 bg-primary/8 text-primary/70">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                Live
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="text-[10px] text-white/30 font-medium">{session.genre}</span>
            <span className="text-white/15">·</span>
            <span className="text-[10px] text-white/30">{session.mood}</span>
            {session.bpm && (
              <>
                <span className="text-white/15">·</span>
                <span className="text-[10px] text-white/30">{session.bpm} BPM</span>
              </>
            )}
            {session.key && (
              <>
                <span className="text-white/15">·</span>
                <span className="text-[10px] text-white/30">Key: {session.key}</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <StatusBadge status={session.currentStage} />
            <div className="flex items-center gap-0.5 text-[10px] text-white/20">
              <Clock className="w-2.5 h-2.5" />
              <span>{formatRelativeTime(session.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action row — visible on hover */}
      <div className="mt-3 pt-3 border-t border-white/4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={() => onResume(session)}
          className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary text-[11px] font-semibold transition-all"
        >
          <Play className="w-3 h-3" />
          Resume
        </button>
        <button
          onClick={() => onDuplicate(session.sessionId)}
          className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/8 hover:border-white/20 text-white/30 hover:text-white/60 transition-all"
          title="Duplicate session"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          onClick={handleDelete}
          className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
            confirmDelete
              ? "border-red-500/40 bg-red-500/10 text-red-400"
              : "border-white/8 hover:border-red-500/30 text-white/25 hover:text-red-400"
          }`}
          title={confirmDelete ? "Click again to confirm" : "Remove session"}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="py-8 flex flex-col items-center text-center">
      <div className="w-10 h-10 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-3">
        <FolderOpen className="w-4 h-4 text-white/20" />
      </div>
      <p className="text-xs font-semibold text-white/25 mb-1">No saved sessions yet</p>
      <p className="text-[11px] text-white/15 max-w-[200px] leading-relaxed">
        Generate a song and save it to start building your project library.
      </p>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface ProjectLibraryPanelProps {
  onResume: (session: SavedSession) => void;
}

export default function ProjectLibraryPanel({ onResume }: ProjectLibraryPanelProps) {
  const { sessions, deleteSession, duplicateSession } = useProjectLibrary();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const visibleSessions = showAll ? sessions : sessions.slice(0, 4);
  const hasMore = sessions.length > 4;

  const handleDuplicate = (sessionId: string) => {
    duplicateSession(sessionId);
  };

  return (
    <div className="rounded-3xl border border-white/8 bg-gradient-to-b from-[#0e0e1a] to-[#090912] backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between border-b border-white/5 hover:bg-white/2 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <FolderOpen className="w-3 h-3 text-primary/70" />
          </div>
          <span className="text-xs font-bold text-white/70 tracking-wide">Project Library</span>
          {sessions.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary/70">
              {sessions.length}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/25 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2">
              <AnimatePresence mode="popLayout">
                {visibleSessions.length === 0 ? (
                  <EmptyState key="empty" />
                ) : (
                  visibleSessions.map((session) => (
                    <SessionRow
                      key={session.sessionId}
                      session={session}
                      onResume={onResume}
                      onDuplicate={handleDuplicate}
                      onDelete={deleteSession}
                    />
                  ))
                )}
              </AnimatePresence>

              {/* Show more / less toggle */}
              {hasMore && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="w-full h-8 text-[11px] text-white/25 hover:text-white/50 transition-colors font-medium"
                >
                  {showAll ? "Show less" : `Show ${sessions.length - 4} more`}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
