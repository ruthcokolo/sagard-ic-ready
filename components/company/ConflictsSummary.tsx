/** Summary counts of open conflicts grouped by severity. */

import type { Contradiction } from "@/lib/types";

/** Renders the conflicts summary UI. */
export function ConflictsSummary({ contradictions }: { contradictions: Contradiction[] }) {
  if (contradictions.length === 0) return null;

  const high = contradictions.filter((c) => c.severity === "high");

  return (
    <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">
            Resolve first
          </p>
          <h3 className="mt-1 text-base font-semibold text-stone-900">
            {contradictions.length} cross-source conflict{contradictions.length > 1 ? "s" : ""}{" "}
            {high.length > 0 && (
              <span className="text-amber-900">({high.length} blocking)</span>
            )}
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            Review contradictions before trusting the AI one-pager below.
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {contradictions.slice(0, 4).map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-100 bg-white px-4 py-3 text-sm"
          >
            <div>
              <span className="font-semibold text-stone-900">{c.field}</span>
              <span className="mx-2 text-stone-300">·</span>
              <span className="text-stone-600">
                {c.sourceA.value} vs {c.sourceB.value}
              </span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                c.severity === "high"
                  ? "bg-red-100 text-red-700"
                  : c.severity === "medium"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-stone-100 text-stone-600"
              }`}
            >
              {c.severity}
            </span>
          </li>
        ))}
      </ul>
      {contradictions.length > 4 && (
        <p className="mt-3 text-xs text-stone-500">
          +{contradictions.length - 4} more in Resolve conflicts tab
        </p>
      )}
    </section>
  );
}
