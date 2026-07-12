/** Summary stat cards at the top of the pipeline page. */

import Link from "next/link";
import { getPipelineSummary } from "@/lib/insights";

const cards = [
  {
    key: "total",
    label: "Total companies",
    iconBg: "bg-[#fdf2f4] text-[#7a3344]",
    icon: "◫",
    href: "/pipeline",
  },
  {
    key: "needsReview",
    label: "Needs review",
    iconBg: "bg-amber-50 text-amber-700",
    icon: "◎",
    href: "/ic-readiness",
  },
  {
    key: "committeePrep",
    label: "Committee prep",
    iconBg: "bg-violet-50 text-violet-700",
    icon: "◆",
    href: "/pipeline?stage=ic_prep",
  },
  {
    key: "assignedToAlex",
    label: "Assigned to Alex",
    iconBg: "bg-emerald-50 text-emerald-700",
    icon: "◉",
    href: "/ic-readiness?mine=1",
  },
] as const;

/** Renders the pipeline summary cards UI. */
export function PipelineSummaryCards() {
  const m = getPipelineSummary();

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, label, iconBg, icon, href }) => (
        <Link
          key={key}
          href={href}
          className="flex items-center gap-3 rounded-2xl border border-stone-200/70 bg-white px-4 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:border-[#7a3344]/20"
        >
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${iconBg}`}
          >
            {icon}
          </span>
          <div>
            <p className="text-2xl font-semibold tabular-nums text-stone-900">
              {m[key].toLocaleString()}
            </p>
            <p className="text-xs font-medium text-stone-500">{label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
