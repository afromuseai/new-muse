import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Lock, Crown, Zap } from "lucide-react";
import { Link } from "wouter";
import { PLAN_COLORS, type Plan } from "@/context/PlanContext";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
  featureIcon?: string;
  featureDesc?: string;
  requiredPlan: Plan;
  onUpgrade?: (plan: Plan) => void;
}

const PLAN_FEATURES_LIST: Record<Plan, string[]> = {
  "Free": [],
  "Creator Pro": [
    "Full lyric controls (Depth, Hook Repeat, Voice, Feel)",
    "Full rewrite stack (Humanize, Catchier, Harder)",
    "Full Audio Studio V2",
    "MP3 / WAV / Stems export",
    "Unlimited project saves",
    "Priority generation speed",
  ],
  "Artist Pro": [
    "Everything in Creator Pro",
    "Artist DNA — personalized style engine",
    "Voice Clone (coming soon)",
    "Persistent memory across sessions",
    "Advanced demo production",
    "Priority support",
  ],
};

const PLAN_ICON: Record<Plan, React.ElementType> = {
  "Free": Sparkles,
  "Creator Pro": Zap,
  "Artist Pro": Crown,
};

const PLAN_ACCENT: Record<Plan, { header: string; check: string; btn: string; shadow: string }> = {
  "Free": {
    header: "bg-white/10",
    check: "text-white/60",
    btn: "bg-white/10 text-white",
    shadow: "",
  },
  "Creator Pro": {
    header: "bg-gradient-to-r from-amber-500 to-orange-400",
    check: "text-amber-400",
    btn: "bg-primary text-primary-foreground shadow-[0_0_24px_rgba(245,158,11,0.3)] hover:shadow-[0_0_32px_rgba(245,158,11,0.45)]",
    shadow: "shadow-[0_0_40px_rgba(245,158,11,0.12)]",
  },
  "Artist Pro": {
    header: "bg-gradient-to-r from-violet-500 to-fuchsia-400",
    check: "text-violet-400",
    btn: "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-[0_0_24px_rgba(167,139,250,0.35)] hover:shadow-[0_0_32px_rgba(167,139,250,0.5)]",
    shadow: "shadow-[0_0_40px_rgba(167,139,250,0.12)]",
  },
};

export function UpgradeModal({
  open,
  onClose,
  featureName,
  featureIcon,
  featureDesc,
  requiredPlan,
  onUpgrade,
}: UpgradeModalProps) {
  const colors = PLAN_COLORS[requiredPlan];
  const accent = PLAN_ACCENT[requiredPlan];
  const PlanIcon = PLAN_ICON[requiredPlan];

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade(requiredPlan);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className={`pointer-events-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0a18] shadow-2xl overflow-hidden ${accent.shadow}`}>
              {/* Gradient header band */}
              <div className={`relative h-1.5 w-full ${accent.header}`} />

              <div className="p-7">
                {/* Close */}
                <div className="flex justify-end mb-2">
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/8 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Icon + lock */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="relative mb-4">
                    <div className="text-5xl mb-1">{featureIcon ?? "✨"}</div>
                    <div className="absolute -bottom-1 -right-2 w-6 h-6 rounded-full bg-[#0a0a18] border border-white/10 flex items-center justify-center">
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border mb-3 ${colors.pill}`}>
                    <PlanIcon className="w-2.5 h-2.5" />
                    {requiredPlan} Feature
                  </div>
                  <h3 className="text-xl font-display font-bold text-white mb-2">{featureName}</h3>
                  {featureDesc && (
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">{featureDesc}</p>
                  )}
                </div>

                {/* What you get */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/6 p-4 mb-5">
                  <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground/60 mb-2">
                    {requiredPlan} Plan Includes
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {PLAN_FEATURES_LIST[requiredPlan].map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className={accent.check}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="flex flex-col gap-2">
                  {onUpgrade ? (
                    <button
                      onClick={handleUpgrade}
                      className={`w-full h-12 rounded-2xl font-bold text-sm tracking-wide transition-all hover:-translate-y-0.5 ${accent.btn}`}
                    >
                      Upgrade to {requiredPlan}
                    </button>
                  ) : (
                    <Link href="/pricing" onClick={onClose}>
                      <button className={`w-full h-12 rounded-2xl font-bold text-sm tracking-wide transition-all hover:-translate-y-0.5 ${accent.btn}`}>
                        Upgrade to {requiredPlan} — See Pricing
                      </button>
                    </Link>
                  )}
                  <button
                    onClick={onClose}
                    className="w-full h-10 rounded-xl border border-white/8 text-xs text-muted-foreground/60 hover:text-muted-foreground hover:border-white/15 transition-all"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
