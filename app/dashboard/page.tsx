/** Route: `/dashboard` — main home screen with deals summary and AI findings. */
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardView } from "@/components/dashboard/DashboardView";

function DashboardFallback() {
  return <div className="min-h-screen bg-[#f4f2ef] p-8 text-sm text-stone-500">Loading dashboard…</div>;
}

/** Shows the dashboard inside the app shell with a loading fallback. */
export default function DashboardPage() {
  return (
    <AppShell>
      <Suspense fallback={<DashboardFallback />}>
        <DashboardView />
      </Suspense>
    </AppShell>
  );
}
