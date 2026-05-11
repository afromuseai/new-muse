import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { Button, Card } from "@/components/ui-elements";
import { useAuth } from "@/context/AuthContext";
import type { AuthUser } from "@/context/AuthContext";

type Status = "loading" | "success" | "expired" | "invalid" | "already_verified";

export default function VerifyEmail() {
  const [status, setStatus] = useState<Status>("loading");
  const [, navigate] = useLocation();
  const { isLoggedIn } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const [expiredEmail, setExpiredEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      credentials: "include",
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          if (data.expired) {
            setExpiredEmail(data.email ?? "");
            setStatus("expired");
          } else {
            setStatus("invalid");
          }
          return;
        }
        if (data.token) {
          try { localStorage.setItem("afromuse_auth_token", data.token); } catch {}
        }
        if (data.alreadyVerified) {
          setStatus("already_verified");
        } else {
          setStatus("success");
        }
        setTimeout(() => navigate("/studio"), 2500);
      })
      .catch(() => setStatus("invalid"));
  }, [token, navigate]);

  const handleResend = async () => {
    if (!expiredEmail) return;
    setResending(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: expiredEmail }),
      });
      setResendDone(true);
    } catch {}
    setResending(false);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[500px] bg-secondary/10 blur-[150px] pointer-events-none rounded-full" />

      <Link href="/" className="relative z-10 mb-8 block hover:scale-105 transition-transform">
        <img src="/logo.png" alt="AfroMuse AI" className="h-16 w-auto drop-shadow-2xl" />
      </Link>

      <Card className="w-full max-w-md p-6 md:p-8 glass-card border-white/10 relative z-10 shadow-2xl text-center">
        <AnimatedStatus status={status} />

        {status === "loading" && (
          <>
            <h2 className="text-xl font-bold text-white mt-4 mb-2">Verifying your email…</h2>
            <p className="text-muted-foreground text-sm">Just a moment.</p>
          </>
        )}

        {(status === "success" || status === "already_verified") && (
          <>
            <h2 className="text-xl font-bold text-white mt-4 mb-2">
              {status === "already_verified" ? "Already verified!" : "Email verified!"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {status === "already_verified"
                ? "Your email was already confirmed. Redirecting you to the studio…"
                : "Your account is confirmed. Redirecting you to the studio…"}
            </p>
            <Button onClick={() => navigate("/studio")} className="w-full h-12">
              Go to Studio
            </Button>
          </>
        )}

        {status === "expired" && (
          <>
            <h2 className="text-xl font-bold text-white mt-4 mb-2">Link expired</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This verification link has expired. Request a new one below.
            </p>
            {resendDone ? (
              <div className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 bg-green-500/10 border border-green-500/20 mb-4">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-xs text-green-400">New verification email sent!</p>
              </div>
            ) : (
              <Button onClick={handleResend} disabled={resending} className="w-full h-12 mb-3">
                {resending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>
                ) : (
                  <><Mail className="w-4 h-4 mr-2" />Resend verification email</>
                )}
              </Button>
            )}
            <button
              onClick={() => navigate("/auth")}
              className="w-full text-sm text-muted-foreground hover:text-white transition-colors py-2"
            >
              Back to login
            </button>
          </>
        )}

        {status === "invalid" && (
          <>
            <h2 className="text-xl font-bold text-white mt-4 mb-2">Invalid link</h2>
            <p className="text-muted-foreground text-sm mb-6">
              This verification link is invalid or has already been used.
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full h-12">
              Back to login
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}

function AnimatedStatus({ status }: { status: Status }) {
  return (
    <motion.div
      key={status}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className="inline-flex items-center justify-center w-20 h-20 rounded-full mx-auto"
      style={{
        background:
          status === "loading"
            ? "rgba(255,255,255,0.05)"
            : status === "success" || status === "already_verified"
            ? "rgba(34,197,94,0.12)"
            : "rgba(239,68,68,0.12)",
        border:
          status === "loading"
            ? "1px solid rgba(255,255,255,0.1)"
            : status === "success" || status === "already_verified"
            ? "1px solid rgba(34,197,94,0.3)"
            : "1px solid rgba(239,68,68,0.3)",
      }}
    >
      {status === "loading" && <Loader2 className="w-9 h-9 text-white/40 animate-spin" />}
      {(status === "success" || status === "already_verified") && <CheckCircle className="w-9 h-9 text-green-400" />}
      {(status === "expired" || status === "invalid") && <XCircle className="w-9 h-9 text-red-400" />}
    </motion.div>
  );
}
