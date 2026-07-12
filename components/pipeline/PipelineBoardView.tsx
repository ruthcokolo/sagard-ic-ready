"use client";

/** Pipeline page composing summary cards, filters, table, and pagination. */
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { pipelineDeals } from "@/lib/deals-pipeline";
import type { DealStage } from "@/lib/deal-types";
import {
  DEFAULT_FILTERS,
  DEMO_PAGE_SIZES,
  filterDeals,
  paginate,
  sortDeals,
  type DealFilters,
  type SortField,
} from "@/lib/deal-query";
import { prioritizePipelineDeals } from "@/lib/curated-deals";
import { PipelineSummaryCards } from "@/components/pipeline/PipelineSummaryCards";
import { PipelineFilterBar } from "@/components/pipeline/PipelineFilterBar";
import { PipelineTable } from "@/components/pipeline/PipelineTable";
import { PipelinePagination } from "@/components/pipeline/PipelinePagination";

/** Full pipeline page with cards, filters, and deal table. */
export function PipelineBoardView() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<DealFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortField>("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(8);

  useEffect(() => {
    const stage = searchParams.get("stage") as DealStage | null;
    const sector = searchParams.get("sector");
    setFilters({
      ...DEFAULT_FILTERS,
      stages: stage ? [stage] : [],
      categoryId: sector ?? "all",
    });
    setPage(1);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = filterDeals(pipelineDeals, filters);
    list = sortDeals(list, sort, sort === "name" ? "asc" : "desc");
    return prioritizePipelineDeals(list);
  }, [filters, sort]);

  const paged = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);

  return (
    <div className="min-h-screen bg-[#f4f2ef]">
      <header className="border-b border-stone-200/60 bg-white px-8 py-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9e4456]">
          Deal inventory
        </p>
        <h1 className="font-display mt-1 text-[2.25rem] leading-tight text-stone-900">All companies</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-stone-500">
          Browse the full pipeline, filter by stage or owner, and open any deal for review.
        </p>
      </header>

      <div className="px-8 pt-6">
        <PipelineSummaryCards />
      </div>

      <div className="mt-5">
        <PipelineFilterBar
          filters={filters}
          onChange={(f) => {
            setFilters(f);
            setPage(1);
          }}
          sort={sort}
          onSortChange={setSort}
          resultCount={filtered.length}
        />
      </div>

      <div className="mx-8 mb-8 overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <PipelineTable deals={paged.items} />
        <PipelinePagination
          page={paged.page}
          totalPages={paged.totalPages}
          total={paged.total}
          start={paged.start}
          end={paged.end}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          pageSizes={DEMO_PAGE_SIZES.pipeline}
        />
      </div>
    </div>
  );
}
