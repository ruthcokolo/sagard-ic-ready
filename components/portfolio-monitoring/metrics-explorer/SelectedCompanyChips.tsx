"use client";

/**
 * Removable chips showing which companies are selected for comparison.
 */
import { CompanyAvatar } from "@/components/portfolio-monitoring/company-identity";
import type { PortfolioCompany } from "@/lib/portfolio/types";

/** Chips showing selected companies with remove buttons. */
export function SelectedCompanyChips({
  companies,
  onRemove,
  onClearAll,
}: {
  companies: PortfolioCompany[];
  onRemove: (companyId: string) => void;
  onClearAll: () => void;
}) {
  if (companies.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {companies.map((company) => (
        <span
          key={company.id}
          className="inline-flex max-w-[16rem] items-center gap-1.5 rounded-full bg-[#fdf2f4] px-3 py-1 text-xs font-semibold text-[#7a3344] ring-1 ring-[#7a3344]/15"
        >
          <CompanyAvatar companyId={company.id} companyName={company.name} size="sm" />
          <span className="min-w-0 truncate" title={company.name}>
            {company.name}
          </span>
          <button
            type="button"
            onClick={() => onRemove(company.id)}
            className="ml-0.5 shrink-0 rounded-full p-0.5 text-[#7a3344]/70 hover:bg-[#7a3344]/10 hover:text-[#7a3344]"
            aria-label={`Remove ${company.name} from comparison`}
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-semibold text-[#7a3344] hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
