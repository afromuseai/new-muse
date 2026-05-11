import { useState } from "react";
import { Check, Sparkles, Crown, Zap } from "lucide-react";
import { Button, Card } from "@/components/ui-elements";
import { SubscriptionModal } from "@/components/ui/SubscriptionModal";

type PlanId = "creator-pro" | "artist-pro";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Perfect for exploring AfroMuse AI and testing the creative experience.",
    cta: "Start Free",
    ctaVariant: "outline" as const,
    href: "/auth",
    badge: null,
    highlight: false,
    isArtistPro: false,
    stripeId: null as PlanId | null,
    features: [
      { text: "10 song generations total", included: true },
      { text: "Basic lyric generation", included: true },
      { text: "3 audio generation trials", included: true },
      { text: "Access to AfroMuse Studio", included: true },
      { text: "Instrumental preview only", included: true },
    ],
  },
  {
    id: "creator-pro",
    name: "Creator Pro",
    price: "$20",
    description: "Full lyric controls, rewrite stack, Audio Studio V2, and unlimited exports.",
    cta: "Upgrade to Creator Pro",
    ctaVariant: "default" as const,
    href: "#",
    badge: { label: "Most Popular", icon: "sparkles" as const },
    highlight: true,
    isArtistPro: false,
    stripeId: "creator-pro" as PlanId,
    trial: "7-day free trial",
    features: [
      { text: "Unlimited song generations", included: true, strong: true },
      { text: "Full lyric controls (Depth, Hook Repeat, Voice, Feel)", included: true },
      { text: "Full rewrite stack (Humanize, Catchier, Harder)", included: true },
      { text: "Full Audio Studio V2", included: true },
      { text: "MP3 / WAV / Stems export", included: true },
      { text: "Unlimited project saves", included: true },
    ],
  },
  {
    id: "artist-pro",
    name: "Artist Pro",
    price: "$40",
    description: "Everything in Creator Pro + Artist DNA, voice clone, and persistent memory.",
    cta: "Go Artist Pro",
    ctaVariant: "default" as const,
    href: "#",
    badge: { label: "For Serious Artists", icon: "crown" as const },
    highlight: false,
    isArtistPro: true,
    stripeId: "artist-pro" as PlanId,
    features: [
      { text: "Everything in Creator Pro", included: true, strong: true },
      { text: "Artist DNA — personalized style engine", included: true },
      { text: "Voice Clone (coming soon)", included: true },
      { text: "Persistent memory across sessions", included: true },
      { text: "Advanced demo production", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

export default function Pricing() {
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("creator-pro");

  const handlePlanClick = (plan: typeof plans[0]) => {
    if (!plan.stripeId) return;
    setSelectedPlan(plan.stripeId);
    setShowSubscriptionModal(true);
  };

  return (
    <div className="min-h-screen pt-32 pb-24 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-primary/8 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute top-2/3 left-1/4 w-80 h-80 bg-violet-500/5 blur-[120px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Built for Artists.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#ff9900]">
              Priced for Creators.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Start free, stay free as long as you want. Upgrade when you're ready to go all in.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => (
            <div key={plan.id} className={`relative flex flex-col ${plan.badge ? "pt-6" : ""}`}>
              {plan.badge && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                  <span
                    className={`inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-lg ${
                      plan.isArtistPro
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-400 text-white shadow-[0_0_16px_rgba(167,139,250,0.5)]"
                        : "bg-gradient-to-r from-primary to-amber-400 text-black shadow-[0_0_16px_rgba(245,158,11,0.4)]"
                    }`}
                  >
                    {plan.badge.icon === "crown" ? (
                      <Crown className="w-3.5 h-3.5" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {plan.badge.label}
                  </span>
                </div>
              )}

              {plan.highlight && (
                <div className="absolute -inset-1 bg-gradient-to-b from-primary/50 to-secondary/30 rounded-3xl blur-xl opacity-40" />
              )}
              {plan.isArtistPro && (
                <div className="absolute -inset-1 bg-gradient-to-b from-violet-500/40 to-fuchsia-600/20 rounded-3xl blur-xl opacity-40" />
              )}

              <Card
                className={`relative z-10 flex flex-col w-full p-6 md:p-8 ${
                  plan.highlight
                    ? "border-primary/40 bg-[#111116] shadow-2xl"
                    : plan.isArtistPro
                    ? "border-violet-500/30 bg-[#0d0d14] shadow-2xl"
                    : "border-white/5 bg-card/40"
                }`}
              >
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {plan.isArtistPro && <Crown className="w-4 h-4 text-violet-400" />}
                    {plan.highlight && <Zap className="w-4 h-4 text-amber-400" />}
                    <h2
                      className={`text-2xl font-semibold ${
                        plan.isArtistPro
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-300"
                          : plan.highlight
                          ? "text-primary"
                          : "text-white"
                      }`}
                    >
                      {plan.name}
                    </h2>
                  </div>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span
                      className={`text-4xl md:text-5xl font-bold ${
                        plan.isArtistPro
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-300"
                          : plan.highlight
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#ff9900]"
                          : "text-white"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">/ month</span>
                  </div>
                  {"trial" in plan && (
                    <div className="text-xs text-amber-400 font-semibold mb-2">✓ {plan.trial}</div>
                  )}
                  <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
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
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          plan.isArtistPro
                            ? "text-violet-400"
                            : plan.highlight
                            ? "text-primary"
                            : "text-emerald-500"
                        }`}
                      />
                      <span className={"strong" in feature && feature.strong ? "text-white font-semibold" : "text-white/80"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.stripeId ? (
                  <button
                    onClick={() => handlePlanClick(plan)}
                    className={`w-full h-12 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 ${
                      plan.isArtistPro
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-[0_0_20px_rgba(167,139,250,0.3)] hover:shadow-[0_0_30px_rgba(167,139,250,0.5)]"
                        : "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(255,184,77,0.3)] hover:shadow-[0_0_30px_rgba(255,184,77,0.5)]"
                    }`}
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Button variant="outline" className="w-full h-12 text-sm">
                    {plan.cta}
                  </Button>
                )}
              </Card>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-16 max-w-2xl mx-auto">
          Voice cloning, collaboration tools, and distribution features are coming in future releases.
          Artist Pro members unlock early access automatically.
        </p>
      </div>

      <SubscriptionModal
        open={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        defaultPlan={selectedPlan}
      />
    </div>
  );
}
