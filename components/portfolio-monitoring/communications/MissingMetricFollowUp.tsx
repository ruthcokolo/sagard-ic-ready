"use client";

/**
 * Missing-metric card and company message composer for outreach emails.
 */
import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import {
  getCommunicationTemplate,
  renderCommunicationTemplate,
  validateTemplateContext,
} from "@/lib/portfolio/communication-templates";
import { getPrimaryReportingContact } from "@/lib/portfolio/contact-extraction";
import {
  describeDuplicateRequest,
  findOpenMissingMetricRequests,
} from "@/lib/portfolio/outbound-request-detection";
import { hasPortfolioPermission } from "@/lib/portfolio/portfolio-permissions";
import type { CompanyCommunication } from "@/lib/portfolio/monitoring-phase-types";

/** Renders the missing metric card UI. */
export function MissingMetricCard({
  companyId,
  companyName,
  metricName,
  reportPeriod,
  packageId,
  reportName,
  reason,
  onRequest,
  onMarkNotApplicable,
}: {
  companyId: string;
  companyName: string;
  metricName: string;
  reportPeriod: string;
  packageId?: string;
  reportName?: string;
  reason: string;
  onRequest: () => void;
  onMarkNotApplicable: () => void;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
      <h3 className="text-sm font-semibold text-stone-900">
        {metricName} was not found in the {reportPeriod} report
      </h3>
      <p className="mt-1 text-[12px] leading-relaxed text-stone-600">{reason}</p>
      <p className="mt-2 text-[11px] text-stone-500">{companyName}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRequest}
          className="rounded-lg bg-[#63202e] px-3 py-1.5 text-[12px] font-semibold text-white"
        >
          Request from company
        </button>
        <button
          type="button"
          onClick={onMarkNotApplicable}
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-stone-700"
        >
          Mark not applicable
        </button>
        <button
          type="button"
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-stone-700"
        >
          Expected next period
        </button>
        <button
          type="button"
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-stone-700"
        >
          Add internal note
        </button>
      </div>
      {packageId || reportName ? (
        <p className="mt-2 text-[11px] text-stone-400">
          Linked package: {reportName ?? packageId}
        </p>
      ) : null}
    </div>
  );
}

/** Renders the company message composer UI. */
export function CompanyMessageComposer({
  open,
  onClose,
  companyId,
  companyName,
  packageId,
  reportPeriod,
  reportName,
  missingMetrics,
}: {
  open: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  packageId?: string;
  reportPeriod: string;
  reportName?: string;
  missingMetrics: string[];
}) {
  const { user } = useAuth();
  const { state, saveCompanyCommunication } = usePortfolio();
  const canSend = hasPortfolioPermission(user?.role, "canSendCompanyMessages");
  const contact = getPrimaryReportingContact(state.companyContacts ?? [], companyId);
  const template = getCommunicationTemplate(
    state.communicationTemplates ?? [],
    "missing_required_metrics"
  );

  const due = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }, []);

  const context = {
    company_name: companyName,
    contact_name: contact?.name,
    contact_email: contact?.email,
    reporting_period: reportPeriod,
    report_name: reportName ?? "reporting package",
    missing_metrics_list: missingMetrics.map((m) => `• ${m}`).join("\n"),
    monitoring_reason: "liquidity and portfolio monitoring",
    requested_due_date: due,
    reviewer_name: user?.name ?? "Alex Rivera",
    reviewer_title: "Associate · Investments",
  };

  const rendered = template
    ? renderCommunicationTemplate(template, context, { fallbackGreeting: "Hello," })
    : { subject: "", body: "" };

  const [subject, setSubject] = useState(rendered.subject);
  const [body, setBody] = useState(rendered.body);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const openDupes = findOpenMissingMetricRequests(state.companyCommunications ?? [], {
    companyId,
    metricNames: missingMetrics,
  });
  const issues = validateTemplateContext(subject, body, context);

  if (!open) return null;

  const persist = (status: CompanyCommunication["status"]) => {
    const now = new Date().toISOString();
    const record: CompanyCommunication = {
      id: `comm-${Date.now()}`,
      companyId,
      packageId,
      reportingPeriod: reportPeriod,
      contactId: contact?.id,
      type: "missing_metrics_request",
      subject,
      body,
      requestedMetricNames: missingMetrics,
      requestedDueDate: due,
      status,
      createdBy: user?.name ?? "Associate",
      createdAt: now,
      updatedAt: now,
      sentBy: status === "sent" || status === "copied" ? user?.name : undefined,
      sentAt: status === "sent" || status === "copied" ? now : undefined,
    };
    saveCompanyCommunication(record);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-900/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-2xl">
        <div className="border-b border-stone-100 px-5 py-4">
          <h2 className="font-display text-xl text-stone-900">Request missing metrics</h2>
          <p className="mt-1 text-sm text-stone-500">{companyName} · {reportPeriod}</p>
        </div>
        <div className="space-y-3 px-5 py-4">
          {openDupes.length > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-950">
              {describeDuplicateRequest(openDupes)}
            </div>
          ) : null}
          {!contact ? (
            <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-[12px] text-stone-600">
              No confirmed reporting contact. Add a contact, or copy the message for use outside
              ICReady.
            </div>
          ) : null}
          <label className="block text-[12px] text-stone-600">
            Recipient
            <input
              value={contact ? `${contact.name} <${contact.email}>` : ""}
              readOnly
              placeholder="No confirmed contact"
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-[12px] text-stone-600">
            Subject
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-[12px] text-stone-600">
            Message
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          {issues
            .filter((i) => i.kind === "unavailable")
            .map((i) => (
              <p key={i.variable} className="text-[11px] text-amber-800">
                {i.message}
              </p>
            ))}
          {statusNote ? <p className="text-[12px] text-emerald-700">{statusNote}</p> : null}
          <p className="text-[11px] text-stone-400">
            Email integration is not connected. Messages are saved as drafts or copied — ICReady
            does not claim they were sent.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              persist("draft");
              setStatusNote("Draft saved internally.");
            }}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(`${subject}\n\n${body}`);
              persist("copied");
              setStatusNote("Message copied to clipboard.");
            }}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold"
          >
            Copy message
          </button>
          <button
            type="button"
            disabled={!canSend}
            onClick={() => {
              // No email integration — record as draft-like "copied" intent with explicit note
              persist("draft");
              setStatusNote(
                "Send unavailable without email integration. Draft saved — use Copy message or your mail client."
              );
            }}
            className="rounded-lg bg-[#63202e] px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Send now
          </button>
        </div>
      </div>
    </div>
  );
}
