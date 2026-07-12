"use client";

/**
 * Shared UI pieces reused across company profile tabs (cards, pills, sparklines).
 */
import Link from "next/link";

/** Formats a date string into a short readable form. */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Placeholder shown when metadata is not available. */
export function MissingMeta({
  label,
  tooltip = "Not set in company profile",
}: {
  label?: string;
  tooltip?: string;
}) {
  return (
    <span className="cursor-help text-stone-400" title={tooltip}>
      {label ?? "—"}
    </span>
  );
}

/** Empty state for a company profile tab with no data. */
export function CompanyProfileEmptyState({
  title,
  copy,
  action,
  compact = false,
}: {
  title: string;
  copy?: string;
  action?: { href: string; label: string } | { onClick: () => void; label: string };
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] border border-dashed border-stone-200 bg-[#faf9f7]/60 text-center ${
        compact ? "px-3 py-4" : "px-5 py-8"
      }`}
    >
      <p className={`font-medium text-stone-800 ${compact ? "text-sm" : "font-display text-lg"}`}>
        {title}
      </p>
      {copy ? (
        <p className={`mx-auto text-stone-500 ${compact ? "mt-1 max-w-sm text-[12px] leading-snug" : "mt-2 max-w-md text-sm"}`}>
          {copy}
        </p>
      ) : null}
      {action ? (
        "href" in action ? (
          <Link
            href={action.href}
            className={`inline-flex font-semibold text-[#7a3344] hover:underline ${compact ? "mt-2 text-[12px]" : "mt-4 text-sm"}`}
          >
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className={`inline-flex font-semibold text-[#7a3344] hover:underline ${compact ? "mt-2 text-[12px]" : "mt-4 text-sm"}`}
          >
            {action.label}
          </button>
        )
      ) : null}
    </div>
  );
}

/** Card wrapper with title used on company profile tabs. */
export function SectionCard({
  title,
  helper,
  badge,
  action,
  children,
  className = "",
  bodyClassName = "",
  titleAddon,
}: {
  title: string;
  helper?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  titleAddon?: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[17px] leading-tight text-stone-900">{title}</h2>
            {badge}
            {titleAddon}
          </div>
          {helper ? <p className="mt-0.5 text-[11px] leading-snug text-stone-500">{helper}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={`mt-3 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/** Tab button styled as a link on the company profile. */
export function TabLinkButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[12px] font-semibold text-[#7a3344] hover:underline ${className}`}
    >
      {children}
    </button>
  );
}

/** Tiny inline chart showing a trend over recent values. */
export function Sparkline({
  values,
  tone = "up",
  width = 72,
  height = 28,
}: {
  values: number[];
  tone?: "up" | "down" | "flat" | null;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) {
    return <div style={{ height }} className="w-full" aria-hidden />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / span) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const color =
    tone === "down" ? "text-red-500/80" : tone === "flat" ? "text-stone-400" : "text-emerald-600/80";
  return (
    <svg width={width} height={height} className={`w-full ${color}`} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" points={points} />
    </svg>
  );
}

/** Small colored pill for status labels on profile pages. */
export function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "amber" | "red" | "stone" | "blue";
}) {
  const styles = {
    green: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
    amber: "bg-amber-50 text-amber-900 ring-amber-200/80",
    red: "bg-red-50 text-red-800 ring-red-200/80",
    stone: "bg-stone-100 text-stone-700 ring-stone-200/80",
    blue: "bg-sky-50 text-sky-800 ring-sky-200/80",
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles}`}
    >
      {label}
    </span>
  );
}

/** Circular gauge showing metric coverage percentage. */
export function CoverageGauge({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const r = 36;
  const stroke = 7;
  const c = 2 * Math.PI * r;
  // semicircle
  const half = c / 2;
  const offset = half - (pct / 100) * half;
  const strokeColor =
    pct >= 80 ? "#059669" : pct >= 65 ? "#d97706" : "#dc2626";

  return (
    <div className="relative flex w-[88px] shrink-0 flex-col items-center">
      <svg width="96" height="56" viewBox="0 0 96 56" aria-hidden>
        <path
          d="M 12 48 A 36 36 0 0 1 84 48"
          fill="none"
          stroke="#e7e5e4"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d="M 12 48 A 36 36 0 0 1 84 48"
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${half}`}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute bottom-0 text-center">
        <p className="text-lg font-semibold tabular-nums leading-none text-stone-900">{pct}%</p>
        <p className="mt-0.5 text-[10px] leading-tight text-stone-500">Avg coverage</p>
      </div>
    </div>
  );
}
