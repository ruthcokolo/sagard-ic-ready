"use client";

import { useMemo, useState } from "react";
import { getPortfolioReviewerOptions } from "@/lib/portfolio/bulk-assignment";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import { PORTFOLIO_SECTORS } from "@/lib/portfolio/sector-classification";

export function AssignOwnerDialog({
  companyId,
  open,
  onClose,
}: {
  companyId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { state, updateCompanyProfile } = usePortfolio();
  const company = companyId ? state.companies.find((c) => c.id === companyId) : null;
  const reviewers = useMemo(() => getPortfolioReviewerOptions(state), [state]);
  const [ownerId, setOwnerId] = useState(company?.assignedAssociateId ?? "");

  if (!open || !company) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-stone-900/30" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-sm rounded-xl border border-stone-200 bg-white p-5 shadow-xl">
        <h2 className="text-base font-semibold text-stone-900">Assign owner</h2>
        <p className="mt-1 text-[12px] text-stone-500">{company.name}</p>
        <select
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          className="mt-4 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
        >
          <option value="">Unassigned</option>
          {reviewers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-[13px] font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const owner = reviewers.find((r) => r.id === ownerId);
              updateCompanyProfile(company.id, {
                assignedAssociateId: owner?.id ?? "",
                assignedAssociateName: owner?.name ?? "",
              });
              onClose();
            }}
            className="rounded-lg bg-[#63202e] px-3 py-1.5 text-[13px] font-semibold text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function ManageSectorsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-stone-900/30" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-md rounded-xl border border-stone-200 bg-white p-5 shadow-xl">
        <h2 className="text-base font-semibold text-stone-900">Manage sectors</h2>
        <p className="mt-1 text-[12px] text-stone-500">
          Canonical portfolio sectors used across Companies and Reporting Packages.
        </p>
        <ul className="mt-4 divide-y divide-stone-100 rounded-lg border border-stone-200">
          {PORTFOLIO_SECTORS.map((s) => (
            <li key={s} className="px-3 py-2 text-[13px] text-stone-700">
              {s}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#63202e] px-3 py-1.5 text-[13px] font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
