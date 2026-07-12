"use client";

import Link from "next/link";

const STEPS = [
  {
    step: 1,
    label: "Upload report",
    description: "Add a company-provided PDF reporting package",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
      </svg>
    ),
  },
  {
    step: 2,
    label: "Extract metrics",
    description: "ICReady finds suggested metrics and captures source evidence",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    step: 3,
    label: "Review extraction result",
    description: "Inspect coverage, warnings, and suggested metrics",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    step: 4,
    label: "Send to Metric Review",
    description: "Successful extractions are validated in Metric Review",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    href: "/dashboard/portfolio/metric-review",
  },
] as Array<{
  step: number;
  label: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
}>;

function StepCard({
  step,
  label,
  description,
  icon,
  href,
}: {
  step: number;
  label: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#63202e] text-[11px] font-bold text-white shadow-sm">
          {step}
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#fdf2f4] text-[#63202e]">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[13px] font-semibold leading-snug text-stone-900">{label}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-stone-500">{description}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block min-w-0 rounded-xl border border-stone-200/80 bg-white p-3.5 transition hover:border-[#63202e]/25 hover:bg-[#fdf2f4]/40 hover:shadow-sm"
      >
        {body}
        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#63202e] opacity-0 transition group-hover:opacity-100">
          Go there
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </Link>
    );
  }

  return (
    <div className="min-w-0 rounded-xl border border-stone-200/80 bg-white p-3.5">
      {body}
    </div>
  );
}

export function WorkflowExplainerCard({ compact = false }: { compact?: boolean }) {
  if (!compact) {
    return (
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-white to-[#fdf2f4]/30 p-5">
        <h2 className="text-[15px] font-semibold text-[#63202e]">From upload to Metric Review</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <StepCard key={step.step} {...step} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-white via-white to-[#fdf2f4]/25">
      <div className="border-b border-stone-100 px-4 py-3.5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[14px] font-semibold text-[#63202e] sm:text-[15px]">
            From upload to Metric Review
          </h2>
          <span className="rounded-full bg-[#63202e]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#63202e]">
            4 steps
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        {STEPS.map((step) => (
          <StepCard key={step.step} {...step} />
        ))}
      </div>
    </section>
  );
}
