"use client";

/**
 * Overview panel listing items that need immediate attention.
 */
import Link from "next/link";
import type { NeedsAttentionItem } from "@/lib/portfolio/overview-selectors";
import { CompanyIdentity } from "@/components/portfolio-monitoring/company-identity";

const ISSUE_STYLES: Record<string, string> = {
  validation: "text-[#7a3344]",
  missing: "text-red-600",
  failed: "text-red-600",
  low_coverage: "text-amber-700",
  partial: "text-amber-700",
};

const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-50 text-red-700 ring-red-100",
  Medium: "bg-amber-50 text-amber-800 ring-amber-100",
  Low: "bg-stone-100 text-stone-600 ring-stone-200",
};

const NEEDS_ATTENTION_PREVIEW_LIMIT = 3;

/** Panel highlighting overdue reports and validation backlogs. */
export function NeedsAttentionPanel({
  items,
  totalCount,
}: {
  items: NeedsAttentionItem[];
  totalCount: number;
}) {
  const visible = items.slice(0, NEEDS_ATTENTION_PREVIEW_LIMIT);
  const remaining = totalCount - visible.length;

  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex shrink-0 items-center justify-between border-b border-stone-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-stone-900">Needs attention</h2>
          {totalCount > 0 && (
            <span className="inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-[#63202e] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {totalCount}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/portfolio/metric-review?scope=needs-attention"
          className="shrink-0 text-xs font-semibold text-[#7a3344] hover:underline"
        >
          View all
        </Link>
      </div>

      {totalCount === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
          <p className="text-sm font-semibold text-stone-800">No urgent items</p>
          <p className="mt-1 text-xs text-stone-500">
            All current reporting packages have been processed and validated.
          </p>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col divide-y divide-stone-100">
          {visible.map((item) => (
            <li key={item.id} className="overflow-hidden px-4 py-3.5">
              <div className="flex min-w-0 items-start gap-2">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <CompanyIdentity
                    companyId={item.companyId}
                    companyName={item.companyName}
                    secondaryText={`${item.reportPeriod} · ${item.reportLabel}`}
                    size="sm"
                    href={`/dashboard/portfolio/companies/${item.companyId}`}
                  />
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${PRIORITY_STYLES[item.priority]}`}
                >
                  {item.priority}
                </span>
              </div>
              <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2">
                <p
                  className={`min-w-0 truncate text-xs font-medium ${ISSUE_STYLES[item.issueType] ?? "text-stone-600"}`}
                  title={item.issueLabel}
                >
                  {item.issueLabel}
                </p>
                <Link
                  href={item.actionHref}
                  className="shrink-0 text-xs font-semibold text-[#7a3344] hover:underline"
                >
                  {item.actionLabel} →
                </Link>
              </div>
            </li>
          ))}
          {/* Fills remaining height so the card bottom aligns with Portfolio health */}
          <li aria-hidden className="min-h-0 flex-1" />
        </ul>
      )}

      {remaining > 0 && (
        <p className="shrink-0 border-t border-stone-100 px-4 py-2 text-xs text-stone-500">
          + {remaining} more item{remaining === 1 ? "" : "s"}
        </p>
      )}
    </section>
  );
}
