/** Route: `/dashboard/portfolio/reporting-requirements` — what each company must report. */
import { Suspense } from "react";
import { ReportingRequirementsView } from "@/components/portfolio-monitoring/reporting-requirements/ReportingRequirementsView";

/** Shows reporting requirement rules per company with edit drawers. */
export default function ReportingRequirementsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f2ef] px-8 py-6">
          <p className="text-sm text-stone-500">Loading reporting requirements…</p>
        </div>
      }
    >
      <ReportingRequirementsView />
    </Suspense>
  );
}
