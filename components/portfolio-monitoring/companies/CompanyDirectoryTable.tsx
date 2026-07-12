"use client";

import Link from "next/link";
import { CompanyIdentity } from "@/components/portfolio-monitoring/company-identity";
import { CoverageBar } from "@/components/portfolio-monitoring/PortfolioShared";
import type {
  CompanyDirectoryRow,
  DirectoryReportingHealth,
} from "@/lib/portfolio/companies-directory-selectors";
import { CompanyActionsMenu } from "./CompanyActionsMenu";

function formatReceivedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function HealthBadge({ health }: { health: DirectoryReportingHealth }) {
  const styles: Record<DirectoryReportingHealth, string> = {
    "On track": "bg-emerald-50 text-emerald-800 ring-emerald-100",
    "Needs validation": "bg-amber-50 text-amber-800 ring-amber-100",
    "Processing issue": "bg-red-50 text-red-700 ring-red-100",
    "Report overdue": "bg-red-50 text-red-700 ring-red-100",
    "Awaiting report": "bg-sky-50 text-sky-800 ring-sky-100",
    "No reports yet": "bg-stone-100 text-stone-600 ring-stone-200",
  };
  const dot: Record<DirectoryReportingHealth, string> = {
    "On track": "bg-emerald-500",
    "Needs validation": "bg-amber-500",
    "Processing issue": "bg-red-500",
    "Report overdue": "bg-red-500",
    "Awaiting report": "bg-sky-500",
    "No reports yet": "bg-stone-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${styles[health]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[health]}`} />
      {health}
    </span>
  );
}

export function CompanyDirectoryTable({
  rows,
  onAssignOwner,
}: {
  rows: CompanyDirectoryRow[];
  onAssignOwner: (companyId: string) => void;
}) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-[1080px] w-full table-fixed text-left text-sm">
          <thead className="border-b border-stone-100 bg-[#fafaf9] text-[10px] font-semibold uppercase tracking-[0.05em] text-stone-500">
            <tr>
              <th className="w-[22%] px-4 py-2.5">Company</th>
              <th className="w-[12%] px-3 py-2.5">Sector</th>
              <th className="w-[14%] px-3 py-2.5">
                <span className="inline-flex items-center gap-1">
                  Latest report period
                  <span
                    title="Reporting period of the latest uploaded package"
                    className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-stone-200 text-[9px] text-stone-500"
                  >
                    i
                  </span>
                </span>
              </th>
              <th className="w-[9%] px-3 py-2.5">Reports received</th>
              <th className="w-[11%] px-3 py-2.5">
                <span className="inline-flex items-center gap-1">
                  Coverage
                  <span
                    title="Extraction coverage reflects expected metrics found across the latest reporting package."
                    className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-stone-200 text-[9px] text-stone-500"
                  >
                    i
                  </span>
                </span>
              </th>
              <th className="w-[10%] px-3 py-2.5">Needs validation</th>
              <th className="w-[14%] px-3 py-2.5">Reporting health</th>
              <th className="w-[8%] px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.company.id}
                className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50"
              >
                <td className="max-w-0 overflow-hidden px-4 py-3 align-middle">
                  <CompanyIdentity
                    companyId={row.company.id}
                    companyName={row.displayName}
                    secondaryText={row.descriptor}
                    size="md"
                    href={`/dashboard/portfolio/companies/${row.company.id}?tab=overview`}
                    nameClassName="text-[#63202e]"
                  />
                </td>
                <td className="max-w-0 overflow-hidden px-3 py-3 align-middle">
                  <span className="block truncate text-[13px] text-stone-600" title={row.sector}>
                    {row.sector}
                  </span>
                </td>
                <td className="px-3 py-3 align-middle">
                  {row.latestReportPeriod ? (
                    <div>
                      <p className="text-[13px] font-semibold text-stone-800">
                        {row.latestReportPeriod}
                      </p>
                      {row.latestFileReceivedAt ? (
                        <p className="mt-0.5 text-[11px] text-stone-500">
                          Latest file received
                          <br />
                          {formatReceivedDate(row.latestFileReceivedAt)}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-[13px] text-stone-400">No reports yet</span>
                  )}
                </td>
                <td className="px-3 py-3 align-middle tabular-nums text-[13px] text-stone-700">
                  {row.reportsReceived}
                </td>
                <td className="px-3 py-3 align-middle">
                  {row.coverage != null ? (
                    <div
                      title="Extraction coverage reflects expected metrics found across the latest reporting package."
                    >
                      <CoverageBar value={row.coverage} />
                    </div>
                  ) : (
                    <span className="text-[13px] text-stone-400">—</span>
                  )}
                </td>
                <td className="px-3 py-3 align-middle">
                  <span
                    title="Metrics from the latest active package that still require validation."
                    className={`text-[13px] font-semibold tabular-nums ${
                      row.needsValidation > 0 ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    {row.needsValidation}
                  </span>
                </td>
                <td className="px-3 py-3 align-middle">
                  <HealthBadge health={row.reportingHealth} />
                </td>
                <td className="px-3 py-3 align-middle text-right">
                  <CompanyActionsMenu
                    row={row}
                    onAssignOwner={() => onAssignOwner(row.company.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 p-3 md:hidden">
        {rows.map((row) => (
          <article
            key={row.company.id}
            className="rounded-xl border border-stone-200 bg-white p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <CompanyIdentity
                companyId={row.company.id}
                companyName={row.displayName}
                secondaryText={row.descriptor ?? row.sector}
                size="md"
                href={`/dashboard/portfolio/companies/${row.company.id}?tab=overview`}
              />
              <CompanyActionsMenu
                row={row}
                onAssignOwner={() => onAssignOwner(row.company.id)}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-stone-600">
              <div>
                <p className="text-stone-400">Latest period</p>
                <p className="font-medium text-stone-800">
                  {row.latestReportPeriod ?? "No reports yet"}
                </p>
              </div>
              <div>
                <p className="text-stone-400">Reports</p>
                <p className="font-medium tabular-nums text-stone-800">{row.reportsReceived}</p>
              </div>
              <div>
                <p className="text-stone-400">Coverage</p>
                <p className="font-medium text-stone-800">
                  {row.coverage != null ? `${row.coverage}%` : "—"}
                </p>
              </div>
              <div>
                <p className="text-stone-400">Needs validation</p>
                <p
                  className={`font-semibold tabular-nums ${
                    row.needsValidation > 0 ? "text-amber-700" : "text-emerald-700"
                  }`}
                >
                  {row.needsValidation}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <HealthBadge health={row.reportingHealth} />
            </div>
            <Link
              href={`/dashboard/portfolio/companies/${row.company.id}?tab=overview`}
              className="mt-2 inline-block text-[12px] font-semibold text-[#7a3344]"
            >
              Open profile →
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
