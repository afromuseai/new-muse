import { motion } from "framer-motion";
import { Music, PenTool, LayoutGrid } from "lucide-react";

export function Features() {
  const features = [
    {
      title: "Generate Hooks",
      description: "AI crafts irresistible hooks that stick. Get multiple variations instantly, tailored to your exact mood and tempo.",
      icon: Music,
      color: "from-orange-500 to-amber-400"
    },
    {
      title: "Write Verses",
      description: "Generate full verses with authentic Afrobeats lyrical flow, storytelling, and cultural cadences.",
      icon: PenTool,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Song Structure",
      description: "Complete song blueprints constructed with intro, verse, chorus, bridge, and outro sequences that make sense.",
      icon: LayoutGrid,
      color: "from-blue-500 to-cyan-400"
    }
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Everything You Need to <span className="text-primary">Create</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Our models are fine-tuned specifically on the rhythmic structures, 
              melodic patterns, and lyrical styles of modern African music.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative"
            >
              <div className="absolute -inset-px bg-gradient-to-b from-white/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative h-full bg-card rounded-3xl p-8 border border-white/5 hover:border-white/10 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-8 shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
