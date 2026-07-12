"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import { CompanyProfileHeader } from "@/components/portfolio-monitoring/company-profile/CompanyProfileHeader";
import { CompanyProfileTabs } from "@/components/portfolio-monitoring/company-profile/CompanyProfileTabs";
import { CompanyOverviewTab } from "@/components/portfolio-monitoring/company-profile/CompanyOverviewTab";
import { CompanyContactsPanel } from "@/components/portfolio-monitoring/company-profile/CompanyContactsPanel";
import { CompanyPerformanceView } from "@/components/portfolio-monitoring/company-profile/CompanyPerformanceView";
import { CompanyReportsView } from "@/components/portfolio-monitoring/company-profile/CompanyReportsView";
import { CompanyRisksView } from "@/components/portfolio-monitoring/company-profile/CompanyRisksView";
import { CompanyActivityView } from "@/components/portfolio-monitoring/company-profile/CompanyActivityView";
import { CompanyNotesView } from "@/components/portfolio-monitoring/company-profile/CompanyNotesView";
import { formatShortDate } from "@/components/portfolio-monitoring/company-profile/shared";
import { resolvePortfolioAssociateIdentity } from "@/lib/portfolio/bulk-assignment";
import {
  getApprovedCompanyMetrics,
  getCompanyAiSummary,
  getCompanyChangesSinceLastReport,
  getCompanyHeadlineMetrics,
  getCompanyNotes,
  getCompanyOpenRisks,
  getCompanyRecentActivity,
  getCompanyReportHistory,
  getCompanyReportingHealth,
  getCompanyReportingPackages,
  getCompanyReportingStatus,
  getCompanyRiskCandidates,
  getLatestCompanyPackage,
  type CompanyProfileTab,
} from "@/lib/portfolio/company-profile-selectors";
import type { MetricName, PortfolioCompany } from "@/lib/portfolio/types";

const VALID_TABS: CompanyProfileTab[] = [
  "overview",
  "performance",
  "reports",
  "risks",
  "activity",
  "notes",
];

export function CompanyDetailView({ companyId }: { companyId: string }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const {
    state,
    hydrated,
    getCompanyById,
    downloadPackagePdf,
    addCompanyNote,
    updateCompanyNote,
    deleteCompanyNote,
    addCompanyFollowUp,
    updateCompanyFollowUp,
    updateCompanyProfile,
    resolveWebsiteConflict,
  } = usePortfolio();

  const tabParam = searchParams.get("tab");
  const initialTab =
    tabParam && VALID_TABS.includes(tabParam as CompanyProfileTab)
      ? (tabParam as CompanyProfileTab)
      : "overview";
  const [tab, setTab] = useState<CompanyProfileTab>(initialTab);

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam as CompanyProfileTab)) {
      setTab(tabParam as CompanyProfileTab);
    }
  }, [tabParam]);

  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [composeNote, setComposeNote] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const company = getCompanyById(companyId);

  const derived = useMemo(() => {
    if (!company) return null;
    const packages = getCompanyReportingPackages(state, companyId);
    const latest = getLatestCompanyPackage(state, companyId);
    const headlines = getCompanyHeadlineMetrics(state, companyId);
    const approved = getApprovedCompanyMetrics(state, companyId);
    const availableMetrics = [
      ...new Set(approved.map((m) => m.metricName)),
    ] as MetricName[];
    const lastReportLabel = latest
      ? `${formatShortDate(latest.uploadedAt)} · ${latest.reportPeriod}`
      : null;

    return {
      packages,
      latest,
      headlines,
      changes: getCompanyChangesSinceLastReport(state, companyId),
      aiSummary: getCompanyAiSummary(state, companyId),
      health: getCompanyReportingHealth(state, companyId),
      risks: getCompanyOpenRisks(state, companyId),
      candidates: getCompanyRiskCandidates(state, companyId),
      reportHistory: getCompanyReportHistory(state, companyId),
      notes: getCompanyNotes(state, companyId),
      activity: getCompanyRecentActivity(state, companyId),
      reportingStatus: getCompanyReportingStatus(state, companyId),
      availableMetrics,
      hasPackages: packages.length > 0,
      hasApproved: approved.length > 0,
      lastReportLabel,
      documentCount: packages.length,
    };
  }, [company, state, companyId]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#f4f2ef] px-4 py-6 sm:px-8">
        <p className="text-sm text-stone-500">Loading company profile…</p>
      </div>
    );
  }

  if (!company || !derived) {
    return (
      <div className="min-h-screen bg-[#f4f2ef] px-4 py-6 sm:px-8">
        <p className="text-stone-600">Company not found.</p>
        <Link
          href="/dashboard/portfolio/companies"
          className="mt-2 inline-block text-sm font-semibold text-[#7a3344]"
        >
          ← Back to Companies
        </Link>
      </div>
    );
  }

  const userId = user?.id ?? "associate";
  const userName = user?.name ?? "Associate";

  const goNotes = () => {
    setTab("notes");
    setComposeNote(true);
  };

  const goRisks = () => {
    setTab("risks");
  };

  const openReport = (packageId: string) => {
    setSelectedPackageId(packageId);
    setTab("reports");
  };

  return (
    <div className="min-h-screen bg-[#f4f2ef] px-6 py-5 sm:px-8">
      <div className="mx-auto max-w-[1480px] space-y-3.5">
        <CompanyProfileHeader
          company={company}
          reportingStatus={derived.reportingStatus}
          latestPackage={derived.latest}
          lastReportLabel={derived.lastReportLabel}
          onDownloadLatest={() => {
            if (derived.latest) downloadPackagePdf(derived.latest.id);
          }}
          onAddNote={goNotes}
          onAddFollowUp={goRisks}
          onOpenDocuments={() => setTab("reports")}
          canEditProfile
          onEditProfile={() => setEditProfileOpen(true)}
          onResolveWebsiteConflict={(decision) =>
            resolveWebsiteConflict(company.id, decision)
          }
        />

        <CompanyProfileTabs active={tab} onChange={setTab} />

        <div className="pt-0.5">
          {tab === "overview" ? (
            <div className="space-y-4">
              <CompanyOverviewTab
                headlines={derived.headlines}
                changes={derived.changes}
                aiSummary={derived.aiSummary}
                health={derived.health}
                risks={derived.risks}
                riskCandidates={derived.candidates}
                reportHistory={derived.reportHistory}
                notes={derived.notes}
                documentCount={derived.documentCount}
                hasPackages={derived.hasPackages}
                onTab={(t) => {
                  if (t === "notes") setComposeNote(true);
                  setTab(t);
                }}
                onViewReport={openReport}
                onAddNote={goNotes}
              />
              <CompanyContactsPanel companyId={companyId} />
            </div>
          ) : null}

          {tab === "performance" ? (
            <CompanyPerformanceView
              state={state}
              companyId={companyId}
              availableMetrics={derived.availableMetrics}
              hasPackages={derived.hasPackages}
              hasApproved={derived.hasApproved}
            />
          ) : null}

          {tab === "reports" ? (
            <CompanyReportsView
              state={state}
              companyId={companyId}
              rows={derived.reportHistory}
              packages={derived.packages}
              selectedPackageId={selectedPackageId}
              onSelectPackage={setSelectedPackageId}
              onDownload={(id) => downloadPackagePdf(id)}
            />
          ) : null}

          {tab === "risks" ? (
            <CompanyRisksView
              risks={(state.companyFollowUps ?? []).filter(
                (f) => f.companyId === companyId
              )}
              candidates={derived.candidates}
              currentUserName={userName}
              onAdd={(input) =>
                addCompanyFollowUp({
                  companyId,
                  title: input.title,
                  category: input.category,
                  source: input.source,
                  priority: input.priority,
                  ownerName: input.ownerName,
                  dueDate: input.dueDate,
                  notes: input.notes,
                  createdBy: userName,
                })
              }
              onUpdate={(id, patch) => updateCompanyFollowUp(id, patch)}
            />
          ) : null}

          {tab === "activity" ? (
            <CompanyActivityView events={derived.activity} />
          ) : null}

          {tab === "notes" ? (
            <CompanyNotesView
              notes={derived.notes}
              currentUserId={userId}
              currentUserName={userName}
              autoFocusCompose={composeNote}
              onAdd={(body) => {
                addCompanyNote({
                  companyId,
                  authorId: userId,
                  authorName: userName,
                  body,
                });
                setComposeNote(false);
              }}
              onUpdate={updateCompanyNote}
              onDelete={deleteCompanyNote}
            />
          ) : null}
        </div>
      </div>

      {editProfileOpen ? (
        <EditCompanyProfileModal
          company={company}
          onClose={() => setEditProfileOpen(false)}
          onSave={(patch) => {
            updateCompanyProfile(companyId, patch);
            setEditProfileOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function EditCompanyProfileModal({
  company,
  onClose,
  onSave,
}: {
  company: PortfolioCompany;
  onClose: () => void;
  onSave: (
    patch: Partial<
      Pick<
        PortfolioCompany,
        | "investmentDate"
        | "reportingFrequency"
        | "assignedAssociateId"
        | "assignedAssociateName"
        | "nextExpectedReportDate"
        | "status"
      >
    >
  ) => void;
}) {
  const [investmentDate, setInvestmentDate] = useState(company.investmentDate ?? "");
  const [reportingFrequency, setReportingFrequency] = useState(
    company.reportingFrequency ?? ""
  );
  const [assignedAssociateName, setAssignedAssociateName] = useState(
    company.assignedAssociateName ?? ""
  );
  const [nextExpectedReportDate, setNextExpectedReportDate] = useState(
    company.nextExpectedReportDate ?? ""
  );
  const [status, setStatus] = useState(company.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="font-display text-xl text-stone-900">Edit company profile</h2>
        <p className="mt-1 text-xs text-stone-500">
          Only set fields you know — leave blank to keep unset.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="text-xs font-medium text-stone-500">Investment date</span>
            <input
              type="date"
              value={investmentDate}
              onChange={(e) => setInvestmentDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-stone-500">Reporting frequency</span>
            <select
              value={reportingFrequency}
              onChange={(e) => setReportingFrequency(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            >
              <option value="">Not set</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Semi-annual">Semi-annual</option>
              <option value="Annual">Annual</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-stone-500">Assigned associate</span>
            <input
              value={assignedAssociateName}
              onChange={(e) => setAssignedAssociateName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              placeholder="Name"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-stone-500">Next expected report</span>
            <input
              type="date"
              value={nextExpectedReportDate}
              onChange={(e) => setNextExpectedReportDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-stone-500">Investment status</span>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as PortfolioCompany["status"])
              }
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            >
              <option value="Active">Active</option>
              <option value="Watchlist">Watchlist</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-sm text-stone-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const trimmed = assignedAssociateName.trim();
              const identity = trimmed
                ? resolvePortfolioAssociateIdentity(trimmed)
                : null;
              onSave({
                investmentDate: investmentDate || undefined,
                reportingFrequency: (reportingFrequency ||
                  undefined) as PortfolioCompany["reportingFrequency"],
                assignedAssociateId: identity?.id ?? "",
                assignedAssociateName: identity?.name ?? "",
                nextExpectedReportDate: nextExpectedReportDate || undefined,
                status,
              });
            }}
            className="rounded-xl bg-[#7a3344] px-4 py-2 text-sm font-medium text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

