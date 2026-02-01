interface AvailabilityBadgeProps {
  readonly available: number;
  readonly total: number;
  readonly soldOut: boolean;
}

function getColorVariant(
  soldOut: boolean,
  isLow: boolean,
): {
  dim: string;
  base: string;
  text: string;
} {
  if (soldOut) {
    return {
      dim: "var(--color-error-dim)",
      base: "var(--color-error)",
      text: "var(--color-error)",
    };
  }
  if (isLow) {
    return {
      dim: "var(--color-warning-dim)",
      base: "var(--color-warning)",
      text: "var(--color-warning)",
    };
  }
  return {
    dim: "var(--color-accent-dim)",
    base: "var(--color-accent)",
    text: "var(--color-accent)",
  };
}

export default function AvailabilityBadge({
  available,
  total,
  soldOut,
}: AvailabilityBadgeProps) {
  const pct = Math.round((available / total) * 100);
  const isLow = available > 0 && available <= total * 0.15;
  const colors = getColorVariant(soldOut, isLow);

  return (
    <div
      className="inline-flex items-center gap-3 px-4 py-2 rounded-full border"
      style={{
        background: colors.dim,
        borderColor: colors.base,
      }}
    >
      {/* pulsing dot */}
      <span className="relative flex h-2.5 w-2.5">
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: colors.base,
            animation: soldOut
              ? "none"
              : "ping 1.5s cubic-bezier(0,0,0.75,1) infinite",
            opacity: 0.75,
          }}
        />
        <span
          className="relative inline-flex rounded-full h-2.5 w-2.5"
          style={{
            background: colors.base,
          }}
        />
      </span>

      <span
        className="text-xs font-semibold"
        style={{
          color: colors.text,
          fontFamily: "var(--font-body)",
        }}
      >
        {soldOut ? "SOLD OUT" : `${available} of ${total} remaining (${pct}%)`}
      </span>
    </div>
  );
}
