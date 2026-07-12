"use client";

import { duplicateReasonLabels } from "@/lib/portfolio/duplicate-detection";
import type { DuplicateDetectionResult } from "@/lib/portfolio/monitoring-phase-types";

function formatWhen(iso?: string) {
  if (!iso) return "an earlier date";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function DuplicateFileDialog({
  fileName,
  actorName = "Alex",
  duplicate,
  onViewExisting,
  onSkip,
  onProcessAsVersion,
  onReplace,
  onTreatAsSeparate,
  onCancel,
}: {
  fileName: string;
  actorName?: string;
  duplicate: DuplicateDetectionResult;
  onViewExisting: () => void;
  onSkip: () => void;
  onProcessAsVersion: () => void;
  onReplace: () => void;
  onTreatAsSeparate?: () => void;
  onCancel: () => void;
}) {
  const isExact = duplicate.type === "exact_duplicate";
  const company = duplicate.existingCompanyName ?? "this company";
  const period = duplicate.existingReportPeriod ?? "the same period";
  const when = formatWhen(duplicate.existingUploadedAt);
  const reasons = duplicateReasonLabels(duplicate.reasons);

  if (!isExact) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/50 px-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dup-file-title"
          className="w-full max-w-lg overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
        >
          <div className="border-b border-stone-100 px-5 py-4">
            <h2 id="dup-file-title" className="font-display text-xl text-stone-900">
              This file appears to be a revised version.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              The company and reporting period match an existing package, but the file contents
              differ.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 bg-[#faf9f7] px-5 py-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onViewExisting}
              className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Compare versions
            </button>
            <button
              type="button"
              onClick={onProcessAsVersion}
              className="rounded-xl border border-[#63202e]/30 bg-white px-3.5 py-2 text-sm font-semibold text-[#63202e] hover:bg-[#fdf2f4]"
            >
              Upload as new version
            </button>
            <button
              type="button"
              onClick={onReplace}
              className="rounded-xl bg-[#63202e] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#521a26]"
            >
              Replace current version
            </button>
            {onTreatAsSeparate ? (
              <button
                type="button"
                onClick={onTreatAsSeparate}
                className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Treat as separate document
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dup-file-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
      >
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 id="dup-file-title" className="font-display text-xl text-stone-900">
            This file may already exist
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {actorName}, “{fileName}” appears to have already been uploaded for {company}, {period},
            on {when}.
          </p>
          <p className="mt-1 text-sm text-stone-600">Would you still like to process this file?</p>
        </div>

        <div className="px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Why it was flagged
          </p>
          <ul className="mt-2 space-y-1.5">
            {reasons.map((r) => (
              <li key={r} className="flex items-center gap-2 text-sm text-stone-700">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7a3344]" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 bg-[#faf9f7] px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onViewExisting}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            View existing package
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Skip this file
          </button>
          <button
            type="button"
            onClick={onProcessAsVersion}
            className="rounded-xl border border-[#63202e]/30 bg-white px-3.5 py-2 text-sm font-semibold text-[#63202e] hover:bg-[#fdf2f4]"
          >
            Process as new version
          </button>
          <button
            type="button"
            onClick={onReplace}
            className="rounded-xl bg-[#63202e] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#521a26]"
          >
            Replace existing file
          </button>
        </div>
      </div>
    </div>
  );
}
