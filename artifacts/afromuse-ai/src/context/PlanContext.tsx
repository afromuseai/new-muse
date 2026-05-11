import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { resolveServerPlan } from "@/lib/access/plans";
import type { PlanId } from "@/lib/access/types";

export type Plan = "Free" | "Creator Pro" | "Artist Pro";

const PLAN_ORDER: Plan[] = ["Free", "Creator Pro", "Artist Pro"];

export const PLAN_LIMITS: Record<Plan, number> = {
  "Free":         10,
  "Creator Pro":  Infinity,
  "Artist Pro":   Infinity,
};

export const FREE_AUDIO_TRIALS = 3;
export const FREE_COLLAB_TRIALS = 1;

interface UsageState {
  generations: number;
  audioTrialsUsed: number;
  collabTrialsUsed: number;
  rewritesUsed: number;
}

interface PlanContextType {
  plan: Plan;
  planId: PlanId;
  hasAccess: (required: Plan) => boolean;
  planIndex: number;
  generationsUsed: number;
  generationsLimit: number;
  generationsRemaining: number;
  audioTrialsLeft: number;
  collabTrialsLeft: number;
  canGenerate: () => boolean;
  incrementGeneration: () => void;
  useAudioTrial: () => boolean;
  useCollabTrial: () => boolean;
  resetUsage: () => void;
  syncPlanFromServer: (serverPlan: string) => void;
  rewritesUsed: number;
  incrementRewrite: () => void;
}

const defaultCtx: PlanContextType = {
  plan: "Free",
  planId: "free",
  hasAccess: () => false,
  planIndex: 0,
  generationsUsed: 0,
  generationsLimit: PLAN_LIMITS.Free,
  generationsRemaining: PLAN_LIMITS.Free,
  audioTrialsLeft: FREE_AUDIO_TRIALS,
  collabTrialsLeft: FREE_COLLAB_TRIALS,
  canGenerate: () => true,
  incrementGeneration: () => {},
  useAudioTrial: () => false,
  useCollabTrial: () => false,
  resetUsage: () => {},
  syncPlanFromServer: () => {},
  rewritesUsed: 0,
  incrementRewrite: () => {},
};

const PlanContext = createContext<PlanContextType>(defaultCtx);

const USAGE_STORAGE_KEY = "afromuse_usage_v3";

function loadUsage(): UsageState {
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { generations: 0, audioTrialsUsed: 0, collabTrialsUsed: 0, rewritesUsed: 0 };
}

function saveUsage(u: UsageState) {
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(u));
}

function serverPlanToPlan(serverPlan: string): Plan {
  const lower = serverPlan?.toLowerCase().trim() ?? "free";
  if (lower === "creator pro" || lower === "pro") return "Creator Pro";
  if (lower === "artist pro" || lower === "gold") return "Artist Pro";
  return "Free";
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlanState] = useState<Plan>("Free");
  const [usage, setUsage] = useState<UsageState>(loadUsage);

  useEffect(() => {
    localStorage.removeItem("afromuse_plan");
  }, []);

  const syncPlanFromServer = useCallback((serverPlan: string) => {
    const resolved = serverPlanToPlan(serverPlan);
    setPlanState(resolved);
  }, []);

  const planIndex = PLAN_ORDER.indexOf(plan);
  const planId = resolveServerPlan(plan) as PlanId;
  const hasAccess = (required: Plan) => planIndex >= PLAN_ORDER.indexOf(required);

  const generationsLimit = PLAN_LIMITS[plan];
  const generationsUsed = usage.generations;
  const generationsRemaining = generationsLimit === Infinity
    ? Infinity
    : Math.max(0, generationsLimit - generationsUsed);

  const audioTrialsLeft = Math.max(0, FREE_AUDIO_TRIALS - usage.audioTrialsUsed);
  const collabTrialsLeft = Math.max(0, FREE_COLLAB_TRIALS - usage.collabTrialsUsed);

  const canGenerate = useCallback(() => {
    if (generationsLimit === Infinity) return true;
    return generationsUsed < generationsLimit;
  }, [generationsUsed, generationsLimit]);

  const incrementGeneration = useCallback(() => {
    setUsage((prev) => {
      const next = { ...prev, generations: prev.generations + 1 };
      saveUsage(next);
      return next;
    });
  }, []);

  const incrementRewrite = useCallback(() => {
    setUsage((prev) => {
      const next = { ...prev, rewritesUsed: (prev.rewritesUsed ?? 0) + 1 };
      saveUsage(next);
      return next;
    });
  }, []);

  const useAudioTrial = useCallback((): boolean => {
    if (usage.audioTrialsUsed >= FREE_AUDIO_TRIALS) return false;
    setUsage((prev) => {
      const next = { ...prev, audioTrialsUsed: prev.audioTrialsUsed + 1 };
      saveUsage(next);
      return next;
    });
    return true;
  }, [usage.audioTrialsUsed]);

  const useCollabTrial = useCallback((): boolean => {
    if (usage.collabTrialsUsed >= FREE_COLLAB_TRIALS) return false;
    setUsage((prev) => {
      const next = { ...prev, collabTrialsUsed: prev.collabTrialsUsed + 1 };
      saveUsage(next);
      return next;
    });
    return true;
  }, [usage.collabTrialsUsed]);

  const resetUsage = useCallback(() => {
    const fresh: UsageState = { generations: 0, audioTrialsUsed: 0, collabTrialsUsed: 0, rewritesUsed: 0 };
    setUsage(fresh);
    saveUsage(fresh);
  }, []);

  return (
    <PlanContext.Provider
      value={{
        plan,
        planId,
        hasAccess,
        planIndex,
        generationsUsed,
        generationsLimit,
        generationsRemaining,
        audioTrialsLeft,
        collabTrialsLeft,
        canGenerate,
        incrementGeneration,
        useAudioTrial,
        useCollabTrial,
        resetUsage,
        syncPlanFromServer,
        rewritesUsed: usage.rewritesUsed ?? 0,
        incrementRewrite,
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}

export const PLAN_COLORS: Record<Plan, { pill: string; badge: string; glow: string }> = {
  "Free": {
    pill: "bg-white/5 border-white/10 text-muted-foreground",
    badge: "text-muted-foreground",
    glow: "",
  },
  "Creator Pro": {
    pill: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    badge: "text-amber-400",
    glow: "shadow-[0_0_16px_rgba(245,158,11,0.25)]",
  },
  "Artist Pro": {
    pill: "bg-gradient-to-r from-violet-500/20 to-fuchsia-400/20 border-violet-400/40 text-violet-300",
    badge: "text-violet-300",
    glow: "shadow-[0_0_20px_rgba(167,139,250,0.3)]",
  },
};

export const FEATURES = [
  {
    id: "lyric-rewrite",
    name: "Full Lyric Rewrite Stack",
    description: "Humanize, punch up, or completely rework your lyrics with AI.",
    icon: "✍️",
    requiredPlan: "Creator Pro" as Plan,
    tag: "Creator Pro",
  },
  {
    id: "lyrical-controls",
    name: "Lyrical Depth Controls",
    description: "Control Hook Repeat, Lyrical Depth, Gender/Voice, and Performance Feel.",
    icon: "🎚️",
    requiredPlan: "Creator Pro" as Plan,
    tag: "Creator Pro",
  },
  {
    id: "audio-gen",
    name: "Full Audio Studio V2",
    description: "Turn your lyrics into a full AI-produced audio track instantly.",
    icon: "🎵",
    requiredPlan: "Creator Pro" as Plan,
    tag: "Creator Pro",
  },
  {
    id: "stems",
    name: "Downloadable Stems",
    description: "Export vocal, beat, and melody stems as separate audio files.",
    icon: "🎚️",
    requiredPlan: "Creator Pro" as Plan,
    tag: "Creator Pro",
  },
  {
    id: "artist-dna",
    name: "Artist DNA",
    description: "Train AfroMuse on your unique style for personalized generations.",
    icon: "🧬",
    requiredPlan: "Artist Pro" as Plan,
    tag: "Artist Pro",
  },
  {
    id: "voice-clone",
    name: "Voice Clone",
    description: "Hear your lyrics sung back in your own generated vocal style.",
    icon: "🎤",
    requiredPlan: "Artist Pro" as Plan,
    tag: "Artist Pro",
  },
  {
    id: "persistent-memory",
    name: "Persistent Memory",
    description: "AfroMuse remembers your style preferences across all sessions.",
    icon: "🧠",
    requiredPlan: "Artist Pro" as Plan,
    tag: "Artist Pro",
  },
  {
    id: "advanced-demos",
    name: "Advanced Demos",
    description: "Full demo production with professional-grade AI audio outputs.",
    icon: "🌍",
    requiredPlan: "Artist Pro" as Plan,
    tag: "Artist Pro",
  },
] as const;
