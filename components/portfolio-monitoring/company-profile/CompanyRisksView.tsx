"use client";

/**
 * Tab view listing risk flags and issues for a company.
 */
import { useState } from "react";
import {
  CompanyProfileEmptyState,
  SectionCard,
  StatusPill,
  formatShortDate,
} from "@/components/portfolio-monitoring/company-profile/shared";
import type { CompanyFollowUp, CompanyFollowUpStatus, ReviewPriority } from "@/lib/portfolio/types";

type Candidate = { title: string; source: string; priority: string };

type Props = {
  risks: CompanyFollowUp[];
  candidates: Candidate[];
  onAdd: (input: {
    title: string;
    category: string;
    source: string;
    priority: ReviewPriority;
    ownerName?: string;
    dueDate?: string;
    notes?: string;
  }) => void;
  onUpdate: (
    id: string,
    patch: Partial<Pick<CompanyFollowUp, "status" | "ownerName" | "dueDate" | "notes" | "resolvedAt">>
  ) => void;
  currentUserName: string;
};

/** Risk flags tab on the company profile. */
export function CompanyRisksView({
  risks,
  candidates,
  onAdd,
  onUpdate,
  currentUserName,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [priority, setPriority] = useState<ReviewPriority>("Normal");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      category: "Follow-up",
      source: source.trim() || "Internal",
      priority,
      ownerName: currentUserName,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
    });
    setTitle("");
    setSource("");
    setDueDate("");
    setNotes("");
    setShowForm(false);
  };

  const confirmCandidate = (c: Candidate) => {
    onAdd({
      title: c.title,
      category: "Suggested risk",
      source: c.source,
      priority: (["Urgent", "High", "Normal", "Low"].includes(c.priority)
        ? c.priority
        : "Normal") as ReviewPriority,
      ownerName: currentUserName,
    });
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title="Risks & follow-ups"
        action={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="text-sm font-semibold text-[#7a3344] hover:underline"
          >
            {showForm ? "Cancel" : "Add follow-up"}
          </button>
        }
      >
        {showForm ? (
          <div className="mb-5 space-y-3 rounded-xl border border-stone-100 bg-[#faf9f7] p-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            />
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Source (e.g. Q2 2026 report · Page 2)"
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-3">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ReviewPriority)}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
              >
                {(["Urgent", "High", "Normal", "Low"] as ReviewPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={3}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={submit}
              className="rounded-xl bg-[#7a3344] px-4 py-2 text-sm font-medium text-white"
            >
              Save follow-up
            </button>
          </div>
        ) : null}

        {risks.length === 0 ? (
          <CompanyProfileEmptyState
            title="No open risks or follow-ups"
            copy="Confirmed company risks and follow-up items will appear here."
          />
        ) : (
          <ul className="space-y-3">
            {risks.map((r) => (
              <li key={r.id} className="rounded-xl border border-stone-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-stone-900">{r.title}</p>
                      <StatusPill
                        label={r.priority}
                        tone={r.priority === "Urgent" || r.priority === "High" ? "red" : "stone"}
                      />
                      <StatusPill
                        label={r.status}
                        tone={r.status === "Overdue" ? "red" : r.status === "Resolved" ? "green" : "amber"}
                      />
                    </div>
                    <p className="mt-1 text-xs text-stone-500">{r.source}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      Owner: {r.ownerName ?? "Unassigned"}
                      {r.dueDate ? ` · Due ${formatShortDate(r.dueDate)}` : ""}
                    </p>
                    {r.notes ? (
                      <p className="mt-2 text-sm text-stone-600">{r.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={r.status}
                      onChange={(e) => {
                        const status = e.target.value as CompanyFollowUpStatus;
                        onUpdate(r.id, {
                          status,
                          resolvedAt:
                            status === "Resolved"
                              ? new Date().toISOString()
                              : undefined,
                        });
                      }}
                      className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs"
                    >
                      {(
                        [
                          "Open",
                          "Follow-up required",
                          "Monitoring",
                          "Pending management response",
                          "Resolved",
                          "Overdue",
                        ] as CompanyFollowUpStatus[]
                      ).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {r.status !== "Resolved" ? (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdate(r.id, {
                            status: "Resolved",
                            resolvedAt: new Date().toISOString(),
                          })
                        }
                        className="text-xs font-semibold text-[#7a3344] hover:underline"
                      >
                        Resolve
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {candidates.length > 0 ? (
        <SectionCard
          title="Suggested risk candidates"
          helper="Derived from reporting issues and material approved metric moves. Confirm to track formally."
        >
          <ul className="space-y-3">
            {candidates.map((c) => (
              <li
                key={c.title}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-stone-900">{c.title}</p>
                  <p className="mt-1 text-xs text-stone-500">{c.source}</p>
                </div>
                <button
                  type="button"
                  onClick={() => confirmCandidate(c)}
                  className="text-sm font-semibold text-[#7a3344] hover:underline"
                >
                  Confirm as follow-up
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </div>
  );
}
