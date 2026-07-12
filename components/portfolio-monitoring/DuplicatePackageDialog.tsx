"use client";

/**
 * Dialog shown when an uploaded package matches an existing one.
 */
import type { ReportingPackage } from "@/lib/portfolio/types";

/** Asks the user how to handle a duplicate reporting package upload. */
export function DuplicatePackageDialog({
  existing,
  onViewExisting,
  onUploadAsVersion,
  onCancel,
}: {
  existing: ReportingPackage;
  onViewExisting: () => void;
  onUploadAsVersion: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-package-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
      >
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 id="duplicate-package-title" className="text-lg font-semibold text-stone-900">
            Similar package found
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            A similar reporting package already exists.
          </p>
        </div>
        <div className="space-y-2 px-5 py-4 text-sm text-stone-700">
          <p>
            <span className="font-medium text-stone-500">Company:</span> {existing.companyName}
          </p>
          <p>
            <span className="font-medium text-stone-500">Period:</span> {existing.reportPeriod}
          </p>
          <p className="break-all">
            <span className="font-medium text-stone-500">File:</span> {existing.fileName}
          </p>
          <p>
            <span className="font-medium text-stone-500">Status:</span> {existing.status}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-stone-200 px-3.5 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onViewExisting}
            className="rounded-xl border border-stone-200 px-3.5 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            View existing package
          </button>
          <button
            type="button"
            onClick={onUploadAsVersion}
            className="rounded-xl bg-[#63202e] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#521a26]"
          >
            Upload as a new version
          </button>
        </div>
      </div>
    </div>
  );
}
