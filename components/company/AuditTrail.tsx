import type { AuditEvent } from "@/lib/types";

const typeLabels: Record<AuditEvent["type"], string> = {
  system: "System",
  ai: "AI",
  warning: "Issue found",
  human: "You",
};

export function AuditTrail({ events }: { events: AuditEvent[] }) {
  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h2 className="text-lg font-semibold text-stone-900">Activity log</h2>
      <p className="mt-1 text-sm text-stone-500">What happened on this deal, in order.</p>

      <ol className="mt-5 space-y-0">
        {events.map((event, i) => (
          <li key={event.id} className="relative flex gap-4 pb-5 last:pb-0">
            {i < events.length - 1 && (
              <span className="absolute left-[7px] top-4 h-full w-px bg-stone-200" aria-hidden />
            )}
            <span
              className={`relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white ${dotColor(event.type)}`}
            />
            <div>
              <p className="text-sm font-medium text-stone-800">{event.label}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-stone-400">
                {typeLabels[event.type]}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function dotColor(type: AuditEvent["type"]) {
  switch (type) {
    case "ai":
      return "bg-violet-500";
    case "warning":
      return "bg-amber-500";
    case "human":
      return "bg-[#7a3344]";
    default:
      return "bg-stone-400";
  }
}
