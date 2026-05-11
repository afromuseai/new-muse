import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button, Input, Card } from "@/components/ui-elements";
import { useAuth } from "@/context/AuthContext";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { login, signup, isLoggedIn } = useAuth();
  const [, navigate] = useLocation();

  const getRedirect = () => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    return from ? decodeURIComponent(from) : "/studio";
  };

  if (isLoggedIn) {
    navigate(getRedirect());
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    const success = login(email, password);
    if (success) {
      navigate(getRedirect());
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    const success = signup(name, email, password);
    if (success) {
      navigate(getRedirect());
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[500px] bg-secondary/10 blur-[150px] pointer-events-none rounded-full" />

      <Link href="/" className="relative z-10 mb-8 block hover:scale-105 transition-transform">
        <img src="/logo.png" alt="AfroMuse AI" className="h-16 w-auto drop-shadow-2xl" />
      </Link>

      <Card className="w-full max-w-md p-6 md:p-8 glass-card border-white/10 relative z-10 shadow-2xl">

        <div className="flex bg-black/40 rounded-lg p-1 mb-8">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? "bg-white/10 text-white shadow" : "text-muted-foreground hover:text-white"}`}
            onClick={() => { setIsLogin(true); setError(""); }}
          >
            Log In
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? "bg-white/10 text-white shadow" : "text-muted-foreground hover:text-white"}`}
            onClick={() => { setIsLogin(false); setError(""); }}
          >
            Sign Up
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back, Creator</h2>
                <p className="text-muted-foreground text-sm">Log in to pick up where you left off.</p>
              </div>

              <form className="space-y-4" onSubmit={handleLogin}>
                <Input
                  type="email"
                  placeholder="Email address"
                  className="h-12 bg-black/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  className="h-12 bg-black/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <div className="flex justify-end">
                  <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
                </div>

                <Button type="submit" className="w-full h-12 mt-2">Log In</Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Join AfroMuse AI</h2>
                <p className="text-muted-foreground text-sm">Start writing your first song for free — no credit card needed.</p>
              </div>

              <form className="space-y-4" onSubmit={handleSignup}>
                <Input
                  type="text"
                  placeholder="Full Name"
                  className="h-12 bg-black/30"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  className="h-12 bg-black/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Create a password"
                  className="h-12 bg-black/30"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full h-12 mt-4">Create Free Account</Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#111116] px-2 text-muted-foreground">{isLogin ? "Or sign in with" : "Or sign up with"}</span>
            </div>
          </div>

          <Button variant="outline" className="w-full h-12 mt-6 bg-white/5 border-white/10 hover:bg-white/10">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </Button>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          By creating an account, you agree to our <a href="#" className="underline hover:text-white">Terms of Service</a> and <a href="#" className="underline hover:text-white">Privacy Policy</a>.
        </p>
      </Card>
    </div>
  );
}
