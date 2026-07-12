/** Compact company summary card for pipeline and list views. */

import type { PipelineDeal } from "@/lib/deal-types";
import { formatAskStage } from "@/lib/company-sources";
import { CompanyLogo } from "@/components/ui/CompanyLogo";

/** Card showing company name, sector tags, and synced source count. */
export function CompanyProfileCard({ deal }: { deal: PipelineDeal }) {
  const tags = [
    formatAskStage(deal),
    deal.sector,
    deal.location,
    deal.askAmount,
    `Owner: ${deal.owner}`,
    "4 Sources synced",
  ];

  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-start gap-5">
        <CompanyLogo companyId={deal.id} name={deal.name} size="xl" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-stone-900">{deal.name}</h2>
          <p className="mt-1 text-[15px] text-stone-600">{deal.tagline}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-stone-200 bg-stone-50/80 px-2.5 py-1 text-[11px] font-medium text-stone-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
