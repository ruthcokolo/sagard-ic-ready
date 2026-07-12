"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import {
  createDefaultCommunicationTemplates,
  renderCommunicationTemplate,
  resetTemplateToDefault,
  validateTemplateSyntax,
} from "@/lib/portfolio/communication-templates";
import type { CommunicationTemplate } from "@/lib/portfolio/monitoring-phase-types";
import { hasPortfolioPermission } from "@/lib/portfolio/portfolio-permissions";

export function CommunicationTemplatesView() {
  const { user } = useAuth();
  const { state, saveCommunicationTemplate } = usePortfolio();
  const canEdit = hasPortfolioPermission(user?.role, "canEditCommunicationTemplates");
  const templates =
    state.communicationTemplates?.length
      ? state.communicationTemplates
      : createDefaultCommunicationTemplates();
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");
  const selected = templates.find((t) => t.id === selectedId) ?? templates[0];
  const [draft, setDraft] = useState<CommunicationTemplate | null>(null);
  const active = draft && draft.id === selected?.id ? draft : selected;

  const issues = useMemo(
    () => (active ? validateTemplateSyntax(active.subject, active.body) : []),
    [active]
  );

  const preview = useMemo(() => {
    if (!active) return null;
    return renderCommunicationTemplate(active, {
      company_name: "Veridian Cloud Systems",
      contact_name: "Jamie Chen",
      contact_email: "jamie@veridian.example",
      reporting_period: "Q2 2026",
      report_name: "Q2 Board Update",
      missing_metrics_list: "• Cash\n• EBITDA",
      monitoring_reason: "liquidity and runway monitoring",
      requested_due_date: "July 25, 2026",
      reviewer_name: user?.name ?? "Alex Rivera",
      reviewer_title: "Associate · Investments",
    });
  }, [active, user?.name]);

  return (
    <div className="min-h-screen bg-[#f4f2ef] px-8 py-6">
      <div>
        <h1 className="font-display text-3xl text-stone-900">Communication templates</h1>
        <p className="mt-1 max-w-2xl text-sm text-stone-500">
          Edit subjects and bodies used for missing-metric and reporting follow-ups.
        </p>
      </div>

      {!active ? (
        <section className="mt-6 rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">No communication templates configured.</p>
        </section>
      ) : (
        <section className="mt-6 rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <select
                value={active.id}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setDraft(null);
                }}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <label className="mt-3 block text-[12px] text-stone-600">
                Subject
                <input
                  value={active.subject}
                  disabled={!canEdit}
                  onChange={(e) => setDraft({ ...active, subject: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="mt-3 block text-[12px] text-stone-600">
                Body
                <textarea
                  value={active.body}
                  disabled={!canEdit}
                  onChange={(e) => setDraft({ ...active, body: e.target.value })}
                  rows={12}
                  className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 font-mono text-[12px]"
                />
              </label>
              {issues.length > 0 ? (
                <ul className="mt-2 space-y-1 text-[12px] text-amber-800">
                  {issues.map((i, idx) => (
                    <li key={idx}>{i.message}</li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canEdit || issues.some((i) => i.kind !== "unavailable")}
                  onClick={() => {
                    if (!active) return;
                    saveCommunicationTemplate({
                      ...active,
                      version: active.version + 1,
                      updatedAt: new Date().toISOString(),
                      updatedBy: user?.name,
                    });
                    setDraft(null);
                  }}
                  className="rounded-lg bg-[#63202e] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => {
                    const reset = resetTemplateToDefault(active.category);
                    if (reset) {
                      saveCommunicationTemplate(reset);
                      setDraft(null);
                    }
                  }}
                  className="rounded-lg border border-stone-200 px-3 py-1.5 text-[12px] font-semibold text-stone-700"
                >
                  Reset to default
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-stone-100 bg-[#faf9f7] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                Live preview
              </p>
              <p className="mt-2 text-sm font-semibold text-stone-900">{preview?.subject}</p>
              <pre className="mt-3 whitespace-pre-wrap text-[12px] leading-relaxed text-stone-700">
                {preview?.body}
              </pre>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
