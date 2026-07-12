"use client";

/**
 * Card showing how PDF source format affects extraction quality.
 */
import { SAMPLE_PDF_SOURCE_COPY } from "@/lib/portfolio/sample-pdf-catalog";

/** Shows how different PDF formats affect extraction accuracy. */
export function SourceFormatImpactCard() {
  const rows = [
    { ...SAMPLE_PDF_SOURCE_COPY["company-formatted"], tone: "stone" as const },
    { ...SAMPLE_PDF_SOURCE_COPY.template, tone: "emerald" as const },
  ];

  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="text-sm font-semibold text-stone-900">Source format impact</h2>
      <p className="mt-1 text-xs text-stone-500">
        Compare company-formatted reports with standardized ICReady template PDFs.
      </p>
      <ul className="mt-4 space-y-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className={`rounded-xl border px-3 py-2.5 text-sm ${
              row.tone === "emerald"
                ? "border-emerald-200/80 bg-emerald-50/40"
                : "border-stone-200 bg-stone-50/50"
            }`}
          >
            <p className="font-semibold text-stone-900">{row.label}</p>
            <p className="text-xs text-stone-600">{row.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
