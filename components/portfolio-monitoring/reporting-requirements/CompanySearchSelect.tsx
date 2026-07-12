"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CompanyOption = { id: string; name: string };

export function CompanySearchSelect({
  companies,
  value,
  onChange,
}: {
  companies: CompanyOption[];
  value: string;
  onChange: (companyId: string) => void;
}) {
  const selected = companies.find((c) => c.id === value) ?? null;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [companies, query]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-1.5 flex w-full items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-sm font-medium text-stone-800"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0 text-stone-400"
          aria-hidden
        >
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M9 21v-6h6v6" />
        </svg>
        <span className="flex-1 truncate">{selected?.name ?? "Select a company"}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
          <div className="border-b border-stone-100 p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search companies…"
              className="w-full rounded-lg border border-stone-200 px-2.5 py-1.5 text-[13px]"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-[13px] text-stone-500">No companies match</li>
            ) : (
              filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={c.id === value}
                    className={`w-full px-3 py-2 text-left text-[13px] hover:bg-stone-50 ${
                      c.id === value ? "bg-[#fdf2f4] font-semibold text-[#7a3344]" : "text-stone-800"
                    }`}
                    onClick={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                  >
                    {c.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
