import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { usePlan } from "@/context/PlanContext";
import { useAuth } from "@/context/AuthContext";

type Status = "verifying" | "success" | "failed";

export default function PaymentCallback() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<Status>("verifying");
  const [planName, setPlanName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { syncPlanFromServer } = usePlan();
  const { refetchUser } = useAuth() as { refetchUser?: () => Promise<void> };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref");

    if (!reference) {
      setStatus("failed");
      setErrorMsg("No payment reference found.");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference!)}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setPlanName(data.plan ?? "Pro");
          setStatus("success");
          syncPlanFromServer(data.plan ?? "Free");
          await refetchUser?.();
          setTimeout(() => navigate("/studio?upgrade=success"), 3000);
        } else {
          setStatus("failed");
          setErrorMsg(data.error ?? "Payment verification failed.");
        }
      } catch {
        setStatus("failed");
        setErrorMsg("A network error occurred. Please contact support.");
      }
    }

    verify();
  }, [navigate, refreshPlan]);

  return (
    <div className="min-h-screen bg-[#080810] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Confirming Payment</h1>
            <p className="text-white/50 text-sm">Verifying your payment with Paystack...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-white/60 text-sm mb-4">
              Welcome to <span className="text-amber-400 font-bold">{planName}</span>. Your plan is now active.
            </p>
            <p className="text-white/30 text-xs">Redirecting you to the Studio...</p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border red-500/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-7 h-7 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Not Confirmed</h1>
            <p className="text-white/50 text-sm mb-6">{errorMsg}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/pricing")}
                className="w-full h-11 rounded-2xl bg-amber-500 text-black font-bold text-sm hover:opacity-90 transition-all"
              >
                Back to Pricing
              </button>
              <button
                onClick={() => navigate("/studio")}
                className="w-full h-11 rounded-2xl bg-white/8 text-white/70 font-medium text-sm hover:bg-white/12 transition-all"
              >
                Go to Studio
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
