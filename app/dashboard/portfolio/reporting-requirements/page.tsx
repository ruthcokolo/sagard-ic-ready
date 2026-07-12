import { Suspense } from "react";
import { ReportingRequirementsView } from "@/components/portfolio-monitoring/reporting-requirements/ReportingRequirementsView";

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
