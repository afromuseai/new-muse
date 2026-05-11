import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Lock } from "lucide-react";
import { Link } from "wouter";
import { usePlan, PLAN_COLORS, type Plan } from "@/context/PlanContext";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
  featureIcon?: string;
  featureDesc?: string;
  requiredPlan: Plan;
}

export function UpgradeModal({
  open,
  onClose,
  featureName,
  featureIcon,
  featureDesc,
  requiredPlan,
}: UpgradeModalProps) {
  const { setPlan } = usePlan();
  const colors = PLAN_COLORS[requiredPlan];
  const isGold = requiredPlan === "Gold";

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
            <div className="pointer-events-auto w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0a18] shadow-2xl overflow-hidden">
              {/* Gradient header band */}
              <div className={`relative h-2 w-full ${isGold ? "bg-gradient-to-r from-amber-500 to-yellow-400" : "bg-gradient-to-r from-amber-500 to-orange-400"}`} />

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
                    <Sparkles className="w-2.5 h-2.5" />
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
                    {requiredPlan === "Pro" && (
                      <>
                        <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> AI Audio Generation</li>
                        <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> Downloadable Stems</li>
                        <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> Unlimited Song Saves</li>
                        <li className="flex items-center gap-2"><span className="text-amber-400">✓</span> Priority Generation Speed</li>
                      </>
                    )}
                    {requiredPlan === "Gold" && (
                      <>
                        <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> Everything in Pro</li>
                        <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> Collaboration Mode</li>
                        <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> Upload Your Instrumental</li>
                        <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> Voice Clone Demo</li>
                        <li className="flex items-center gap-2"><span className="text-yellow-300">✓</span> Music Distribution</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-2">
                  <Link href="/pricing" onClick={onClose}>
                    <button className={`w-full h-12 rounded-2xl font-bold text-sm tracking-wide transition-all hover:-translate-y-0.5 ${
                      isGold
                        ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-[0_0_24px_rgba(234,179,8,0.35)] hover:shadow-[0_0_32px_rgba(234,179,8,0.5)]"
                        : "bg-primary text-primary-foreground shadow-[0_0_24px_rgba(245,158,11,0.3)] hover:shadow-[0_0_32px_rgba(245,158,11,0.45)]"
                    }`}>
                      Upgrade to {requiredPlan} — See Pricing
                    </button>
                  </Link>

                  {/* Demo mode switcher — clearly labelled */}
                  <button
                    onClick={() => { setPlan(requiredPlan); onClose(); }}
                    className="w-full h-10 rounded-xl border border-white/8 text-xs text-muted-foreground/60 hover:text-muted-foreground hover:border-white/15 transition-all"
                  >
                    Demo only: preview as {requiredPlan} plan →
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
