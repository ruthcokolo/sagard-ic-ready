"use client";

/** Collapsible panel listing ingested source documents for analysis. */

import { useState } from "react";
import { NORTHWIND_SOURCE_DOCUMENTS } from "@/lib/northwind-sources";

/** Expandable list of Northwind demo source inputs. */
export function SourceInputsPanel({ defaultOpen = true }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a3344]">
            Source inputs
          </p>
          <h2 className="mt-1 text-lg font-semibold text-stone-900">
            4 documents synced — review raw fields before analysis
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            ARR and concentration values differ across sources. Run analysis to detect conflicts with
            evidence.
          </p>
        </div>
        <span className="shrink-0 text-sm text-stone-400">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="grid gap-3 border-t border-stone-100 px-6 pb-6 pt-2 sm:grid-cols-2">
          {NORTHWIND_SOURCE_DOCUMENTS.map((doc) => (
            <article
              key={doc.id}
              className="rounded-xl border border-stone-200 bg-stone-50/50 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-stone-900">{doc.name}</p>
                  <p className="text-[11px] text-stone-500">{doc.subtitle}</p>
                </div>
                <span className="shrink-0 text-[10px] font-medium text-stone-400">{doc.syncedAt}</span>
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
              <p className="mt-3 border-t border-stone-200/80 pt-3 text-xs italic leading-relaxed text-stone-500">
                &ldquo;{doc.excerpt}&rdquo;
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
