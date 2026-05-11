import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Copy, Download, Loader2, Check, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Studio() {
  const { toast } = useToast();
  const [status, setStatus] = useState<'idle' | 'generating' | 'done'>('idle');
  const [topic, setTopic] = useState('');
  const [genre, setGenre] = useState('Afrobeats');
  const [mood, setMood] = useState('Uplifting');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for your song.",
        variant: "destructive"
      });
      return;
    }
    
    setStatus('generating');
    // Simulate API call
    setTimeout(() => {
      setStatus('done');
      toast({
        title: "Song Generated! 🎵",
        description: "Your Afrobeats track is ready.",
      });
    }, 2500);
  };

  const handleCopy = () => {
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="studio" className="py-24 relative overflow-hidden">
      {/* Studio Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/studio-bg.png`} 
          alt="Studio background" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              AI Music <span className="text-primary">Studio</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Describe your vision. Get complete song drafts in seconds.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT: FORM */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5"
          >
            <div className="bg-card rounded-3xl p-6 sm:p-8 border border-white/5 shadow-2xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Song Parameters
              </h3>
              
              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Song Topic</label>
                  <input 
                    type="text" 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Dancing under the Lagos moon"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Genre</label>
                    <select 
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 appearance-none"
                    >
                      <option>Afrobeats</option>
                      <option>Afropop</option>
                      <option>Amapiano</option>
                      <option>Highlife</option>
                      <option>Afrofusion</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Mood</label>
                    <select 
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 appearance-none"
                    >
                      <option>Uplifting</option>
                      <option>Romantic</option>
                      <option>Party</option>
                      <option>Introspective</option>
                      <option>Spiritual</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Style Notes (Optional)</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Wizkid-inspired flow, heavy percussion, storytelling verses..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={status === 'generating'}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === 'generating' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Song
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* RIGHT: OUTPUT PANEL */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7"
          >
            <div className="h-full min-h-[500px] bg-[#0A0A0E] rounded-3xl border border-white/5 relative overflow-hidden flex flex-col">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <h3 className="font-semibold text-white/90">
                  {status === 'idle' ? 'Draft Output' : status === 'generating' ? 'Writing...' : `Generated: ${topic || 'Lagos Nights'}`}
                </h3>
                {status === 'done' && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleCopy}
                      className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                      title="Copy text"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => toast({ title: "Download started" })}
                      className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                      title="Download text"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6 relative">
                <AnimatePresence mode="wait">
                  
                  {status === 'idle' && (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground"
                    >
                      <Music className="w-12 h-12 mb-4 opacity-20" />
                      <p>Fill out the form to generate your song.</p>
                    </motion.div>
                  )}

                  {status === 'generating' && (
                    <motion.div 
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center"
                    >
                      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6"></div>
                      <p className="text-primary font-medium animate-pulse">Channeling the vibes...</p>
                    </motion.div>
                  )}

                  {status === 'done' && (
                    <motion.div 
                      key="done"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6 text-white/80 font-sans h-[500px] overflow-y-auto pr-2 custom-scrollbar"
                    >
                      <div>
                        <div className="text-xs font-bold text-primary tracking-widest uppercase mb-2">[INTRO]</div>
                        <p className="leading-relaxed">
                          (Afrobeats percussion rolls in)<br/>
                          Yeah, yeah, yeah<br/>
                          AfroMuse vibes, you know the deal<br/>
                          Listen to the frequency...
                        </p>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-primary tracking-widest uppercase mb-2">[VERSE 1]</div>
                        <p className="leading-relaxed">
                          I step out looking fresh, the aura is clean<br/>
                          They try to figure out what the energy mean<br/>
                          Omo, no be today wey we dey on the scene<br/>
                          Taking over the globe, yeah we living the dream<br/>
                          Slow whine, catch the tempo, feel the bassline<br/>
                          Everything align when the stars shine
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="text-xs font-bold text-primary tracking-widest uppercase mb-2 flex items-center gap-2">
                          <Sparkles className="w-3 h-3" /> [CHORUS]
                        </div>
                        <p className="leading-relaxed text-white font-medium text-lg">
                          Baby come dance with me under the Lagos lights<br/>
                          We go move to the rhythm all through the night<br/>
                          No wahala, no stress, just you and I<br/>
                          Feeling the frequency taking us high
                        </p>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-primary tracking-widest uppercase mb-2">[VERSE 2]</div>
                        <p className="leading-relaxed">
                          Say she want the designer, Prada and Gucci<br/>
                          I tell am say baby, my love is a movie<br/>
                          Odogwu level, we popping the bubblies<br/>
                          Making them wonder how we doing it smoothly
                        </p>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
