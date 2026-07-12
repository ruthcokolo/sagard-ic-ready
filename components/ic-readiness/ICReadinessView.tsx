"use client";

/** IC review queue page with filters, table, and pagination. */
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useDecisions } from "@/components/decisions/DecisionProvider";
import {
  DEFAULT_FILTERS,
  paginate,
  type DealFilters,
  type SortField,
  type WorkflowStep,
} from "@/lib/deal-query";
import { ICQueueBanner } from "@/components/ic-readiness/ICQueueBanner";
import { ReviewQueueFilterBar } from "@/components/ic-readiness/ReviewQueueFilterBar";
import { ReviewQueueTable } from "@/components/ic-readiness/ReviewQueueTable";
import { ReviewQueuePagination } from "@/components/ic-readiness/ReviewQueuePagination";

const icDefaults: DealFilters = {
  ...DEFAULT_FILTERS,
  mineOnly: true,
  workflowStep: "all",
};

const PAGE_SIZE = 5;

/** IC review queue page with banner, filters, and table. */
export function ICReadinessView() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { getQueueDeals, sortQueueDeals } = useDecisions();
  const currentUser = user?.name ?? "Alex Rivera";
  const [filters, setFilters] = useState<DealFilters>(icDefaults);
  const [sort] = useState<SortField>("readiness");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const step = searchParams.get("step") as WorkflowStep | null;
    const mine = searchParams.get("mine");
    setFilters({
      ...icDefaults,
      workflowStep: step && ["conflicts", "draft", "decision"].includes(step) ? step : "all",
      mineOnly: mine === "0" ? false : true,
    });
    setPage(1);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const list = getQueueDeals(filters, currentUser);
    return sortQueueDeals(list, sort, "asc");
  }, [filters, sort, currentUser, getQueueDeals, sortQueueDeals]);

  const paged = useMemo(() => paginate(filtered, page, PAGE_SIZE), [filtered, page]);

  return (
    <div className="min-h-screen bg-[#f4f2ef]">
      <header className="border-b border-stone-200/60 bg-white px-8 py-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9e4456]">
          Your action list
        </p>
        <h1 className="font-display mt-1 text-[2.25rem] leading-tight text-stone-900">Review queue</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-stone-500">
          Each deal has one next action — resolve blockers, verify analysis, then record your decision.
        </p>
      </header>

      <ICQueueBanner />

      <ReviewQueueFilterBar
        filters={filters}
        onChange={(f) => {
          setFilters(f);
          setPage(1);
        }}
      />

      <div className="mx-8 mb-8 overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <ReviewQueueTable deals={paged.items} reviewerName={currentUser} />
        <ReviewQueuePagination
          page={paged.page}
          totalPages={paged.totalPages}
          total={paged.total}
          start={paged.start}
          end={paged.end}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
