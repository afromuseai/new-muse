import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Copy, Save, Loader2, Music, RefreshCw,
  ChevronDown, Sliders, Volume2, Music2, Download, Check, Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  generateSongDraft,
  formatDraftForClipboard,
  saveProjectToStorage,
  type SongDraft,
} from "@/lib/songGenerator";
import { useAuth } from "@/context/AuthContext";
import { usePlan, PLAN_LIMITS, type Plan } from "@/context/PlanContext";

type GenerationStatus = "idle" | "generating" | "done";

const generatingSteps = [
  "Reading your vibe...",
  "Writing the hook...",
  "Building your verses...",
  "Putting it all together...",
];

export default function Studio() {
  const { toast } = useToast();
  const { isLoggedIn } = useAuth();
  const {
    plan,
    hasAccess,
    generationsUsed,
    generationsLimit,
    generationsRemaining,
    audioTrialsLeft,
    collabTrialsLeft,
    canGenerate,
    incrementGeneration,
  } = usePlan();

  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [topic, setTopic] = useState("");
  const [genre, setGenre] = useState("Afrobeats");
  const [mood, setMood] = useState("Uplifting");
  const [style, setStyle] = useState("");
  const [notes, setNotes] = useState("");
  const [generatingStep, setGeneratingStep] = useState(0);
  const [draft, setDraft] = useState<SongDraft | null>(null);
  const [seed, setSeed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTo, setUpgradeTo] = useState<Plan>("Pro");

  useEffect(() => {
    if (status === "generating") {
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % generatingSteps.length;
        setGeneratingStep(i);
      }, 600);
      return () => clearInterval(interval);
    }
  }, [status]);

  const runGeneration = (currentSeed: number) => {
    setStatus("generating");
    setGeneratingStep(0);
    setSaved(false);
    incrementGeneration();
    setTimeout(() => {
      const newDraft = generateSongDraft(topic, genre, mood, style, currentSeed);
      setDraft(newDraft);
      setStatus("done");
      toast({ title: "Draft ready!", description: `"${newDraft.title}" has been written.` });
    }, 2600);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic or theme for your song.",
        variant: "destructive",
      });
      return;
    }
    if (!canGenerate()) {
      setUpgradeTo("Pro");
      setShowUpgradeModal(true);
      return;
    }
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    runGeneration(nextSeed);
  };

  const handleRegenerate = () => {
    if (!canGenerate()) {
      setUpgradeTo("Pro");
      setShowUpgradeModal(true);
      return;
    }
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    runGeneration(nextSeed);
  };

  const handleClear = () => {
    setTopic("");
    setGenre("Afrobeats");
    setMood("Uplifting");
    setStyle("");
    setNotes("");
    setStatus("idle");
    setDraft(null);
    setSeed(0);
    setSaved(false);
  };

  const copyToClipboard = async () => {
    if (!draft) return;
    const text = formatDraftForClipboard(draft, genre, mood);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    toast({ title: "Copied!", description: "Full draft copied to clipboard." });
    setTimeout(() => setCopied(false), 2500);
  };

  const saveProject = () => {
    if (!draft) return;
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    saveProjectToStorage(topic, genre, mood, style, draft);
    setSaved(true);
    toast({
      title: "Project saved!",
      description: `"${draft.title}" saved to My Projects.`,
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background relative">
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-secondary/10 blur-[150px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] pointer-events-none rounded-full" />

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className={`w-full max-w-sm rounded-3xl border shadow-2xl p-8 text-center relative overflow-hidden ${
                upgradeTo === "Gold"
                  ? "border-yellow-500/30 bg-[#0f0f0a]"
                  : "border-primary/30 bg-[#0d0d1a]"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 blur-3xl pointer-events-none ${
                upgradeTo === "Gold" ? "bg-yellow-500/20" : "bg-primary/20"
              }`} />
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
                  upgradeTo === "Gold"
                    ? "bg-yellow-500/15 border border-yellow-500/30"
                    : "bg-primary/10 border border-primary/20"
                }`}>
                  <Sparkles className={`w-6 h-6 ${upgradeTo === "Gold" ? "text-yellow-400" : "text-primary"}`} />
                </div>
                <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border mb-4 ${
                  upgradeTo === "Gold"
                    ? "bg-yellow-500/15 border-yellow-500/30 text-yellow-400"
                    : "bg-primary/15 border-primary/30 text-primary"
                }`}>
                  Upgrade to {upgradeTo}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {upgradeTo === "Gold" ? "Unlock Gold Features" : "You've Hit Your Limit"}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  {upgradeTo === "Gold"
                    ? "Collaboration mode, custom instrumentals, and voice cloning are all waiting for you on Gold."
                    : plan === "Free"
                      ? `You've used all ${PLAN_LIMITS.Free} Free generations. Upgrade to Pro for up to ${PLAN_LIMITS.Pro} per month.`
                      : `Upgrade to Gold for unlimited song generations and the full creator toolkit.`}
                </p>
                <div className="flex flex-col gap-3">
                  <Link href="/pricing">
                    <button className={`w-full h-12 rounded-xl font-semibold text-sm transition-all ${
                      upgradeTo === "Gold"
                        ? "bg-gradient-to-r from-yellow-500 to-amber-400 text-black hover:from-yellow-400 hover:to-amber-300 shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_28px_rgba(245,158,11,0.4)]"
                    }`}>
                      See Plans & Pricing
                    </button>
                  </Link>
                  <button
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full h-10 rounded-xl border border-white/8 text-sm text-muted-foreground hover:text-white hover:border-white/20 transition-all"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Gate Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d0d1a] shadow-2xl p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Please log in to continue</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Save your projects and access them anywhere. Create a free account to get started.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/auth?from=/studio">
                  <button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_28px_rgba(245,158,11,0.4)] transition-all">
                    Log In or Sign Up
                  </button>
                </Link>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full h-10 rounded-xl border border-white/8 text-sm text-muted-foreground hover:text-white hover:border-white/20 transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 md:px-6 relative z-10">

        {/* PAGE HEADER */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">AfroMuse Studio</div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-white">AfroMuse Studio</h1>
            <p className="text-muted-foreground text-sm md:text-base">Describe your vibe. Choose your sound. Get a full song structure — in seconds.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shrink-0">
            {status === "idle" && (
              <><div className="w-2 h-2 rounded-full bg-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Ready to Create</span></>
            )}
            {status === "generating" && (
              <><div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /><span className="text-xs font-medium text-amber-500">Writing your song...</span></>
            )}
            {status === "done" && (
              <><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-xs font-medium text-green-500">Draft Ready</span></>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* LEFT PANEL: Form */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 rounded-3xl border border-white/8 bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-xl p-5 md:p-7 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold tracking-widest text-primary uppercase">Tell Us Your Story</span>
            </div>

            <form onSubmit={handleGenerate}>
              {/* Topic */}
              <div className="space-y-1.5 mb-5">
                <label className="text-sm font-medium text-white/80 mb-1.5 block">Your Song Idea</label>
                <input
                  type="text"
                  placeholder="e.g. love in Lagos, hustle, heartbreak at 3am"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Genre */}
              <div className="space-y-1.5 mb-5">
                <label className="text-sm font-medium text-white/80 mb-1.5 block">Genre</label>
                <div className="relative">
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full h-12 rounded-xl bg-[#1a1a2e] border border-white/10 px-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Afrobeats" className="bg-[#1a1a2e] text-white">Afrobeats</option>
                    <option value="Afropop" className="bg-[#1a1a2e] text-white">Afropop</option>
                    <option value="Amapiano" className="bg-[#1a1a2e] text-white">Amapiano</option>
                    <option value="Dancehall" className="bg-[#1a1a2e] text-white">Dancehall</option>
                    <option value="R&B" className="bg-[#1a1a2e] text-white">Afro R&B</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Mood */}
              <div className="space-y-1.5 mb-5">
                <label className="text-sm font-medium text-white/80 mb-1.5 block">Energy & Mood</label>
                <div className="relative">
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full h-12 rounded-xl bg-[#1a1a2e] border border-white/10 px-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Uplifting" className="bg-[#1a1a2e] text-white">Uplifting</option>
                    <option value="Romantic" className="bg-[#1a1a2e] text-white">Romantic</option>
                    <option value="Energetic" className="bg-[#1a1a2e] text-white">Energetic / Party</option>
                    <option value="Spiritual" className="bg-[#1a1a2e] text-white">Spiritual / Deep</option>
                    <option value="Sad" className="bg-[#1a1a2e] text-white">Sad / Heartbreak</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Style */}
              <div className="space-y-1.5 mb-5">
                <label className="text-sm font-medium text-white/80 mb-1.5 block">Sound Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Burna Boy's 'Last Last' energy, or Wizkid slow-wave vibes"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full h-12 rounded-xl bg-white/5 border border-white/10 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5 mb-5">
                <label className="text-sm font-medium text-white/80 mb-1.5 block">Extra Direction</label>
                <textarea
                  placeholder="Anything else — a story, a line you want in, a specific feeling to capture"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all resize-none min-h-[100px]"
                />
              </div>

              <div className="pt-2 flex flex-col gap-3">
                {!canGenerate() ? (
                  <button
                    type="button"
                    onClick={() => { setUpgradeTo("Pro"); setShowUpgradeModal(true); }}
                    className="w-full h-14 rounded-2xl border border-primary/30 bg-primary/10 text-primary font-bold text-base tracking-wide transition-all hover:bg-primary/20 flex items-center justify-center gap-2"
                  >
                    <Lock className="w-5 h-5" />
                    Upgrade to Generate More
                  </button>
                ) : (
                <button
                  type="submit"
                  disabled={status === "generating"}
                  className="relative overflow-hidden w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base tracking-wide transition-all duration-200 shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  <motion.div
                    className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                  />
                  {status === "generating" ? (
                    <><Loader2 className="w-5 h-5 animate-spin relative z-10" /><span className="relative z-10">Composing your draft...</span></>
                  ) : (
                    <><Sparkles className="w-5 h-5 relative z-10" /><span className="relative z-10">Write My Song</span></>
                  )}
                </button>
                )}

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={status === "generating"}
                  className="w-full h-10 rounded-xl border border-white/8 text-sm text-muted-foreground hover:text-white hover:border-white/20 transition-all bg-transparent"
                >
                  Clear Form
                </button>

                {/* Usage indicator */}
                {generationsLimit !== Infinity && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/6 p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Song Generations
                      </span>
                      <span className={`text-[10px] font-bold ${generationsRemaining <= 1 ? "text-red-400" : "text-muted-foreground"}`}>
                        {generationsUsed} of {generationsLimit} used
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          generationsRemaining === 0 ? "bg-red-500" :
                          generationsRemaining <= 1 ? "bg-amber-500" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(100, (generationsUsed / generationsLimit) * 100)}%` }}
                      />
                    </div>
                    {generationsRemaining === 0 ? (
                      <p className="text-[10px] text-red-400/80 mt-1.5">Limit reached · <button onClick={() => { setUpgradeTo("Pro"); setShowUpgradeModal(true); }} className="underline hover:text-red-400">Upgrade to Pro</button></p>
                    ) : generationsRemaining === 1 ? (
                      <p className="text-[10px] text-amber-400/70 mt-1.5">1 generation left · <button onClick={() => { setUpgradeTo("Pro"); setShowUpgradeModal(true); }} className="underline hover:text-amber-400">Upgrade to Pro</button></p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/40 mt-1.5">{generationsRemaining} remaining on Free plan</p>
                    )}
                  </div>
                )}

                {generationsLimit === Infinity && (
                  <div className="flex items-center gap-2 rounded-xl bg-white/[0.02] border border-white/5 px-3 py-2">
                    <Sparkles className="w-3 h-3 text-yellow-400 shrink-0" />
                    <span className="text-[10px] text-yellow-400/70 font-medium">Unlimited generations · Gold</span>
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground/40 text-center mt-1">
                  AfroMuse AI · Creative first drafts for human artists
                </p>
              </div>
            </form>
          </div>

          {/* RIGHT PANEL: Output */}
          <div className="lg:col-span-8 min-h-[300px] lg:min-h-[600px]">
            <AnimatePresence mode="wait">

              {/* IDLE */}
              {status === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex flex-col items-center justify-center p-8 md:p-16 text-center rounded-3xl border border-dashed border-white/8 bg-white/[0.015] min-h-[300px] md:min-h-[600px]"
                >
                  <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-60" />
                    <div className="relative w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.08)]">
                      <Music className="w-10 h-10 text-primary/70" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-3">Your Canvas is Blank — Fill It</h3>
                  <p className="text-muted-foreground max-w-sm leading-relaxed">
                    Tell AfroMuse your story. We'll craft the full song structure — hook, verses, bridge, and production notes — in seconds.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-8">
                    {["✦ Hook", "✦ Verse 1 & 2", "✦ Bridge", "✦ Chord Notes", "✦ Melody Direction", "✦ Arrangement"].map((tag) => (
                      <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* GENERATING */}
              {status === "generating" && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex flex-col items-center justify-center p-8 md:p-16 text-center rounded-3xl border border-white/8 bg-[#080810] min-h-[300px] md:min-h-[600px] shadow-2xl"
                >
                  <div className="relative w-28 h-28 mb-8">
                    <div className="absolute inset-0 rounded-full border-[3px] border-white/5 border-t-primary animate-spin" />
                    <div className="absolute inset-3 rounded-full border-[3px] border-white/5 border-b-secondary animate-[spin_2.5s_linear_infinite_reverse]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">Writing your song...</h3>
                  <p className="text-muted-foreground text-sm mb-8 max-w-xs">AfroMuse AI is channeling your vibe into a full song structure.</p>
                  <div className="w-56 h-1 bg-white/8 rounded-full overflow-hidden mb-3">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                      animate={{ width: ["0%", "100%"] }}
                      transition={{ duration: 2.6, ease: "linear" }}
                    />
                  </div>
                  <div className="h-5 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={generatingStep}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm text-muted-foreground font-medium"
                      >
                        {generatingSteps[generatingStep]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* DONE */}
              {status === "done" && draft && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  {/* Header + Actions */}
                  <div className="rounded-2xl border border-white/8 bg-card/50 backdrop-blur-xl px-5 py-4">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-primary/80 bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                          <Sparkles className="w-2.5 h-2.5" /> AI Generated Draft
                        </span>
                        <span className="text-[10px] text-muted-foreground/50">{genre} · {mood}</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 capitalize leading-tight">
                        {draft.title}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleRegenerate}
                        className="flex items-center gap-2 rounded-xl h-10 px-4 text-sm border border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Regenerate
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className={`flex items-center gap-2 rounded-xl h-10 px-4 text-sm border transition-all ${
                          copied
                            ? "border-green-500/40 bg-green-500/10 text-green-400"
                            : "border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white"
                        }`}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Copied!" : "Copy Lyrics"}
                      </button>
                      <button
                        onClick={saveProject}
                        disabled={saved}
                        className={`flex items-center gap-2 rounded-xl h-10 px-5 text-sm font-semibold transition-all ${
                          saved
                            ? "bg-green-500/20 border border-green-500/30 text-green-400 cursor-default"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_28px_rgba(245,158,11,0.4)] hover:-translate-y-0.5"
                        }`}
                      >
                        {saved ? <><Check className="w-3.5 h-3.5" />Saved!</> : <><Save className="w-3.5 h-3.5" />Save Project</>}
                      </button>
                    </div>
                  </div>

                  {/* Lyrics Card */}
                  <div className="rounded-3xl border border-white/8 bg-[#07070f] overflow-hidden shadow-2xl">
                    <div className="flex items-center justify-between bg-[#0d0d1a] border-b border-white/5 px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground/60">
                          {draft.title.toLowerCase().replace(/\s+/g, "_")}_draft.txt
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/40 bg-white/4 border border-white/5 px-2.5 py-0.5 rounded-full">
                        AfroMuse AI · v{seed}
                      </span>
                    </div>

                    <div className="p-6 md:p-10 space-y-10">

                      {/* HOOK */}
                      <LyricsSection
                        label="⚡ Hook / Chorus"
                        labelClass="bg-primary/15 text-primary border-primary/20"
                        lines={draft.hook}
                        isHook
                      />

                      {/* VERSE 1 */}
                      <LyricsSection
                        label="Verse 1"
                        labelClass="bg-secondary/12 text-secondary border-secondary/20"
                        lines={draft.verse1}
                      />

                      {/* HOOK REPEAT */}
                      <LyricsSection
                        label="⚡ Hook / Chorus"
                        labelClass="bg-primary/15 text-primary border-primary/20"
                        lines={draft.hook}
                        isHook
                        repeat
                      />

                      {/* VERSE 2 */}
                      <LyricsSection
                        label="Verse 2"
                        labelClass="bg-secondary/12 text-secondary border-secondary/20"
                        lines={draft.verse2}
                      />

                      {/* BRIDGE */}
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-violet-500/12 text-violet-400 border border-violet-500/20">
                            Bridge
                          </span>
                          <div className="flex-1 h-px bg-white/5" />
                        </div>
                        <div className="rounded-xl bg-violet-500/5 border border-violet-500/10 p-5">
                          <p className="font-sans text-base text-white/70 leading-8 italic text-center">
                            {draft.bridge.map((line, i) => (
                              <span key={i}>{line}{i < draft.bridge.length - 1 && <br />}</span>
                            ))}
                          </p>
                        </div>
                      </div>

                      {/* HOOK FINAL */}
                      <LyricsSection
                        label="⚡ Hook / Chorus"
                        labelClass="bg-primary/15 text-primary border-primary/20"
                        lines={draft.hook}
                        isHook
                        repeat
                      />

                      {/* PRODUCTION NOTES */}
                      <div className="border-t border-white/6 pt-8">
                        <div className="flex items-center gap-2 mb-5">
                          <Sliders className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Production Notes</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="rounded-2xl bg-white/[0.025] border border-white/6 p-5 hover:border-primary/20 transition-colors">
                            <div className="text-primary text-[10px] tracking-widest font-bold mb-2 uppercase">Chord / Vibe</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{draft.chordVibe}</p>
                          </div>
                          <div className="rounded-2xl bg-white/[0.025] border border-white/6 p-5 hover:border-secondary/20 transition-colors">
                            <div className="text-secondary text-[10px] tracking-widest font-bold mb-2 uppercase">Melody Direction</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{draft.melodyDirection}</p>
                          </div>
                          <div className="rounded-2xl bg-white/[0.025] border border-white/6 p-5 hover:border-violet-500/20 transition-colors">
                            <div className="text-violet-400 text-[10px] tracking-widest font-bold mb-2 uppercase">Arrangement</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{draft.arrangement}</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* PLAN-GATED FEATURES PANEL */}
                  <PlanFeaturesPanel
                    plan={plan}
                    hasAccess={hasAccess}
                    audioTrialsLeft={audioTrialsLeft}
                    collabTrialsLeft={collabTrialsLeft}
                    onUpgrade={(target) => { setUpgradeTo(target); setShowUpgradeModal(true); }}
                  />

                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Plan-gated features panel ──────────────────────────────────────────────

function PlanFeaturesPanel({
  plan,
  hasAccess,
  audioTrialsLeft,
  collabTrialsLeft,
  onUpgrade,
}: {
  plan: Plan;
  hasAccess: (p: Plan) => boolean;
  audioTrialsLeft: number;
  collabTrialsLeft: number;
  onUpgrade: (target: Plan) => void;
}) {
  const isPro = hasAccess("Pro");
  const isGold = hasAccess("Gold");

  const proFeatures = [
    {
      icon: <Volume2 className="w-5 h-5 text-amber-400" />,
      title: "AI Audio Generation",
      desc: "Turn lyrics into a full audio track",
      trial: plan === "Free" ? `${audioTrialsLeft} trial${audioTrialsLeft !== 1 ? "s" : ""} left` : null,
      locked: !isPro,
      upgradeTarget: "Pro" as Plan,
    },
    {
      icon: <Music2 className="w-5 h-5 text-purple-400" />,
      title: "Downloadable Stems",
      desc: "Vocal, beat & melody separate tracks",
      trial: null,
      locked: !isPro,
      upgradeTarget: "Pro" as Plan,
    },
    {
      icon: <Download className="w-5 h-5 text-emerald-400" />,
      title: "Priority Access",
      desc: "First access to all upcoming features",
      trial: null,
      locked: !isPro,
      upgradeTarget: "Pro" as Plan,
    },
  ];

  const goldFeatures = [
    {
      icon: <span className="text-xl">🤝</span>,
      title: "Collaboration Mode",
      desc: "Co-write with producers in real-time",
      trial: plan !== "Gold" ? `${collabTrialsLeft} trial${collabTrialsLeft !== 1 ? "s" : ""} left` : null,
      locked: !isGold,
    },
    {
      icon: <span className="text-xl">🎹</span>,
      title: "Upload Instrumental",
      desc: "Generate lyrics fitted to your beat",
      trial: null,
      locked: !isGold,
    },
    {
      icon: <span className="text-xl">🎤</span>,
      title: "Voice Clone",
      desc: "Hear lyrics in a generated vocal style",
      trial: null,
      locked: !isGold,
    },
  ];

  return (
    <div className="space-y-4">
      {/* PRO SECTION */}
      {!isPro && (
        <div className="rounded-3xl border border-amber-500/15 bg-gradient-to-br from-amber-500/5 via-background to-primary/5 p-5 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-24 bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 mb-2">
                  <Sparkles className="w-2.5 h-2.5" /> Pro Features
                </div>
                <p className="text-white/60 text-xs">Unlock with AfroMuse Pro · $20/mo</p>
              </div>
              <button
                onClick={() => onUpgrade("Pro")}
                className="shrink-0 h-9 px-4 rounded-xl bg-primary/15 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/25 transition-all"
              >
                Upgrade →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {proFeatures.map((f) => (
                <div key={f.title} className="rounded-2xl bg-white/[0.03] border border-white/8 p-4 flex items-start gap-3 relative">
                  <div className="mt-0.5 shrink-0 opacity-50">{f.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-white/50 text-sm mb-0.5 flex items-center gap-1.5">
                      {f.title}
                      <Lock className="w-3 h-3 text-white/20" />
                    </h5>
                    <p className="text-xs text-muted-foreground/50">{f.desc}</p>
                    {f.trial && (
                      <span className="text-[10px] inline-block mt-2 bg-amber-500/10 border border-amber-500/20 text-amber-400/70 px-2 py-0.5 rounded-full">
                        {f.trial}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isPro && !isGold && (
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-transparent p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary">
              <Sparkles className="w-2.5 h-2.5" /> Pro — Active
            </div>
            <span className="text-xs text-muted-foreground">You have full Pro access</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {proFeatures.map((f) => (
              <div key={f.title} className="rounded-2xl bg-primary/5 border border-primary/15 p-4 flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{f.icon}</div>
                <div>
                  <h5 className="font-semibold text-white text-sm mb-0.5">{f.title}</h5>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                  <span className="text-[10px] inline-block mt-2 bg-primary/15 border border-primary/20 text-primary px-2 py-0.5 rounded-full">Pro Unlocked</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GOLD SECTION */}
      {!isGold && (
        <div className="rounded-3xl border border-yellow-500/15 bg-gradient-to-br from-yellow-500/5 via-background to-amber-500/5 p-5 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-24 bg-yellow-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 mb-2">
                  ✦ Gold Features
                </div>
                <p className="text-white/60 text-xs">Unlock with AfroMuse Gold · $40/mo</p>
              </div>
              <button
                onClick={() => onUpgrade("Gold")}
                className="shrink-0 h-9 px-4 rounded-xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/25 transition-all"
              >
                Go Gold →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {goldFeatures.map((f) => (
                <div key={f.title} className="rounded-2xl bg-white/[0.02] border border-yellow-500/10 p-4 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 opacity-40">{f.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-white/40 text-sm mb-0.5 flex items-center gap-1.5">
                      {f.title}
                      <Lock className="w-3 h-3 text-white/20" />
                    </h5>
                    <p className="text-xs text-muted-foreground/40">{f.desc}</p>
                    {f.trial && (
                      <span className="text-[10px] inline-block mt-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400/70 px-2 py-0.5 rounded-full">
                        {f.trial}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isGold && (
        <div className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/8 via-background to-amber-500/5 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400">
              ✦ Gold — All Features Unlocked
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {goldFeatures.map((f) => (
              <div key={f.title} className="rounded-2xl bg-yellow-500/5 border border-yellow-500/15 p-4 flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{f.icon}</div>
                <div>
                  <h5 className="font-semibold text-white text-sm mb-0.5">{f.title}</h5>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                  <span className="text-[10px] inline-block mt-2 bg-yellow-500/15 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Gold Unlocked</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-component for lyric sections ────────────────────────────────────────

function LyricsSection({
  label,
  labelClass,
  lines,
  isHook = false,
  repeat = false,
}: {
  label: string;
  labelClass: string;
  lines: string[];
  isHook?: boolean;
  repeat?: boolean;
}) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${labelClass}`}>
          {label}
        </span>
        {!isHook && <div className="flex-1 h-px bg-white/5" />}
        {repeat && <span className="text-[10px] text-muted-foreground/40 italic">repeat</span>}
      </div>
      {isHook ? (
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/8 via-primary/5 to-transparent border border-primary/15 p-6 overflow-hidden">
          <div className="absolute top-4 left-4 text-primary/10 text-7xl font-serif leading-none select-none">"</div>
          <p className="relative font-sans text-lg md:text-xl text-white/90 leading-relaxed italic font-medium">
            {lines.map((line, i) => (
              <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
            ))}
          </p>
          <div className="absolute bottom-3 right-5 text-primary/10 text-5xl font-serif leading-none select-none rotate-180">"</div>
        </div>
      ) : (
        <p className="font-sans text-base text-white/75 leading-8 pl-4 border-l border-white/10">
          {lines.map((line, i) => (
            <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
          ))}
        </p>
      )}
    </div>
  );
}
