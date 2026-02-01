import { useState, useRef, type ChangeEvent } from "react";
import { verifyTicket } from "../utils/api";
import type { VerifyData } from "../types/api";
import Button from "../components/Button";

function ValidResult({ data }: { readonly data: VerifyData }) {
  return (
    <div
      className="rounded-xl border p-8 flex flex-col items-center gap-5 text-center"
      style={{
        background: "var(--color-success-dim)",
        borderColor: "var(--color-success)",
      }}
    >
      {/* big checkmark */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: "var(--color-success)",
          boxShadow: "0 0 32px rgba(74,222,128,0.35)",
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0a0a0a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h3
        className="text-2xl font-bold"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--color-success)",
        }}
      >
        ENTRY GRANTED
      </h3>

      {/* details */}
      <div className="w-full flex flex-col gap-2">
        {[
          { label: "Name", value: data.buyerName },
          { label: "Phone", value: data.buyerPhone },
          { label: "Order", value: data.orderId },
        ].map(
          (row) =>
            row.value && (
              <div key={row.label} className="flex justify-between text-sm">
                <span style={{ color: "rgba(74,222,128,0.6)" }}>
                  {row.label}
                </span>
                <span
                  className="font-medium"
                  style={{ color: "var(--color-success)" }}
                >
                  {row.value}
                </span>
              </div>
            ),
        )}
      </div>
    </div>
  );
}

function InvalidResult({ data }: { readonly data: VerifyData }) {
  const isUsed = data.status === "USED";

  return (
    <div
      className="rounded-xl border p-8 flex flex-col items-center gap-5 text-center"
      style={{
        background: isUsed
          ? "var(--color-warning-dim)"
          : "var(--color-error-dim)",
        borderColor: isUsed ? "var(--color-warning)" : "var(--color-error)",
      }}
    >
      {/* icon */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: isUsed ? "var(--color-warning)" : "var(--color-error)",
          boxShadow: isUsed
            ? "0 0 32px rgba(251,191,36,0.35)"
            : "0 0 32px rgba(248,113,113,0.35)",
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0a0a0a"
          strokeWidth="3"
          strokeLinecap="round"
        >
          {isUsed ? (
            /* clock / already-used icon */
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 6v6l4 2" />
            </>
          ) : (
            /* X */
            <path d="M18 6L6 18M6 6l12 12" />
          )}
        </svg>
      </div>

      <h3
        className="text-2xl font-bold"
        style={{
          fontFamily: "var(--font-display)",
          color: isUsed ? "var(--color-warning)" : "var(--color-error)",
        }}
      >
        {isUsed ? "ALREADY USED" : "INVALID TICKET"}
      </h3>

      <p
        className="text-sm max-w-xs"
        style={{
          color: isUsed ? "var(--color-warning)" : "var(--color-error)",
        }}
      >
        {data.message}
      </p>

      {data.buyerName && (
        <span
          className="text-xs"
          style={{
            color: isUsed ? "var(--color-warning)" : "var(--color-error)",
            opacity: 0.7,
          }}
        >
          Buyer: {data.buyerName}
        </span>
      )}
    </div>
  );
}

export default function Verify() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VerifyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const TICKET_CODE_REGEX = /^HP-\d{4}-\d{5}$/i;

  const handleSubmit = async (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const trimmed = code.trim().toUpperCase();
    if (!TICKET_CODE_REGEX.test(trimmed)) {
      setError("Invalid format. Ticket codes look like HP-2025-00001");
      return;
    }

    setLoading(true);
    try {
      const data = await verifyTicket(trimmed);
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      // re-focus input for fast sequential scanning
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  };

  const reset = () => {
    setCode("");
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      {/* header */}
      <div className="flex flex-col gap-2 mb-10">
        <h1
          className="text-4xl font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-accent)",
          }}
        >
          VERIFY TICKET
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-dim)" }}>
          Enter a ticket code to check validity at the door.
        </p>
      </div>

      {/* input form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="button"
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-dim)" }}
          >
            Ticket Code
          </label>
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="HP-2025-00001"
            autoComplete="off"
            autoFocus
            className="w-full px-4 py-3.5 rounded-md text-base font-bold tracking-widest text-center transition-colors duration-200"
            style={{
              background: "var(--color-surface-raised)",
              color: "var(--color-accent)",
              border: `1px solid ${error ? "var(--color-error)" : "var(--color-border)"}`,
              fontFamily: "var(--font-display)",
              outline: "none",
            }}
            onFocus={(e) =>
              (e.target.style.borderColor = "var(--color-accent)")
            }
            onBlur={(e) =>
              (e.target.style.borderColor = error
                ? "var(--color-error)"
                : "var(--color-border)")
            }
          />
          {error && (
            <span className="text-xs" style={{ color: "var(--color-error)" }}>
              {error}
            </span>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          variant="accent"
          isLoading={loading}
          disabled={!code.trim()}
        >
          Verify Ticket
        </Button>
      </form>

      {result && (
        <div className="flex flex-col gap-4">
          {result.valid ? (
            <ValidResult data={result} />
          ) : (
            <InvalidResult data={result} />
          )}

          <button
            onClick={reset}
            className="text-sm font-medium text-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: "var(--color-text)" }}
          >
            ← Check another ticket
          </button>
        </div>
      )}
    </div>
  );
}
