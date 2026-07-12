"use client";

export function CompanyGuideDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-stone-900/30"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-xl border border-stone-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-xl text-[#63202e]">Company Guide</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-stone-400 hover:bg-stone-100"
          >
            ×
          </button>
        </div>
        <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-stone-600">
          <p>
            The Companies directory lists every portfolio company and is the entry point into each
            company profile.
          </p>
          <p>
            Company profiles hold overview metrics, performance history, reporting packages, risks,
            notes, and activity.
          </p>
          <p>
            Uploaded reports in Reporting Packages are linked to companies by selected company,
            normalized name, filename signals, and website domain when available.
          </p>
          <p>
            When you add a company manually, ICReady checks for duplicate names and website domains
            before saving.
          </p>
          <p>
            Metrics and reporting history live on the company profile tabs. Use Metric Review to
            validate extracted values.
          </p>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#63202e] px-3 py-2 text-[13px] font-semibold text-white"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
