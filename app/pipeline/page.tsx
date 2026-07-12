import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PipelineBoardView } from "@/components/pipeline/PipelineBoardView";

function PipelineFallback() {
  return <div className="min-h-screen bg-[#f4f2ef] p-8 text-sm text-stone-500">Loading pipeline…</div>;
}

export default function PipelinePage() {
  return (
    <AppShell>
      <Suspense fallback={<PipelineFallback />}>
        <PipelineBoardView />
      </Suspense>
    </AppShell>
  );
}
