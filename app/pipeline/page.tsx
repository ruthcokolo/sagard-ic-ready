/** Route: `/pipeline` — kanban-style view of deals by stage. */
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PipelineBoardView } from "@/components/pipeline/PipelineBoardView";

function PipelineFallback() {
  return <div className="min-h-screen bg-[#f4f2ef] p-8 text-sm text-stone-500">Loading pipeline…</div>;
}

/** Shows the deal pipeline board with filters and summary cards. */
export default function PipelinePage() {
  return (
    <AppShell>
      <Suspense fallback={<PipelineFallback />}>
        <PipelineBoardView />
      </Suspense>
    </AppShell>
  );
}
