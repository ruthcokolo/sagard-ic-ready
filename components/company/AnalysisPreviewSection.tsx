/** Marketing overview of the three-step AI diligence workflow. */

import { IconAlertTriangle, IconClipboardCheck, IconDocumentSparkle } from "@/components/ui/Icons";

const STEPS = [
  {
    icon: IconAlertTriangle,
    title: "Surface conflicts with citations",
    description: "AI flags mismatches between sources with quoted evidence.",
    iconBg: "bg-red-50 text-red-600",
  },
  {
    icon: IconDocumentSparkle,
    title: "Draft the IC summary",
    description: "Generates readiness score, thesis, risks, and mitigants.",
    iconBg: "bg-amber-50 text-amber-700",
  },
  {
    icon: IconClipboardCheck,
    title: "Unlock decision panel",
    description: "Record Proceed, More Diligence, or Pass with rationale.",
    iconBg: "bg-emerald-50 text-emerald-700",
  },
];

/** Static cards describing conflict detection, drafting, and sign-off. */
export function AnalysisPreviewSection() {
  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="text-sm font-semibold text-stone-900">What happens after analysis</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, description, iconBg }) => (
          <div
            key={title}
            className="rounded-xl border border-stone-100 bg-stone-50/40 px-4 py-4"
          >
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-sm font-semibold text-stone-900">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-stone-500">{description}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-stone-400">
        Estimated time: 1–2 minutes · You&apos;ll be notified when analysis is ready.
      </p>
    </section>
  );
}
