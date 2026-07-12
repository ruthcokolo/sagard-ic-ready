"use client";

/** Full company diligence page: profile, analysis, conflicts, and decision workflow. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getDealById } from "@/lib/deals-pipeline";
import {
  buildAnalysisForDeal,
  buildCompletedAnalysis,
  buildPendingAnalysis,
} from "@/lib/generate-analysis";
import { runNorthwindPipeline } from "@/lib/analysis-pipeline";
import { runAnalysisClient } from "@/lib/analysis-client";
import { getExportLockState } from "@/lib/export-lock";
import { downloadIcPackagePdf } from "@/lib/export-document";
import type { AnalysisResult, Decision } from "@/lib/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { useDecisions } from "@/components/decisions/DecisionProvider";
import { CompanyPortfolioHeader } from "@/components/company/CompanyPortfolioHeader";
import { CompanyProfileCard } from "@/components/company/CompanyProfileCard";
import { DealSnapshotSection } from "@/components/company/DealSnapshotSection";
import { SourceEvidenceGrid } from "@/components/company/SourceEvidenceGrid";
import { AnalysisPreviewSection } from "@/components/company/AnalysisPreviewSection";
import { AnalysisPipelineStatus } from "@/components/company/AnalysisPipelineStatus";
import { ReadinessVerdict } from "@/components/company/ReadinessVerdict";
import { BlockingConflicts } from "@/components/company/BlockingConflicts";
import { UnsupportedClaims } from "@/components/company/UnsupportedClaims";
import { ChecklistTable } from "@/components/company/ChecklistTable";
import { DraftOnePager } from "@/components/company/DraftOnePager";
import { ICPackageReadiness } from "@/components/company/ICPackageReadiness";
import { AuditTrail } from "@/components/company/AuditTrail";
import { ReviewWorkflowSidebar } from "@/components/company/ReviewWorkflowSidebar";
import { SubmittedDecisionBanner } from "@/components/company/SubmittedDecisionBanner";
import {
  buildDiligenceTasksFromRationale,
  DecisionOutcomeModal,
  type DecisionOutcome,
} from "@/components/company/DecisionOutcomeModal";
import { resolveBackNav } from "@/components/ui/BackNav";

const NORTHWIND_ID = "northwind-logistics";
const NORTHWIND_PIPELINE_START = "Checking 4 sources (Google Sheets via n8n)…";

/** Orchestrates all company diligence panels for a single deal ID. */
export function CompanyDetailView({ dealId }: { dealId: string }) {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const back = resolveBackNav(from);
  const { user } = useAuth();
  const { submitDecision, getDealSubmission, hydrated } = useDecisions();
  const owner = user?.name ?? "Alex Rivera";

  const deal = getDealById(dealId);
  const existingSubmission = hydrated ? getDealSubmission(dealId) : undefined;
  const decisionLocked =
    !!existingSubmission &&
    (existingSubmission.decision === "proceed" || existingSubmission.decision === "pass");
  const initialAnalysis = useMemo(
    () => (deal ? buildAnalysisForDeal(deal) : null),
    [dealId, deal],
  );
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(initialAnalysis);
  const [analysisReady, setAnalysisReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pipelineStepIndex, setPipelineStepIndex] = useState(0);
  const [pipelineStepLabel, setPipelineStepLabel] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision>(null);
  const [rationale, setRationale] = useState("");
  const [proceedAnyway, setProceedAnyway] = useState(false);
  const [outcome, setOutcome] = useState<DecisionOutcome | null>(null);

  useEffect(() => {
    const d = getDealById(dealId);
    setAnalysis(d ? buildPendingAnalysis(d) : null);
    setAnalysisReady(false);
    setPipelineStepIndex(0);
    setPipelineStepLabel(null);
    setDecision(null);
    setRationale("");
    setProceedAnyway(false);
    setOutcome(null);
  }, [dealId]);

  const runAnalysis = useCallback(async () => {
    const d = getDealById(dealId);
    if (!d) return;
    setLoading(true);
    setAnalysisReady(false);
    setAnalysis(buildPendingAnalysis(d));
    setPipelineStepIndex(0);
    setPipelineStepLabel(NORTHWIND_PIPELINE_START);

    try {
      await runNorthwindPipeline((index, step) => {
        setPipelineStepIndex(index);
        setPipelineStepLabel(step.label);
      });

      let result: AnalysisResult;
      if (d.id === NORTHWIND_ID) {
        try {
          result = await runAnalysisClient();
        } catch {
          result = buildCompletedAnalysis(d);
        }
      } else {
        result = buildCompletedAnalysis(d);
      }
      setAnalysis(result);
      setAnalysisReady(true);
    } finally {
      setLoading(false);
      setPipelineStepLabel(null);
    }
  }, [dealId]);

  const exportState = useMemo(() => {
    if (!analysis || !deal) {
      return {
        locks: [],
        canSubmit: false,
        canExportCommitteePackage: false,
        proceedLocked: false,
        proceedLockReason: null,
        readyMessage: null,
        unresolvedBlockerCount: 0,
        materialConflictCount: 0,
        submitLabel: "Complete your decision first",
      };
    }
    return getExportLockState(analysis, deal, decision, rationale, proceedAnyway);
  }, [analysis, deal, decision, rationale, proceedAnyway]);

  if (!deal || !analysis) return null;

  const analysisPending = !analysisReady;

  const handleSubmitDecision = () => {
    if (!exportState.canSubmit || !decision || !deal) return;

    submitDecision({
      deal,
      analysis,
      decision,
      rationale: rationale.trim(),
      owner,
    });

    if (decision === "proceed") {
      downloadIcPackagePdf(analysis, decision, rationale.trim());
      setOutcome({ type: "proceed", dealName: deal.name });
      return;
    }

    if (decision === "more_diligence") {
      setOutcome({
        type: "more_diligence",
        dealName: deal.name,
        tasks: buildDiligenceTasksFromRationale(rationale),
      });
      return;
    }

    setOutcome({ type: "pass", dealName: deal.name });
  };

  return (
    <div className="min-h-screen bg-[#f4f2ef]">
      <CompanyPortfolioHeader
        deal={deal}
        analysis={analysis}
        analysisPending={analysisPending}
        running={loading}
        backHref={back.href}
        backLabel={back.label}
        onRunAnalysis={runAnalysis}
      />

      <div className="px-8 pb-16 pt-6">
        {from === "onboarding" && (
          <div className="mb-6 rounded-xl border border-[#7a3344]/20 bg-[#fdf2f4] px-4 py-3 text-sm text-stone-700">
            <strong className="text-stone-900">Guided walkthrough:</strong> Review synced sources,
            click <strong>Run analysis</strong>, then record your decision. Conflicts block committee
            recommendation — not every outcome.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          <div className="min-w-0 space-y-6">
            <CompanyProfileCard deal={deal} />
            <DealSnapshotSection deal={deal} analysisPending={analysisPending} />
            <SourceEvidenceGrid deal={deal} />

            {loading && (
              <AnalysisPipelineStatus
                running={loading}
                stepIndex={pipelineStepIndex}
                stepLabel={pipelineStepLabel}
                analysisReady={analysisReady}
                onRun={runAnalysis}
              />
            )}

            {analysisPending && !loading && <AnalysisPreviewSection />}

            {analysisReady && (
              <>
                <ReadinessVerdict analysis={analysis} analysisPending={false} />
                <BlockingConflicts
                  analysis={analysis}
                  loading={loading}
                  analysisPending={false}
                  onRefresh={runAnalysis}
                />
                <UnsupportedClaims claims={analysis.unsupportedClaims} />
                <ChecklistTable checklist={analysis.checklist} />
                <DraftOnePager analysis={analysis} />
                <ICPackageReadiness sections={analysis.packageSections} />
                <AuditTrail events={analysis.auditTrail} />
              </>
            )}
          </div>

          <div className="lg:sticky lg:top-4">
            {decisionLocked && existingSubmission ? (
              <SubmittedDecisionBanner submission={existingSubmission} />
            ) : (
              <ReviewWorkflowSidebar
                analysisPending={analysisPending}
                running={loading}
                decision={decision}
                rationale={rationale}
                proceedAnyway={proceedAnyway}
                exportState={exportState}
                analysis={analysis}
                onDecisionChange={setDecision}
                onRationaleChange={setRationale}
                onProceedAnywayChange={setProceedAnyway}
                onExport={handleSubmitDecision}
              />
            )}
          </div>
        </div>
      </div>

      <DecisionOutcomeModal outcome={outcome} onClose={() => setOutcome(null)} />
    </div>
  );
}
