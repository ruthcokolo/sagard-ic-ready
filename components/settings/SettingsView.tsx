"use client";

/** Settings page for profile, integrations, and notification preferences. */
import { useState } from "react";
import Link from "next/link";
import { pipelineStats } from "@/lib/deals-pipeline";
import { DEMO_METRICS, systemActivityLog } from "@/lib/insights";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLE_LABELS } from "@/lib/auth-constants";
import {
  IconCheck,
  IconChevronRight,
  IconClock,
  IconExternalLink,
} from "@/components/ui/Icons";

const SHEET_COLUMNS = ["Company name", "Sector", "Annual revenue", "Round", "Owner", "Stage"];

const FLOW_STEPS = [
  {
    label: "Google Sheets",
    sub: "New deals",
    shell: "border-emerald-200 bg-emerald-50/80",
    iconBg: "bg-emerald-100 text-emerald-700",
    icon: "📊",
  },
  {
    label: "n8n",
    sub: "Clean up data",
    shell: "border-[#7a3344]/25 bg-[#fdf2f4]/80",
    iconBg: "bg-[#fdf2f4] text-[#7a3344]",
    icon: "⚡",
  },
  {
    label: "Claude",
    sub: "AI review",
    shell: "border-amber-200 bg-amber-50/80",
    iconBg: "bg-amber-100 text-amber-800",
    icon: "AI",
  },
  {
    label: "Review queue",
    sub: "Your work",
    shell: "border-[#7a3344]/40 bg-[#7a3344]/5",
    iconBg: "bg-[#7a3344] text-white",
    icon: "☑",
    href: "/ic-readiness",
  },
] as const;

/** Account and integration settings form. */
export function SettingsView() {
  const { user } = useAuth();
  const [emailAlerts, setEmailAlerts] = useState(false);

  const integrations = [
    {
      name: "Google Sheets",
      tag: "INTAKE",
      description: "Deal pipeline spreadsheet · live sync",
      status: user?.integrations.sheets ?? true,
    },
    {
      name: "n8n Automation",
      tag: "WORKFLOW",
      description: "Normalizes rows and triggers AI review",
      status: user?.integrations.n8n ?? true,
    },
    {
      name: "Claude",
      tag: "ANALYSIS",
      description: "Cross-source comparison and IC drafts",
      status: user?.integrations.claude ?? true,
    },
  ];

  const connectedCount = integrations.filter((i) => i.status).length;

  return (
    <div className="min-h-screen bg-[#f4f2ef]">
      <header className="border-b border-stone-200/60 bg-white px-8 py-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9e4456]">Setup</p>
        <h1 className="font-display mt-1 text-[2.25rem] leading-tight text-stone-900">Settings</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-stone-500">
          Control how deals enter the system and what rules apply before export.
        </p>
      </header>

      <div className="space-y-5 px-8 py-6">
        {/* Top row */}
        <div className="grid gap-5 lg:grid-cols-2">
          {user && (
            <section className="overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="border-b border-stone-100 bg-gradient-to-r from-[#fdf2f4]/80 via-white to-white px-5 py-4">
                <h2 className="text-sm font-semibold text-stone-900">Your account</h2>
                <p className="mt-0.5 text-xs text-stone-500">Profile and workspace access</p>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7a3344] to-[#5a2533] text-lg font-bold text-white shadow-sm">
                      {user.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-stone-900">{user.name}</p>
                      <p className="mt-0.5 text-sm text-stone-600">{user.email}</p>
                      <span className="mt-2 inline-flex rounded-full bg-[#fdf2f4] px-2.5 py-0.5 text-[11px] font-semibold text-[#7a3344] ring-1 ring-[#7a3344]/10">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-[#7a3344] px-3.5 py-2 text-xs font-semibold text-[#7a3344] transition hover:bg-[#fdf2f4]"
                  >
                    Edit profile
                  </button>
                </div>

                <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                  <AccountStat label="Assigned deals" value="73" hint="In your review queue" />
                  <AccountStat label="Exports recorded" value="16" hint="Decisions you signed off" />
                  <AccountStat label="Session" value="Active" hint="Signed in on this device" />
                </dl>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-stone-900">Workspace health</h2>
            <ul className="mt-4 space-y-3">
              <HealthRow
                value={String(connectedCount)}
                label="Connected tools"
                sub="All systems online"
              />
              <HealthRow
                value={pipelineStats.total.toLocaleString()}
                label="Synced companies"
                sub="From your spreadsheet"
              />
              <HealthRow value="Active" label="Rules status" sub="Enforced before export" />
            </ul>
          </section>
        </div>

        {/* Activity history */}
        <section className="rounded-2xl border border-stone-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">Activity history</h2>
              <p className="mt-0.5 text-sm text-stone-500">
                Sheet syncs, sign-ins, and overnight jobs · last refresh{" "}
                <span className="font-medium text-stone-700">Today, {DEMO_METRICS.dataRefreshTime}</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live sync active
            </span>
          </div>
          <ul className="divide-y divide-stone-100">
            {systemActivityLog.map((entry) => (
              <li key={entry.id} className="flex gap-4 px-5 py-4">
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm ${activityIconStyle(entry.type)}`}
                >
                  {activityIcon(entry.type)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-stone-900">{entry.title}</p>
                    <time className="shrink-0 text-xs tabular-nums text-stone-400">{entry.timestamp}</time>
                  </div>
                  <p className="mt-0.5 text-sm text-stone-600">{entry.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* How deals enter */}
        <section className="rounded-2xl border border-stone-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-stone-900">How deals enter</h2>
          <p className="mt-1 text-sm text-stone-500">
            {pipelineStats.total.toLocaleString()} companies synced from your spreadsheet
          </p>

          <div className="mt-6 flex flex-wrap items-stretch gap-2 lg:flex-nowrap">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.label} className="flex min-w-[140px] flex-1 items-center gap-2">
                {"href" in step && step.href ? (
                  <Link
                    href={step.href}
                    className={`flex flex-1 flex-col items-center rounded-xl border px-4 py-4 text-center transition hover:shadow-sm ${step.shell}`}
                  >
                    <FlowStepInner step={step} />
                  </Link>
                ) : (
                  <div
                    className={`flex flex-1 flex-col items-center rounded-xl border px-4 py-4 text-center ${step.shell}`}
                  >
                    <FlowStepInner step={step} />
                  </div>
                )}
                {i < FLOW_STEPS.length - 1 && (
                  <span className="hidden shrink-0 text-stone-300 lg:inline" aria-hidden>
                    →
                  </span>
                )}
              </div>
            ))}
          </div>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Data we pull from the sheet
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SHEET_COLUMNS.map((col) => (
              <span
                key={col}
                className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600"
              >
                {col}
              </span>
            ))}
          </div>
        </section>

        {/* Bottom row */}
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-stone-900">Connected tools</h2>
            <ul className="mt-4 divide-y divide-stone-100">
              {integrations.map((tool) => (
                <li key={tool.name} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      {tool.name}{" "}
                      <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                        {tool.tag}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">{tool.description}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-emerald-600">
                    ● {tool.status ? "Connected · Live sync" : "Disconnected"}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="#"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#7a3344] hover:underline"
            >
              Manage integrations
              <IconExternalLink className="h-3.5 w-3.5" />
            </Link>
          </section>

          <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h2 className="text-sm font-semibold text-stone-900">Rules before export</h2>
            <ul className="mt-4 space-y-3">
              <RuleRow checked label="Decision rationale required before download" />
              <RuleRow
                checked
                label="Cannot recommend to committee while material conflicts remain"
              />
              <li className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-stone-300 bg-white" />
                  <span className="text-sm text-stone-700">Email when new rows arrive</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailAlerts}
                  onClick={() => setEmailAlerts((v) => !v)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    emailAlerts ? "bg-[#7a3344]" : "bg-stone-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      emailAlerts ? "left-[1.35rem]" : "left-0.5"
                    }`}
                  />
                </button>
              </li>
            </ul>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#7a3344] hover:underline"
            >
              Manage rules
              <IconChevronRight />
            </button>
          </section>
        </div>

        {/* Overnight schedule */}
        <section className="rounded-2xl border border-stone-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <IconClock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900">What happens overnight</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-600">
                Each night, ICReady syncs your spreadsheet, normalizes new rows through n8n, and
                runs Claude cross-source review. Flagged deals appear in your review queue by
                morning.
              </p>
              <p className="mt-2 text-xs text-stone-400">
                Runs daily at 2:00 AM ET · Next run in 10h 24m · All times in your timezone
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AccountStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50/60 px-3 py-2.5">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{label}</dt>
      <dd className="mt-1 text-lg font-semibold tabular-nums text-stone-900">{value}</dd>
      <dd className="mt-0.5 text-[11px] text-stone-500">{hint}</dd>
    </div>
  );
}

function HealthRow({ value, label, sub }: { value: string; label: string; sub: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        <IconCheck className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-stone-900">
          {value} <span className="font-medium text-stone-600">{label}</span>
        </p>
        <p className="text-xs text-stone-500">{sub}</p>
      </div>
    </li>
  );
}

function FlowStepInner({
  step,
}: {
  step: (typeof FLOW_STEPS)[number];
}) {
  return (
    <>
      <span
        className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-sm ${step.iconBg}`}
      >
        {step.icon}
      </span>
      <p className="text-sm font-semibold text-stone-900">{step.label}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-400">
        {step.sub}
      </p>
    </>
  );
}

function RuleRow({ checked, label }: { checked: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded ${
          checked ? "bg-[#7a3344] text-white" : "border border-stone-300 bg-white"
        }`}
      >
        {checked && <IconCheck className="h-3 w-3" />}
      </span>
      <span className="text-sm text-stone-700">{label}</span>
    </li>
  );
}

function activityIconStyle(type: (typeof systemActivityLog)[number]["type"]) {
  const styles = {
    sync: "bg-blue-50 text-blue-600",
    login: "bg-stone-100 text-stone-600",
    workflow: "bg-[#fdf2f4] text-[#7a3344]",
    analysis: "bg-violet-50 text-violet-600",
  };
  return styles[type];
}

function activityIcon(type: (typeof systemActivityLog)[number]["type"]) {
  const icons = { sync: "↻", login: "→", workflow: "⚡", analysis: "AI" };
  return icons[type];
}
