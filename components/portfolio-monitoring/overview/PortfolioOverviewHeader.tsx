"use client";

import Link from "next/link";
import { ProductModeSwitch } from "@/components/portfolio-monitoring/PortfolioModeHeader";

export function PortfolioOverviewHeader() {
  return (
    <header className="border-b border-stone-200/60 bg-white px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="font-display text-[2.25rem] leading-tight text-stone-900 sm:text-[2.75rem] sm:leading-none">
            Good morning, Alex 👋
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-stone-500">
            Here&apos;s your portfolio reporting snapshot. Review priority items, track progress,
            and keep reporting on schedule.
          </p>
        </div>
        <div className="shrink-0 pt-1">
          <ProductModeSwitch mode="portfolio" />
        </div>
      </div>
    </header>
  );
}

export function PortfolioOverviewEmptyState() {
  return (
    <div className="mx-4 mt-6 rounded-2xl border border-dashed border-stone-300 bg-white px-8 py-16 text-center sm:mx-6 lg:mx-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fdf2f4] text-[#7a3344]">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="mt-4 text-base font-semibold text-stone-900">No reporting activity yet</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
        Process a company reporting package to begin monitoring submission progress and extracted
        metrics.
      </p>
      <Link
        href="/dashboard/portfolio/reporting-packages"
        className="mt-5 inline-flex rounded-xl bg-[#63202e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#521a26]"
      >
        Go to Reporting Packages
      </Link>
    </div>
  );
}
