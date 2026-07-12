"use client";

import { useEffect, useRef, useState } from "react";

export function CompaniesHeader({
  onOpenGuide,
  onAddCompany,
  onExport,
  onManageSectors,
}: {
  onOpenGuide: () => void;
  onAddCompany: () => void;
  onExport: () => void;
  onManageSectors: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-3xl tracking-tight text-[#63202e]">Companies</h1>
        <p className="mt-1 max-w-xl text-sm text-stone-500">
          All portfolio companies in one place. Explore profiles, track reporting, and monitor data
          quality.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenGuide}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 text-[13px] font-medium text-stone-700 hover:bg-stone-50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          Company Guide
        </button>
        <button
          type="button"
          onClick={onAddCompany}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#63202e] px-3 text-[13px] font-semibold text-white hover:bg-[#521a26]"
        >
          <span className="text-base leading-none">+</span>
          Add Company
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="More actions"
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {menuOpen ? (
            <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50"
                onClick={() => {
                  setMenuOpen(false);
                  onExport();
                }}
              >
                Export list
              </button>
              <button
                type="button"
                disabled
                title="Bulk import is not available yet"
                className="flex w-full cursor-not-allowed items-center gap-2 px-3 py-2 text-left text-[13px] text-stone-400"
              >
                Import companies
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50"
                onClick={() => {
                  setMenuOpen(false);
                  onManageSectors();
                }}
              >
                Manage sectors
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
