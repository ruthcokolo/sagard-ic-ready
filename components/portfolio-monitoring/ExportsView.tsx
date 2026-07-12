"use client";

import Link from "next/link";
import { useState } from "react";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import { downloadCsv } from "@/lib/portfolio/csv-export";
import { EmptyState } from "@/components/portfolio-monitoring/PortfolioShared";

export function ExportsView() {
  const { state, exportCsv } = usePortfolio();
  const [message, setMessage] = useState<string | null>(null);

  const approvedMetrics = state.metrics.filter((m) => m.status === "Approved for reporting");
  const approvedCompanies = new Set(approvedMetrics.map((m) => m.companyId)).size;

  function handleExportApproved() {
    const result = exportCsv();
    setMessage(result.message);
  }

  return (
    <div className="min-h-screen bg-[#f4f2ef] px-8 py-6">
      <div>
        <h1 className="font-display text-3xl text-stone-900">Exports</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone-500">
          Export approved CSV includes only metrics with status Approved for reporting. Human
          validation required before export.
        </p>
      </div>

      {approvedMetrics.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No approved metrics yet"
            description="Validate extracted metrics in Metric Review before exporting."
            action={
              <Link
                href="/dashboard/portfolio/metric-review"
                className="inline-flex rounded-xl bg-[#7a3344] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6a2b3a]"
              >
                Go to Metric Review
              </Link>
            }
          />
        </div>
      ) : (
        <section className="mt-6 rounded-2xl border border-stone-200/70 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">Export approved CSV</h2>
          <p className="mt-1 text-sm text-stone-500">
            {approvedMetrics.length} metrics approved for reporting across {approvedCompanies}{" "}
            {approvedCompanies === 1 ? "company" : "companies"}.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportApproved}
              className="rounded-xl bg-[#7a3344] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6a2b3a]"
            >
              Export approved CSV
            </button>
          </div>
          {message && (
            <p className={`mt-3 text-sm ${message.includes("Exported") ? "text-emerald-700" : "text-amber-700"}`}>
              {message}
            </p>
          )}
        </section>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm">
        <div className="border-b border-stone-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-stone-900">Export history</h2>
        </div>
        {state.exportHistory.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No exports yet"
              description="Export approved CSV to create a downloadable file and history record."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full text-left text-sm">
              <thead className="border-b border-stone-100 bg-stone-50/80 text-[11px] font-semibold uppercase text-stone-500">
                <tr>
                  <th className="px-4 py-2.5">Export name</th>
                  <th className="px-3 py-2.5">Created at</th>
                  <th className="px-3 py-2.5">Created by</th>
                  <th className="px-3 py-2.5">Metrics</th>
                  <th className="px-3 py-2.5">Companies</th>
                  <th className="px-3 py-2.5">Format</th>
                  <th className="px-4 py-2.5">Download</th>
                </tr>
              </thead>
              <tbody>
                {state.exportHistory.map((entry) => (
                  <tr key={entry.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{entry.exportName}</td>
                    <td className="px-3 py-3 text-xs text-stone-500">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">{entry.createdBy}</td>
                    <td className="px-3 py-3 tabular-nums">{entry.metricsIncluded}</td>
                    <td className="px-3 py-3 tabular-nums">{entry.companiesIncluded}</td>
                    <td className="px-3 py-3">{entry.format}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => downloadCsv(entry.csvContent, entry.exportName)}
                        className="text-xs font-semibold text-[#7a3344] hover:underline"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
