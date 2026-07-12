"use client";

export function CompanyDirectoryBanner({
  onLearnMore,
  onDismiss,
}: {
  onLearnMore: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-[#fbf6e9] px-4 py-3">
      <div className="min-w-0 max-w-3xl pr-6">
        <p className="text-[13px] font-semibold text-stone-800">
          Adding companies is simple and smart.
        </p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-stone-600">
          Provide company name, sector, and an optional website when adding manually. Potential
          duplicates are flagged before saving. When a future report matches an existing company, it
          will be linked automatically.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onLearnMore}
          className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-stone-700 hover:bg-stone-50"
        >
          Learn more
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Dismiss banner"
          onClick={onDismiss}
          className="rounded p-1 text-stone-400 hover:bg-stone-200/60 hover:text-stone-600"
        >
          ×
        </button>
      </div>
    </div>
  );
}
