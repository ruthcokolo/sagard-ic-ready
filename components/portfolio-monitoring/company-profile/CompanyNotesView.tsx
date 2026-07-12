"use client";

/**
 * Tab view for internal notes about a company.
 */
import { useState } from "react";
import {
  CompanyProfileEmptyState,
  SectionCard,
  formatShortDate,
} from "@/components/portfolio-monitoring/company-profile/shared";
import type { CompanyNote } from "@/lib/portfolio/types";

type Props = {
  notes: CompanyNote[];
  currentUserId: string;
  currentUserName: string;
  onAdd: (body: string) => void;
  onUpdate: (id: string, body: string) => void;
  onDelete: (id: string) => void;
  autoFocusCompose?: boolean;
};

/** Internal notes tab on the company profile. */
export function CompanyNotesView({
  notes,
  currentUserId,
  onAdd,
  onUpdate,
  onDelete,
  autoFocusCompose,
}: Props) {
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const submit = () => {
    if (!body.trim()) return;
    onAdd(body.trim());
    setBody("");
  };

  return (
    <div className="space-y-5">
      <SectionCard title="Add note" helper="Internal only — not exposed externally">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          autoFocus={autoFocusCompose}
          placeholder="Write an internal company note…"
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={submit}
          className="mt-3 rounded-xl bg-[#7a3344] px-4 py-2 text-sm font-medium text-white"
        >
          Add note
        </button>
      </SectionCard>

      <SectionCard title="Company notes">
        {notes.length === 0 ? (
          <CompanyProfileEmptyState title="No company notes yet" />
        ) : (
          <ul className="space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-stone-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-xs text-stone-400">
                    {n.authorName} · {formatShortDate(n.createdAt)}
                    {n.updatedAt ? " · edited" : ""}
                  </p>
                  {n.authorId === currentUserId ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#7a3344] hover:underline"
                        onClick={() => {
                          setEditingId(n.id);
                          setEditBody(n.body);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs font-semibold text-stone-500 hover:underline"
                        onClick={() => onDelete(n.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
                {editingId === n.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdate(n.id, editBody);
                          setEditingId(null);
                        }}
                        className="rounded-lg bg-[#7a3344] px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-xs text-stone-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">{n.body}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
