"use client";

import { useState } from "react";
import {
  CompanyProfileEmptyState,
  CoverageGauge,
  SectionCard,
  Sparkline,
  StatusPill,
  TabLinkButton,
  formatShortDate,
} from "@/components/portfolio-monitoring/company-profile/shared";
import {
  getChangesComparisonLabel,
  type AiSummary,
  type HeadlineMetricCard,
  type MetricChangeRow,
  type ReportHistoryRow,
  type ReportingHealth,
} from "@/lib/portfolio/company-profile-selectors";
import type { CompanyFollowUp, CompanyNote } from "@/lib/portfolio/types";
import { METRIC_REVIEW_PATH } from "@/lib/portfolio/metric-review-url-state";

type Props = {
  headlines: HeadlineMetricCard[];
  changes: MetricChangeRow[];
  aiSummary: AiSummary;
  health: ReportingHealth;
  risks: CompanyFollowUp[];
  riskCandidates: { title: string; source: string; priority: string }[];
  reportHistory: ReportHistoryRow[];
  notes: CompanyNote[];
  documentCount: number;
  hasPackages: boolean;
  onTab: (tab: "performance" | "reports" | "risks" | "notes") => void;
  onViewReport: (packageId: string) => void;
  onAddNote: () => void;
};

function CoverageCell({ value }: { value: number }) {
  const barColor =
    value >= 80 ? "bg-emerald-500" : value >= 65 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-10 overflow-hidden rounded-full bg-stone-100">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="tabular-nums text-[12px] text-stone-600">{value}%</span>
    </div>
  );
}

function MetricCard({ card }: { card: HeadlineMetricCard }) {
  const noPrior = !card.changeLabel || card.changeLabel === "No prior approved comparison";
  return (
    <div className="flex h-[142px] flex-col rounded-xl border border-stone-200/70 bg-[#f7f5f2] p-3">
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-stone-600">{card.metricName}</p>
          <p className="text-[11px] text-stone-400">{card.period}</p>
        </div>
      </div>
      <p className="mt-1.5 truncate font-display text-[24px] leading-none tabular-nums text-stone-900">
        {card.displayValue}
      </p>
      <p
        className={`mt-1.5 text-[11px] leading-snug ${
          noPrior ? "text-stone-400" : "font-medium text-stone-600"
        }`}
      >
        {noPrior ? "No prior approved comparison" : card.changeLabel}
      </p>
      <div className="mt-auto pt-1">
        <Sparkline values={card.sparkline} tone={card.changeDirection} height={26} width={88} />
      </div>
    </div>
  );
}

function HealthStatRow({
  icon,
  label,
  tone = "stone",
}: {
  icon: "check" | "clock" | "edit" | "warn" | "ok";
  label: string;
  tone?: "stone" | "green" | "amber" | "red";
}) {
  const iconColor = {
    stone: "text-stone-400",
    green: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
  }[tone];
  const glyph =
    icon === "check" || icon === "ok"
      ? "✓"
      : icon === "clock"
        ? "◷"
        : icon === "edit"
          ? "✎"
          : "!";
  return (
    <li className="flex items-start gap-2 text-[12px] leading-snug text-stone-700">
      <span className={`mt-0.5 w-3.5 shrink-0 text-center text-[11px] font-semibold ${iconColor}`}>
        {glyph}
      </span>
      <span>{label}</span>
    </li>
  );
}

export function CompanyOverviewTab({
  headlines,
  changes,
  aiSummary,
  health,
  risks,
  riskCandidates,
  reportHistory,
  notes,
  documentCount,
  hasPackages,
  onTab,
  onViewReport,
  onAddNote,
}: Props) {
  const [citationsOpen, setCitationsOpen] = useState(false);
  const latestNote = notes[0];
  const previewRisks = risks.slice(0, 4);
  const recentReports = reportHistory.slice(0, 4);
  const comparisonLabel = getChangesComparisonLabel(changes);
  const riskCount = risks.length || (previewRisks.length === 0 ? riskCandidates.length : 0);

  const performanceBullets =
    aiSummary.performance.length > 0
      ? aiSummary.performance
      : ["No approved performance trend is available yet."];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 min-[1100px]:grid-cols-[minmax(0,3fr)_minmax(300px,1fr)] min-[1100px]:items-stretch">
        {/* Left column */}
        <div className="flex min-w-0 flex-col gap-3.5 min-[1100px]:h-full">
          <SectionCard
            title="Company snapshot"
            helper="Approved sector-relevant headline metrics only"
          >
            {!hasPackages ? (
              <CompanyProfileEmptyState
                compact
                title="No reporting history yet"
                copy="Reports submitted by this company will appear here after they are uploaded and processed."
                action={{
                  href: "/dashboard/portfolio/reporting-packages",
                  label: "Go to Reporting Packages",
                }}
              />
            ) : headlines.length === 0 ? (
              <CompanyProfileEmptyState
                compact
                title="No approved performance data yet"
                copy="Complete metric validation to populate company performance and trends."
                action={{ href: METRIC_REVIEW_PATH, label: "Open Metric Review" }}
              />
            ) : (
              <div
                className={`grid gap-2.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${
                  {
                    1: "min-[1440px]:grid-cols-1",
                    2: "min-[1440px]:grid-cols-2",
                    3: "min-[1440px]:grid-cols-3",
                    4: "min-[1440px]:grid-cols-4",
                    5: "min-[1440px]:grid-cols-5",
                    6: "min-[1440px]:grid-cols-6",
                  }[Math.min(6, Math.max(1, headlines.length))] ?? "min-[1440px]:grid-cols-6"
                }`}
              >
                {headlines.map((card) => (
                  <MetricCard key={card.metricId} card={card} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Changes + AI */}
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.8fr)] lg:items-stretch">
            <SectionCard
              title="Changes since last report"
              titleAddon={
                comparisonLabel ? (
                  <span className="text-[11px] font-medium text-stone-400">{comparisonLabel}</span>
                ) : null
              }
              className="flex h-full flex-col"
              bodyClassName="flex flex-1 flex-col"
            >
              {changes.length === 0 ? (
                <div className="flex flex-1 flex-col">
                  <p className="text-[12px] leading-snug text-stone-500">
                    No comparable approved period-over-period changes yet.
                  </p>
                  <div className="mt-auto pt-3">
                    <TabLinkButton onClick={() => onTab("performance")}>
                      View performance trends →
                    </TabLinkButton>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col">
                  <ul className="divide-y divide-stone-100">
                    {changes.map((row) => (
                      <li
                        key={row.metricName}
                        className="grid grid-cols-[1fr_auto_auto] items-center gap-2 py-1.5 text-[12px]"
                      >
                        <span className="truncate font-medium text-stone-800">{row.metricName}</span>
                        <span className="tabular-nums text-stone-700">{row.latestValue}</span>
                        <span className="min-w-[3.75rem] text-right tabular-nums text-stone-500">
                          {row.changeLabel}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto border-t border-stone-100 pt-2.5">
                    <TabLinkButton onClick={() => onTab("performance")}>
                      View performance trends →
                    </TabLinkButton>
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="AI-assisted summary"
              badge={
                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                  Beta
                </span>
              }
              helper="Generated from approved metrics and source-backed management commentary."
              className="flex h-full flex-col"
              bodyClassName="flex flex-1 flex-col"
            >
              {aiSummary.insufficient ? (
                <div className="flex flex-1 flex-col">
                  <p className="text-[12px] leading-snug text-stone-500">
                    Not enough approved data to generate a reliable summary.
                  </p>
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-2.5 text-[12px] leading-[1.45] text-stone-700">
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                      Current performance
                    </h3>
                    <ul className="mt-1 list-disc space-y-0.5 pl-3.5">
                      {performanceBullets.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                      Key risks
                    </h3>
                    <ul className="mt-1 list-disc space-y-0.5 pl-3.5">
                      {aiSummary.risks.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                      What to review next
                    </h3>
                    <ul className="mt-1 list-disc space-y-0.5 pl-3.5">
                      {aiSummary.next.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-auto space-y-1.5 border-t border-stone-100 pt-2.5">
                    <TabLinkButton onClick={() => setCitationsOpen(true)}>
                      View AI details and citations →
                    </TabLinkButton>
                    <p className="text-[10px] leading-snug text-stone-400">
                      Not an investment recommendation. Claims are limited to approved metrics and
                      cited sources.
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard
            title="Reporting history"
            action={
              <TabLinkButton onClick={() => onTab("reports")}>View all reports →</TabLinkButton>
            }
            className="flex min-h-0 flex-1 flex-col"
            bodyClassName="flex min-h-0 flex-1 flex-col"
          >
            {recentReports.length === 0 ? (
              <div className="flex flex-1 flex-col justify-center">
                <CompanyProfileEmptyState
                  compact
                  title="No reporting history yet"
                  copy="Reports submitted by this company will appear here after they are uploaded and processed."
                  action={{
                    href: "/dashboard/portfolio/reporting-packages",
                    label: "Go to Reporting Packages",
                  }}
                />
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="hidden min-h-0 flex-1 overflow-x-auto md:block">
                  <table className="w-full min-w-[680px] text-left text-[12px]">
                    <thead className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                      <tr>
                        <th className="pb-1.5 pr-3 font-semibold">Period</th>
                        <th className="pb-1.5 pr-3 font-semibold">Report</th>
                        <th className="pb-1.5 pr-3 font-semibold">Received</th>
                        <th className="pb-1.5 pr-3 font-semibold">Status</th>
                        <th className="pb-1.5 pr-3 font-semibold">Review</th>
                        <th className="pb-1.5 pr-3 font-semibold">Coverage</th>
                        <th className="pb-1.5 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReports.map((row) => (
                        <tr key={row.packageId} className="border-t border-stone-100">
                          <td className="h-12 pr-3 font-medium text-stone-800">{row.period}</td>
                          <td className="pr-3">
                            <p className="font-semibold text-stone-800">{row.reportTitle}</p>
                            <p className="truncate text-[11px] text-stone-400" title={row.fileName}>
                              {row.fileName}
                            </p>
                          </td>
                          <td className="pr-3 text-stone-500">{formatShortDate(row.receivedAt)}</td>
                          <td className="pr-3">
                            <StatusPill
                              label={
                                row.processingStatus === "Processed"
                                  ? "Processed"
                                  : row.processingStatus === "Failed"
                                    ? "Failed"
                                    : "Processing"
                              }
                              tone={
                                row.processingStatus === "Processed"
                                  ? "green"
                                  : row.processingStatus === "Failed"
                                    ? "red"
                                    : "amber"
                              }
                            />
                          </td>
                          <td className="pr-3 text-stone-600">{row.reviewStatus}</td>
                          <td className="pr-3">
                            <CoverageCell value={row.coverage} />
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => onViewReport(row.packageId)}
                              className="rounded-lg border border-stone-200 px-2 py-1 text-[11px] font-semibold text-[#7a3344] hover:bg-stone-50"
                            >
                              View report
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="space-y-2 md:hidden">
                  {recentReports.map((row) => (
                    <li
                      key={row.packageId}
                      className="rounded-xl border border-stone-100 bg-[#faf9f7] px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-stone-900">
                            {row.period} · {row.reportTitle}
                          </p>
                          <p className="truncate text-[11px] text-stone-500">{row.fileName}</p>
                          <p className="mt-0.5 text-[11px] text-stone-500">
                            {formatShortDate(row.receivedAt)} · {row.reviewStatus}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onViewReport(row.packageId)}
                          className="shrink-0 text-[12px] font-semibold text-[#7a3344]"
                        >
                          View
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right rail */}
        <div className="flex min-w-0 flex-col gap-3.5 min-[1100px]:h-full">
          <SectionCard
            title="Reporting health"
            helper="Submission and processing quality — not financial health."
            action={<TabLinkButton onClick={() => onTab("reports")}>View details →</TabLinkButton>}
          >
            <div className="flex items-start gap-3">
              <CoverageGauge value={health.averageCoverage} />
              <ul className="min-w-0 flex-1 space-y-1.5">
                <HealthStatRow
                  icon="check"
                  tone="green"
                  label={
                    health.reportsExpected != null
                      ? `${health.reportsReceived} of ${health.reportsExpected} reports received`
                      : `${health.reportsReceived} report${health.reportsReceived === 1 ? "" : "s"} received`
                  }
                />
                <HealthStatRow
                  icon="clock"
                  tone={health.reportsOnTime != null ? "green" : "amber"}
                  label={
                    health.reportsOnTime != null
                      ? `${health.reportsOnTime} reports on time`
                      : "On-time rate unavailable"
                  }
                />
                <HealthStatRow
                  icon="clock"
                  tone="amber"
                  label={`Avg. days late: ${health.averageDaysLate != null ? health.averageDaysLate : "—"}`}
                />
                <HealthStatRow
                  icon="edit"
                  tone={health.manualCorrections > 0 ? "amber" : "stone"}
                  label={`Manual corrections: ${health.manualCorrections}`}
                />
                <HealthStatRow
                  icon={health.extractionFailures > 0 ? "warn" : "ok"}
                  tone={health.extractionFailures > 0 ? "red" : "green"}
                  label={`Extraction failures: ${health.extractionFailures}`}
                />
              </ul>
            </div>
          </SectionCard>

          <SectionCard
            title="Key risks & follow-ups"
            badge={
              riskCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
                  {Math.min(riskCount, 99)}
                </span>
              ) : null
            }
            action={
              <TabLinkButton onClick={() => onTab("risks")}>
                View all risks & follow-ups →
              </TabLinkButton>
            }
          >
            {previewRisks.length === 0 && riskCandidates.length === 0 ? (
              <CompanyProfileEmptyState
                compact
                title="No open risks or follow-ups"
                copy="Confirmed company risks and follow-up items will appear here."
              />
            ) : (
              <ul className="space-y-2">
                {previewRisks.map((r) => (
                  <li key={r.id} className="flex gap-2 border-b border-stone-50 pb-2 last:border-0 last:pb-0">
                    <span className="mt-0.5 text-[12px] text-amber-600">▲</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-stone-900">{r.title}</p>
                      <p className="truncate text-[11px] text-stone-500">{r.source}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <StatusPill
                          label={r.status}
                          tone={r.status === "Overdue" ? "red" : "amber"}
                        />
                        <span className="text-[10px] text-stone-400">
                          {r.ownerName ?? "Unassigned"}
                          {r.dueDate ? ` · ${formatShortDate(r.dueDate)}` : ""}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
                {previewRisks.length === 0 &&
                  riskCandidates.slice(0, 3).map((c) => (
                    <li
                      key={c.title}
                      className="rounded-lg border border-dashed border-amber-200/80 bg-amber-50/30 px-2.5 py-2"
                    >
                      <p className="text-[12px] font-medium text-stone-900">{c.title}</p>
                      <p className="mt-0.5 text-[11px] text-stone-500">{c.source}</p>
                      <p className="mt-1 text-[10px] text-amber-800">Suggested — confirm to track</p>
                    </li>
                  ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title="Company notes"
            action={
              <div className="flex items-center gap-2.5">
                <TabLinkButton onClick={onAddNote}>+ Add note</TabLinkButton>
                <TabLinkButton onClick={() => onTab("notes")}>View all notes →</TabLinkButton>
              </div>
            }
          >
            {!latestNote ? (
              <div className="flex min-h-[110px] flex-col items-center justify-center rounded-[12px] border border-dashed border-stone-200 bg-[#faf9f7]/50 px-3 py-4 text-center">
                <p className="text-[13px] font-medium text-stone-700">No company notes yet</p>
                <button
                  type="button"
                  onClick={onAddNote}
                  className="mt-2 text-[12px] font-semibold text-[#7a3344] hover:underline"
                >
                  Add note
                </button>
              </div>
            ) : (
              <div className="rounded-[12px] border border-stone-100 bg-[#faf9f7] px-3 py-2.5">
                <p className="text-[11px] text-stone-400">
                  {latestNote.authorName} · {formatShortDate(latestNote.createdAt)}
                </p>
                <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-[12px] leading-snug text-stone-700">
                  {latestNote.body}
                </p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Documents & agreements" className="!py-3">
            <div className="flex min-h-[52px] items-center justify-between gap-3">
              <p className="text-[12px] text-stone-600">
                {documentCount === 0
                  ? "No documents on file yet."
                  : `${documentCount} operating report${documentCount === 1 ? "" : "s"}`}
              </p>
              <TabLinkButton onClick={() => onTab("reports")}>View all documents →</TabLinkButton>
            </div>
          </SectionCard>
        </div>
      </div>

      {citationsOpen ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-stone-900/30">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close citations"
            onClick={() => setCitationsOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 className="font-display text-lg text-stone-900">AI details & citations</h2>
              <button
                type="button"
                onClick={() => setCitationsOpen(false)}
                className="text-sm font-medium text-stone-500 hover:text-stone-800"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                {aiSummary.citations.map((c) => (
                  <li key={c.id} className="rounded-xl border border-stone-100 p-3">
                    <p className="text-sm text-stone-800">{c.statement}</p>
                    <dl className="mt-2 space-y-1 text-xs text-stone-500">
                      {c.reportPeriod ? (
                        <div>
                          <dt className="inline font-medium">Report: </dt>
                          <dd className="inline">{c.reportPeriod}</dd>
                        </div>
                      ) : null}
                      {c.page != null ? (
                        <div>
                          <dt className="inline font-medium">Page: </dt>
                          <dd className="inline">{c.page}</dd>
                        </div>
                      ) : null}
                      {c.metricName ? (
                        <div>
                          <dt className="inline font-medium">Metric: </dt>
                          <dd className="inline">{c.metricName}</dd>
                        </div>
                      ) : null}
                      {c.evidenceExcerpt ? (
                        <div>
                          <dt className="font-medium">Evidence</dt>
                          <dd className="mt-0.5 italic text-stone-600">“{c.evidenceExcerpt}”</dd>
                        </div>
                      ) : null}
                    </dl>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
