"use client";

/**
 * Demo checklist guiding users through the portfolio monitoring workflow.
 */
import { useState } from "react";
import type { PortfolioState } from "@/lib/portfolio/types";

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

function buildChecklist(state: PortfolioState): ChecklistItem[] {
  const hasPackage = state.packages.some((p) => p.status === "Processed");
  const hasMetrics = state.metrics.length > 0;
  const approved = state.metrics.filter((m) => m.status === "Approved for reporting").length;
  const hasExport = state.exportHistory.length > 0;

  return [
    { id: "reset", label: "Reset demo data in Settings", done: false },
    { id: "load", label: "Load or upload a sample PDF", done: state.packages.length > 0 },
    { id: "process", label: "Process the PDF", done: hasPackage },
    { id: "review", label: "Review extracted metrics", done: hasMetrics },
    { id: "approve", label: "Approve selected metrics", done: approved >= 2 },
    { id: "overview", label: "Check Portfolio Overview", done: approved > 0 },
    { id: "export", label: "Export approved CSV", done: hasExport },
  ];
}

/** Interactive checklist for demo users to walk through key flows. */
export function DemoFlowChecklist({ state }: { state: PortfolioState }) {
  const [open, setOpen] = useState(true);
  const items = buildChecklist(state);
  const completed = items.filter((i) => i.done).length;

  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
      >
        <div>
          <h2 className="text-sm font-semibold text-stone-900">Demo flow</h2>
          <p className="text-xs text-stone-500">
            Interview checklist · {completed}/{items.length} complete
          </p>
        </div>
        <span className="text-stone-400">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <ul className="border-t border-stone-100 px-5 py-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2.5 py-1.5 text-sm text-stone-700">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  item.done
                    ? "bg-emerald-100 text-emerald-700"
                    : "border border-stone-200 bg-stone-50 text-stone-400"
                }`}
                aria-hidden
              >
                {item.done ? "✓" : ""}
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
