import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CompanyDetailView } from "@/components/company/CompanyDetailView";
import { getDealById } from "@/lib/deals-pipeline";

function CompanyFallback() {
  return <div className="min-h-screen bg-[#f4f2ef] p-8 text-sm text-stone-500">Loading company…</div>;
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = getDealById(id);

  if (!deal) notFound();

  return (
    <AppShell>
      <Suspense fallback={<CompanyFallback />}>
        <CompanyDetailView dealId={id} />
      </Suspense>
    </AppShell>
  );
}
