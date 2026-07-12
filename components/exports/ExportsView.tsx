"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  EXPORT_DECISION_LABELS,
  getBaseExportHistory,
  type ExportDecision,
  type ExportHistoryItem,
} from "@/lib/exports-mock";
import { useDecisions } from "@/components/decisions/DecisionProvider";
import {
  downloadExportArchivePdf,
  downloadExportArchiveWord,
  matchesExportSearch,
} from "@/lib/export-download";
import { paginate } from "@/lib/deal-query";
import { ExportsSummaryCards } from "@/components/exports/ExportsSummaryCards";
import { ExportsFilterBar } from "@/components/exports/ExportsFilterBar";
import { ExportsPagination } from "@/components/exports/ExportsPagination";
import { CompanyLogo } from "@/components/ui/CompanyLogo";
import { IconClock, IconSearch } from "@/components/ui/Icons";

type FilterValue = "all" | ExportDecision;

export function ExportsView() {
  const searchParams = useSearchParams();
  const { getExportHistory, hydrated } = useDecisions();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sectorId, setSectorId] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const f = searchParams.get("filter");
    if (f === "Proceed" || f === "Need more research" || f === "Don't invest") {
      setFilter(f);
      setPage(1);
    }
  }, [searchParams]);

  const exportHistory = useMemo(
    () => (hydrated ? getExportHistory() : getBaseExportHistory()),
    [hydrated, getExportHistory],
  );

  const filtered = useMemo(() => {
    let list =
      filter === "all" ? exportHistory : exportHistory.filter((e) => e.decision === filter);
    if (sectorId !== "all") {
      list = list.filter((e) => e.categoryId === sectorId);
    }
    return list.filter((item) => matchesExportSearch(item, search));
  }, [filter, sectorId, search, exportHistory]);

  const paged = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);

  return (
    <div className="min-h-screen bg-[#f4f2ef]">
      <header className="border-b border-stone-200/60 bg-white px-8 py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9e4456]">
              <IconClock className="h-3.5 w-3.5" />
              Compliance archive
            </p>
            <h1 className="font-display mt-1 text-[2.25rem] leading-tight text-stone-900">
              Download history
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] text-stone-500">
              A record of past decisions — what you chose, why, and what issues were open at download.
            </p>
          </div>

          <div className="relative w-full max-w-sm sm:w-72">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search company, owner, or rationale…"
              aria-label="Search exports"
              className="w-full rounded-lg border border-stone-200 bg-[#faf9f7] py-2.5 pl-9 pr-3 text-[13px] focus:border-[#9e4456] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9e4456]/10 [&::-webkit-search-cancel-button]:hidden"
            />
          </div>
        </div>
      </header>

      <div className="px-8 pt-6">
        <ExportsSummaryCards />
      </div>

      <div className="mt-5">
        <ExportsFilterBar
          filter={filter}
          sectorId={sectorId}
          onChange={(f) => {
            setFilter(f);
            setPage(1);
          }}
          onSectorChange={(id) => {
            setSectorId(id);
            setPage(1);
          }}
        />
      </div>

      <div className="mx-8 mb-8 overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-stone-800">No exports match your search</p>
            <p className="mt-1 text-sm text-stone-500">
              Try a different company name or clear the search field.
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-stone-100 bg-stone-50/80 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-3 py-3">Decision</th>
                  <th className="hidden px-3 py-3 lg:table-cell">Rationale</th>
                  <th className="px-3 py-3">Open issues at export</th>
                  <th className="px-3 py-3">Exported</th>
                  <th className="hidden px-3 py-3 sm:table-cell">Owner</th>
                  <th className="px-3 py-3 text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {paged.items.map((item) => (
                  <ExportRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
            <ExportsPagination
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
            />
          </>
        )}
      </div>
    </div>
  );
}

function ExportRow({ item }: { item: ExportHistoryItem }) {
  return (
    <tr className="border-b border-stone-50 hover:bg-[#fdf2f4]/20">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <CompanyLogo
            companyId={item.companyId}
            name={item.company}
            size="sm"
            className="!h-9 !w-9 !rounded-lg !text-xs"
          />
          <span className="font-semibold text-stone-900">{item.company}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <DecisionLabel decision={item.decision} />
      </td>
      <td className="hidden max-w-xs px-3 py-3 text-stone-600 lg:table-cell">
        {item.rationalePreview}
      </td>
      <td className="px-3 py-3 text-stone-600">{item.blockersAtExport}</td>
      <td className="px-3 py-3 tabular-nums text-stone-500">{item.exportedAt}</td>
      <td className="hidden px-3 py-3 text-stone-600 sm:table-cell">
        {item.owner.split(" ")[0]}
      </td>
      <td className="px-3 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => downloadExportArchivePdf(item)}
            aria-label={`Download ${item.company} as PDF`}
            className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 hover:border-[#7a3344]/30 hover:bg-[#fdf2f4]"
          >
            PDF
          </button>
          <button
            type="button"
            onClick={() => downloadExportArchiveWord(item)}
            aria-label={`Download ${item.company} as Word`}
            className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 hover:border-[#7a3344]/30 hover:bg-[#fdf2f4]"
          >
            Word
          </button>
          <button
            type="button"
            aria-label="More actions"
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          >
            ⋮
          </button>
        </div>
      </td>
    </tr>
  );
}

function DecisionLabel({ decision }: { decision: ExportDecision }) {
  const label = EXPORT_DECISION_LABELS[decision];
  const cls =
    decision === "Proceed"
      ? "text-emerald-700"
      : decision === "Don't invest"
        ? "text-red-700"
        : "text-amber-800";

  return <span className={`text-[13px] font-semibold ${cls}`}>{label}</span>;
}
