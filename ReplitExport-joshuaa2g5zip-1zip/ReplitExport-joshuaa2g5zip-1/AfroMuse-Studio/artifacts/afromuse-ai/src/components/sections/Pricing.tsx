import { motion } from "framer-motion";
import { Check, Sparkles, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description:
      "Perfect for exploring AfroMuse AI and testing the creative experience before upgrading.",
    cta: "Start Free",
    badge: null,
    highlight: false,
    isGold: false,
    features: [
      "Limited song generations",
      "Hook + lyrics generation",
      "Save basic drafts",
      "Access to AfroMuse Studio",
      "3 one-time audio generation trials",
      "1 one-time collaboration trial",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$20",
    description:
      "For creators who want more depth, more power, and a stronger songwriting workflow.",
    cta: "Upgrade to Pro",
    badge: { label: "Most Popular", icon: "sparkles" },
    highlight: true,
    isGold: false,
    features: [
      "More song generations",
      "Better songwriting assistance",
      "Stronger outputs",
      "Priority access to future premium features",
      "Access to improved creator tools as AfroMuse AI grows",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: "$40",
    description:
      "For serious creators who want advanced creation tools and collaboration power.",
    cta: "Go Gold",
    badge: { label: "Best for Serious Artists", icon: "crown" },
    highlight: false,
    isGold: true,
    features: [
      "Everything in Pro",
      "Collaboration Mode access",
      "50 collaboration generations per month",
      "Upload your own instrumental",
      "Priority future access: voice clone, stems & distribution",
    ],
  },
];

export function Pricing() {
  const { toast } = useToast();

  const handlePlanClick = (plan: string) => {
    toast({
      title: `${plan} Selected`,
      description: "Redirecting to checkout... (Mock Action)",
    });
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
              {plan.isGold && (
                <div className="absolute -inset-1 bg-gradient-to-b from-yellow-500/40 to-amber-600/20 rounded-3xl blur-xl opacity-40" />
              )}

              <div
                className={`relative z-10 flex flex-col w-full rounded-3xl p-8 border transition-all ${
                  plan.highlight
                    ? "bg-[#111116] border-primary/40 shadow-2xl"
                    : plan.isGold
                    ? "bg-[#0f0f0a] border-yellow-500/30 shadow-2xl"
                    : "bg-card border-white/5 hover:border-white/10"
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                        plan.isGold
                          ? "bg-gradient-to-r from-yellow-500 to-amber-400 text-black"
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
                  <h3
                    className={`text-2xl font-bold mb-1 ${
                      plan.isGold
                        ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300"
                        : plan.highlight
                        ? "text-primary"
                        : "text-white"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-5xl font-bold ${
                        plan.isGold
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300"
                          : plan.highlight
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#ff9900]"
                          : "text-white"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                <div
                  className={`h-px w-full mb-6 ${
                    plan.isGold
                      ? "bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"
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
                          plan.isGold
                            ? "text-yellow-400"
                            : plan.highlight
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={
                          i === 0 && plan.isGold
                            ? "font-semibold text-white"
                            : "text-white/80"
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.isGold ? (
                  <button
                    onClick={() => handlePlanClick("Gold Plan")}
                    className="w-full py-4 rounded-xl font-bold bg-gradient-to-r from-yellow-500 to-amber-400 text-black hover:from-yellow-400 hover:to-amber-300 transition-all shadow-[0_0_20px_rgba(234,179,8,0.25)] hover:shadow-[0_0_30px_rgba(234,179,8,0.45)] hover:-translate-y-0.5"
                  >
                    {plan.cta}
                  </button>
                ) : plan.highlight ? (
                  <button
                    onClick={() => handlePlanClick("Pro Plan")}
                    className="w-full py-4 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5"
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlanClick("Free Plan")}
                    className="w-full py-4 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 transition-colors border border-white/10"
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
