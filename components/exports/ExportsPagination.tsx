"use client";

/** Page controls for the exports table. */
function pageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "ellipsis", total];
  if (current >= total - 3) return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

/** Renders the exports pagination UI. */
export function ExportsPagination({
  page,
  totalPages,
  total,
  start,
  end,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  start: number;
  end: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const pages = pageNumbers(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 bg-stone-50/60 px-6 py-3">
      <p className="text-xs text-stone-500">
        Showing{" "}
        <span className="font-medium text-stone-800">
          {start}–{end}
        </span>{" "}
        of <span className="font-medium text-stone-800">{total.toLocaleString()}</span> exports
      </p>

      <div className="flex items-center gap-3">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs text-stone-700"
        >
          {[10, 25, 50].map((s) => (
            <option key={s} value={s}>
              {s} / page
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <NavBtn disabled={page <= 1} onClick={() => onPageChange(page - 1)} label="←" />
          {pages.map((p, i) =>
            p === "ellipsis" ? (
              <span key={`e-${i}`} className="px-1 text-xs text-stone-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition ${
                  p === page
                    ? "bg-[#7a3344] text-white"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {p}
              </button>
            ),
          )}
          <NavBtn disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} label="→" />
        </div>
      </div>
    </div>
  );
}

function NavBtn({
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
      className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {label}
    </button>
  );
}
