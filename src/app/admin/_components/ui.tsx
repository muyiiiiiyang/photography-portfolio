import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export function PanelHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-ink/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink/40">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 font-display text-2xl tracking-[-0.02em]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-ink/50">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint ? (
        <span className="mt-1 block text-[10px] leading-relaxed text-ink/40">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

const BUTTON_VARIANTS = {
  solid:
    "border-ink bg-ink text-paper hover:border-red hover:bg-red",
  ghost:
    "border-ink/25 bg-transparent hover:border-ink hover:bg-ink/5",
  danger:
    "border-red/40 bg-transparent text-red hover:border-red hover:bg-red hover:text-paper",
  accent:
    "border-ink bg-yellow text-ink hover:bg-ink hover:text-paper",
} as const;

const BUTTON_SIZES = {
  sm: "px-2 py-1 text-[10px]",
  md: "px-3 py-1.5 text-[11px]",
} as const;

export function Button({
  variant = "ghost",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 border tracking-[0.08em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    />
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center border border-ink/20 px-1.5 py-0.5 text-[9px] tracking-[0.06em] text-ink/55">
      {children}
    </span>
  );
}
