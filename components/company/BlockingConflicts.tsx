"use client";

import { useState } from "react";
import type { AnalysisResult, Contradiction } from "@/lib/types";
import { conflictHeadline } from "@/lib/conflict-headline";
import { conflictLabels } from "@/lib/plain-copy";
import { buildSourceEvidence } from "@/lib/source-evidence";
import type { SourceEvidence } from "@/lib/source-evidence";
import { EvidenceDrawer } from "@/components/ui/EvidenceDrawer";

export function BlockingConflicts({
  analysis,
  loading,
  analysisPending = false,
  onRefresh,
}: {
  analysis: AnalysisResult;
  loading: boolean;
  analysisPending?: boolean;
  onRefresh: () => void;
}) {
  const { contradictions } = analysis;
  const blocking = contradictions.filter((c) => c.severity === "high" || c.status === "unresolved");
  const [drawerEvidence, setDrawerEvidence] = useState<SourceEvidence | null>(null);

  return (
    <>
      <section className="rounded-2xl border-2 border-amber-200/80 bg-white p-6 shadow-[0_4px_24px_-12px_rgba(120,53,15,0.12)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">
              Main issues to fix
            </p>
            <h2 className="mt-1 text-xl font-semibold text-stone-900">{conflictLabels.sectionTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            {loading ? "Running…" : analysisPending ? "Run analysis" : "Recheck sources"}
          </button>
        </div>

        {analysisPending ? (
          <div className="mt-6 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 py-12 text-center">
            <p className="text-sm font-medium text-stone-800">No conflicts computed yet</p>
            <p className="mt-1 text-sm text-stone-500">
              Claude will compare the 4 synced sources and surface mismatches with quoted evidence.
            </p>
          </div>
        ) : contradictions.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-stone-200 bg-stone-50/50 py-12 text-center">
            <p className="text-sm font-medium text-stone-700">No mismatched numbers found</p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {blocking.map((c) => (
              <ConflictCard
                key={c.id}
                conflict={c}
                owner={analysis.deal.owner}
                onViewSource={(evidence) => setDrawerEvidence(evidence)}
              />
            ))}
          </div>
        )}
      </section>

      <EvidenceDrawer
        open={Boolean(drawerEvidence)}
        evidence={drawerEvidence}
        onClose={() => setDrawerEvidence(null)}
      />
    </>
  );
}

function ConflictCard({
  conflict: c,
  owner,
  onViewSource,
}: {
  conflict: Contradiction;
  owner: string;
  onViewSource: (evidence: SourceEvidence) => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 ring-1 ring-stone-100">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-gradient-to-r from-red-50/40 via-white to-white px-5 py-4">
        <p className="text-xl font-semibold tracking-tight text-stone-900">{conflictHeadline(c)}</p>
        <div className="flex gap-2">
          <SeverityBadge severity={c.severity} />
          <StatusBadge status={c.status} />
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        <SourceBlock
          name={c.sourceA.name}
          value={c.sourceA.value}
          quote={c.sourceA.quote}
          field={c.field}
          owner={owner}
          onViewSource={onViewSource}
        />
        <SourceBlock
          name={c.sourceB.name}
          value={c.sourceB.value}
          quote={c.sourceB.quote}
          field={c.field}
          owner={owner}
          divider
          onViewSource={onViewSource}
        />
      </div>

      <div className="space-y-2.5 border-t border-stone-100 bg-white px-5 py-4">
        <ImpactRow label={conflictLabels.whyItMatters} text={c.whyItMatters} />
        <ImpactRow label={conflictLabels.whyBlocksReview} text={c.whyItBlocksIC} accent />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            {conflictLabels.suggestedAction}
          </p>
          <p className="mt-1 text-sm text-stone-700">{c.suggestedAction}</p>
        </div>
      </div>
    </article>
  );
}

function SourceBlock({
  name,
  value,
  quote,
  field,
  owner,
  divider,
  onViewSource,
}: {
  name: string;
  value: string;
  quote: string;
  field: string;
  owner: string;
  divider?: boolean;
  onViewSource: (evidence: SourceEvidence) => void;
}) {
  return (
    <div className={`p-5 ${divider ? "border-t lg:border-l lg:border-t-0 border-stone-100" : ""}`}>
      <p className="text-sm font-semibold text-stone-900">{name}</p>
      <p className="mt-2 text-lg font-semibold tabular-nums text-[#7a3344]">{value}</p>
      <p className="mt-2 text-sm italic leading-relaxed text-stone-500">&ldquo;{quote}&rdquo;</p>
      <button
        type="button"
        onClick={() => onViewSource(buildSourceEvidence(name, quote, field, owner))}
        className="mt-3 text-xs font-semibold text-[#7a3344] hover:underline"
      >
        {conflictLabels.viewSource}
      </button>
    </div>
  );
}

function ImpactRow({ label, text, accent }: { label: string; text: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg px-3 py-2.5 ${accent ? "bg-amber-50/70" : "bg-stone-50/80"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-0.5 text-sm text-stone-800">{text}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "high" | "medium" | "low" }) {
  const s = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-stone-100 text-stone-600",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${s[severity]}`}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: Contradiction["status"] }) {
  const s = {
    unresolved: "bg-red-50 text-red-700 ring-red-200",
    resolved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    acknowledged: "bg-amber-50 text-amber-800 ring-amber-200",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${s[status]}`}>
      {status}
    </span>
  );
}
