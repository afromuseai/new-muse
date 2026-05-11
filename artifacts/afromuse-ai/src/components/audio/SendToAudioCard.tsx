import { useState } from "react";
import { motion } from "framer-motion";
import { Headphones, Zap, Music, Mic2, ArrowDown } from "lucide-react";
import type { SongDraft } from "@/lib/songGenerator";
import type { QuickMode } from "@/components/studio/AudioStudioV2";

interface SendToAudioCardProps {
  draft: SongDraft;
  genre: string;
  mood: string;
  onSendToAudio: (mode: QuickMode) => void;
}

interface QuickModeConfig {
  mode: QuickMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  hoverClass: string;
  hoverIconClass: string;
}

const QUICK_MODES: QuickModeConfig[] = [
  {
    mode: "afrobeats-demo",
    label: "Afrobeats Demo",
    description: "Full demo, Afrobeats genre",
    icon: <Music className="w-3 h-3" />,
    hoverClass: "hover:bg-primary/10 hover:border-primary/30 hover:text-primary/90",
    hoverIconClass: "group-hover:text-primary",
  },
  {
    mode: "default",
    label: "Full Session",
    description: "Complete lyrics-to-audio build",
    icon: <Zap className="w-3 h-3" />,
    hoverClass: "hover:bg-sky-500/10 hover:border-sky-500/30 hover:text-sky-300",
    hoverIconClass: "group-hover:text-sky-400",
  },
  {
    mode: "hook-only",
    label: "Hook-Only Audio",
    description: "Chorus section, max energy",
    icon: <Mic2 className="w-3 h-3" />,
    hoverClass: "hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300",
    hoverIconClass: "group-hover:text-violet-400",
  },
];

export default function SendToAudioCard({
  onSendToAudio,
}: SendToAudioCardProps) {
  const [lastSent, setLastSent] = useState<QuickMode | null>(null);

  const handleSend = (mode: QuickMode) => {
    setLastSent(mode);
    onSendToAudio(mode);
    setTimeout(() => setLastSent(null), 2500);
  };

  const isSent = (mode: QuickMode) => lastSent === mode;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative rounded-3xl overflow-hidden border border-sky-500/20 bg-gradient-to-br from-sky-950/50 via-[#080c14] to-[#08090f]"
    >
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-sky-500/8 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-48 h-24 bg-violet-500/6 blur-3xl pointer-events-none rounded-full" />

      <div className="relative z-10 p-6 md:p-7">

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white leading-tight mb-1">
              Turn This Song Into Audio
            </h3>
            <p className="text-xs text-white/45 leading-relaxed">
              Send your lyrics straight to the Audio Studio and craft a full beat, vocal demo, or instrumental concept in seconds.
            </p>
          </div>
        </div>

        {/* Primary + Secondary CTA */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
          {/* Send to Audio Studio */}
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSend("default")}
            className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm transition-all ${
              isSent("default")
                ? "bg-green-500/15 border border-green-500/35 text-green-400"
                : "bg-sky-500/15 border border-sky-500/35 text-sky-300 hover:bg-sky-500/22 hover:border-sky-500/50 shadow-[0_0_20px_rgba(14,165,233,0.08)]"
            }`}
          >
            {isSent("default") ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                Sent to Audio Studio
              </>
            ) : (
              <>
                <ArrowDown className="w-4 h-4" />
                Send to Audio Studio
              </>
            )}
          </motion.button>

          {/* Build Audio Concept */}
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSend("instrumental")}
            className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-sm transition-all ${
              isSent("instrumental")
                ? "bg-green-500/15 border border-green-500/35 text-green-400"
                : "border border-white/10 text-white/50 hover:text-white/80 hover:border-white/22 hover:bg-white/4"
            }`}
          >
            {isSent("instrumental") ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                Set Up
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Instrumental Quick Setup
              </>
            )}
          </motion.button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/20">Quick Start</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Quick mode shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {QUICK_MODES.map((qm) => (
            <motion.button
              key={qm.mode}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSend(qm.mode)}
              className={`group relative flex items-center gap-2.5 h-12 px-4 rounded-xl border transition-all text-left ${
                isSent(qm.mode)
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : `border-white/8 bg-white/[0.025] text-white/40 ${qm.hoverClass}`
              }`}
            >
              <span className={`shrink-0 transition-colors ${
                isSent(qm.mode) ? "text-green-400" : `text-white/30 ${qm.hoverIconClass}`
              }`}>
                {qm.icon}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold leading-none mb-0.5 truncate">{qm.label}</div>
                <div className="text-[10px] text-white/25 leading-none truncate">{qm.description}</div>
              </div>
              {isSent(qm.mode) && (
                <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
              )}
            </motion.button>
          ))}
        </div>

      </div>
    </motion.div>
  );
}
