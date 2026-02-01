import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { fetchOrderStatus } from "../utils/api";
import type { OrderStatusData } from "../types/api";
import Button from "../components/Button";

function SuccessView({ data }: { readonly data: OrderStatusData }) {
  return (
    <div className="flex flex-col items-center gap-8">
      {/* checkmark */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{
          background: "var(--color-success-dim)",
          border: "2px solid var(--color-success)",
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-success)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-2">
        <h2
          className="text-3xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-success)",
          }}
        >
          PAYMENT SUCCESSFUL
        </h2>
        <p
          className="text-sm text-center max-w-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          Your tickets have been issued. Show any of these codes at the door to
          enter.
        </p>
      </div>

      {/* ticket codes */}
      {data.ticketCodes && data.ticketCodes.length > 0 && (
        <div className="w-full max-w-sm flex flex-col gap-2">
          <span
            className="text-xs uppercase tracking-wider font-semibold mb-1"
            style={{ color: "var(--color-text-dim)" }}
          >
            Your Tickets
          </span>
          {data.ticketCodes.map((code) => (
            <div
              key={code}
              className="flex items-center justify-between px-4 py-3 rounded-md border"
              style={{
                background: "var(--color-surface-raised)",
                borderColor: "var(--color-border)",
              }}
            >
              <span
                className="text-base font-bold tracking-widest"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-accent)",
                }}
              >
                {code}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="text-xs font-medium opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                style={{ color: "var(--color-text)" }}
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      )}

      <Link to="/">
        <Button variant="ghost" size="md">
          Back to Home
        </Button>
      </Link>
    </div>
  );
}

function FailureView({ status }: { readonly status: string }) {
  const messages: Record<string, string> = {
    PAYMENT_FAILED:
      "Your payment was declined or failed. No money has been charged.",
    PAYMENT_TIMEOUT:
      "The payment request timed out. If you were charged, please contact support.",
    CANCELLED: "You cancelled the payment. No money has been charged.",
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* X icon */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{
          background: "var(--color-error-dim)",
          border: "2px solid var(--color-error)",
        }}
      >
        <svg
          width="38"
          height="38"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-error)"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-2">
        <h2
          className="text-3xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-error)",
          }}
        >
          {status === "CANCELLED" ? "PAYMENT CANCELLED" : "PAYMENT FAILED"}
        </h2>
        <p
          className="text-sm text-center max-w-sm"
          style={{ color: "var(--color-text-dim)" }}
        >
          {messages[status] || "Something went wrong with your payment."}
        </p>
      </div>

      <div className="flex gap-3">
        <Link to="/buy">
          <Button variant="accent" size="md">
            Try Again
          </Button>
        </Link>
        <Link to="/">
          <Button variant="ghost" size="md">
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

function PendingView() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border-4"
          style={{
            borderColor: "transparent",
            borderTopColor: "var(--color-accent)",
            animation: "spin 1s linear infinite",
          }}
        />
        <div
          className="w-3 h-3 rounded-full"
          style={{
            background: "var(--color-accent)",
            animation: "pulse 1.8s ease-in-out infinite",
          }}
        />
      </div>
      <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
        Verifying your payment…
      </p>
    </div>
  );
}

export default function Confirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const statusParam = searchParams.get("status"); // hint from the callback redirect

  const [orderData, setOrderData] = useState<OrderStatusData | null>(null);
  const [phase, setPhase] = useState<"polling" | "done">("polling");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!orderId) {
      setPhase("done");
      return;
    }

    // If status hint is already terminal, still verify server-side once
    let pollCount = 0;
    const MAX_POLLS = 24; // ~2 min at 5 s intervals

    const poll = async () => {
      try {
        const result = await fetchOrderStatus(orderId);
        pollCount++;

        if (
          result.orderStatus === "PAYMENT_SUCCESSFUL" ||
          result.orderStatus === "PAYMENT_FAILED" ||
          result.orderStatus === "PAYMENT_TIMEOUT" ||
          result.orderStatus === "CANCELLED"
        ) {
          setOrderData(result);
          setPhase("done");
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        // still pending — if we hit max polls, force fail display
        if (pollCount >= MAX_POLLS) {
          setOrderData({
            orderStatus: "PAYMENT_TIMEOUT",
            message: "Payment verification timed out.",
          });
          setPhase("done");
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        // swallow — will retry on next tick
      }
    };

    // kick off immediately, then every 5 s
    poll();
    intervalRef.current = setInterval(poll, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orderId, statusParam]);

  const renderContent = () => {
    if (!orderId) {
      return (
        /* no orderId at all — shouldn't happen normally */
        <div className="flex flex-col items-center gap-4 text-center">
          <h2
            className="text-2xl font-bold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-text)",
            }}
          >
            INVALID PAGE
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
            No order reference found. Please start from the beginning.
          </p>
          <Link to="/buy">
            <Button variant="accent">Buy Tickets</Button>
          </Link>
        </div>
      );
    }

    if (phase === "polling") {
      return <PendingView />;
    }

    if (orderData?.orderStatus === "PAYMENT_SUCCESSFUL") {
      return <SuccessView data={orderData} />;
    }

    return <FailureView status={orderData?.orderStatus ?? "PAYMENT_FAILED"} />;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-5">
      <div className="max-w-md w-full">{renderContent()}</div>
    </div>
  );
}
