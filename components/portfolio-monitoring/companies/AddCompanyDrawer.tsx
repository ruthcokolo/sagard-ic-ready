"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PORTFOLIO_SECTORS } from "@/lib/portfolio/sector-classification";
import {
  findPotentialDuplicateCompanies,
  type PotentialDuplicate,
} from "@/lib/portfolio/company-normalize";
import { normalizeWebsiteInput } from "@/lib/portfolio/company-website";
import type { PortfolioCompany } from "@/lib/portfolio/types";
import { getPortfolioReviewerOptions } from "@/lib/portfolio/bulk-assignment";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";

export type AddCompanyInput = {
  name: string;
  sector: string;
  websiteUrl?: string;
  status: PortfolioCompany["status"];
  reportingFrequency?: PortfolioCompany["reportingFrequency"];
  assignedAssociateId?: string;
  assignedAssociateName?: string;
  notes?: string;
  duplicateOverride?: boolean;
  matchedCompanyIds?: string[];
};

export function AddCompanyDrawer({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: AddCompanyInput) => { success: boolean; message: string; companyId?: string };
}) {
  const { state } = usePortfolio();
  const reviewers = useMemo(() => getPortfolioReviewerOptions(state), [state]);

  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<PortfolioCompany["status"]>("Active");
  const [frequency, setFrequency] =
    useState<PortfolioCompany["reportingFrequency"]>("Quarterly");
  const [ownerId, setOwnerId] = useState("");
  const [notes, setNotes] = useState("");
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [createAnyway, setCreateAnyway] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setSector("");
    setWebsite("");
    setStatus("Active");
    setFrequency("Quarterly");
    setOwnerId("");
    setNotes("");
    setWebsiteError(null);
    setCreateAnyway(false);
    setError(null);
  }, [open]);

  const duplicates = useMemo(() => {
    if (!name.trim()) return [] as PotentialDuplicate[];
    return findPotentialDuplicateCompanies(
      { name: name.trim(), websiteUrl: website.trim() || undefined },
      state.companies
    );
  }, [name, website, state.companies]);

  const exactOrDomain = duplicates.find(
    (d) => d.kind === "exact" || d.kind === "domain" || d.confidence === "high"
  );
  const fuzzy = duplicates.find((d) => d.kind === "fuzzy");
  const blockSave = Boolean(exactOrDomain) || (Boolean(fuzzy) && !createAnyway);

  if (!open) return null;

  function validateWebsite(): string | undefined {
    if (!website.trim()) {
      setWebsiteError(null);
      return undefined;
    }
    const result = normalizeWebsiteInput(website);
    if (!result.ok) {
      setWebsiteError(result.error);
      return undefined;
    }
    setWebsiteError(null);
    return result.value.displayUrl;
  }

  function handleSubmit() {
    setError(null);
    if (!name.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!sector.trim()) {
      setError("Sector is required.");
      return;
    }
    const websiteUrl = validateWebsite();
    if (website.trim() && !websiteUrl) return;
    if (blockSave) {
      setError("Resolve the duplicate warning before creating this company.");
      return;
    }

    const owner = reviewers.find((r) => r.id === ownerId);
    const result = onSubmit({
      name: name.trim(),
      sector,
      websiteUrl,
      status,
      reportingFrequency: frequency,
      assignedAssociateId: owner?.id,
      assignedAssociateName: owner?.name,
      notes: notes.trim() || undefined,
      duplicateOverride: Boolean(fuzzy && createAnyway),
      matchedCompanyIds: duplicates.map((d) => d.company.id),
    });
    if (!result.success) {
      setError(result.message);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-stone-900/30"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-stone-200 bg-[#faf9f7] shadow-2xl">
        <div className="border-b border-stone-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Add company</h2>
              <p className="mt-1 text-[12px] text-stone-500">
                Add a new portfolio company. Potential duplicates are checked before the company is
                created.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="text-[12px] font-medium text-stone-600">Company name</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setCreateAnyway(false);
              }}
              placeholder="Enter company name"
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-medium text-stone-600">Sector</span>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select sector</option>
              {PORTFOLIO_SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[12px] font-medium text-stone-600">Company website</span>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              onBlur={() => validateWebsite()}
              placeholder="https://company.com"
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            />
            {websiteError ? (
              <p className="mt-1 text-[11px] text-red-600">{websiteError}</p>
            ) : (
              <p className="mt-1 text-[11px] text-stone-400">Optional</p>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[12px] font-medium text-stone-600">Investment status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PortfolioCompany["status"])}
                className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
              >
                <option value="Active">Active</option>
                <option value="Watchlist">Watchlist</option>
                <option value="On hold">On hold</option>
                <option value="Exited">Exited</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[12px] font-medium text-stone-600">Reporting frequency</span>
              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as PortfolioCompany["reportingFrequency"])
                }
                className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Semi-annual">Semiannual</option>
                <option value="Annual">Annual</option>
                <option value="Ad hoc">Ad hoc</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-[12px] font-medium text-stone-600">Assigned owner</span>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {reviewers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[12px] font-medium text-stone-600">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
            />
          </label>

          {exactOrDomain ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-800">
              <p className="font-semibold">Possible duplicate found</p>
              <p className="mt-1">
                {exactOrDomain.company.name} already exists in{" "}
                {exactOrDomain.company.sector || "the portfolio"}.
              </p>
              <Link
                href={`/dashboard/portfolio/companies/${exactOrDomain.company.id}`}
                className="mt-2 inline-block font-semibold text-[#7a3344] hover:underline"
              >
                View existing company
              </Link>
            </div>
          ) : null}

          {!exactOrDomain && fuzzy ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-900">
              <p className="font-semibold">A similar company already exists.</p>
              <p className="mt-1">{fuzzy.company.name}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/portfolio/companies/${fuzzy.company.id}`}
                  className="font-semibold text-[#7a3344] hover:underline"
                >
                  View existing company
                </Link>
                <label className="inline-flex items-center gap-1.5 font-medium">
                  <input
                    type="checkbox"
                    checked={createAnyway}
                    onChange={(e) => setCreateAnyway(e.target.checked)}
                  />
                  Create anyway
                </label>
              </div>
            </div>
          ) : null}

          {error ? <p className="text-[12px] text-red-600">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-stone-200 bg-white px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-[13px] font-medium text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={blockSave}
            onClick={handleSubmit}
            className="rounded-lg bg-[#63202e] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[#521a26] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add company
          </button>
        </div>
      </aside>
    </div>
  );
}
