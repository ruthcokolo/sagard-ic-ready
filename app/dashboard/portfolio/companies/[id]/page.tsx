/** Route: `/dashboard/portfolio/companies/[id]` — one company's profile and metrics. */
import { Suspense } from "react";
import { CompanyDetailView } from "@/components/portfolio-monitoring/CompanyDetailView";

/** Loads a single portfolio company profile by ID. */
export default async function PortfolioCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f2ef] px-8 py-10 text-sm text-stone-500">
          Loading company…
        </div>
      }
    >
      <CompanyDetailView companyId={id} />
    </Suspense>
  );
}
