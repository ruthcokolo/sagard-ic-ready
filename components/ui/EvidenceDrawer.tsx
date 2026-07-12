"use client";

/** Slide-out drawer showing source evidence for a claim or metric. */
import { useEffect } from "react";
import type { SourceEvidence } from "@/lib/source-evidence";

/** Side drawer that shows linked source documents and quotes. */
export function EvidenceDrawer({
  open,
  evidence,
  onClose,
}: {
  open: boolean;
  evidence: SourceEvidence | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !evidence) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close evidence drawer"
        className="absolute inset-0 bg-stone-900/30"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Source document
            </p>
            <h3 className="mt-1 text-lg font-semibold text-stone-900">{evidence.sourceName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-stone-500 hover:bg-stone-100"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
            {evidence.location}
          </p>
          <blockquote className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm leading-relaxed text-stone-800">
            &ldquo;{evidence.excerpt}&rdquo;
          </blockquote>
          <ul className="mt-5 space-y-2">
            {evidence.meta.map((line) => (
              <li key={line} className="text-sm text-stone-600">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
