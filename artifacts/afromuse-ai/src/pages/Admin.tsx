import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Users, Music, FolderOpen, TrendingUp, Shield, Crown,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  Sparkles, Activity, MessageSquare, Zap, Globe,
  RefreshCw, Search, CheckCircle, AlertCircle, Clock, ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RealUser {
  id: number;
  name: string;
  email: string;
  role: string;
  plan: string;
  createdAt: string;
}

interface AdminStats {
  users: RealUser[];
  planCounts: { Free: number; Pro: number; Gold: number; Admin: number };
  totalUsers: number;
  totalProjects: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PLAN_BADGE: Record<string, string> = {
  Free:  "bg-white/5 border-white/10 text-muted-foreground",
  Pro:   "bg-amber-500/15 border-amber-500/30 text-amber-400",
  Gold:  "bg-yellow-500/15 border-yellow-500/30 text-yellow-400",
  Admin: "bg-red-500/15 border-red-500/30 text-red-400",
};

const PLAN_LABEL: Record<string, string> = {
  Free: "Free", Pro: "Pro", Gold: "Gold", admin: "Admin",
};

function effectivePlanLabel(user: RealUser): string {
  return user.role === "admin" ? "Admin" : PLAN_LABEL[user.plan] ?? user.plan;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, trend, trendUp,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; trend?: string; trendUp?: boolean;
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

function UserRow({ user }: { user: RealUser }) {
  const planLabel = effectivePlanLabel(user);
  return (
    <div className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-[11px] text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PLAN_BADGE[planLabel] ?? PLAN_BADGE.Free}`}>
          {planLabel}
        </span>
        <span className="text-[10px] text-muted-foreground/60 hidden sm:block">{timeAgo(user.createdAt)}</span>
      </div>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "users">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Failed to load admin stats");
      }
      const data = await res.json() as AdminStats;
      setStats(data);
      setLastRefreshed(new Date());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleRefresh = () => { fetchStats(); };

  const allUsers = stats?.users ?? [];
  const planCounts = stats?.planCounts ?? { Free: 0, Pro: 0, Gold: 0, Admin: 0 };
  const totalUsers = stats?.totalUsers ?? 0;

  const paidUsers = allUsers.filter((u) => u.role !== "admin" && (u.plan === "Pro" || u.plan === "Gold"));
  const paidTotal = planCounts.Pro + planCounts.Gold;
  const total = totalUsers;
  const freePct  = total > 0 ? Math.round((planCounts.Free  / total) * 100) : 0;
  const proPct   = total > 0 ? Math.round((planCounts.Pro   / total) * 100) : 0;
  const goldPct  = total > 0 ? Math.round((planCounts.Gold  / total) * 100) : 0;
  const adminPct = total > 0 ? Math.round((planCounts.Admin / total) * 100) : 0;

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#06060f] pt-24 pb-16 relative">
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
                <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                <span className="text-[10px] font-medium text-muted-foreground">{isLoading ? "Loading…" : "Live"}</span>
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
            <Link
              href="/studio"
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-muted-foreground hover:text-white transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Studio
            </Link>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 h-9 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-muted-foreground hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <div className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-white/8 bg-white/[0.02] text-xs text-muted-foreground">
              <Globe className="w-3.5 h-3.5" />
              All Regions
            </div>
          </div>
        </div>

        {/* ── ERROR STATE ─────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* ── TOP STATS GRID ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Users"
            value={isLoading ? "—" : totalUsers.toLocaleString()}
            sub={`${paidTotal} paid accounts`}
            icon={<Users className="w-4 h-4" />}
          />
          <StatCard
            label="Paid Users"
            value={isLoading ? "—" : paidTotal.toLocaleString()}
            sub={`${planCounts.Pro} Pro · ${planCounts.Gold} Gold`}
            icon={<Crown className="w-4 h-4" />}
            trend={total > 0 ? `${proPct + goldPct}% conversion` : undefined}
            trendUp
          />
          <StatCard
            label="Saved Projects"
            value={isLoading ? "—" : (stats?.totalProjects ?? 0).toLocaleString()}
            sub="Across all users"
            icon={<FolderOpen className="w-4 h-4" />}
          />
          <StatCard
            label="Admin Accounts"
            value={isLoading ? "—" : planCounts.Admin.toLocaleString()}
            sub="Full access users"
            icon={<Shield className="w-4 h-4" />}
          />
        </div>

        {/* ── PLAN BREAKDOWN ──────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 rounded-2xl border border-white/8 bg-white/[0.02] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white">Plan Distribution</h3>
                <p className="text-xs text-muted-foreground">Live from database</p>
              </div>
              <div className="text-xs text-muted-foreground">{total.toLocaleString()} total</div>
            </div>
            <div className="space-y-4">
              {[
                { label: "Free",  count: planCounts.Free,  pct: freePct,  color: "bg-white/20",   textColor: "text-muted-foreground" },
                { label: "Pro",   count: planCounts.Pro,   pct: proPct,   color: "bg-amber-500",  textColor: "text-amber-400" },
                { label: "Gold",  count: planCounts.Gold,  pct: goldPct,  color: "bg-yellow-400", textColor: "text-yellow-400" },
                { label: "Admin", count: planCounts.Admin, pct: adminPct, color: "bg-red-500",    textColor: "text-red-400" },
              ].map((tier) => (
                <div key={tier.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-semibold ${tier.textColor}`}>{tier.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{tier.count} user{tier.count !== 1 ? "s" : ""}</span>
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
            <div className="grid grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/5">
              {[
                { label: "Free",  value: planCounts.Free,  color: "text-muted-foreground" },
                { label: "Pro",   value: planCounts.Pro,   color: "text-amber-400" },
                { label: "Gold",  value: planCounts.Gold,  color: "text-yellow-400" },
                { label: "Admin", value: planCounts.Admin, color: "text-red-400" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{isLoading ? "—" : s.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 flex flex-col gap-4">
            <h3 className="text-base font-bold text-white">Quick Insights</h3>
            {[
              { icon: <Users className="w-4 h-4 text-blue-400" />,        label: "Total Accounts",    value: isLoading ? "—" : totalUsers },
              { icon: <Crown className="w-4 h-4 text-yellow-400" />,      label: "Paid Share",         value: isLoading ? "—" : `${proPct + goldPct}%` },
              { icon: <Sparkles className="w-4 h-4 text-amber-400" />,    label: "Pro Users",          value: isLoading ? "—" : planCounts.Pro },
              { icon: <Activity className="w-4 h-4 text-emerald-400" />,  label: "Gold Users",         value: isLoading ? "—" : planCounts.Gold },
              { icon: <Shield className="w-4 h-4 text-red-400" />,        label: "Admin Accounts",     value: isLoading ? "—" : planCounts.Admin },
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
          {([["overview", "Overview"], ["users", "All Users"]] as const).map(([tab, label]) => (
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 rounded bg-white/5 animate-pulse w-32" />
                        <div className="h-2.5 rounded bg-white/5 animate-pulse w-48" />
                      </div>
                    </div>
                  ))
                ) : allUsers.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">No users yet</div>
                ) : (
                  allUsers.slice(0, 5).map((u) => <UserRow key={u.id} user={u} />)
                )}
              </div>
            </div>

            {/* Paid Users */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-white">Paid Subscribers</h3>
                <Crown className="w-4 h-4 text-yellow-400/60" />
              </div>
              <div className="divide-y divide-white/5">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 rounded bg-white/5 animate-pulse w-32" />
                        <div className="h-2.5 rounded bg-white/5 animate-pulse w-48" />
                      </div>
                    </div>
                  ))
                ) : paidUsers.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-muted-foreground">No paid subscribers yet</div>
                ) : (
                  paidUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                          u.plan === "Gold"
                            ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        }`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{u.name}</p>
                          <p className="text-[11px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PLAN_BADGE[u.plan] ?? PLAN_BADGE.Free}`}>
                          {u.plan}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 hidden sm:block">{formatDate(u.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ALL USERS TAB ────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 gap-3 flex-wrap">
              <h3 className="text-sm font-bold text-white">
                All Accounts <span className="text-muted-foreground font-normal">({filteredUsers.length})</span>
              </h3>
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-muted-foreground/50 outline-none focus:border-primary/40"
                  />
                </div>
              </div>
            </div>
            <div className="divide-y divide-white/5">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 rounded bg-white/5 animate-pulse w-40" />
                      <div className="h-2.5 rounded bg-white/5 animate-pulse w-56" />
                    </div>
                    <div className="h-5 w-12 rounded-full bg-white/5 animate-pulse" />
                  </div>
                ))
              ) : filteredUsers.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {searchQuery ? "No users match your search" : "No users found"}
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-muted-foreground hidden md:block">Joined {formatDate(u.createdAt)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PLAN_BADGE[effectivePlanLabel(u)] ?? PLAN_BADGE.Free}`}>
                        {effectivePlanLabel(u)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
