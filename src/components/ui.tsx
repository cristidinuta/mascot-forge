import { ReactNode } from "react";

export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  type?: "button" | "submit";
}) {
  const base =
    "font-display text-sm tracking-[0.02em] rounded-full px-5 py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-signal text-paper hover:bg-[#ff6e5f]"
      : "border border-line text-ink70 bg-paper hover:bg-panel2 hover:text-ink";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-panel ${className}`}>{children}</div>
  );
}

export function Annot({ children }: { children: ReactNode }) {
  return <div className="font-display uppercase text-[11px] tracking-[0.28em] text-ink45">{children}</div>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-ink45 font-body text-[12px] uppercase tracking-[0.18em]">
      <span className="inline-block w-3 h-3 border border-signal border-t-transparent rounded-full animate-spin" />
      {label}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="border border-signal/40 bg-signal/5 px-4 py-3 font-body text-[12px] text-signal rounded-3xl">
      {message}
    </div>
  );
}
