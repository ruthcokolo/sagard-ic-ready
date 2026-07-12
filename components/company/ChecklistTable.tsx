import type { ChecklistItem } from "@/lib/types";

export function ChecklistTable({ checklist }: { checklist: ChecklistItem[] }) {
  const open = checklist.filter((i) => !i.done);
  const done = checklist.filter((i) => i.done);

  return (
    <section className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">Research checklist</h2>
          <p className="mt-1 text-sm text-stone-500">
            {open.length} open · {done.length} done · linked to issues above
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200">
        <div className="max-h-[min(420px,50vh)] overflow-y-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="sticky top-0 z-10 border-b border-stone-100 bg-stone-50 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              <tr>
                <th className="w-10 px-3 py-2.5" />
                <th className="px-3 py-2.5">Task</th>
                <th className="hidden w-24 px-3 py-2.5 sm:table-cell">Priority</th>
                <th className="hidden px-3 py-2.5 md:table-cell">Linked to</th>
                <th className="hidden px-3 py-2.5 lg:table-cell">Owner</th>
                <th className="hidden w-24 px-3 py-2.5 md:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {checklist.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-stone-50 last:border-0 ${
                    item.done ? "bg-emerald-50/30" : "bg-white hover:bg-stone-50/80"
                  }`}
                >
                  <td className="px-3 py-2.5 text-center">
                    <span className={item.done ? "text-emerald-600" : "text-stone-300"}>
                      {item.done ? "✓" : "○"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className={`font-medium ${item.done ? "text-stone-500 line-through" : "text-stone-800"}`}>
                      {item.label}
                    </p>
                    <p className="mt-0.5 sm:hidden">
                      <PriorityBadge priority={item.priority} />
                    </p>
                  </td>
                  <td className="hidden px-3 py-2.5 sm:table-cell">
                    <PriorityBadge priority={item.priority} />
                  </td>
                  <td className="hidden px-3 py-2.5 text-stone-600 md:table-cell">
                    {item.linkedIssue ?? item.linkedRisk ?? "—"}
                  </td>
                  <td className="hidden px-3 py-2.5 text-stone-600 lg:table-cell">
                    {item.owner ?? "—"}
                  </td>
                  <td className="hidden px-3 py-2.5 md:table-cell">
                    <span
                      className={`text-[10px] font-semibold uppercase ${
                        item.done ? "text-emerald-600" : "text-amber-700"
                      }`}
                    >
                      {item.done ? "Complete" : "Open"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const s = {
    high: "bg-red-50 text-red-700",
    medium: "bg-amber-50 text-amber-800",
    low: "bg-stone-100 text-stone-600",
  };
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${s[priority]}`}>
      {priority}
    </span>
  );
}
