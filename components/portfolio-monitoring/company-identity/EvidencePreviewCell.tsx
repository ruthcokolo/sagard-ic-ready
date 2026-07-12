"use client";

/**
 * Table cell with a small preview snippet of metric evidence text.
 */
import type { ExtractedMetric } from "@/lib/portfolio/types";

/** Table cell with a truncated evidence text preview. */
export function EvidencePreviewCell({
  row,
  onViewEvidence,
}: {
  row: Pick<ExtractedMetric, "sourcePage" | "evidenceText">;
  onViewEvidence: () => void;
}) {
  const pageLabel = row.sourcePage ? `Page ${row.sourcePage}` : "Page unavailable";
  const excerpt = row.evidenceText?.trim();

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-stone-800">{pageLabel}</p>
      {excerpt ? (
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-stone-500" title={excerpt}>
          &ldquo;{excerpt}&rdquo;
        </p>
      ) : (
        <p className="mt-0.5 text-[11px] text-stone-400">Evidence unavailable</p>
      )}
      <button
        type="button"
        onClick={onViewEvidence}
        className="mt-1 text-[11px] font-semibold text-[#7a3344] hover:underline"
      >
        View evidence →
      </button>
    </div>
  );
}
