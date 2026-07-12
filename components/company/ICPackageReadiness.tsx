/** Score and breakdown of how ready the IC package is for committee review. */

import type { ICPackageSection } from "@/lib/types";
import { packageStatusLabels } from "@/lib/plain-copy";

/** Renders the icpackage readiness UI. */
export function ICPackageReadiness({ sections }: { sections: ICPackageSection[] }) {
  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="text-lg font-semibold text-stone-900">Review document sections</h2>
      <p className="mt-1 text-sm text-stone-500">
        What goes into the download package and what's still missing.
      </p>

      <div className="mt-5 overflow-hidden rounded-xl border border-stone-200">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-stone-100 bg-stone-50 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            <tr>
              <th className="px-4 py-3">Section</th>
              <th className="px-4 py-3">Status</th>
              <th className="hidden px-4 py-3 sm:table-cell">What's missing</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.id} className="border-b border-stone-50 last:border-0">
                <td className="px-4 py-3 font-medium text-stone-800">{s.section}</td>
                <td className="px-4 py-3">
                  <SectionStatusBadge status={s.status} />
                </td>
                <td className="hidden px-4 py-3 text-stone-500 sm:table-cell">{s.blocker ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SectionStatusBadge({ status }: { status: ICPackageSection["status"] }) {
  const styles = {
    ready: "bg-emerald-50 text-emerald-700",
    needs_support: "bg-amber-50 text-amber-800",
    blocked: "bg-red-50 text-red-700",
    draft_ready: "bg-violet-50 text-violet-700",
    not_started: "bg-stone-100 text-stone-600",
  };
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${styles[status]}`}>
      {packageStatusLabels[status]}
    </span>
  );
}
