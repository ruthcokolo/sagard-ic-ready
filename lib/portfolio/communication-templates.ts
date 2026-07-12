import type {
  CommunicationTemplate,
  CommunicationTemplateCategory,
  TemplateRenderContext,
  TemplateValidationIssue,
} from "./monitoring-phase-types";

export const TEMPLATE_VARIABLES = [
  "company_name",
  "contact_name",
  "contact_email",
  "reporting_period",
  "report_name",
  "missing_metrics_list",
  "monitoring_reason",
  "requested_due_date",
  "reviewer_name",
  "reviewer_title",
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

const DEFAULT_MISSING_METRICS: Omit<CommunicationTemplate, "id"> = {
  name: "Missing required metrics",
  category: "missing_required_metrics",
  subject:
    "Additional information requested for {{company_name}} — {{reporting_period}}",
  body: `Hi {{contact_name}},

Thank you for submitting {{report_name}} for {{reporting_period}}.

During our review, we were unable to locate the following information:

{{missing_metrics_list}}

This information is used for {{monitoring_reason}}.

Could you please reply with the requested values or provide an updated reporting package by {{requested_due_date}}?

Thank you,

{{reviewer_name}}
{{reviewer_title}}`,
  active: true,
  version: 1,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

export function createDefaultCommunicationTemplates(): CommunicationTemplate[] {
  const now = new Date().toISOString();
  const base = (partial: Partial<CommunicationTemplate> & { category: CommunicationTemplateCategory; name: string; subject: string; body: string }): CommunicationTemplate => ({
    id: `tmpl-${partial.category}`,
    active: true,
    version: 1,
    createdAt: now,
    updatedAt: now,
    ...partial,
  });

  return [
    {
      id: "tmpl-missing_required_metrics",
      ...DEFAULT_MISSING_METRICS,
      createdAt: now,
      updatedAt: now,
    },
    base({
      category: "report_overdue",
      name: "Report overdue",
      subject: "Overdue reporting package — {{company_name}} {{reporting_period}}",
      body: `Hi {{contact_name}},\n\nWe have not yet received the {{reporting_period}} reporting package for {{company_name}}.\n\nPlease upload or send the package by {{requested_due_date}}.\n\nThank you,\n{{reviewer_name}}\n{{reviewer_title}}`,
    }),
    base({
      category: "revised_report_requested",
      name: "Revised report requested",
      subject: "Revised reporting package requested — {{company_name}} {{reporting_period}}",
      body: `Hi {{contact_name}},\n\nPlease provide a revised version of {{report_name}} for {{reporting_period}}.\n\n{{missing_metrics_list}}\n\nRequested by {{requested_due_date}}.\n\nThank you,\n{{reviewer_name}}`,
    }),
    base({
      category: "metric_clarification",
      name: "Metric clarification",
      subject: "Clarification needed — {{company_name}} {{reporting_period}}",
      body: `Hi {{contact_name}},\n\nWe need clarification on the following items in {{report_name}}:\n\n{{missing_metrics_list}}\n\nThank you,\n{{reviewer_name}}`,
    }),
    base({
      category: "conflicting_values",
      name: "Conflicting values",
      subject: "Conflicting values in {{report_name}}",
      body: `Hi {{contact_name}},\n\nWe found conflicting values for:\n\n{{missing_metrics_list}}\n\nPlease confirm the correct figures for {{reporting_period}}.\n\nThank you,\n{{reviewer_name}}`,
    }),
    base({
      category: "unreadable_source",
      name: "Unreadable source document",
      subject: "Unreadable reporting file — {{company_name}}",
      body: `Hi {{contact_name}},\n\nWe were unable to process {{report_name}} (password-protected, scanned, or damaged).\n\nPlease send an unlocked, text-selectable PDF by {{requested_due_date}}.\n\nThank you,\n{{reviewer_name}}`,
    }),
    base({
      category: "reporting_reminder",
      name: "Reporting reminder",
      subject: "Upcoming reporting reminder — {{company_name}} {{reporting_period}}",
      body: `Hi {{contact_name}},\n\nThis is a reminder that the {{reporting_period}} report for {{company_name}} is due by {{requested_due_date}}.\n\nThank you,\n{{reviewer_name}}`,
    }),
    base({
      category: "follow_up_reminder",
      name: "Follow-up reminder",
      subject: "Follow-up: {{company_name}} — {{reporting_period}}",
      body: `Hi {{contact_name}},\n\nFollowing up on our previous request regarding:\n\n{{missing_metrics_list}}\n\nPlease reply by {{requested_due_date}}.\n\nThank you,\n{{reviewer_name}}`,
    }),
  ];
}

export function getCommunicationTemplate(
  templates: CommunicationTemplate[],
  category: CommunicationTemplateCategory
): CommunicationTemplate | null {
  return templates.find((t) => t.category === category && t.active) ?? null;
}

export function extractTemplateVariables(text: string): string[] {
  const found = new Set<string>();
  const re = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) found.add(m[1]);
  return [...found];
}

export function validateTemplateSyntax(subject: string, body: string): TemplateValidationIssue[] {
  const issues: TemplateValidationIssue[] = [];
  const combined = `${subject}\n${body}`;
  if ((combined.match(/\{\{/g) ?? []).length !== (combined.match(/\}\}/g) ?? []).length) {
    issues.push({
      variable: "",
      kind: "unclosed",
      message: "Template has mismatched {{ }} braces.",
    });
  }
  for (const variable of extractTemplateVariables(combined)) {
    if (!(TEMPLATE_VARIABLES as readonly string[]).includes(variable)) {
      issues.push({
        variable,
        kind: "unknown",
        message: `Unknown variable {{${variable}}}.`,
      });
    }
  }
  return issues;
}

export function validateTemplateContext(
  subject: string,
  body: string,
  context: TemplateRenderContext
): TemplateValidationIssue[] {
  const issues = validateTemplateSyntax(subject, body);
  for (const variable of extractTemplateVariables(`${subject}\n${body}`)) {
    const key = variable as keyof TemplateRenderContext;
    const value = context[key];
    if (value == null || String(value).trim() === "") {
      issues.push({
        variable,
        kind: "unavailable",
        message:
          variable === "contact_name"
            ? "{{contact_name}} is unavailable because no company contact is selected."
            : `{{${variable}}} is unavailable in the current context.`,
      });
    }
  }
  return issues;
}

export function renderCommunicationTemplate(
  template: Pick<CommunicationTemplate, "subject" | "body">,
  context: TemplateRenderContext,
  options?: { fallbackGreeting?: string }
): { subject: string; body: string } {
  const replace = (text: string) =>
    text.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (_, key: string) => {
      const value = context[key as keyof TemplateRenderContext];
      if (value != null && String(value).trim() !== "") return String(value);
      if (key === "contact_name" && options?.fallbackGreeting) {
        return options.fallbackGreeting.replace(/,$/, "");
      }
      return "";
    });

  let body = replace(template.body);
  if (!context.contact_name?.trim() && options?.fallbackGreeting) {
    body = body.replace(/^Hi\s*,/m, options.fallbackGreeting).replace(/^Hi\s+\n/m, `${options.fallbackGreeting}\n`);
  }

  return { subject: replace(template.subject).replace(/\s+/g, " ").trim(), body };
}

export function resetTemplateToDefault(
  category: CommunicationTemplateCategory
): CommunicationTemplate | null {
  const defaults = createDefaultCommunicationTemplates();
  return defaults.find((t) => t.category === category) ?? null;
}
