import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Users, Music, FolderOpen, TrendingUp, Shield, Bell,
  ChevronRight, MoreHorizontal, ArrowUpRight, ArrowDownRight,
  Sparkles, Crown, Activity, MessageSquare, Zap, Globe,
  RefreshCw, Search, Filter, CheckCircle, AlertCircle, Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { loadProjectsFromStorage } from "@/lib/songGenerator";

// ── Mock data seeds ──────────────────────────────────────────────────────────

const MOCK_SIGNUPS = [
  { id: 1, name: "Adebayo Okafor",    email: "adebayo@gmail.com",    plan: "Pro",  joined: "2 mins ago",   country: "NG" },
  { id: 2, name: "Amara Diallo",      email: "amara.d@outlook.com",  plan: "Free", joined: "18 mins ago",  country: "SN" },
  { id: 3, name: "Kemi Fashola",      email: "kemi.f@icloud.com",    plan: "Gold", joined: "34 mins ago",  country: "NG" },
  { id: 4, name: "Kwame Asante",      email: "kwame@proton.me",      plan: "Pro",  joined: "1 hr ago",     country: "GH" },
  { id: 5, name: "Zainab Musa",       email: "zainab.m@gmail.com",   plan: "Free", joined: "2 hrs ago",    country: "NG" },
  { id: 6, name: "Tunde Adeyemi",     email: "tunde.a@yahoo.com",    plan: "Free", joined: "3 hrs ago",    country: "NG" },
  { id: 7, name: "Chioma Eze",        email: "chioma.e@gmail.com",   plan: "Pro",  joined: "5 hrs ago",    country: "NG" },
  { id: 8, name: "Segun Bello",       email: "segun.b@hotmail.com",  plan: "Free", joined: "6 hrs ago",    country: "NG" },
];

const MOCK_GENERATIONS = [
  { id: 1, title: "Lagos Love (No Wahala)",  genre: "Afrobeats", user: "Adebayo O.",  time: "4 mins ago" },
  { id: 2, title: "Soft Life — Piano Nights", genre: "Amapiano",  user: "Kemi F.",     time: "11 mins ago" },
  { id: 3, title: "Riddim Fire",              genre: "Dancehall", user: "Kwame A.",    time: "22 mins ago" },
  { id: 4, title: "Soul Ties — Deep Feelings",genre: "R&B",       user: "Amara D.",    time: "41 mins ago" },
  { id: 5, title: "Higher Vibrations",        genre: "Afropop",   user: "Chioma E.",   time: "1 hr ago" },
  { id: 6, title: "Joburg Dawn",              genre: "Amapiano",  user: "Zainab M.",   time: "2 hrs ago" },
];

const MOCK_SUPPORT = [
  { id: 1, user: "Tunde Adeyemi",  subject: "Can't save my project",         status: "open",     priority: "high",   time: "14 mins ago" },
  { id: 2, user: "Amara Diallo",   subject: "Audio generation not loading",   status: "open",     priority: "medium", time: "1 hr ago" },
  { id: 3, user: "Segun Bello",    subject: "How do I upgrade to Pro?",        status: "resolved", priority: "low",    time: "3 hrs ago" },
  { id: 4, user: "Zainab Musa",    subject: "Regenerate button not working",   status: "open",     priority: "medium", time: "4 hrs ago" },
  { id: 5, user: "Kwame Asante",   subject: "Billing question about Gold plan",status: "resolved", priority: "low",    time: "1 day ago" },
];

const MOCK_PREMIUM_USERS = [
  { id: 1, name: "Kemi Fashola",  email: "kemi.f@icloud.com",   plan: "Gold", joined: "Jan 12",  gens: 89,  projects: 24 },
  { id: 2, name: "Adebayo Okafor",email: "adebayo@gmail.com",   plan: "Pro",  joined: "Jan 18",  gens: 47,  projects: 13 },
  { id: 3, name: "Kwame Asante",  email: "kwame@proton.me",     plan: "Pro",  joined: "Feb 3",   gens: 35,  projects: 9  },
  { id: 4, name: "Chioma Eze",    email: "chioma.e@gmail.com",  plan: "Pro",  joined: "Feb 7",   gens: 28,  projects: 7  },
  { id: 5, name: "Aisha Kamara",  email: "aisha.k@gmail.com",   plan: "Gold", joined: "Feb 11",  gens: 112, projects: 31 },
];

const PLATFORM_STATS = {
  totalUsers:       1247,
  totalGenerations: 8941,
  freeUsers:        892,
  proUsers:         289,
  goldUsers:        66,
  weeklyGrowth:     12.4,
  conversionRate:   28.5,
  avgGenPerUser:    7.2,
  activeToday:      184,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<string, string> = {
  Free: "bg-white/5 border-white/10 text-muted-foreground",
  Pro:  "bg-amber-500/15 border-amber-500/30 text-amber-400",
  Gold: "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
};

const PRIORITY_STYLE: Record<string, string> = {
  high:   "bg-red-500/15 border-red-500/30 text-red-400",
  medium: "bg-amber-500/15 border-amber-500/30 text-amber-400",
  low:    "bg-green-500/15 border-green-500/30 text-green-400",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  open:     <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
  resolved: <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
};

const GENRE_COLOR: Record<string, string> = {
  Afrobeats: "text-amber-400",
  Amapiano:  "text-violet-400",
  Dancehall: "text-rose-400",
  "R&B":     "text-blue-400",
  Afropop:   "text-emerald-400",
};

function StatCard({
  label, value, sub, icon, trend, trendUp,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 flex flex-col gap-3 hover:border-white/15 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? "text-emerald-400" : "text-red-400"}`}>
          {trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {trend}
        </div>
      )}
    </motion.div>
  );
}

// ── Main Admin Page ──────────────────────────────────────────────────────────

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "support">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const realProjects = loadProjectsFromStorage();
  const realProjectCount = realProjects.length;

  const realUsage = (() => {
    try {
      const raw = localStorage.getItem("afromuse_usage");
      return raw ? JSON.parse(raw) : { generations: 0 };
    } catch { return { generations: 0 }; }
  })();

  const realPlan = localStorage.getItem("afromuse_plan") || "Free";

  const totalUsers    = PLATFORM_STATS.totalUsers + 1;
  const totalGens     = PLATFORM_STATS.totalGenerations + realUsage.generations;
  const totalProjects = PLATFORM_STATS.totalGenerations * 0.41 + realProjectCount;

  const freeCount = PLATFORM_STATS.freeUsers;
  const proCount  = PLATFORM_STATS.proUsers;
  const goldCount = PLATFORM_STATS.goldUsers + (realPlan === "Gold" ? 1 : 0);
  const total     = freeCount + proCount + goldCount;

  const freePct  = Math.round((freeCount / total) * 100);
  const proPct   = Math.round((proCount  / total) * 100);
  const goldPct  = Math.round((goldCount / total) * 100);

  const filteredUsers = MOCK_SIGNUPS.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#06060f] pt-24 pb-16 relative">
      {/* Background accents */}
      <div className="fixed top-0 left-0 w-[600px] h-[400px] bg-red-500/3 blur-[200px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-primary/4 blur-[200px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-7xl">

        {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                <Shield className="w-3 h-3 text-red-400" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-red-400">Admin Access Only</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/8">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-medium text-muted-foreground">Live</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
              AfroMuse <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300">Control Panel</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Signed in as <span className="text-white font-medium">{user?.name ?? "Admin"}</span>
              {" · "}Last updated {lastRefreshed.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLastRefreshed(new Date())}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-muted-foreground hover:text-white transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <div className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-white/8 bg-white/[0.02] text-xs text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              All Regions
            </div>
          </div>
        </div>

        {/* ── TOP STATS GRID ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Users"
            value={totalUsers.toLocaleString()}
            sub={`${PLATFORM_STATS.activeToday} active today`}
            icon={<Users className="w-4 h-4" />}
            trend={`+${PLATFORM_STATS.weeklyGrowth}% this week`}
            trendUp
          />
          <StatCard
            label="Song Generations"
            value={totalGens.toLocaleString()}
            sub={`~${PLATFORM_STATS.avgGenPerUser} avg per user`}
            icon={<Music className="w-4 h-4" />}
            trend="+23.1% this week"
            trendUp
          />
          <StatCard
            label="Saved Projects"
            value={Math.round(totalProjects).toLocaleString()}
            sub={`${realProjectCount} from this session`}
            icon={<FolderOpen className="w-4 h-4" />}
            trend="+18.6% this week"
            trendUp
          />
          <StatCard
            label="Conversion Rate"
            value={`${PLATFORM_STATS.conversionRate}%`}
            sub="Free → Paid upgrade"
            icon={<TrendingUp className="w-4 h-4" />}
            trend="+2.1% vs last month"
            trendUp
          />
        </div>

        {/* ── PLAN BREAKDOWN + QUICK STATS ────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* Plan Distribution */}
          <div className="md:col-span-2 rounded-2xl border border-white/8 bg-white/[0.02] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white">Plan Distribution</h3>
                <p className="text-xs text-muted-foreground">Current subscriber breakdown</p>
              </div>
              <div className="text-xs text-muted-foreground">{total.toLocaleString()} total</div>
            </div>

            <div className="space-y-4">
              {[
                { label: "Free",  count: freeCount,  pct: freePct,  color: "bg-white/20",    textColor: "text-muted-foreground", border: "border-white/10" },
                { label: "Pro",   count: proCount,   pct: proPct,   color: "bg-amber-500",   textColor: "text-amber-400",        border: "border-amber-500/20" },
                { label: "Gold",  count: goldCount,  pct: goldPct,  color: "bg-yellow-400",  textColor: "text-yellow-400",       border: "border-yellow-500/20" },
              ].map((tier) => (
                <div key={tier.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${tier.textColor}`}>{tier.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{tier.count.toLocaleString()} users</span>
                      <span className={`text-xs font-bold ${tier.textColor}`}>{tier.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${tier.pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                      className={`h-full rounded-full ${tier.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/5">
              {[
                { label: "Free Users",  value: freeCount,  color: "text-muted-foreground" },
                { label: "Pro Users",   value: proCount,   color: "text-amber-400" },
                { label: "Gold Users",  value: goldCount,  color: "text-yellow-400" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 flex flex-col gap-4">
            <h3 className="text-base font-bold text-white">Quick Insights</h3>
            {[
              { icon: <Zap className="w-4 h-4 text-amber-400" />, label: "Avg Gens / User", value: PLATFORM_STATS.avgGenPerUser },
              { icon: <Activity className="w-4 h-4 text-emerald-400" />, label: "Active Today", value: `${PLATFORM_STATS.activeToday}` },
              { icon: <TrendingUp className="w-4 h-4 text-blue-400" />, label: "Weekly Growth", value: `+${PLATFORM_STATS.weeklyGrowth}%` },
              { icon: <Crown className="w-4 h-4 text-yellow-400" />, label: "Paid Share", value: `${proPct + goldPct}%` },
              { icon: <MessageSquare className="w-4 h-4 text-violet-400" />, label: "Open Tickets", value: MOCK_SUPPORT.filter(s => s.status === "open").length },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── TABS ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 mb-6 p-1 rounded-xl bg-white/[0.03] border border-white/8 w-fit">
          {([["overview", "Overview"], ["users", "Users & Signups"], ["support", "Support"]] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-white/10 text-white shadow"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Signups */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-white">Recent Signups</h3>
                <button onClick={() => setActiveTab("users")} className="text-xs text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {MOCK_SIGNUPS.slice(0, 5).map((signup) => (
                  <div key={signup.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {signup.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{signup.name}</p>
                        <p className="text-[11px] text-muted-foreground">{signup.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PLAN_BADGE[signup.plan]}`}>
                        {signup.plan}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 hidden sm:block">{signup.joined}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Generations */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-white">Recent Song Generations</h3>
                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {MOCK_GENERATIONS.map((gen) => (
                  <div key={gen.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                        <Music className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{gen.title}</p>
                        <p className="text-[11px] text-muted-foreground">{gen.user}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-semibold ${GENRE_COLOR[gen.genre] ?? "text-muted-foreground"}`}>
                        {gen.genre}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60 hidden sm:block">{gen.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Requests */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Support Requests</h3>
                  <span className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold flex items-center justify-center">
                    {MOCK_SUPPORT.filter(s => s.status === "open").length}
                  </span>
                </div>
                <button onClick={() => setActiveTab("support")} className="text-xs text-primary hover:underline flex items-center gap-1">
                  Manage <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {MOCK_SUPPORT.slice(0, 4).map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">{STATUS_ICON[ticket.status]}</div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{ticket.subject}</p>
                        <p className="text-[11px] text-muted-foreground">{ticket.user}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Premium Users */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-white">Top Creators</h3>
                <Crown className="w-4 h-4 text-yellow-400/60" />
              </div>
              <div className="divide-y divide-white/5">
                {MOCK_PREMIUM_USERS.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                        u.plan === "Gold"
                          ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      }`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.gens} gens · {u.projects} projects</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PLAN_BADGE[u.plan]}`}>
                      {u.plan}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS TAB ───────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="space-y-5">
            {/* Search + filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search users by name or email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm text-muted-foreground">
                <Filter className="w-3.5 h-3.5" /> Filter
              </div>
            </div>

            {/* Users table */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 px-5 py-3 border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                <div className="col-span-4">User</div>
                <div className="col-span-2">Plan</div>
                <div className="col-span-2">Country</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-white/5">
                {filteredUsers.map((signup) => (
                  <div key={signup.id} className="grid sm:grid-cols-12 gap-2 px-5 py-4 hover:bg-white/[0.02] transition-colors items-center">
                    <div className="sm:col-span-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                        {signup.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{signup.name}</p>
                        <p className="text-[11px] text-muted-foreground">{signup.email}</p>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${PLAN_BADGE[signup.plan]}`}>
                        {signup.plan}
                      </span>
                    </div>
                    <div className="sm:col-span-2 text-sm text-muted-foreground">{signup.country}</div>
                    <div className="sm:col-span-2 text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {signup.joined}
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                      <button className="w-8 h-8 rounded-lg border border-white/8 hover:bg-white/5 flex items-center justify-center text-muted-foreground hover:text-white transition-all">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="px-5 py-12 text-center text-muted-foreground text-sm">
                    No users found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>

            {/* Premium users section */}
            <div className="rounded-2xl border border-yellow-500/15 bg-yellow-500/[0.02] overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-yellow-500/10">
                <Crown className="w-4 h-4 text-yellow-400" />
                <h3 className="text-sm font-bold text-white">Premium Creators</h3>
                <span className="text-[10px] text-muted-foreground/60 ml-auto">{MOCK_PREMIUM_USERS.length} active</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {["Creator", "Plan", "Joined", "Generations", "Projects"].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {MOCK_PREMIUM_USERS.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${
                              u.plan === "Gold"
                                ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            }`}>{u.name.charAt(0)}</div>
                            <div>
                              <p className="font-medium text-white text-sm">{u.name}</p>
                              <p className="text-[10px] text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PLAN_BADGE[u.plan]}`}>{u.plan}</span>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground text-sm">{u.joined}</td>
                        <td className="px-5 py-3.5 text-white font-semibold">{u.gens}</td>
                        <td className="px-5 py-3.5 text-white font-semibold">{u.projects}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── SUPPORT TAB ─────────────────────────────────────────────────── */}
        {activeTab === "support" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Open",     count: MOCK_SUPPORT.filter(s => s.status === "open").length,     color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                { label: "Resolved", count: MOCK_SUPPORT.filter(s => s.status === "resolved").length, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                { label: "Total",    count: MOCK_SUPPORT.length, color: "text-white", bg: "bg-white/5 border-white/10" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{s.label} Tickets</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-white">All Support Requests</h3>
              </div>
              <div className="divide-y divide-white/5">
                {MOCK_SUPPORT.map((ticket) => (
                  <div key={ticket.id} className="px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 shrink-0">{STATUS_ICON[ticket.status]}</div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">{ticket.subject}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{ticket.user} · {ticket.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                        <span className={`text-[10px] font-medium capitalize ${ticket.status === "open" ? "text-amber-400" : "text-emerald-400"}`}>
                          {ticket.status}
                        </span>
                        {ticket.status === "open" && (
                          <button className="h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-white transition-all">
                            Reply
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin note */}
            <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4 flex items-start gap-3">
              <Bell className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Support Inbox</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full email integration coming in the next release. For now, reach users directly via their registered email addresses shown above.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── FOOTER NOTE ─────────────────────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-red-400/60" />
            <span className="text-[11px] text-muted-foreground/40">
              Admin Console · AfroMuse AI · Data refreshes every 60s in production
            </span>
          </div>
          <Link href="/studio" className="text-xs text-primary/60 hover:text-primary transition-colors">
            ← Back to Studio
          </Link>
        </div>

      </div>
    </div>
  );
}
