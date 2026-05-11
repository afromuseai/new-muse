import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui-elements";
import { Menu, X, Sparkles, Crown, Zap, LogOut, User, Shield } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePlan, PLAN_COLORS } from "@/context/PlanContext";
import { useAuth } from "@/context/AuthContext";

function PlanBadge() {
  const { plan } = usePlan();
  const colors = PLAN_COLORS[plan];

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 h-8 px-3 rounded-full border text-[11px] font-bold tracking-wider uppercase",
        colors.pill, colors.glow
      )}
    >
      {plan === "Artist Pro" && <Crown className="w-3 h-3" />}
      {plan === "Creator Pro" && <Zap className="w-3 h-3" />}
      {plan}
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-8 px-3 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
      >
        <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <User className="w-3 h-3 text-primary" />
        </div>
        <span className="text-xs font-semibold text-white/90 max-w-[100px] truncate">{user?.name}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-52 rounded-2xl border border-white/10 bg-[#0d0d1a] shadow-2xl p-2 z-50"
          >
            <div className="px-3 py-2.5 border-b border-white/5 mb-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground/60 truncate">{user?.email}</p>
            </div>
            <Link
              href="/projects"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
            >
              My Projects
            </Link>
            <Link
              href="/studio"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-all"
            >
              Open Studio
            </Link>
            <div className="border-t border-white/5 my-1" />
            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/8 transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Panel
              </Link>
            )}
            <div className="border-t border-white/5 mt-1 pt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/8 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { plan } = usePlan();
  const { isLoggedIn, user, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const publicLinks = [
    { name: "Features", href: "/#features" },
    { name: "Pricing", href: "/pricing" },
  ];

  const authLinks = [
    { name: "Studio", href: "/studio" },
    { name: "Projects", href: "/projects" },
    ...(user?.role === "admin" ? [{ name: "Admin", href: "/admin" }] : []),
  ];

  const navLinks = isLoggedIn ? [...publicLinks, ...authLinks] : publicLinks;

  const handleMobileLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/70 backdrop-blur-2xl border-b border-white/10 py-3 shadow-sm" : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 z-50 relative group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img src="/logo.png" alt="AfroMuse AI" className="h-10 w-auto relative z-10 drop-shadow-lg" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight hidden sm:block text-white">
              AfroMuse <span className="text-gradient-primary">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location === link.href || (link.href.startsWith("/#") && location === "/");
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-white relative group",
                    isActive ? "text-white" : "text-muted-foreground"
                  )}
                >
                  {link.name}
                  {isActive ? (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary"
                    />
                  ) : (
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary/50 transition-colors" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn && <PlanBadge />}
            {isLoggedIn ? (
              <UserMenu />
            ) : (
              <>
                <Link href="/auth" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
                  Log in
                </Link>
                <Link href="/auth?tab=signup">
                  <Button className="rounded-full shadow-[0_0_0_rgba(245,158,11,0)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-shadow">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden relative z-50 text-foreground p-2 -mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-3xl pt-24 px-6 md:hidden flex flex-col h-[100dvh] overflow-y-auto pb-6"
          >
            {/* Mobile plan indicator — read only, logged-in users only */}
            {isLoggedIn && (
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                <span className="text-xs text-muted-foreground">Current plan</span>
                <div className={cn(
                  "text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full border",
                  PLAN_COLORS[plan].pill
                )}>
                  {plan}
                </div>
              </div>
            )}

            {isLoggedIn && (
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground/60">{user?.email}</p>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-6 text-xl font-display font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-b border-white/5 py-4 text-foreground/80 hover:text-primary transition-colors flex items-center justify-between min-h-[56px]"
                >
                  {link.name}
                  {(location === link.href || (link.href.startsWith("/#") && location === "/")) && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </Link>
              ))}

              {!isLoggedIn && (
                <Link
                  href="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-b border-white/5 py-4 text-foreground/80 hover:text-primary transition-colors min-h-[56px] flex items-center"
                >
                  Log in
                </Link>
              )}
            </nav>

            <div className="mt-8 flex flex-col gap-3">
              {isLoggedIn ? (
                <>
                  <Link href="/studio" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full h-14 text-lg rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">Open Studio</Button>
                  </Link>
                  <button
                    onClick={handleMobileLogout}
                    className="w-full h-12 rounded-xl border border-red-500/20 text-red-400/80 hover:text-red-400 hover:border-red-500/40 transition-all text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </>
              ) : (
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full h-14 text-lg rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">Sign Up Free</Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
