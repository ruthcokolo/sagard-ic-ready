"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getDashboardMetrics,
  getSectorMix,
  RECENT_DECISION,
  recentActivity,
  stageLabel,
  TOP_ALERT_ISSUES,
} from "@/lib/insights";
import type { DealStage } from "@/lib/deal-types";
import { TodaysAiFindings } from "@/components/dashboard/TodaysAiFindings";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { ProductModeSwitch } from "@/components/layout/ProductModeHeaderBar";
import { useAuth } from "@/components/auth/AuthProvider";
import { useDecisions } from "@/components/decisions/DecisionProvider";
import { decisionToExportDecision } from "@/lib/decision-records";
import { firstName } from "@/lib/auth-session";
import {
  IconCheck,
  IconClipboardCheck,
  IconDocumentSparkle,
  IconEditCheck,
} from "@/components/ui/Icons";

const STAGE_STYLES: Record<DealStage, string> = {
  screening: "border-amber-200/80 bg-amber-50/90 text-amber-950",
  diligence: "border-sky-200/80 bg-sky-50/90 text-sky-950",
  ic_prep: "border-emerald-200/80 bg-emerald-50/90 text-emerald-950",
  passed: "border-stone-200 bg-stone-100/90 text-stone-700",
};

const STAGE_ORDER: DealStage[] = ["screening", "diligence", "ic_prep", "passed"];

export function DashboardView() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { getWorkloadCounts, latestSubmission } = useDecisions();
  const showWelcome = searchParams.get("welcome") === "1";
  const m = getDashboardMetrics();
  const queueCounts = getWorkloadCounts();
  const sectors = getSectorMix(5);
  const maxSector = Math.max(...sectors.map((s) => s.count), 1);
  const greeting = user ? firstName(user.name) : "Alex";

  return (
    <div className="min-h-screen bg-[#f4f2ef]">
      <header className="border-b border-stone-200/60 bg-white px-8 py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9e4456]">
              Good morning
            </p>
            <h1 className="font-display mt-1 text-[2.75rem] leading-none text-stone-900">{greeting}</h1>
            <p className="mt-2 text-[15px] text-stone-500">Here&apos;s what needs your attention today.</p>
          </div>
          <div className="flex items-center pt-1">
            <ProductModeSwitch mode="diligence" label="Switch to Portfolio" />
          </div>
        </div>
      </header>

      {showWelcome && <WelcomeBanner />}

      <TodaysAiFindings />

      <div className="grid gap-6 px-8 py-6 lg:grid-cols-2">
        {/* Deals by stage */}
        <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">Deals by stage</h2>
            <Link href="/pipeline" className="text-xs font-semibold text-[#7a3344] hover:underline">
              View pipeline →
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-1.5 sm:flex-nowrap">
            {STAGE_ORDER.map((stage, i) => (
              <div key={stage} className="flex min-w-0 flex-1 items-center gap-1.5">
                <Link
                  href={`/pipeline?stage=${stage}`}
                  className={`flex min-w-0 flex-1 flex-col items-center rounded-xl border px-2 py-3 text-center transition hover:shadow-sm ${STAGE_STYLES[stage]}`}
                >
                  <p className="text-xl font-semibold tabular-nums">{m.stages[stage].toLocaleString()}</p>
                  <p className="mt-0.5 text-[10px] font-medium leading-tight">{stageLabel(stage)}</p>
                </Link>
                {i < STAGE_ORDER.length - 1 && (
                  <span className="hidden shrink-0 text-stone-300 sm:inline" aria-hidden>
                    →
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-stone-100 pt-4">
            <p className="text-xs font-semibold text-stone-800">Top issues driving alerts</p>
            <ul className="mt-3 space-y-2">
              {TOP_ALERT_ISSUES.map((issue) => (
                <li key={issue.label} className="flex items-center justify-between text-sm">
                  <span className="text-stone-600">{issue.label}</span>
                  <span className="font-semibold tabular-nums text-[#7a3344]">
                    {issue.count.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Review queue breakdown */}
        <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Your review queue breakdown</h2>
              <p className="mt-0.5 text-xs text-stone-500">
                {m.ic.total.toLocaleString()} review tasks
              </p>
            </div>
            <Link href="/ic-readiness" className="shrink-0 text-xs font-semibold text-[#7a3344] hover:underline">
              Go to queue →
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            <QueueTaskCard
              href="/ic-readiness?step=conflicts"
              icon={<IconEditCheck className="h-5 w-5" />}
              iconBg="bg-[#fdf2f4] text-[#7a3344]"
              title="Resolve blockers"
              description="Fix conflicts and missing evidence"
              count={queueCounts.conflicts}
            />
            <QueueTaskCard
              href="/ic-readiness?step=draft"
              icon={<IconDocumentSparkle className="h-5 w-5" />}
              iconBg="bg-sky-50 text-sky-700"
              title="Verify analysis"
              description="Review the AI's findings and IC package"
              count={queueCounts.draft}
            />
            <QueueTaskCard
              href="/ic-readiness?step=decision"
              icon={<IconClipboardCheck className="h-5 w-5" />}
              iconBg="bg-emerald-50 text-emerald-700"
              title="Record decision"
              description="Choose an outcome and explain why"
              count={queueCounts.decision}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <IconCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">Recent decisions</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="font-medium text-stone-800">
                    {latestSubmission?.dealName ?? RECENT_DECISION.company}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {latestSubmission
                      ? decisionToExportDecision(latestSubmission.decision)
                      : RECENT_DECISION.decision}
                  </span>
                  <span className="text-xs text-stone-400">
                    {latestSubmission
                      ? new Date(latestSubmission.submittedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : RECENT_DECISION.exportedAt}
                  </span>
                </div>
              </div>
            </div>
            <Link href="/exports" className="shrink-0 text-xs font-semibold text-[#7a3344] hover:underline">
              View exports →
            </Link>
          </div>
        </section>

        {/* Top sectors — preserved */}
        <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-stone-900">Top sectors</h2>
          <ul className="mt-4 space-y-2">
            {sectors.map((s) => (
              <li key={s.id}>
                <Link href={`/pipeline?sector=${s.id}`} className="group block">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-stone-700 group-hover:text-[#7a3344]">{s.label}</span>
                    <span className="tabular-nums text-stone-400">{s.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-[#7a3344]/60"
                      style={{ width: `${(s.count / maxSector) * 100}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* System activity — preserved */}
        <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-stone-900">System activity</h2>
          <ul className="mt-4 space-y-3">
            {recentActivity.map((a) => (
              <li key={a.id} className="flex gap-2 text-sm">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    a.tone === "alert" ? "bg-red-500" : a.tone === "sync" ? "bg-blue-500" : "bg-emerald-500"
                  }`}
                />
                <div>
                  <p className="leading-snug text-stone-700">{a.text}</p>
                  <p className="text-[11px] text-stone-400">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function QueueTaskCard({
  href,
  icon,
  iconBg,
  title,
  description,
  count,
}: {
  href: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/40 px-4 py-3.5 transition hover:border-[#7a3344]/20 hover:bg-[#fdf2f4]/30"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-900">{title}</p>
          <p className="mt-0.5 text-xs text-stone-500">{description}</p>
        </div>
      </div>
      <span className="shrink-0 text-lg font-semibold tabular-nums text-[#7a3344]">
        {count.toLocaleString()}
      </span>
    </Link>
  );
}
