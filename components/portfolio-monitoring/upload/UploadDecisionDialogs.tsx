"use client";

/**
 * Dialogs that ask the user to confirm company, period, and metadata during upload.
 */
import { useState } from "react";
import type { DuplicateDetectionResult } from "@/lib/portfolio/monitoring-phase-types";

/** Asks the user to confirm which company a PDF belongs to. */
export function CompanyConfirmationDialog({
  companyName,
  confidence,
  evidence,
  companies,
  onConfirm,
  onChooseAnother,
  onCreateNew,
  onCancel,
}: {
  companyName?: string;
  confidence?: string;
  evidence?: string;
  companies: { id: string; name: string }[];
  onConfirm: (companyId?: string, companyName?: string) => void;
  onChooseAnother: (companyId: string, companyName: string) => void;
  onCreateNew: () => void;
  onCancel: () => void;
}) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
      >
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="font-display text-xl text-stone-900">Confirm company</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                Detected company
              </dt>
              <dd className="mt-0.5 font-medium text-stone-900">
                {companyName ?? "No confident match"}
              </dd>
            </div>
            {confidence ? (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Confidence
                </dt>
                <dd className="mt-0.5 capitalize text-stone-700">{confidence}</dd>
              </div>
            ) : null}
            {evidence ? (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Evidence
                </dt>
                <dd className="mt-0.5 text-stone-600">{evidence}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        {picking ? (
          <div className="max-h-56 overflow-auto px-3 py-2">
            {companies.map((c) => (
              <button
                key={c.id}
                type="button"
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-stone-800 hover:bg-stone-50"
                onClick={() => onChooseAnother(c.id, c.name)}
              >
                {c.name}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 bg-[#faf9f7] px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700"
          >
            Choose another company
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700"
          >
            Create new company
          </button>
          <button
            type="button"
            disabled={!companyName}
            onClick={() => onConfirm()}
            className="rounded-xl bg-[#63202e] px-3.5 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Confirm company
          </button>
        </div>
      </div>
    </div>
  );
}

/** Asks the user to confirm the reporting period for a PDF. */
export function ReportingPeriodConfirmationDialog({
  detectedPeriod,
  otherPeriod,
  evidence,
  onConfirm,
  onChooseAnother,
  onCancel,
}: {
  detectedPeriod?: string;
  otherPeriod?: string;
  evidence?: string;
  onConfirm: (period: string) => void;
  onChooseAnother: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
      >
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="font-display text-xl text-stone-900">Confirm reporting period</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                Detected reporting period
              </dt>
              <dd className="mt-0.5 font-medium text-stone-900">{detectedPeriod ?? "—"}</dd>
            </div>
            {otherPeriod ? (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Other possible value
                </dt>
                <dd className="mt-0.5 text-stone-700">{otherPeriod}</dd>
              </div>
            ) : null}
            {evidence ? (
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Evidence
                </dt>
                <dd className="mt-0.5 text-stone-600">{evidence}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 bg-[#faf9f7] px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onChooseAnother}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700"
          >
            Choose another period
          </button>
          {detectedPeriod ? (
            <button
              type="button"
              onClick={() => onConfirm(detectedPeriod)}
              className="rounded-xl bg-[#63202e] px-3.5 py-2 text-sm font-semibold text-white"
            >
              Confirm {detectedPeriod}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Asks whether a PDF is related to an existing package. */
export function RelatedDocumentDialog({
  fileName,
  duplicate,
  onClassify,
  onCancel,
}: {
  fileName: string;
  duplicate: DuplicateDetectionResult;
  onClassify: (
    decision: "revision" | "supplement" | "separate" | "skip"
  ) => void;
  onCancel: () => void;
}) {
  const company = duplicate.existingCompanyName ?? "this company";
  const period = duplicate.existingReportPeriod ?? "the same period";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
      >
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="font-display text-xl text-stone-900">Related document</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            “{fileName}” is for {company}, {period}, but the filename differs from an existing
            package. How should this file be classified?
          </p>
        </div>
        <div className="space-y-2 px-5 py-4">
          {(
            [
              ["revision", "Revised report"],
              ["supplement", "Supplementary document"],
              ["separate", "Separate reporting package"],
              ["skip", "Accidental duplicate — skip"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onClassify(key)}
              className="block w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-left text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex justify-end border-t border-stone-100 bg-[#faf9f7] px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/** Warns when extracted metadata conflicts with user input. */
export function MetadataConflictDialog({
  fileName,
  selectedCompany,
  detectedCompany,
  selectedPeriod,
  detectedPeriod,
  onUseDetected,
  onKeepSelected,
  onCancel,
}: {
  fileName: string;
  selectedCompany?: string;
  detectedCompany?: string;
  selectedPeriod?: string;
  detectedPeriod?: string;
  onUseDetected: () => void;
  onKeepSelected: () => void;
  onCancel: () => void;
}) {
  const companyMismatch =
    selectedCompany &&
    detectedCompany &&
    selectedCompany.toLowerCase() !== detectedCompany.toLowerCase();
  const periodMismatch =
    selectedPeriod &&
    detectedPeriod &&
    selectedPeriod.toLowerCase() !== detectedPeriod.toLowerCase();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl"
      >
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="font-display text-xl text-stone-900">
            {companyMismatch ? "Company mismatch detected" : "Reporting period needs confirmation"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {companyMismatch
              ? `The PDF appears to reference ${detectedCompany}, but ${selectedCompany} is selected.`
              : `Filename or selection says ${selectedPeriod}, but report content suggests ${detectedPeriod}.`}
          </p>
          <p className="mt-1 text-[12px] text-stone-500">File: {fileName}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 bg-[#faf9f7] px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700"
          >
            Cancel upload
          </button>
          <button
            type="button"
            onClick={onKeepSelected}
            className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700"
          >
            Keep selected
          </button>
          <button
            type="button"
            onClick={onUseDetected}
            className="rounded-xl bg-[#63202e] px-3.5 py-2 text-sm font-semibold text-white"
          >
            Use detected {companyMismatch ? "company" : "period"}
          </button>
        </div>
        {periodMismatch && companyMismatch ? null : null}
      </div>
    </div>
  );
}

/** Notice shown when a PDF is password protected. */
export function PasswordProtectedNotice({
  fileName,
  onSkip,
  onDismiss,
}: {
  fileName: string;
  onSkip: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
      <h3 className="text-sm font-semibold text-stone-900">Password protected</h3>
      <p className="mt-1 text-[12px] text-stone-600">
        “{fileName}” appears to be password protected. Re-upload an unlocked file or skip this file.
        Do not retry endlessly.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg bg-[#63202e] px-3 py-1.5 text-[12px] font-semibold text-white"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-stone-700"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

/** Notice shown when a scanned PDF needs OCR processing. */
export function OcrRequiredNotice({ fileName }: { fileName: string }) {
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-4">
      <h3 className="text-sm font-semibold text-stone-900">OCR required</h3>
      <p className="mt-1 text-[12px] text-stone-600">
        “{fileName}” looks scanned or has limited selectable text. Extraction confidence will be
        lower. Native text extraction did not fully succeed.
      </p>
    </div>
  );
}
