/** Route: `/ic-readiness` — queue of deals waiting for IC committee review. */
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ICReadinessView } from "@/components/ic-readiness/ICReadinessView";

function ICFallback() {
  return <div className="min-h-screen bg-[#f4f2ef] p-8 text-sm text-stone-500">Loading queue…</div>;
}

/** Shows the IC review queue table with filters and pagination. */
export default function ICReadinessPage() {
  return (
    <AppShell>
      <Suspense fallback={<ICFallback />}>
        <ICReadinessView />
      </Suspense>
    </AppShell>
  );
}
