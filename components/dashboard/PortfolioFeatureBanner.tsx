import Link from "next/link";
import { IconExternalLink } from "@/components/ui/Icons";

export function PortfolioFeatureBanner() {
  return (
    <section className="mx-8 mb-6 overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-[#fdf2f4] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
            New feature
          </p>
          <h2 className="mt-1 text-xl font-semibold text-stone-900">
            Portfolio Monitoring is now in ICReady
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-stone-600">
            Extract and validate metrics from company-provided reporting PDFs — a separate
            post-investment workflow from IC Diligence.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/portfolio"
            className="rounded-xl bg-[#7a3344] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#5a2533]"
          >
            Open Portfolio Monitoring →
          </Link>
          <a
            href="https://github.com/ruthcokolo/sagard-portfolio-metrics"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-stone-600 hover:text-[#7a3344]"
          >
            View Python POC
            <IconExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
