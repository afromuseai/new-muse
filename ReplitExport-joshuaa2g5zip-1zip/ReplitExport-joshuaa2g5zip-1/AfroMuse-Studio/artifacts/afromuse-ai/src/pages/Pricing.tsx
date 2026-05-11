import { Check, X, Sparkles, Crown } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui-elements";
import { Link } from "wouter";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description:
      "Perfect for exploring AfroMuse AI and testing the creative experience before upgrading.",
    cta: "Start Free",
    ctaVariant: "outline" as const,
    href: "/auth",
    badge: null,
    highlight: false,
    isGold: false,
    features: [
      { text: "Limited song generations", included: true },
      { text: "Hook + lyrics generation", included: true },
      { text: "Save basic drafts", included: true },
      { text: "Access to AfroMuse Studio", included: true },
      { text: "3 one-time audio generation trials", included: true },
      { text: "1 one-time collaboration trial", included: true },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$20",
    description:
      "For creators who want more depth, more power, and a stronger songwriting workflow.",
    cta: "Upgrade to Pro",
    ctaVariant: "default" as const,
    href: "/auth",
    badge: { label: "Most Popular", icon: "sparkles" },
    highlight: true,
    isGold: false,
    features: [
      { text: "More song generations", included: true, strong: true },
      { text: "Better songwriting assistance", included: true },
      { text: "Stronger outputs", included: true },
      { text: "Priority access to future premium features", included: true },
      { text: "Access to improved creator tools as AfroMuse AI grows", included: true },
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: "$40",
    description:
      "For serious creators who want advanced creation tools and collaboration power.",
    cta: "Go Gold",
    ctaVariant: "default" as const,
    href: "/auth",
    badge: { label: "Best for Serious Artists", icon: "crown" },
    highlight: false,
    isGold: true,
    features: [
      { text: "Everything in Pro", included: true, strong: true },
      { text: "Collaboration Mode access", included: true },
      { text: "50 collaboration generations per month", included: true },
      { text: "Upload your own instrumental", included: true },
      { text: "Priority future access: voice clone, stems & distribution", included: true },
    ],
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen pt-32 pb-24 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-primary/8 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute top-2/3 left-1/4 w-80 h-80 bg-yellow-500/5 blur-[120px] pointer-events-none rounded-full" />

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
              {/* Badge — sits above the card, outside overflow-hidden */}
              {plan.badge && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
                  <span
                    className={`inline-flex items-center gap-1.5 px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-lg ${
                      plan.isGold
                        ? "bg-gradient-to-r from-yellow-400 to-amber-400 text-black shadow-[0_0_16px_rgba(234,179,8,0.5)]"
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
              {plan.isGold && (
                <div className="absolute -inset-1 bg-gradient-to-b from-yellow-500/40 to-amber-600/20 rounded-3xl blur-xl opacity-40" />
              )}

              <Card
                className={`relative z-10 flex flex-col w-full p-6 md:p-8 ${
                  plan.highlight
                    ? "border-primary/40 bg-[#111116] shadow-2xl"
                    : plan.isGold
                    ? "border-yellow-500/30 bg-[#0f0f0a] shadow-2xl"
                    : "border-white/5 bg-card/40"
                }`}
              >
                {/* Plan header */}
                <div className="mb-6">
                  <h2
                    className={`text-2xl font-semibold mb-2 ${
                      plan.isGold
                        ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300"
                        : plan.highlight
                        ? "text-primary"
                        : "text-white"
                    }`}
                  >
                    {plan.name}
                  </h2>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span
                      className={`text-4xl md:text-5xl font-bold ${
                        plan.isGold
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300"
                          : plan.highlight
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#ff9900]"
                          : "text-white"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground text-sm">/ month</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Divider */}
                <div
                  className={`h-px w-full mb-6 ${
                    plan.isGold
                      ? "bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"
                      : plan.highlight
                      ? "bg-gradient-to-r from-transparent via-primary/30 to-transparent"
                      : "bg-white/5"
                  }`}
                />

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          plan.isGold
                            ? "text-yellow-400"
                            : plan.highlight
                            ? "text-primary"
                            : "text-emerald-500"
                        }`}
                      />
                      <span
                        className={
                          feature.strong
                            ? "text-white font-semibold"
                            : "text-white/80"
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href={plan.href}>
                  {plan.isGold ? (
                    <button className="w-full h-12 rounded-xl font-bold text-sm bg-gradient-to-r from-yellow-500 to-amber-400 text-black hover:from-yellow-400 hover:to-amber-300 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:-translate-y-0.5">
                      {plan.cta}
                    </button>
                  ) : plan.highlight ? (
                    <Button className="w-full h-12 text-sm font-bold shadow-[0_0_20px_rgba(255,184,77,0.3)] hover:shadow-[0_0_30px_rgba(255,184,77,0.5)] hover:-translate-y-0.5 transition-all">
                      {plan.cta}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full h-12 text-sm">
                      {plan.cta}
                    </Button>
                  )}
                </Link>
              </Card>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-16 max-w-2xl mx-auto">
          Audio generation, custom instrumentals, collaboration tools, voice cloning, and
          distribution features are coming in future releases. Pro and Gold members unlock
          early access automatically.
        </p>
      </div>
    </div>
  );
}
