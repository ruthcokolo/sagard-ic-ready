/** Route: `/exports` — download history for diligence exports. */
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ExportsView } from "@/components/exports/ExportsView";

function ExportsFallback() {
  return <div className="min-h-screen bg-[#f4f2ef] p-8 text-sm text-stone-500">Loading exports…</div>;
}

/** Shows export logs and filters for generated diligence files. */
export default function ExportsPage() {
  return (
    <AppShell>
      <Suspense fallback={<ExportsFallback />}>
        <ExportsView />
      </Suspense>
    </AppShell>
  );
}
