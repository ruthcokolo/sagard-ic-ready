"use client";

import { resolveSourceDownload, triggerSourceDownload } from "@/lib/portfolio/source-download";

export function DownloadSourceLink({
  sourceFile,
  companyId,
  fileUrl,
  onDownload,
  className = "",
}: {
  sourceFile: string;
  companyId?: string;
  fileUrl?: string | null;
  /** When provided, called instead of resolving from catalog (e.g. in-memory upload). */
  onDownload?: () => boolean;
  className?: string;
}) {
  const resolved = resolveSourceDownload({ sourceFile, companyId, fileUrl });
  const canDownload = Boolean(onDownload) || Boolean(resolved.url);

  if (!canDownload) {
    return <span className="text-[11px] text-stone-400">Source unavailable</span>;
  }

  return (
    <button
      type="button"
      title={`Download ${resolved.fileName}`}
      onClick={() => {
        if (onDownload) {
          const ok = onDownload();
          if (ok) return;
        }
        if (resolved.url) {
          void triggerSourceDownload(resolved.url, resolved.fileName);
        }
      }}
      className={`inline-flex max-w-full items-start gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-left transition hover:border-emerald-300 hover:bg-emerald-100 ${className}`}
    >
      <svg
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
        />
      </svg>
      <span className="line-clamp-2 text-[11px] font-medium leading-snug text-emerald-800">
        {resolved.fileName}
      </span>
    </button>
  );
}
