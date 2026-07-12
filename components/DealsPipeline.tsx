"use client";

/** Legacy deals list with summary cards, filters, and links to company detail pages. */
import Link from "next/link";
import { pipelineDeals, type PipelineDeal, type ReadinessStatus } from "@/lib/deals-pipeline";

/** Renders the deals pipeline UI. */
export function DealsPipeline() {
  const myDeals = pipelineDeals.filter((d) => d.owner === "Alex Rivera");
  const blocked = myDeals.filter((d) => d.readinessStatus === "blocked").length;

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="border-b border-stone-200 bg-white px-6 py-5">
        <h1 className="text-xl font-semibold text-stone-900">Deals</h1>
        <p className="mt-1 text-sm text-stone-500">
          Pipeline synced from Google Sheets · {myDeals.length} active · {blocked} need IC review
        </p>
      </header>

      <div className="flex-1 p-6">
        {/* Summary row */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="In IC prep" value="2" hint="Ready for readiness review" />
          <SummaryCard label="Blocked" value={String(blocked)} hint="Conflicts or open items" accent="warning" />
          <SummaryCard label="Ready for IC" value="1" hint="Score 8+ with no conflicts" accent="success" />
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sagard-700 px-3 py-1 text-xs font-medium text-white">
            All deals
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs text-stone-500 ring-1 ring-stone-200">
            My deals
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs text-stone-500 ring-1 ring-stone-200">
            Blocked
          </span>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">ARR</th>
                <th className="px-4 py-3 font-medium">Readiness</th>
                <th className="px-4 py-3 font-medium">Issues</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {pipelineDeals.map((deal) => (
                <DealRow key={deal.id} deal={deal} />
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-stone-400">
          Demo: open <strong>Northwind Logistics</strong> for the full IC Readiness workflow.
        </p>
      </div>
    </div>
  );
}

function DealRow({ deal }: { deal: PipelineDeal }) {
  const isDemoDeal = deal.id === "northwind-logistics";

  return (
    <tr className="border-b border-stone-50 hover:bg-stone-50/50">
      <td className="px-4 py-4">
        <p className="font-medium text-stone-900">{deal.name}</p>
        <p className="text-xs text-stone-500">{deal.sector}</p>
      </td>
      <td className="px-4 py-4 capitalize text-stone-600">{deal.stage.replace("_", " ")}</td>
      <td className="px-4 py-4 text-stone-800">{deal.arr}</td>
      <td className="px-4 py-4">
        <ReadinessBadge status={deal.readinessStatus} score={deal.readinessScore} />
      </td>
      <td className="px-4 py-4 text-stone-600">
        {deal.conflictCount > 0 && (
          <span className="text-red-600">{deal.conflictCount} conflicts</span>
        )}
        {deal.conflictCount > 0 && deal.openItems > 0 && " · "}
        {deal.openItems > 0 && <span>{deal.openItems} open</span>}
        {deal.conflictCount === 0 && deal.openItems === 0 && "—"}
      </td>
      <td className="px-4 py-4 text-stone-500">{deal.lastUpdated}</td>
      <td className="px-4 py-4 text-right">
        {isDemoDeal ? (
          <Link
            href={`/deals/${deal.id}`}
            className="inline-flex rounded-lg bg-sagard-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sagard-800"
          >
            Open IC review
          </Link>
        ) : (
          <span className="text-xs text-stone-400">Preview</span>
        )}
      </td>
    </tr>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: "warning" | "success";
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-stone-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          accent === "warning"
            ? "text-amber-600"
            : accent === "success"
              ? "text-emerald-600"
              : "text-stone-900"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-stone-400">{hint}</p>
    </div>
  );
}

function ReadinessBadge({
  status,
  score,
}: {
  status: ReadinessStatus;
  score: number;
}) {
  const styles = {
    ready: "bg-emerald-50 text-emerald-700",
    blocked: "bg-red-50 text-red-700",
    in_review: "bg-amber-50 text-amber-800",
  };
  const labels = {
    ready: "Ready",
    blocked: "Blocked",
    in_review: "In review",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {score}/10 · {labels[status]}
    </span>
  );
}
