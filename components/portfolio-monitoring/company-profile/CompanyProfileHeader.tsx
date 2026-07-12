"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CompanyAvatar } from "@/components/portfolio-monitoring/company-identity";
import {
  formatShortDate,
  MissingMeta,
  StatusPill,
} from "@/components/portfolio-monitoring/company-profile/shared";
import {
  getCompanyProfileDisplayName,
  getInvestmentStatusLabel,
  type CompanyReportingStatusLabel,
} from "@/lib/portfolio/company-profile-selectors";
import { formatWebsiteProvenance } from "@/lib/portfolio/company-website";
import type { PortfolioCompany, ReportingPackage } from "@/lib/portfolio/types";
import { METRIC_REVIEW_PATH } from "@/lib/portfolio/metric-review-url-state";

type Props = {
  company: PortfolioCompany;
  reportingStatus: CompanyReportingStatusLabel;
  latestPackage: ReportingPackage | null;
  lastReportLabel: string | null;
  onDownloadLatest: () => void;
  onAddNote: () => void;
  onAddFollowUp: () => void;
  onOpenDocuments: () => void;
  canEditProfile: boolean;
  onEditProfile: () => void;
  onResolveWebsiteConflict?: (decision: "keep" | "replace") => void;
};

function statusTone(
  status: CompanyReportingStatusLabel
): "green" | "amber" | "red" | "stone" {
  if (status === "Up to date") return "green";
  if (status === "Needs validation") return "amber";
  if (status === "Report overdue" || status === "Extraction issue") return "red";
  return "stone";
}

function MetaCell({
  label,
  value,
  missingTooltip,
  last = false,
}: {
  label: string;
  value: React.ReactNode;
  missingTooltip?: string;
  last?: boolean;
}) {
  const empty = value == null || value === "";
  return (
    <div
      className={`min-w-0 flex-1 px-3 py-2 first:pl-0 last:pr-0 ${
        last ? "" : "border-r border-stone-200/80"
      }`}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-0.5 truncate text-[13px] font-medium text-stone-800">
        {empty ? <MissingMeta tooltip={missingTooltip} /> : value}
      </p>
    </div>
  );
}

const actionBtn =
  "inline-flex h-8 shrink-0 items-center rounded-lg border border-stone-200 bg-white px-2.5 text-[12px] font-medium text-stone-700 transition hover:border-stone-300 disabled:cursor-not-allowed disabled:opacity-50";

export function CompanyProfileHeader({
  company,
  reportingStatus,
  latestPackage,
  lastReportLabel,
  onDownloadLatest,
  onAddNote,
  onAddFollowUp,
  onOpenDocuments,
  canEditProfile,
  onEditProfile,
  onResolveWebsiteConflict,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayName = getCompanyProfileDisplayName(company);
  const hasLatest = Boolean(latestPackage);
  const websiteProvenance = formatWebsiteProvenance(company);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const reviewHref = latestPackage
    ? `${METRIC_REVIEW_PATH}?companyId=${encodeURIComponent(company.id)}&packageId=${encodeURIComponent(latestPackage.id)}`
    : METRIC_REVIEW_PATH;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/portfolio/companies"
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#7a3344] hover:underline"
        >
          ← Back to Companies
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            disabled={!hasLatest}
            title={hasLatest ? "Download latest report PDF" : "No report available"}
            onClick={onDownloadLatest}
            className={actionBtn}
          >
            Download latest report
          </button>
          {hasLatest ? (
            <Link href={reviewHref} className={actionBtn}>
              Open latest review
            </Link>
          ) : (
            <span title="No report available" className={`${actionBtn} opacity-50`}>
              Open latest review
            </span>
          )}
          <button type="button" onClick={onOpenDocuments} className={`${actionBtn} hidden lg:inline-flex`}>
            Company documents
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="More actions"
              onClick={() => setMenuOpen((o) => !o)}
              className={`${actionBtn} px-2.5`}
            >
              ···
            </button>
            {menuOpen ? (
              <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                {canEditProfile ? (
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50"
                    onClick={() => {
                      setMenuOpen(false);
                      onEditProfile();
                    }}
                  >
                    Edit company profile
                  </button>
                ) : null}
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onAddNote();
                  }}
                >
                  Add internal note
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onAddFollowUp();
                  }}
                >
                  Add follow-up
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50 lg:hidden"
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenDocuments();
                  }}
                >
                  Company documents
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200/80 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] sm:px-5">
        <div className="flex items-start gap-3.5">
          <CompanyAvatar
            companyId={company.id}
            companyName={company.name}
            size="lg"
            className="!h-[54px] !w-[54px] !text-[15px]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h1
                  className="truncate font-display text-[34px] leading-[1.05] text-stone-900"
                  title={displayName}
                >
                  {displayName}
                </h1>
                <p className="mt-1 text-[13px] text-stone-500">
                  {company.sector} · {getInvestmentStatusLabel(company.status)}
                </p>
                {company.websiteUrl ? (
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]">
                    <span className="font-medium text-stone-500">Company website</span>
                    <a
                      href={company.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#7a3344] hover:underline"
                    >
                      {company.websiteDomain ?? company.websiteUrl}
                    </a>
                    {websiteProvenance ? (
                      <span className="text-stone-400">· {websiteProvenance}</span>
                    ) : null}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {company.pendingWebsiteUrl ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] text-amber-950">
            <p className="font-semibold">The latest report contains a different website.</p>
            <p className="mt-0.5 text-amber-900/80">
              Suggested: {company.pendingWebsiteUrl}
              {company.pendingWebsiteSourcePage != null
                ? ` · Page ${company.pendingWebsiteSourcePage}`
                : ""}
            </p>
            {onResolveWebsiteConflict ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onResolveWebsiteConflict("keep")}
                  className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold"
                >
                  Keep existing
                </button>
                <button
                  type="button"
                  onClick={() => onResolveWebsiteConflict("replace")}
                  className="rounded-md bg-[#63202e] px-2.5 py-1 text-[11px] font-semibold text-white"
                >
                  Replace website
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex min-h-[56px] items-stretch overflow-x-auto border-t border-stone-100 pt-2.5">
          <MetaCell
            label="Investment date"
            value={company.investmentDate ? formatShortDate(company.investmentDate) : null}
            missingTooltip="Investment date not set"
          />
          <MetaCell
            label="Reporting frequency"
            value={company.reportingFrequency ?? null}
            missingTooltip="Reporting schedule not set"
          />
          <MetaCell
            label="Assigned to"
            value={company.assignedAssociateName ?? null}
            missingTooltip="No associate assigned"
          />
          <MetaCell
            label="Next expected report"
            value={
              company.nextExpectedReportDate
                ? formatShortDate(company.nextExpectedReportDate)
                : null
            }
            missingTooltip="Next expected report not configured"
          />
          <MetaCell
            label="Last report received"
            value={lastReportLabel}
            missingTooltip="No reports received yet"
          />
          <div className="flex min-w-[7rem] shrink-0 flex-col justify-center px-3 py-2 pl-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">Status</p>
            <div className="mt-1">
              <StatusPill label={reportingStatus} tone={statusTone(reportingStatus)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
