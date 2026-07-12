"use client";

/** Page wrapper with title, subtitle, and optional action slot. */
import Link from "next/link";
import { IconBriefcase, IconCheck, IconClock } from "@/components/ui/Icons";
import { pipelineDeals } from "@/lib/deals-pipeline";

/** Renders the kpi strip UI. */
export function KpiStrip() {
  const total = pipelineDeals.length;
  const needsReview = pipelineDeals.filter((d) => d.readinessStatus === "blocked").length;
  const icReady = pipelineDeals.filter((d) => d.readinessStatus === "ready").length;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <KpiCard
        icon={<IconBriefcase className="h-5 w-5" />}
        iconBg="bg-[#fdf2f4] text-[#7a3344]"
        label="Total deals"
        value={String(total)}
        sub="Companies in pipeline"
      />
      <KpiCard
        icon={<IconClock className="h-5 w-5" />}
        iconBg="bg-amber-50 text-amber-700"
        label="Needs review"
        value={String(needsReview)}
        sub="Require your attention"
      />
      <KpiCard
        icon={<IconCheck className="h-5 w-5" />}
        iconBg="bg-emerald-50 text-emerald-700"
        label="IC ready"
        value={String(icReady)}
        sub="Ready for IC consideration"
      />
    </div>
  );
}

function KpiCard({
  icon,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-stone-200/60 bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-stone-900">{value}</p>
        <p className="text-xs text-stone-500">{sub}</p>
      </div>
    </div>
  );
}

/** Renders the page header UI. */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b border-stone-200/60 bg-white px-8 py-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9e4456]">{eyebrow}</p>
      <h1 className="font-display mt-2 text-[2rem] leading-tight text-stone-900">{title}</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-stone-500">{description}</p>
      {children}
    </header>
  );
}

/** Renders the open icreadiness button UI. */
export function OpenICReadinessButton() {
  return (
    <Link
      href="/ic-readiness"
      className="inline-flex items-center gap-2 rounded-xl border-2 border-[#7a3344] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#7a3344] transition hover:bg-[#fdf2f4]"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fdf2f4] text-xs">✓</span>
      Open IC readiness
    </Link>
  );
}
