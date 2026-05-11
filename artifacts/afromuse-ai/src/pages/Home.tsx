import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button, Badge } from "@/components/ui-elements";
import { Sparkles, Music, PenTool, Layers, Play, CheckCircle2, Lock, ArrowRight, ArrowUpRight, Mic2, Sliders, FileText, Copy, UserCircle, Users, Globe, Volume2, Music2, Download } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen pt-20">
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        
        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-primary/20 blur-[1px]"
            style={{
              width: Math.random() * 8 + 4,
              height: Math.random() * 8 + 4,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{
              duration: Math.random() * 3 + 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-2xl"
            >
              <Badge variant="secondary" className="mb-8 border border-secondary/30 bg-secondary/10 backdrop-blur-sm py-2 px-5 text-sm font-medium shadow-lg">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                Built for Afrobeat Creators
              </Badge>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black leading-[1.1] mb-6">
                Produce Your Next <span className="text-gradient-primary drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">Hit Song</span><br />
                <span className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">With AfroMuse AI</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground/80 mb-10 leading-relaxed max-w-xl font-medium">
                From raw idea to full song structure in seconds. Hooks, verses, bridges — crafted in the vibrant language of Afrobeats, Amapiano, and beyond.
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/studio">
                  <Button size="lg" className="w-full sm:w-auto text-base group shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-shadow hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] h-14 px-8">
                    Start Writing Free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base rounded-full h-14 px-8 bg-transparent border-white/20 hover:bg-white/5">
                  <Play className="mr-2 w-4 h-4 fill-current" /> Watch Demo
                </Button>
              </div>

              {/* Trust Bar */}
              <div className="mt-12 flex flex-wrap items-center gap-4 pt-8 border-t border-white/5">
                <div className="flex -space-x-3">
                  {/* Real-looking gradient avatars */}
                  {[
                    "from-amber-400 to-orange-500",
                    "from-purple-400 to-violet-500",
                    "from-pink-400 to-rose-500",
                    "from-emerald-400 to-teal-500",
                    "from-blue-400 to-indigo-500"
                  ].map((grad, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden relative shadow-md">
                      <div className={`absolute inset-0 bg-gradient-to-br ${grad}`} />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium text-muted-foreground flex flex-col justify-center">
                  <div className="flex items-center text-primary text-xs mb-0.5 tracking-widest">
                    ★★★★★
                  </div>
                  <span><span className="text-foreground font-bold">10,000+</span> artists shaping the next sound of Africa</span>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Premium Preview Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:ml-auto w-full max-w-md mx-auto animate-float order-last lg:order-none"
            >
              {/* Decorative background elements for the card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary opacity-40 blur-2xl rounded-3xl" />
              <div className="absolute -inset-[1px] bg-gradient-to-b from-white/20 to-transparent rounded-3xl z-10 pointer-events-none opacity-50" />
              
              <div className="glass-panel rounded-3xl p-6 relative z-10 flex flex-col h-auto min-h-[420px] lg:h-[520px] bg-[#0A0A0F]/80">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold font-display text-white mb-2">Lagos Nights</h3>
                    <div className="flex gap-2">
                      <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-0">Afrobeats</Badge>
                      <Badge variant="outline" className="border-white/10 text-muted-foreground">Uplifting</Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="bg-white/5 text-[10px] text-white/70 border-white/10 uppercase tracking-wider py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" /> Live Preview
                    </Badge>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-primary border border-white/5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5v14M7 9v6M22 9v6M2 11v2"/></svg>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden relative custom-scrollbar">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A0A0F]/90 z-10 pointer-events-none" />
                  
                  <div className="space-y-6 pb-20">
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/10 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                      <div className="text-xs font-bold tracking-widest text-primary mb-2 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> HOOK
                      </div>
                      <p className="text-white/95 italic leading-relaxed text-lg font-medium drop-shadow-sm">
                        "Baby come dance with me under the Lagos lights<br/>
                        We go move to the rhythm all through the night<br/>
                        No wahala, no stress, just you and I<br/>
                        Feeling the frequency taking us high"
                      </p>
                    </div>

                    <div className="px-2">
                      <div className="text-xs font-bold tracking-widest text-muted-foreground mb-2">
                        VERSE 1 SNIPPET
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        I been waiting for this moment steady on my grind<br/>
                        Now I see the vision clear, not playing blind...
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fake Player */}
                <div className="absolute bottom-6 left-6 right-6 pt-4 border-t border-white/10 bg-[#0A0A0F]/90 backdrop-blur-xl rounded-b-xl">
                  <div className="flex items-center gap-4">
                    <button className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                      <Play className="w-5 h-5 ml-1" fill="currentColor" />
                    </button>
                    <div className="flex-1">
                      <div className="h-2 bg-white/10 rounded-full w-full mb-2 overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-primary to-[#ff9900] w-1/3 rounded-full relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md" />
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground font-mono font-medium">
                        <span>0:45</span>
                        <span>3:12</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>Generated in 2.4s</span>
                    </div>
                    <span className="text-[10px] opacity-50">AFROMUSE AI</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background z-0" />
        
        {/* Subtle Animated Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] z-0" 
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Everything You Need to <span className="text-gradient">Write Hits</span></h2>
            <p className="text-lg text-muted-foreground">
              AfroMuse AI speaks the language of Afrobeats. From Lagos to Johannesburg — we understand the rhythm, the slang, the storytelling.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 lg:gap-8">
            {[
              {
                icon: Sparkles,
                title: "AI Songwriter",
                desc: "Describe your vibe — love, hustle, heartbreak, celebration — and get a complete song draft with intro, verse, hook, bridge, and outro.",
                color: "text-primary",
                bg: "bg-primary/10",
                gradient: "from-primary",
                badge: "Full Song Drafts"
              },
              {
                icon: Music,
                title: "Hook Architect",
                desc: "The hook makes or breaks a song. AfroMuse crafts irresistible, earworm-worthy hooks built to stick — generate multiple options until one hits.",
                color: "text-secondary",
                bg: "bg-secondary/10",
                gradient: "from-secondary",
                badge: "Ear-Catching Hooks"
              },
              {
                icon: PenTool,
                title: "Verse Crafter",
                desc: "Deep Afrobeat storytelling with authentic lyrical flow, Pidgin touches, and the kind of verses that make fans sing along at every show.",
                color: "text-accent",
                bg: "bg-accent/10",
                gradient: "from-accent",
                badge: "Authentic Lyrics"
              },
              {
                icon: Layers,
                title: "Structure Blueprint",
                desc: "Never stare at a blank page again. Get a full song roadmap — every section mapped out, every transition designed for maximum impact.",
                color: "text-emerald-400",
                bg: "bg-emerald-400/10",
                gradient: "from-emerald-400",
                badge: "Song Architecture"
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-10 rounded-3xl group hover:border-primary/30 relative overflow-hidden min-h-[280px] flex flex-col"
              >
                {/* Top Gradient Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} to-transparent opacity-50`} />
                
                {/* Hover Arrow */}
                <div className="absolute top-8 right-8 opacity-0 -translate-x-2 translate-y-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300">
                  <ArrowUpRight className="w-6 h-6 text-white/40" />
                </div>

                <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-inner`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2 text-white flex items-center gap-3">
                    {feature.title}
                  </h3>
                  <Badge variant="outline" className="mb-4 text-[10px] uppercase tracking-widest border-white/10 bg-white/5 text-white/50">{feature.badge}</Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed flex-1">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">From Idea to Studio-Ready Draft</h2>
            <p className="text-xl text-muted-foreground">Three steps between you and a complete song structure</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 -translate-y-1/2 left-[15%] right-[15%] h-px border-t-2 border-dashed border-white/20" />

            {[
              {
                num: "01",
                icon: Mic2,
                title: "Drop Your Idea",
                desc: "Give us a topic, a mood, or even just a feeling. The rawer the idea, the better — AfroMuse AI builds around it."
              },
              {
                num: "02",
                icon: Sliders,
                title: "Set Your Sound",
                desc: "Pick your genre — Afrobeats, Amapiano, Afropop, Afro R&B — set the mood and energy level. We tune the AI to match."
              },
              {
                num: "03",
                icon: Sparkles,
                title: "Get Your Draft",
                desc: "In seconds, your full song structure appears — ready to record, refine, or take straight to the booth."
              }
            ].map((step, idx) => (
              <div key={idx} className="relative z-10">
                <div className="glass-card rounded-3xl p-6 md:p-8 h-full flex flex-col items-center text-center hover:border-primary/20 transition-colors">
                  <div className="w-24 h-24 rounded-full bg-card border border-white/10 flex items-center justify-center text-3xl font-display font-bold text-primary shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-6 relative">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-[spin_4s_linear_infinite]" />
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-b-secondary animate-[spin_3s_linear_infinite_reverse]" />
                    {step.num}
                  </div>
                  <step.icon className="w-8 h-8 text-white/50 mb-6" />
                  <h4 className="text-2xl font-bold mb-3 text-white">{step.title}</h4>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SAMPLE OUTPUT --- */}
      <section className="py-24 bg-black/60 border-y border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">From Prompt to Song in Under 3 Seconds</h2>
            <p className="text-muted-foreground">Real output from the AfroMuse Studio. Every word, every section — generated and ready to record.</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#0d0d12]">
              <div className="bg-[#1a1a24] px-4 py-3 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-mono">street_prayer_draft.txt</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase tracking-wider hidden sm:flex">
                    Generated by AfroMuse AI
                  </Badge>
                  <button className="text-muted-foreground hover:text-white transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 md:p-8 font-mono text-sm md:text-base leading-relaxed overflow-x-auto break-words text-white/80 flex">
                {/* Line Numbers */}
                <div className="flex flex-col text-white/20 select-none pr-6 border-r border-white/5 mr-6 text-right min-w-[3rem]">
                  {[...Array(20)].map((_, i) => (
                    <span key={i} className="leading-relaxed">{String(i + 1).padStart(2, '0')}</span>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-max">
                  <div className="text-primary mb-6 border-b border-white/5 pb-4 inline-block pr-12">
                    SONG TITLE: Street Prayer<br/>
                    GENRE: Afrobeats | MOOD: Spiritual
                  </div>
                  
                  <div className="mb-6">
                    <span className="inline-block bg-secondary/20 text-secondary px-2 py-0.5 rounded text-xs font-bold tracking-wider mb-2">[INTRO]</span><br/>
                    (Soft acoustic guitar picking, distant choir hums)<br/>
                    Oluwa cover me o... yeah yeah<br/>
                    We outside today
                  </div>

                  <div className="mb-6">
                    <span className="inline-block bg-accent/20 text-accent px-2 py-0.5 rounded text-xs font-bold tracking-wider mb-2">[VERSE 1]</span><br/>
                    Woke up this morning, tie my shoes tight<br/>
                    Mama told me boy you gotta win the fight<br/>
                    The road is rough but the vision is bright<br/>
                    I dey hustle from the morning till it turn night<br/>
                    (Ah) They want to see me fall<br/>
                    But the grace on my head standing ten feet tall
                  </div>

                  <div className="mb-2 bg-white/5 p-4 rounded-lg border-l-2 border-primary">
                    <span className="inline-block bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold tracking-wider mb-2">[HOOK / CHORUS]</span><br/>
                    Lord guide my steps through the city streets<br/>
                    Where the rhythm meets the soul and the heart beats<br/>
                    Bless the work of my hands, make the money sweet<br/>
                    Make I no go fall down for defeat<br/>
                    (Amin o, Amin o)
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="mt-4 text-center text-xs text-muted-foreground/60 font-mono tracking-wider">
              Generated in 1.8s &nbsp;•&nbsp; 412 words &nbsp;•&nbsp; Afrobeats &nbsp;•&nbsp; Spiritual mood &nbsp;•&nbsp; Studio-ready draft
            </div>
          </div>
        </div>
      </section>

      {/* --- FUTURE VISION --- */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">What's Coming Next</h2>
            <p className="text-muted-foreground">AfroMuse AI is just getting started. Here's where we're taking it — and Pro users get there first.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: "AI Audio Generation", desc: "Hear your lyrics brought to life. Upload or generate a beat and AfroMuse turns your draft into a real audio track.", icon: Volume2, iconColor: "text-primary", glowColor: "bg-primary/20", hoverBorder: "group-hover:border-primary/25" },
              { title: "Custom Instrumentals", desc: "AI-composed beats matched to your genre, mood, and tempo — your sound, your way.", icon: Music2, iconColor: "text-secondary", glowColor: "bg-secondary/20", hoverBorder: "group-hover:border-secondary/25" },
              { title: "Downloadable Stems", desc: "Export isolated vocal, beat, and melody tracks — ready for mixing, mastering, or collaboration.", icon: Download, iconColor: "text-emerald-400", glowColor: "bg-emerald-400/20", hoverBorder: "group-hover:border-emerald-400/25" }
            ].map((item, i) => (
              <div key={i} className={`rounded-2xl border border-white/5 bg-card/20 p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden group hover:bg-card/40 transition-all duration-300 min-h-[220px]`}>
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-0" />
                
                {/* Glowing ring on hover */}
                <div className={`absolute inset-0 border-2 border-transparent ${item.hoverBorder} rounded-2xl transition-colors duration-500`} />
                
                <div className="relative mb-6">
                  <div className={`absolute inset-0 ${item.glowColor} blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <item.icon className={`w-10 h-10 ${item.iconColor} opacity-50 group-hover:opacity-100 transition-opacity relative z-10`} />
                  <Lock className="w-4 h-4 text-primary absolute -bottom-1 -right-1 z-20" />
                </div>
                
                <h4 className="font-semibold text-white/70 group-hover:text-white transition-colors relative z-10 mb-2 text-lg">{item.title}</h4>
                <p className="text-sm text-muted-foreground mb-4 relative z-10">{item.desc}</p>
                <Badge variant="outline" className="text-[10px] border-white/10 text-white/30 relative z-10 uppercase tracking-widest">Coming in v2.0</Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-32 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-primary/5" />
        
        {/* Animated wave/glow behind */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-primary/30 blur-[150px] pointer-events-none rounded-[100%]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex justify-center mb-6">
            <Sparkles className="w-8 h-8 text-primary opacity-80" />
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-black mb-6 text-white drop-shadow-lg">
            Your next hit starts here.
          </h2>
          <p className="text-xl md:text-2xl text-white/70 mb-10 max-w-2xl mx-auto font-medium">
            Join thousands of Afrobeat artists writing faster, thinking bigger, and creating more with AfroMuse AI.
          </p>
          <Link href="/studio">
            <Button size="lg" className="rounded-full h-14 px-8 md:h-16 md:px-12 text-lg md:text-xl shadow-[0_0_40px_rgba(245,158,11,0.6)] hover:shadow-[0_0_60px_rgba(245,158,11,0.8)] transition-all hover:scale-105 font-bold">
              Start Writing Free
            </Button>
          </Link>
          
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-white/50 font-medium text-center">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Free forever</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Start in seconds</span>
          </div>
        </div>
      </section>

    </div>
  );
}
