/** Grid of synced source documents with type and freshness. */

import type { PipelineDeal } from "@/lib/deal-types";
import { getCompanySourceDocuments } from "@/lib/company-sources";

/** Lists diligence source files linked to the deal. */
export function SourceEvidenceGrid({ deal }: { deal: PipelineDeal }) {
  const sources = getCompanySourceDocuments(deal);

  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="text-sm font-semibold text-stone-900">
        Source evidence{" "}
        <span className="font-normal text-stone-500">({sources.length} sources synced)</span>
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {sources.map((doc) => (
          <article
            key={doc.id}
            className="rounded-xl border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-stone-900">{doc.name}</p>
                <p className="text-[11px] text-stone-500">{doc.subtitle}</p>
              </div>
              <span className="shrink-0 text-[10px] text-stone-400">{doc.syncedAt}</span>
            </div>
            <dl className="mt-3 space-y-1.5">
              {doc.fields.map((field) => (
                <div key={field.label} className="flex justify-between gap-3 text-sm">
                  <dt className="text-stone-500">{field.label}</dt>
                  <dd
                    className={`font-semibold tabular-nums ${
                      field.highlight ? "text-amber-800" : "text-stone-800"
                    }`}
                  >
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 border-t border-stone-100 pt-3 text-xs italic leading-relaxed text-stone-500">
              &ldquo;{doc.excerpt}&rdquo;
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
