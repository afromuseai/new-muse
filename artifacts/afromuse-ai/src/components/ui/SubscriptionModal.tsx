import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Zap, Check, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type PlanId = "creator-pro" | "artist-pro";
type BillingPeriod = "monthly" | "yearly";

interface PlanConfig {
  id: PlanId;
  name: string;
  icon: React.ElementType;
  monthly: string;
  yearly: string;
  yearlyLabel: string;
  savings: string;
  color: string;
  headerGradient: string;
  btnClass: string;
  checkColor: string;
  trial?: string;
  features: string[];
}

const PLANS: PlanConfig[] = [
  {
    id: "creator-pro",
    name: "Creator Pro",
    icon: Zap,
    monthly: "GHS 299/mo",
    yearly: "GHS 239/mo",
    yearlyLabel: "GHS 2,870/yr",
    savings: "Save GHS 718",
    color: "amber",
    headerGradient: "from-amber-500 to-orange-400",
    btnClass: "bg-primary text-primary-foreground hover:opacity-90 shadow-[0_0_24px_rgba(245,158,11,0.3)]",
    checkColor: "text-amber-400",
    trial: "7-day free trial",
    features: [
      "Full lyric controls (Depth, Hook Repeat, Voice, Feel)",
      "Full rewrite stack (Humanize, Catchier, Harder)",
      "Full Audio Studio V2",
      "MP3 / WAV / Stems export",
      "Unlimited project saves",
      "Priority generation speed",
    ],
  },
  {
    id: "artist-pro",
    name: "Artist Pro",
    icon: Crown,
    monthly: "GHS 599/mo",
    yearly: "GHS 479/mo",
    yearlyLabel: "GHS 5,750/yr",
    savings: "Save GHS 1,438",
    color: "violet",
    headerGradient: "from-violet-500 to-fuchsia-400",
    btnClass: "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white hover:opacity-90 shadow-[0_0_24px_rgba(167,139,250,0.35)]",
    checkColor: "text-violet-400",
    features: [
      "Everything in Creator Pro",
      "Artist DNA — personalized style engine",
      "Voice Clone (coming soon)",
      "Persistent memory across sessions",
      "Advanced demo production",
      "Priority support",
    ],
  },
];

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  defaultPlan?: PlanId;
}

export function SubscriptionModal({ open, onClose, defaultPlan = "creator-pro" }: SubscriptionModalProps) {
  const { isLoggedIn } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(defaultPlan);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upgrade your plan.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, billingPeriod }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error ?? "Failed to start checkout.",
          variant: "destructive",
        });
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast({
        title: "Network error",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const plan = PLANS.find((p) => p.id === selectedPlan) ?? PLANS[0];
  const PlanIcon = plan.icon;

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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg rounded-3xl border border-white/10 bg-[#09090f] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className={`bg-gradient-to-r ${plan.headerGradient} p-6 relative`}>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/40 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3 mb-1">
                  <PlanIcon className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">Upgrade Your Plan</h2>
                </div>
                <p className="text-white/80 text-sm">Unlock the full AfroMuse creative experience</p>
              </div>

              <div className="p-6">
                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-1 bg-white/5 rounded-xl p-1 mb-6">
                  {(["monthly", "yearly"] as BillingPeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setBillingPeriod(period)}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        billingPeriod === period
                          ? "bg-white/10 text-white"
                          : "text-muted-foreground hover:text-white"
                      }`}
                    >
                      {period === "monthly" ? "Monthly" : "Yearly"}
                      {period === "yearly" && (
                        <span className="ml-2 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
                          SAVE 20%
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Plan Selector */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {PLANS.map((p) => {
                    const PIcon = p.icon;
                    const isSelected = selectedPlan === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlan(p.id)}
                        className={`rounded-2xl border p-4 text-left transition-all ${
                          isSelected
                            ? `border-white/25 bg-white/8`
                            : "border-white/8 hover:border-white/15 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <PIcon className={`w-4 h-4 ${p.checkColor}`} />
                          <span className="text-sm font-bold text-white">{p.name}</span>
                        </div>
                        <div className="text-xl font-bold text-white">
                          {billingPeriod === "monthly" ? p.monthly : p.yearly}
                        </div>
                        {billingPeriod === "yearly" && (
                          <div className="text-xs text-emerald-400 mt-0.5">
                            {p.savings} · billed as {p.yearlyLabel}
                          </div>
                        )}
                        {p.trial && billingPeriod === "monthly" && (
                          <div className={`text-[10px] mt-1 ${p.checkColor}`}>{p.trial}</div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Features */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/6 p-4 mb-5">
                  <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground/60 mb-3">
                    {plan.name} Includes
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.checkColor}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                {!isLoggedIn ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-amber-400/80 bg-amber-400/8 border border-amber-400/20 rounded-xl p-3 mb-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>You need an account to subscribe.</span>
                    </div>
                    <Link href="/auth" onClick={onClose}>
                      <button className="w-full h-12 rounded-2xl font-bold text-sm bg-white/10 text-white hover:bg-white/15 transition-all">
                        Sign In / Create Account
                      </button>
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className={`w-full h-12 rounded-2xl font-bold text-sm tracking-wide transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${plan.btnClass}`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecting to Paystack...
                      </>
                    ) : (
                      <>
                        <PlanIcon className="w-4 h-4" />
                        Subscribe to {plan.name}
                        {plan.trial && billingPeriod === "monthly" ? " — 7 Days Free" : ""}
                      </>
                    )}
                  </button>
                )}

                <p className="text-center text-xs text-muted-foreground/40 mt-3">
                  Secure payment via Paystack · MTN MoMo · Visa / Mastercard · Cancel anytime
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
