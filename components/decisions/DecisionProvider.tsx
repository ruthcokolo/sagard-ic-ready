"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { PipelineDeal } from "@/lib/deal-types";
import type { DealFilters, SortField, SortDir } from "@/lib/deal-query";
import {
  buildQueueAddition,
  countEffectiveWorkload,
  EMPTY_DECISION_STATE,
  filterEffectiveQueue,
  getEffectiveStep,
  getExportSummaryFromState,
  getMergedExportHistory,
  getNextQueueDealId,
  getSubmissionForDeal,
  isDealInActiveQueue,
  sortEffectiveQueue,
  type DecisionAppState,
} from "@/lib/decision-queue";
import {
  createRecordedDecision,
  dedupeSubmissions,
  stepAfterDecision,
  type RecordedDecision,
  type StepOverride,
} from "@/lib/decision-records";
import { getAssignedStep } from "@/lib/assigned-queue";
import type { AnalysisResult, Decision } from "@/lib/types";
import type { ExportHistoryItem } from "@/lib/exports-mock";

const STORAGE_KEY = "icready-decision-state";

type SubmitInput = {
  deal: PipelineDeal;
  analysis: AnalysisResult;
  decision: Exclude<Decision, null>;
  rationale: string;
  owner: string;
};

type DecisionContextValue = {
  hydrated: boolean;
  submissions: RecordedDecision[];
  submitDecision: (input: SubmitInput) => RecordedDecision;
  getExportHistory: () => ExportHistoryItem[];
  getExportSummary: () => ReturnType<typeof getExportSummaryFromState>;
  getWorkloadCounts: () => ReturnType<typeof countEffectiveWorkload>;
  getQueueDeals: (filters: DealFilters, currentUser?: string) => PipelineDeal[];
  sortQueueDeals: (deals: PipelineDeal[], field: SortField, dir: SortDir) => PipelineDeal[];
  getDealStep: (dealId: string) => ReturnType<typeof getEffectiveStep>;
  getDealSubmission: (dealId: string) => RecordedDecision | undefined;
  isInActiveQueue: (dealId: string) => boolean;
  nextQueueDealId: string | null;
  latestSubmission: RecordedDecision | null;
};

const DecisionContext = createContext<DecisionContextValue | null>(null);

function loadState(): DecisionAppState {
  if (typeof window === "undefined") return EMPTY_DECISION_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DECISION_STATE;
    const parsed = JSON.parse(raw) as DecisionAppState;
    const submissions = dedupeSubmissions(parsed.submissions ?? []);
    return {
      submissions,
      stepOverrides: parsed.stepOverrides ?? {},
      queueAdditions: parsed.queueAdditions ?? [],
    };
  } catch {
    return EMPTY_DECISION_STATE;
  }
}

function persistState(state: DecisionAppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function DecisionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DecisionAppState>(EMPTY_DECISION_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    persistState(loaded);
    setHydrated(true);
  }, []);

  const submitDecision = useCallback((input: SubmitInput) => {
    const record = createRecordedDecision({
      dealId: input.deal.id,
      dealName: input.deal.name,
      categoryId: input.deal.categoryId,
      decision: input.decision,
      rationale: input.rationale,
      owner: input.owner,
      analysis: input.analysis,
    });

    const nextStep: StepOverride = stepAfterDecision(input.decision);

    setState((prev) => {
      const stepOverrides = { ...prev.stepOverrides, [input.deal.id]: nextStep };
      let queueAdditions = [...prev.queueAdditions];

      if (input.decision === "more_diligence") {
        const inAssigned = !!getAssignedStep(input.deal.id);
        const alreadyAdded = queueAdditions.some((d) => d.id === input.deal.id);
        if (!inAssigned && !alreadyAdded) {
          const addition = buildQueueAddition(input.deal.id);
          if (addition) queueAdditions = [...queueAdditions, addition];
        }
      } else {
        queueAdditions = queueAdditions.filter((d) => d.id !== input.deal.id);
      }

      const withoutDeal = prev.submissions.filter((s) => s.dealId !== input.deal.id);
      const next: DecisionAppState = {
        submissions: dedupeSubmissions([...withoutDeal, record]),
        stepOverrides,
        queueAdditions,
      };
      persistState(next);
      return next;
    });

    return record;
  }, []);

  const value = useMemo((): DecisionContextValue => {
    const submissions = dedupeSubmissions(state.submissions);
    const latestSubmission = submissions[0] ?? null;

    return {
      hydrated,
      submissions,
      submitDecision,
      getExportHistory: () => getMergedExportHistory(state),
      getExportSummary: () => getExportSummaryFromState(state),
      getWorkloadCounts: () => countEffectiveWorkload(state),
      getQueueDeals: (filters, currentUser) => filterEffectiveQueue(state, filters, currentUser),
      sortQueueDeals: (deals, field, dir) => sortEffectiveQueue(state, deals, field, dir),
      getDealStep: (dealId) => getEffectiveStep(dealId, state),
      getDealSubmission: (dealId) => getSubmissionForDeal(state, dealId),
      isInActiveQueue: (dealId) => isDealInActiveQueue(state, dealId),
      nextQueueDealId: getNextQueueDealId(state),
      latestSubmission,
    };
  }, [state, hydrated, submitDecision]);

  return <DecisionContext.Provider value={value}>{children}</DecisionContext.Provider>;
}

export function useDecisions() {
  const ctx = useContext(DecisionContext);
  if (!ctx) {
    throw new Error("useDecisions must be used within DecisionProvider");
  }
  return ctx;
}
