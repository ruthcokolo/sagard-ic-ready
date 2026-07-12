"use client";

import Link from "next/link";
import {
  IconAlertTriangle,
  IconHourglass,
  IconLayers,
  IconRefreshCheck,
  IconUser,
} from "@/components/ui/Icons";
import { DEMO_DEAL_ID, getAiFindings } from "@/lib/insights";
import { getDealById } from "@/lib/deals-pipeline";
import { useDecisions } from "@/components/decisions/DecisionProvider";

export function TodaysAiFindings() {
  const ai = getAiFindings();
  const { getWorkloadCounts, isInActiveQueue, nextQueueDealId, hydrated } = useDecisions();
  const workload = getWorkloadCounts();
  const showNorthwind = !hydrated || isInActiveQueue(DEMO_DEAL_ID);
  const nextDeal = nextQueueDealId ? getDealById(nextQueueDealId) : null;
  const ctaHref = showNorthwind
    ? `/dashboard/companies/${DEMO_DEAL_ID}?from=dashboard`
    : nextDeal
      ? `/dashboard/companies/${nextDeal.id}?from=dashboard`
      : "/ic-readiness";
  const ctaLabel = showNorthwind
    ? "Review Northwind Logistics →"
    : nextDeal
      ? `Review ${nextDeal.name} →`
      : "Open review queue →";

  return (
    <section className="mx-8 mb-6 overflow-hidden rounded-2xl border border-[#7a3344]/15 bg-gradient-to-br from-[#fdf2f4] via-[#fefafa] to-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7a3344] text-white shadow-[0_4px_14px_-4px_rgba(107,45,60,0.45)]">
            <IconRefreshCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9e4456]">
              Overnight review #{ai.batchId}
            </p>
            <h2 className="mt-1 text-xl font-semibold leading-snug text-stone-900 sm:text-[1.35rem]">
              {ai.blockedByGaps.toLocaleString()} deals need work before committee
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-stone-500">
              The AI compared spreadsheets, memos, and uploads while you were away.
            </p>
          </div>
        </div>
        <Link
          href={ctaHref}
          className="shrink-0 rounded-xl bg-[#7a3344] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_2px_8px_-2px_rgba(107,45,60,0.4)] hover:bg-[#5a2533]"
        >
          {ctaLabel}
        </Link>
      </div>

      <div className="grid gap-3 border-t border-[#7a3344]/10 bg-white/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          value={ai.blockedByGaps}
          label="Deals not ready"
          sub="Portfolio-wide"
          href="/ic-readiness?step=conflicts"
          icon={<IconLayers className="h-5 w-5" />}
          iconBg="bg-stone-100 text-stone-600"
        />
        <MetricCard
          value={ai.arrContradictions}
          label="Cross-source conflicts"
          sub={`Across ${ai.blockedByGaps.toLocaleString()} deals`}
          href="/ic-readiness?step=conflicts"
          icon={<IconAlertTriangle className="h-5 w-5" />}
          iconBg="bg-red-50 text-red-600"
        />
        <MetricCard
          value={workload.total}
          label="Assigned to you"
          sub="Your review queue"
          href="/ic-readiness?mine=1"
          icon={<IconUser className="h-5 w-5" />}
          iconBg="bg-[#fdf2f4] text-[#7a3344]"
        />
        <MetricCard
          value={workload.decision}
          label="Decisions pending"
          sub="In your queue"
          href="/ic-readiness?step=decision"
          icon={<IconHourglass className="h-5 w-5" />}
          iconBg="bg-amber-50 text-amber-700"
        />
      </div>
    </section>
  );
}

function MetricCard({
  value,
  label,
  sub,
  href,
  icon,
  iconBg,
}: {
  value: number;
  label: string;
  sub: string;
  href: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start justify-between gap-3 rounded-xl border border-stone-200/80 bg-white px-4 py-4 transition hover:border-[#7a3344]/25 hover:shadow-sm"
    >
      <div>
        <p className="text-2xl font-semibold tabular-nums text-stone-900">{value.toLocaleString()}</p>
        <p className="mt-0.5 text-sm font-medium text-stone-800">{label}</p>
        <p className="mt-0.5 text-xs text-stone-500">{sub}</p>
      </div>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </div>
    </Link>
  );
}
