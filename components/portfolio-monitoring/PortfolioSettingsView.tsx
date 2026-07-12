"use client";

import { useState } from "react";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import { isDemoReportsEnabled } from "@/lib/portfolio/demo-report-catalog";

export function PortfolioSettingsView() {
  const { state, updateSettings, resetDemoData, clearUploadedPackages } = usePortfolio();
  const [message, setMessage] = useState<string | null>(null);
  const showDemo = isDemoReportsEnabled();

  return (
    <div className="min-h-screen bg-[#f4f2ef] px-8 py-6">
      <div>
        <h1 className="font-display text-3xl text-stone-900">Settings</h1>
        <p className="mt-1 text-sm text-stone-500">Portfolio monitoring configuration.</p>
      </div>

      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}

      <section className="mt-6 rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">Validation settings</h2>
        <label className="mt-4 flex items-center justify-between gap-4 text-sm">
          <span>Require human validation before export</span>
          <input
            type="checkbox"
            checked={state.settings.requireHumanValidation}
            onChange={(e) => updateSettings({ requireHumanValidation: e.target.checked })}
          />
        </label>
        <label className="mt-3 block text-sm">
          Default confidence threshold
          <select
            value={state.settings.defaultConfidenceThreshold}
            onChange={(e) =>
              updateSettings({
                defaultConfidenceThreshold: e.target.value as "High" | "Medium" | "Low",
              })
            }
            className="mt-1 w-full max-w-xs rounded-lg border border-stone-200 px-3 py-2 text-sm"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
      </section>

      <section className="mt-4 rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">Upload settings</h2>
        <p className="mt-2 text-sm text-stone-600">
          Allowed file type: {state.settings.allowedFileType}
        </p>
        <label className="mt-3 flex items-center justify-between gap-4 text-sm">
          <span>Assume selectable text PDFs (no OCR in POC)</span>
          <input
            type="checkbox"
            checked={state.settings.assumeSelectableText}
            onChange={(e) => updateSettings({ assumeSelectableText: e.target.checked })}
          />
        </label>
      </section>

      <section className="mt-4 rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-stone-900">Export settings</h2>
        <p className="mt-2 text-sm text-stone-600">
          Default format: {state.settings.defaultExportFormat}
        </p>
      </section>

      {showDemo ? (
        <section className="mt-4 rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-900">Demo data controls</h2>
          <p className="mt-1 text-sm text-stone-500">
            Reset seeded demo data or remove user-uploaded packages from localStorage. Hidden when
            NEXT_PUBLIC_ENABLE_DEMO_REPORTS=false.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                setMessage("Demo data reset to seed state.");
              }}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700"
            >
              Reset demo data
            </button>
            <button
              type="button"
              onClick={() => {
                clearUploadedPackages();
                setMessage("Uploaded packages cleared.");
              }}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-700"
            >
              Clear uploaded packages
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
