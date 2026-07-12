"use client";

/**
 * Help guide explaining how to set up reporting requirements.
 */
const REQUIREMENTS_SECTIONS = [
  {
    title: "Metric definitions",
    body: "How ICReady recognizes, parses, and normalizes metrics in company-provided PDFs.",
  },
  {
    title: "Reporting requirements",
    body: "How ICReady decides which metrics should be reported for a sector or company.",
  },
  {
    title: "Required",
    body: "If missing from a report, ICReady creates a follow-up item for the associate.",
  },
  {
    title: "Optional",
    body: "If missing, no urgent alert is created. Optional metrics may still appear when extracted.",
  },
  {
    title: "Not applicable",
    body: "Excluded from missing-metric checks for that company or sector.",
  },
  {
    title: "Not configured",
    body: "ICReady makes no expectation decision until a sector default or company override is set.",
  },
  {
    title: "Company overrides",
    body: "Company overrides take precedence over sector defaults for that metric only.",
  },
  {
    title: "AI suggestions",
    body: "AI suggestions require human confirmation and never change requirements automatically.",
  },
  {
    title: "Rationales",
    body: "Every company override should explain why the company differs from its sector.",
  },
  {
    title: "Audit history",
    body: "Every change records the previous rule, new rule, actor, timestamp, and rationale.",
  },
] as const;

const EXTRACTION_SECTIONS = [
  {
    title: "What extraction rules do",
    body: "Teach ICReady how to recognize and normalize metrics in uploaded portfolio PDFs.",
  },
  {
    title: "Metric definitions versus reporting requirements",
    body: "Extraction rules define how to find a metric. Reporting Requirements define whether a sector or company must report it.",
  },
  {
    title: "Metric name",
    body: "The canonical name used throughout ICReady.",
  },
  {
    title: "Aliases",
    body: "Alternative labels that may appear in company reports. Aliases affect future AI-assisted extraction attempts.",
  },
  {
    title: "Type and unit",
    body: "How extracted values should be parsed and normalized (currency, percentage, count, ratio, or text).",
  },
  {
    title: "Matching guidance",
    body: "Business context that helps reduce incorrect matches. It is not treated as code or a system prompt.",
  },
  {
    title: "Supported contexts",
    body: "Whether a metric may appear as actual, budget, forecast, or prior-period data. Extraction still distinguishes each value type.",
  },
  {
    title: "Active versus inactive",
    body: "Active definitions are used for future extraction. Inactive definitions remain available in historical records but are not used for new extraction.",
  },
  {
    title: "How changes affect extraction",
    body: "Definition updates apply to future PDF uploads. Historical extracted and approved values remain unchanged.",
  },
  {
    title: "Deletion restrictions",
    body: "Definitions with historical extracted values or active reporting requirements cannot be deleted. Disable them instead.",
  },
  {
    title: "Audit history",
    body: "Creates, edits, alias changes, enable/disable, and deletions are logged immutably.",
  },
] as const;

/** Expandable help panel for setting up requirements. */
export function MetricsConfigurationGuide({
  open,
  onClose,
  variant = "requirements",
}: {
  open: boolean;
  onClose: () => void;
  variant?: "requirements" | "extraction";
}) {
  if (!open) return null;
  const sections = variant === "extraction" ? EXTRACTION_SECTIONS : REQUIREMENTS_SECTIONS;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-stone-900/30"
        aria-label="Close guide"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-[min(480px,100vw)] flex-col border-l border-stone-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="text-[17px] font-semibold text-stone-900">Metrics configuration guide</h2>
            <p className="mt-1 text-[12px] text-stone-500">
              {variant === "extraction"
                ? "Metric definitions, aliases, units, and extraction status."
                : "Difference between metric definitions and reporting requirements."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100"
            aria-label="Close"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {sections.map((section) => (
            <section key={section.title}>
              <h3 className="text-[13px] font-semibold text-stone-900">{section.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-stone-600">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
