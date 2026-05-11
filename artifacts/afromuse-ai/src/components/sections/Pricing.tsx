import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Crown, Zap } from "lucide-react";
import { SubscriptionModal } from "@/components/ui/SubscriptionModal";

type PlanId = "creator-pro" | "artist-pro";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Perfect for exploring AfroMuse AI and testing the creative experience.",
    cta: "Start Free",
    badge: null,
    highlight: false,
    isArtistPro: false,
    isCreatorPro: false,
    stripeId: null as PlanId | null,
    features: [
      "10 song generations total",
      "Basic lyric generation",
      "3 audio generation trials",
      "Access to AfroMuse Studio",
      "Instrumental preview",
    ],
  },
  {
    id: "creator-pro",
    name: "Creator Pro",
    price: "$20",
    description: "Full lyric controls, rewrite stack, Audio Studio V2, and unlimited exports.",
    cta: "Upgrade to Creator Pro",
    badge: { label: "Most Popular", icon: "sparkles" as const },
    highlight: true,
    isArtistPro: false,
    isCreatorPro: true,
    stripeId: "creator-pro" as PlanId,
    trial: "7-day free trial",
    features: [
      "Unlimited song generations",
      "Full lyric controls (Depth, Hook Repeat, Voice, Feel)",
      "Full rewrite stack (Humanize, Catchier, Harder)",
      "Full Audio Studio V2",
      "MP3 / WAV / Stems export",
      "Unlimited project saves",
    ],
  },
  {
    id: "artist-pro",
    name: "Artist Pro",
    price: "$40",
    description: "Everything in Creator Pro + Artist DNA, voice clone, and persistent memory.",
    cta: "Go Artist Pro",
    badge: { label: "For Serious Artists", icon: "crown" as const },
    highlight: false,
    isArtistPro: true,
    isCreatorPro: false,
    stripeId: "artist-pro" as PlanId,
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

export function Pricing() {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("creator-pro");

  const handlePlanClick = (stripeId: PlanId | null) => {
    if (!stripeId) return;
    setSelectedPlan(stripeId);
    setShowSubscriptionModal(true);
  };

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[400px] bg-primary/8 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Simple,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#ff9900]">
                Creator-Friendly
              </span>{" "}
              Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Start for free, upgrade when you need more power and creative tools.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative flex"
            >
              {plan.highlight && (
                <div className="absolute -inset-1 bg-gradient-to-b from-primary/50 to-secondary/30 rounded-3xl blur-xl opacity-40" />
              )}
              {plan.isArtistPro && (
                <div className="absolute -inset-1 bg-gradient-to-b from-violet-500/40 to-fuchsia-600/20 rounded-3xl blur-xl opacity-40" />
              )}

              <div
                className={`relative z-10 flex flex-col w-full rounded-3xl p-8 border transition-all ${
                  plan.highlight
                    ? "bg-[#111116] border-primary/40 shadow-2xl"
                    : plan.isArtistPro
                    ? "bg-[#0d0d14] border-violet-500/30 shadow-2xl"
                    : "bg-card border-white/5 hover:border-white/10"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                        plan.isArtistPro
                          ? "bg-gradient-to-r from-violet-500 to-fuchsia-400 text-white"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {plan.badge.icon === "crown" ? (
                        <Crown className="w-3 h-3" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      {plan.badge.label}
                    </span>
                  </div>
                )}

                <div className={`mb-6 ${plan.badge ? "mt-3" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {plan.isArtistPro && <Crown className="w-4 h-4 text-violet-400" />}
                    {plan.isCreatorPro && <Zap className="w-4 h-4 text-amber-400" />}
                    <h3
                      className={`text-2xl font-bold ${
                        plan.isArtistPro
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-300"
                          : plan.highlight
                          ? "text-primary"
                          : "text-white"
                      }`}
                    >
                      {plan.name}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-5xl font-bold ${
                        plan.isArtistPro
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-300"
                          : plan.highlight
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#ff9900]"
                          : "text-white"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {"trial" in plan && (
                    <div className="mt-1.5 text-xs text-amber-400 font-semibold">✓ {plan.trial}</div>
                  )}
                </div>

                <div
                  className={`h-px w-full mb-6 ${
                    plan.isArtistPro
                      ? "bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"
                      : plan.highlight
                      ? "bg-gradient-to-r from-transparent via-primary/30 to-transparent"
                      : "bg-white/5"
                  }`}
                />

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/80">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          plan.isArtistPro
                            ? "text-violet-400"
                            : plan.highlight
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span className={i === 0 && plan.isArtistPro ? "font-semibold text-white" : "text-white/80"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.stripeId ? (
                  <button
                    onClick={() => handlePlanClick(plan.stripeId)}
                    className={`w-full py-4 rounded-xl font-bold transition-all hover:-translate-y-0.5 ${
                      plan.isArtistPro
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:shadow-[0_0_30px_rgba(167,139,250,0.5)]"
                        : "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
                    }`}
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <button className="w-full py-4 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/10">
                    {plan.cta}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <SubscriptionModal
        open={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        defaultPlan={selectedPlan}
      />
    </section>
  );
}
