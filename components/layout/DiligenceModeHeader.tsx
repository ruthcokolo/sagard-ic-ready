"use client";

/** Top header for IC diligence mode with product switcher and user menu. */
import { ModeHeaderActions } from "@/components/layout/ProductModeHeaderBar";

/** Renders the diligence mode header UI. */
export function DiligenceModeHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-[1.35rem]">
              IC Diligence
            </h1>
            <span className="rounded-full bg-[#fdf2f4] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#7a3344] ring-1 ring-[#7a3344]/15">
              Diligence mode
            </span>
          </div>
          <p className="mt-0.5 text-sm text-stone-500">
            Pre-investment deal review and IC readiness
          </p>
        </div>
        <ModeHeaderActions mode="diligence" />
      </div>
    </header>
  );
}
