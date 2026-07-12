/**
 * Compact list of the most recently uploaded reporting packages.
 */
import Link from "next/link";

type RecentReport = {
  id: string;
  company: string;
  fileName: string;
  period: string;
  uploadedAt: string;
  status: string;
  needsValidation: number;
};

function companyInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Compact list of recently uploaded packages. */
export function RecentReportingPackages({ reports }: { reports: RecentReport[] }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-stone-900">Recent reporting packages</h2>
        <Link href="/dashboard/portfolio/reporting-packages" className="text-xs font-semibold text-[#7a3344] hover:underline">
          View all
        </Link>
      </div>

      <ul className="mt-4 flex-1 divide-y divide-stone-100">
        {reports.map((report) => (
          <li key={report.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-stone-600 to-stone-800 text-[10px] font-bold text-white">
              {companyInitials(report.company)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-900">{report.company}</p>
              <p className="truncate text-xs text-blue-600">{report.fileName}</p>
              <p className="mt-0.5 text-[11px] text-stone-400">
                {new Date(report.uploadedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                · {report.period}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              {report.status}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href="/dashboard/portfolio/reporting-packages"
        className="mt-4 inline-flex text-sm font-semibold text-[#7a3344] hover:underline"
      >
        Go to reporting packages →
      </Link>
    </div>
  );
}
