import { motion } from "framer-motion";
import { Play, Sparkles, AudioWaveform } from "lucide-react";

export function Hero() {
  const scrollToStudio = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[100svh] flex items-center pt-20 overflow-hidden">
      {/* Background with AI generated image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-glow.png`} 
          alt="Abstract glowing background" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background"></div>
        
        {/* Animated subtle grid overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          
          {/* Left Column: Copy */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">The New Era of Afrobeats</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
              <span className="text-gradient">Create Afrobeats Songs</span> <br />
              <span className="text-gradient-primary">with AI</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl">
              Generate catchy hooks, write powerful verses, and build complete song structures — powered by AI trained entirely on the authentic sounds of Africa.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a 
                href="#studio" 
                onClick={scrollToStudio}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_30px_rgba(255,165,0,0.3)] hover:shadow-[0_0_40px_rgba(255,165,0,0.5)] hover:-translate-y-1 transition-all duration-300 text-center"
              >
                Start Creating
              </a>
              <a 
                href="#features" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-center flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </a>
            </div>
            
            <div className="mt-12 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-background bg-card flex items-center justify-center overflow-hidden`}>
                    <img 
                      src={`https://i.pravatar.cc/100?img=${i + 10}`} 
                      alt="User" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>
              <p>Join <span className="text-white font-semibold">10,000+</span> creators globally</p>
            </div>
          </motion.div>

          {/* Right Column: Preview Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="lg:ml-auto w-full max-w-md relative"
          >
            {/* Decorative elements behind card */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-purple-600 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
            
            <div className="glass-panel rounded-3xl p-6 relative z-10 overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-orange-400 to-transparent"></div>
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Lagos Nights</h3>
                  <div className="flex items-center gap-2 text-xs font-medium text-primary">
                    <span className="px-2 py-0.5 rounded-md bg-primary/10">Afrobeats</span>
                    <span className="px-2 py-0.5 rounded-md bg-primary/10">Uplifting</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <AudioWaveform className="w-6 h-6" />
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-background/50 rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-primary" /> Hook
                  </div>
                  <p className="text-lg font-medium leading-relaxed italic text-white/90">
                    "Baby come dance with me under the Lagos lights <br/>
                    We go move to the rhythm all through the night <br/>
                    No wahala, no stress, just you and I <br/>
                    Feeling the frequency taking us high"
                  </p>
                </div>
                
                <div className="bg-background/30 rounded-xl p-4 border border-white/5 opacity-80">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Verse 1 snippet</div>
                  <p className="text-sm text-muted-foreground">
                    I been waiting for this moment steady on my grind<br/>
                    Now I see the vision clear, not playing blind...
                  </p>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-default">
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  </button>
                  <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-primary rounded-full"></div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-mono">0:45 / 3:12</span>
              </div>
            </div>
            
            {/* Floating badge */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -right-6 -bottom-6 glass-panel rounded-2xl p-4 flex items-center gap-3 shadow-xl border border-white/10"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Generated</p>
                <p className="text-xs text-muted-foreground">in 2.4 seconds</p>
              </div>
            </motion.div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
