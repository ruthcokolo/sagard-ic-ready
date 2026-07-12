"use client";

/** Table of deals waiting for IC committee review with status columns. */
import Link from "next/link";
import type { PipelineDeal } from "@/lib/deal-types";
import { DEMO_DEAL_ID } from "@/lib/insights";
import type { WorkflowStep } from "@/lib/deal-query";
import {
  getQueueKeyIssue,
  getQueuePriority,
  getQueueReadiness,
  priorityClass,
  priorityLabel,
  queueActionLabel,
  queueStepLabel,
  stepBadgeClass,
} from "@/lib/review-queue-display";
import { useDecisions } from "@/components/decisions/DecisionProvider";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { IconAlertTriangle, IconClipboardCheck, IconDocumentSparkle } from "@/components/ui/Icons";

function scoreClass(score: number) {
  if (score >= 8) return "text-emerald-700 bg-emerald-50";
  if (score >= 5) return "text-amber-800 bg-amber-50";
  return "text-red-700 bg-red-50";
}

function StepIcon({ step }: { step: WorkflowStep }) {
  const cls = "h-3.5 w-3.5";
  if (step === "conflicts") return <IconAlertTriangle className={cls} />;
  if (step === "draft") return <IconDocumentSparkle className={cls} />;
  return <IconClipboardCheck className={cls} />;
}

/** Renders the review queue table UI. */
export function ReviewQueueTable({
  deals,
  reviewerName,
}: {
  deals: PipelineDeal[];
  reviewerName: string;
}) {
  const { getDealStep } = useDecisions();

  if (deals.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-stone-500">No deals match these filters.</div>
    );
  }

  const reviewerFirst = reviewerName.split(" ")[0];

  return (
    <table className="w-full text-left text-[13px]">
      <thead className="border-b border-stone-100 bg-stone-50/80 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        <tr>
          <th className="px-4 py-3">Company</th>
          <th className="px-3 py-3">What needs you</th>
          <th className="hidden px-3 py-3 lg:table-cell">Key issue</th>
          <th className="px-3 py-3">Priority</th>
          <th className="px-3 py-3">Readiness</th>
          <th className="px-3 py-3 text-right">Action</th>
        </tr>
      </thead>
      <tbody>
        {deals.map((deal) => {
          const isDemo = deal.id === DEMO_DEAL_ID;
          const step = (getDealStep(deal.id) ?? "draft") as WorkflowStep;
          const issue = getQueueKeyIssue(deal);
          const priority = getQueuePriority(deal);
          const readiness = getQueueReadiness(deal);
          const action = queueActionLabel(step);

          return (
            <tr
              key={deal.id}
              className={`border-b border-stone-50 hover:bg-[#fdf2f4]/25 ${
                isDemo ? "border-l-4 border-l-[#7a3344] bg-[#fdf2f4]/15" : ""
              }`}
            >
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/companies/${deal.id}?from=ic-readiness`}
                  className="group flex items-center gap-3"
                >
                  <CompanyLogo
                    companyId={deal.id}
                    name={deal.name}
                    size="sm"
                    className="!h-9 !w-9 !rounded-lg !text-xs"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-stone-900 group-hover:text-[#7a3344]">
                      {deal.name}
                    </p>
                    <p className="truncate text-[11px] text-stone-500">{deal.tagline}</p>
                  </div>
                </Link>
              </td>
              <td className="px-3 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold ${stepBadgeClass(step)}`}
                >
                  <StepIcon step={step} />
                  {queueStepLabel(step)}
                </span>
              </td>
              <td className="hidden px-3 py-3 lg:table-cell">
                <p className="font-semibold text-stone-900">{issue.headline}</p>
                <p className="mt-0.5 text-[11px] text-stone-500">{issue.detail}</p>
              </td>
              <td className="px-3 py-3">
                <span
                  className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${priorityClass(priority)}`}
                >
                  {priorityLabel(priority)}
                </span>
              </td>
              <td className="px-3 py-3">
                <span
                  className={`inline-flex min-w-[1.75rem] justify-center rounded px-1.5 py-0.5 text-xs font-bold tabular-nums ${scoreClass(readiness)}`}
                >
                  {readiness}
                </span>
              </td>
              <td className="px-3 py-3 text-right">
                <Link
                  href={`/dashboard/companies/${deal.id}?from=ic-readiness`}
                  className="inline-flex rounded-lg bg-[#7a3344] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#5a2533]"
                >
                  {action}
                </Link>
                <p className="mt-1 text-[10px] text-stone-400">Reviewer: {reviewerFirst}</p>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
