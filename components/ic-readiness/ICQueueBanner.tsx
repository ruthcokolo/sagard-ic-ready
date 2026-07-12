"use client";

import Link from "next/link";
import { DEMO_DEAL_ID } from "@/lib/insights";
import { getDealById } from "@/lib/deals-pipeline";
import { queueStepHint } from "@/lib/review-queue-display";
import { useDecisions } from "@/components/decisions/DecisionProvider";
import {
  IconAlertTriangle,
  IconClipboardCheck,
  IconDocumentSparkle,
  IconUser,
} from "@/components/ui/Icons";

export function ICQueueBanner() {
  const { getWorkloadCounts, isInActiveQueue, nextQueueDealId, hydrated } = useDecisions();
  const w = getWorkloadCounts();
  const showNorthwind = !hydrated || isInActiveQueue(DEMO_DEAL_ID);
  const nextDeal = nextQueueDealId ? getDealById(nextQueueDealId) : null;
  const ctaHref = showNorthwind
    ? `/dashboard/companies/${DEMO_DEAL_ID}?from=ic-readiness`
    : nextDeal
      ? `/dashboard/companies/${nextDeal.id}?from=ic-readiness`
      : "/ic-readiness";
  const ctaLabel = showNorthwind
    ? "Review Northwind Logistics →"
    : nextDeal
      ? `Review ${nextDeal.name} →`
      : "Open review queue →";

  return (
    <section className="mx-8 mb-6 overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/90 via-[#fffdf8] to-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <IconUser className="h-3 w-3" />
            </span>
            Your workload
          </p>
          <p className="mt-2 text-[2rem] font-semibold leading-none tabular-nums text-stone-900 sm:text-[2.25rem]">
            {w.total}{" "}
            <span className="text-xl font-semibold text-stone-800 sm:text-2xl">deals assigned to you</span>
          </p>
          <p className="mt-2 text-sm text-stone-600">Focus on these tasks to keep your pipeline moving.</p>
          <p className="mt-3 text-xs text-stone-500">
            Drawn from 247 portfolio-wide flagged deals.
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <Link
            href={ctaHref}
            className="rounded-xl border-2 border-[#7a3344] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#7a3344] transition hover:bg-[#fdf2f4]"
          >
            {ctaLabel}
          </Link>
          <p className="text-[11px] text-stone-400">{showNorthwind ? "Next up" : "Next in queue"}</p>
        </div>
      </div>

      <div className="grid gap-3 border-t border-amber-100/80 bg-white/50 px-4 py-4 sm:grid-cols-3">
        <WorkloadCard
          href="/ic-readiness?step=conflicts"
          icon={<IconAlertTriangle className="h-4 w-4" />}
          iconBg="bg-red-50 text-red-600"
          label="Resolve blockers"
          hint={queueStepHint("conflicts")}
          count={w.conflicts}
        />
        <WorkloadCard
          href="/ic-readiness?step=draft"
          icon={<IconDocumentSparkle className="h-4 w-4" />}
          iconBg="bg-amber-50 text-amber-700"
          label="Verify analysis"
          hint={queueStepHint("draft")}
          count={w.draft}
        />
        <WorkloadCard
          href="/ic-readiness?step=decision"
          icon={<IconClipboardCheck className="h-4 w-4" />}
          iconBg="bg-emerald-50 text-emerald-700"
          label="Record decision"
          hint={queueStepHint("decision")}
          count={w.decision}
        />
      </div>
    </section>
  );
}

function WorkloadCard({
  href,
  icon,
  iconBg,
  label,
  hint,
  count,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  hint: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl border border-stone-200/80 bg-white px-4 py-3 transition hover:border-[#7a3344]/20 hover:shadow-sm"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
            {icon}
          </span>
          <span className="text-sm font-medium text-stone-800">{label}</span>
        </div>
        <p className="mt-1 pl-[2.625rem] text-[11px] text-stone-500">{hint}</p>
      </div>
      <span className="text-lg font-semibold tabular-nums text-[#7a3344]">{count}</span>
    </Link>
  );
}
