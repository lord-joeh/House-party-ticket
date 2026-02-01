import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "accent" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Variant;
  readonly size?: Size;
  readonly children: ReactNode;
  readonly isLoading?: boolean;
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  accent: {
    background: "var(--color-accent)",
    color: "#0a0a0a",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-text)",
    border: "1px solid var(--color-border)",
  },
  danger: {
    background: "var(--color-error-dim)",
    color: "var(--color-error)",
    border: "1px solid var(--color-error)",
  },
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-4 py-1.5 text-xs",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
};

export default function Button({
  variant = "accent",
  size = "md",
  children,
  isLoading = false,
  disabled,
  className = "",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={[
        "relative font-semibold rounded-md transition-all duration-200 cursor-pointer",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        SIZE_CLASSES[size],
        className,
      ].join(" ")}
      style={{
        ...VARIANT_STYLES[variant],
        fontFamily: "var(--font-body)",
        opacity: isDisabled ? 0.4 : 1,
      }}
      {...rest}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span
            className="inline-block w-4 h-4 border-2 rounded-full"
            style={{
              borderColor:
                variant === "accent" ? "#0a0a0a" : "var(--color-text)",
              borderTopColor: "transparent",
              animation: "spin 0.6s linear infinite",
            }}
          />
        </span>
      )}
      <span className={isLoading ? "opacity-0" : ""}>{children}</span>
    </button>
  );
}
