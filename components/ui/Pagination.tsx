"use client";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  start: number;
  end: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizes?: readonly number[];
};

export function Pagination({
  page,
  totalPages,
  total,
  start,
  end,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizes = [25, 50, 100],
}: PaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 bg-stone-50/80 px-6 py-3">
      <p className="text-xs text-stone-500">
        Showing{" "}
        <span className="font-medium text-stone-800">
          {start}–{end}
        </span>{" "}
        of <span className="font-medium text-stone-800">{total.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-3">
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs"
        >
          {pageSizes.map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <PageBtn disabled={page <= 1} onClick={() => onPageChange(page - 1)} label="Prev" />
          <span className="min-w-[4rem] text-center text-xs tabular-nums text-stone-600">
            {page} / {totalPages}
          </span>
          <PageBtn disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} label="Next" />
        </div>
      </div>
    </div>
  );
}

function PageBtn({
  disabled,
  onClick,
  label,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-stone-50"
    >
      {label}
    </button>
  );
}
