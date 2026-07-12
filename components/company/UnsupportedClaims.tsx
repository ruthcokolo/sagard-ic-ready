/** List of AI claims that lack supporting evidence in source documents. */

import type { UnsupportedClaim } from "@/lib/types";
import { evidenceStatusLabels } from "@/lib/plain-copy";

/** Renders the unsupported claims UI. */
export function UnsupportedClaims({ claims }: { claims: UnsupportedClaim[] }) {
  if (claims.length === 0) return null;

  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="text-lg font-semibold text-stone-900">Statements without proof</h2>
      <p className="mt-1 text-sm text-stone-500">
        Claims that sound good but aren't backed up in the files we reviewed.
      </p>

      <div className="mt-5 overflow-hidden rounded-xl border border-stone-200">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-stone-100 bg-stone-50 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            <tr>
              <th className="px-4 py-3">Statement</th>
              <th className="hidden px-4 py-3 md:table-cell">Found in</th>
              <th className="px-4 py-3">Proof status</th>
              <th className="hidden px-4 py-3 lg:table-cell">What would help</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-stone-800">&ldquo;{c.claim}&rdquo;</p>
                  <p className="mt-1 text-xs text-stone-500 md:hidden">{c.source}</p>
                </td>
                <td className="hidden px-4 py-3 text-stone-600 md:table-cell">{c.source}</td>
                <td className="px-4 py-3">
                  <EvidenceBadge status={c.evidenceStatus} />
                </td>
                <td className="hidden px-4 py-3 text-stone-600 lg:table-cell">{c.requiredProof}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EvidenceBadge({ status }: { status: UnsupportedClaim["evidenceStatus"] }) {
  const styles = {
    supported: "bg-emerald-50 text-emerald-700",
    partially_supported: "bg-amber-50 text-amber-800",
    not_supported: "bg-red-50 text-red-700",
    needs_source: "bg-violet-50 text-violet-700",
  };
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${styles[status]}`}>
      {evidenceStatusLabels[status]}
    </span>
  );
}
