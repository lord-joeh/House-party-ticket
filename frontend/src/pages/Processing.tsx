import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface LocationState {
  authorizationUrl?: string;
  orderId?: string;
}

export default function Processing() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state || {}) as LocationState;

  const [phase, setPhase] = useState<"redirecting" | "stalled">("redirecting");

  useEffect(() => {
    // guard: if we landed here without state, bounce back
    if (!state.authorizationUrl || !state.orderId) {
      navigate("/buy", { replace: true });
      return;
    }

    // short delay so the user sees the interstitial, then redirect
    const redirectTimer = setTimeout(() => {
      globalThis.location.href = state.authorizationUrl!;
    }, 1200);

    // if after 6 s nothing happened (tab stayed open), show retry
    const stallTimer = setTimeout(() => {
      setPhase("stalled");
    }, 6000);

    return () => {
      clearTimeout(redirectTimer);
      clearTimeout(stallTimer);
    };
  }, [state.authorizationUrl, state.orderId, navigate]);

  const retryRedirect = () => {
    if (state.authorizationUrl) {
      setPhase("redirecting");
      globalThis.location.href = state.authorizationUrl;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-8">
        {/* animated ring */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* outer rotating ring */}
          <div
            className="absolute inset-0 rounded-full border-4"
            style={{
              borderColor: "transparent",
              borderTopColor: "var(--color-accent)",
              animation: "spin 1s linear infinite",
            }}
          />
          {/* inner pulsing dot */}
          <div
            className="w-4 h-4 rounded-full"
            style={{
              background: "var(--color-accent)",
              animation: "pulse 1.8s ease-in-out infinite",
            }}
          />
        </div>

        {/* copy */}
        <div className="flex flex-col gap-2">
          <h2
            className="text-2xl font-bold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-accent)",
            }}
          >
            {phase === "redirecting" ? "PREPARING PAYMENT" : "REDIRECT PAUSED"}
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            {phase === "redirecting"
              ? "Redirecting you to Paystack's secure checkout…"
              : "It looks like the redirect didn't go through. Tap the button below to try again."}
          </p>
        </div>

        {/* retry button (only shown when stalled) */}
        {phase === "stalled" && (
          <button
            onClick={retryRedirect}
            className="px-6 py-2.5 rounded-md text-sm font-semibold cursor-pointer transition-opacity duration-200 hover:opacity-80"
            style={{ background: "var(--color-accent)", color: "#0a0a0a" }}
          >
            Retry Redirect →
          </button>
        )}

        {/* order ref */}
        {state.orderId && (
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Order ref: {state.orderId}
          </span>
        )}
      </div>
    </div>
  );
}
