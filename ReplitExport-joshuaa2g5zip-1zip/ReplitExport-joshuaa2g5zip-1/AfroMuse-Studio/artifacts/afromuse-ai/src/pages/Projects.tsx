import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  Plus, Search, Trash2, Copy, Eye, Calendar, Music,
  Sparkles, X, ChevronDown, Sliders, Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  loadProjectsFromStorage,
  persistProjects,
  formatDraftForClipboard,
  type SavedProject,
} from "@/lib/songGenerator";

const GENRES = ["All", "Afrobeats", "Afropop", "Amapiano", "Dancehall", "R&B"];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function Projects() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [openProject, setOpenProject] = useState<SavedProject | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setProjects(loadProjectsFromStorage());
  }, []);

  const save = useCallback((updated: SavedProject[]) => {
    setProjects(updated);
    persistProjects(updated);
  }, []);

  const handleDelete = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    save(updated);
    setConfirmDeleteId(null);
    if (openProject?.id === id) setOpenProject(null);
    toast({ title: "Project deleted" });
  };

  const handleDuplicate = (project: SavedProject) => {
    const copy: SavedProject = {
      ...project,
      id: `proj_${Date.now()}`,
      title: `${project.draft.title} (Copy)`,
      draft: { ...project.draft, title: `${project.draft.title} (Copy)` },
      savedAt: new Date().toISOString(),
    };
    const updated = [copy, ...projects];
    save(updated);
    toast({ title: "Project duplicated", description: `"${copy.title}" added to your library.` });
  };

  const handleCopyLyrics = async (project: SavedProject) => {
    const text = formatDraftForClipboard(project.draft, project.genre, project.mood);
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

  const filtered = projects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.topic.toLowerCase().includes(search.toLowerCase());
    const matchGenre = filter === "All" || p.genre === filter;
    return matchSearch && matchGenre;
  });

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background relative">
      <div className="fixed top-0 left-0 w-[400px] h-[400px] bg-secondary/8 blur-[140px] pointer-events-none rounded-full" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-primary/4 blur-[140px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">

        {/* HEADER */}
        <div className="mb-10">
          <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">My Library</div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 text-white">Your Song Library</h1>
          <p className="text-muted-foreground">Every draft you've written — saved, organised, ready to revisit.</p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center mb-8">
          <div className="flex w-full sm:w-auto gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search your songs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 rounded-xl bg-card/50 border border-white/10 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <div className="relative shrink-0">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-12 rounded-xl border border-white/10 bg-[#1a1a2e] px-4 pr-9 text-sm text-white focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g} className="bg-[#1a1a2e]">{g === "All" ? "All Genres" : g}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <Link href="/studio">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 sm:h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_28px_rgba(245,158,11,0.35)] hover:-translate-y-0.5 transition-all">
              <Plus className="w-4 h-4" /> New Song
            </button>
          </Link>
        </div>

        {/* STATS BAR */}
        {projects.length > 0 && (
          <div className="flex items-center gap-4 mb-6 text-xs text-muted-foreground">
            <span><span className="text-white font-medium">{projects.length}</span> {projects.length === 1 ? "project" : "projects"} saved</span>
            {filtered.length !== projects.length && (
              <span>· showing <span className="text-white font-medium">{filtered.length}</span> result{filtered.length !== 1 ? "s" : ""}</span>
            )}
            {(search || filter !== "All") && (
              <button
                onClick={() => { setSearch(""); setFilter("All"); }}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* GRID */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => setOpenProject(project)}
                  onDuplicate={() => handleDuplicate(project)}
                  onDelete={() => {
                    if (confirmDeleteId === project.id) {
                      handleDelete(project.id);
                    } else {
                      setConfirmDeleteId(project.id);
                    }
                  }}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                  isConfirmingDelete={confirmDeleteId === project.id}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : projects.length === 0 ? (
          /* TRUE EMPTY STATE */
          <EmptyState />
        ) : (
          /* FILTERED EMPTY */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.015]"
          >
            <Search className="w-10 h-10 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No results found</h3>
            <p className="text-muted-foreground text-sm mb-5">No songs match "{search || filter}". Try a different search or filter.</p>
            <button
              onClick={() => { setSearch(""); setFilter("All"); }}
              className="text-sm text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/50 px-5 h-10 rounded-xl transition-all"
            >
              Clear filters
            </button>
          </motion.div>
        )}

      </div>

      {/* PROJECT DETAIL DRAWER */}
      <AnimatePresence>
        {openProject && (
          <ProjectDrawer
            project={openProject}
            onClose={() => setOpenProject(null)}
            onCopyLyrics={() => handleCopyLyrics(openProject)}
            copied={copied}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── PROJECT CARD ─────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onOpen,
  onDuplicate,
  onDelete,
  onCancelDelete,
  isConfirmingDelete,
}: {
  project: SavedProject;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
  isConfirmingDelete: boolean;
}) {
  const hookPreview = project.draft.hook?.[0] ?? "";

  const moodColors: Record<string, string> = {
    Uplifting: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    Romantic: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    Energetic: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    Spiritual: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    Sad: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };
  const moodClass = moodColors[project.mood] ?? "text-muted-foreground bg-white/5 border-white/10";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="group rounded-3xl border border-white/8 bg-gradient-to-b from-card/80 to-card/30 backdrop-blur-xl p-6 flex flex-col hover:border-primary/25 hover:shadow-[0_0_40px_rgba(245,158,11,0.05)] transition-all duration-300"
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3
            className="font-bold text-lg text-white mb-2 group-hover:text-primary transition-colors leading-tight cursor-pointer truncate"
            onClick={onOpen}
          >
            {project.title}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {project.genre}
            </span>
            <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border ${moodClass}`}>
              {project.mood}
            </span>
          </div>
        </div>

        {/* Action icons — always visible on mobile, hover on desktop */}
        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={onOpen}
            title="Open draft"
            className="p-1.5 text-muted-foreground hover:text-white rounded-lg hover:bg-white/10 transition-all"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onDuplicate}
            title="Duplicate"
            className="p-1.5 text-muted-foreground hover:text-white rounded-lg hover:bg-white/10 transition-all"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="p-1.5 text-muted-foreground hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Topic */}
      {project.topic && (
        <p className="text-xs text-muted-foreground/60 mb-3 italic">
          Theme: {project.topic}
        </p>
      )}

      {/* Hook preview */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-5 flex-1 italic leading-relaxed">
        "{hookPreview}"
      </p>

      {/* Delete confirm */}
      <AnimatePresence>
        {isConfirmingDelete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-xs text-red-400 font-medium">Delete this project?</p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={onCancelDelete}
                  className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-muted-foreground hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onDelete}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
          <Calendar className="w-3 h-3 mr-0.5" />
          {formatDate(project.savedAt)}
        </div>
        <button
          onClick={onOpen}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all"
        >
          <Eye className="w-3.5 h-3.5" />
          Open Draft
        </button>
      </div>
    </motion.div>
  );
}

// ── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-24 text-center flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.015]"
    >
      <div className="relative w-20 h-20 mb-8">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping opacity-40" />
        <div className="relative w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.08)]">
          <Music className="w-9 h-9 text-primary/60" />
        </div>
      </div>
      <h3 className="text-2xl font-display font-bold text-white mb-3">No projects yet</h3>
      <p className="text-muted-foreground max-w-xs leading-relaxed mb-8">
        Start your first song draft and it will appear here. Every track you write is saved automatically.
      </p>
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {["✦ Hook", "✦ Verse 1 & 2", "✦ Bridge", "✦ Production Notes"].map((tag) => (
          <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-muted-foreground">{tag}</span>
        ))}
      </div>
      <Link href="/studio">
        <button className="flex items-center gap-2 h-12 px-7 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wide shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:-translate-y-0.5 transition-all">
          <Sparkles className="w-4 h-4" />
          Create New Song
        </button>
      </Link>
    </motion.div>
  );
}

// ── PROJECT DETAIL DRAWER ────────────────────────────────────────────────────

function ProjectDrawer({
  project,
  onClose,
  onCopyLyrics,
  copied,
}: {
  project: SavedProject;
  onClose: () => void;
  onCopyLyrics: () => void;
  copied: boolean;
}) {
  const { draft, genre, mood } = project;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
      />

      {/* Drawer Panel */}
      <motion.div
        key="drawer"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-2xl bg-[#080812] border-l border-white/8 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Drawer header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/8 bg-[#0d0d1a] shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-primary/80 bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" /> Saved Draft
              </span>
              <span className="text-[10px] text-muted-foreground/50">{genre} · {mood}</span>
            </div>
            <h2 className="text-xl font-display font-bold text-white leading-tight">{draft.title}</h2>
            {project.topic && (
              <p className="text-xs text-muted-foreground/60 mt-0.5 italic">Theme: {project.topic}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onCopyLyrics}
              className={`flex items-center gap-2 h-9 px-4 rounded-xl text-sm border transition-all ${
                copied
                  ? "border-green-500/40 bg-green-500/10 text-green-400"
                  : "border-white/10 text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metadata strip */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5 bg-white/[0.015] shrink-0 flex-wrap">
          <MetaChip label="Genre" value={genre} />
          <MetaChip label="Mood" value={mood} />
          {project.style && <MetaChip label="Reference" value={project.style} />}
          <MetaChip label="Saved" value={formatDate(project.savedAt)} />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">

            <DrawerSection label="⚡ Hook / Chorus" isHook lines={draft.hook} />
            <DrawerSection label="Verse 1" lines={draft.verse1} />
            <DrawerSection label="⚡ Hook / Chorus" isHook lines={draft.hook} repeat />
            <DrawerSection label="Verse 2" lines={draft.verse2} />

            {/* Bridge */}
            <div>
              <SectionLabel label="Bridge" className="bg-violet-500/12 text-violet-400 border-violet-500/20" />
              <div className="rounded-xl bg-violet-500/5 border border-violet-500/10 p-5 mt-3">
                <p className="text-sm text-white/70 leading-8 italic text-center">
                  {draft.bridge.map((line, i) => (
                    <span key={i}>{line}{i < draft.bridge.length - 1 && <br />}</span>
                  ))}
                </p>
              </div>
            </div>

            <DrawerSection label="⚡ Hook / Chorus" isHook lines={draft.hook} repeat />

            {/* Production Notes */}
            <div className="border-t border-white/6 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Production Notes</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ProdCard label="Chord / Vibe" color="text-primary" value={draft.chordVibe} />
                <ProdCard label="Melody Direction" color="text-secondary" value={draft.melodyDirection} />
                <ProdCard label="Arrangement" color="text-violet-400" value={draft.arrangement} />
              </div>
            </div>

          </div>
        </div>

        {/* Drawer footer */}
        <div className="shrink-0 px-6 py-4 border-t border-white/8 bg-[#0d0d1a]">
          <Link href="/studio">
            <button
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_28px_rgba(245,158,11,0.35)] transition-all"
            >
              Write a New Song in Studio →
            </button>
          </Link>
        </div>
      </motion.div>
    </>
  );
}

// ── Drawer helper sub-components ─────────────────────────────────────────────

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[10px] text-muted-foreground/70">
      <span className="text-muted-foreground/40 uppercase tracking-wider mr-1">{label}:</span>
      <span className="text-white/70">{value}</span>
    </span>
  );
}

function SectionLabel({ label, className }: { label: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border ${className}`}>
      {label}
    </span>
  );
}

function DrawerSection({
  label,
  lines,
  isHook = false,
  repeat = false,
}: {
  label: string;
  lines: string[];
  isHook?: boolean;
  repeat?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <SectionLabel
          label={label}
          className={isHook ? "bg-primary/15 text-primary border-primary/20" : "bg-secondary/12 text-secondary border-secondary/20"}
        />
        {!isHook && <div className="flex-1 h-px bg-white/5" />}
        {repeat && <span className="text-[10px] text-muted-foreground/40 italic">repeat</span>}
      </div>
      {isHook ? (
        <div className="relative rounded-xl bg-gradient-to-br from-primary/8 via-primary/5 to-transparent border border-primary/15 p-5 overflow-hidden">
          <div className="absolute top-3 left-3 text-primary/10 text-6xl font-serif leading-none select-none">"</div>
          <p className="relative text-base text-white/90 leading-8 italic font-medium">
            {lines.map((line, i) => (
              <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
            ))}
          </p>
          <div className="absolute bottom-2 right-4 text-primary/10 text-4xl font-serif leading-none select-none rotate-180">"</div>
        </div>
      ) : (
        <p className="text-sm text-white/75 leading-8 pl-4 border-l border-white/10">
          {lines.map((line, i) => (
            <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
          ))}
        </p>
      )}
    </div>
  );
}

function ProdCard({ label, color, value }: { label: string; color: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.025] border border-white/6 p-4">
      <div className={`text-[10px] tracking-widest font-bold mb-2 uppercase ${color}`}>{label}</div>
      <p className="text-xs text-muted-foreground leading-relaxed">{value}</p>
    </div>
  );
}
