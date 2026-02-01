import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly error?: string;
  readonly helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  id,
  className = "",
  ...rest
}: InputProps) {
  const inputId = id || label.toLowerCase().replaceAll(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-xs font-semibold uppercase tracking-wider"
        style={{
          color: "var(--color-text-dim)",
          fontFamily: "var(--font-body)",
        }}
      >
        {label}
      </label>

      <input
        id={inputId}
        className={[
          "w-full px-4 py-3 rounded-md text-sm transition-colors duration-200",
          "placeholder-text-muted",
          error
            ? "border border-error focus:border-error"
            : "border border-border focus:border-accent",
          className,
        ].join(" ")}
        style={{
          background: "var(--color-surface-raised)",
          color: "var(--color-text)",
          fontFamily: "var(--font-body)",
          outline: "none",
        }}
        {...rest}
      />

      {/* helper / error row */}
      {(helperText || error) && (
        <span
          className="text-xs"
          style={{
            color: error ? "var(--color-error)" : "var(--color-text-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
}
