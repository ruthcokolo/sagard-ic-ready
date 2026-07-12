"use client";

export function SectorFilter({
  sectors,
  value,
  onChange,
}: {
  sectors: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-[9rem] flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Sector</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800"
        aria-label="Filter by sector"
      >
        <option value="all">All sectors</option>
        {sectors.map((sector) => (
          <option key={sector} value={sector}>
            {sector}
          </option>
        ))}
      </select>
    </label>
  );
}
