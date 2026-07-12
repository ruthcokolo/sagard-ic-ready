"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { IntegrationState, UserRole } from "@/lib/auth-types";
import { DEMO_DEAL_ID } from "@/lib/insights";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AuthButton,
  AuthField,
  AuthFooterLink,
  AuthShell,
} from "@/components/auth/AuthShell";

const STEPS = ["welcome", "profile", "connect", "ready"] as const;
type Step = (typeof STEPS)[number];

const ROLE_OPTIONS: { value: UserRole; label: string; hint: string }[] = [
  { value: "associate", label: "Associate", hint: "Runs diligence and prepares IC materials" },
  { value: "principal", label: "Principal", hint: "Leads deal workstreams and IC prep" },
  { value: "partner", label: "Partner", hint: "Records final IC recommendation" },
];

const INTEGRATIONS: {
  key: keyof IntegrationState;
  name: string;
  role: string;
}[] = [
  { key: "sheets", name: "Google Sheets", role: "Deal pipeline intake" },
  { key: "n8n", name: "n8n", role: "Overnight sync and normalization" },
  { key: "claude", name: "Claude", role: "Cross-source analysis and drafting" },
];

export function OnboardingView() {
  const router = useRouter();
  const { user, refreshSession } = useAuth();
  const [step, setStep] = useState<Step>("welcome");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(user?.role ?? "associate");
  const [integrations, setIntegrations] = useState<IntegrationState>({
    sheets: false,
    n8n: false,
    claude: false,
  });
  const [connecting, setConnecting] = useState<keyof IntegrationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const connectIntegration = useCallback(async (key: keyof IntegrationState) => {
    setConnecting(key);
    await new Promise((r) => setTimeout(r, 700));
    setIntegrations((prev) => ({ ...prev, [key]: true }));
    setConnecting(null);
  }, []);

  const connectAll = useCallback(async () => {
    for (const item of INTEGRATIONS) {
      if (!integrations[item.key]) {
        await connectIntegration(item.key);
      }
    }
  }, [connectIntegration, integrations]);

  const saveProgress = async (complete: boolean) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        integrations,
        complete,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error ?? "Could not save your workspace.");
    }

    await refreshSession();
    return data.user;
  };

  const handleProfileNext = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("Enter your name, email, and a password with at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await saveProgress(false);
      setStep("connect");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async (destination: "dashboard" | "northwind") => {
    setError(null);
    setSubmitting(true);
    try {
      if (!integrations.sheets || !integrations.n8n || !integrations.claude) {
        await connectAll();
      }
      await saveProgress(true);
      if (destination === "northwind") {
        router.push(`/dashboard/companies/${DEMO_DEAL_ID}?from=onboarding&welcome=1`);
      } else {
        router.push("/dashboard?welcome=1");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={step === "welcome" ? "Set up ICReady" : step === "profile" ? "Your profile" : step === "connect" ? "Connect your stack" : "You're ready"}
      subtitle={
        step === "welcome"
          ? "A short setup so your workspace reflects your role and connected systems."
          : step === "profile"
            ? "This is how your name appears on decisions and exports."
            : step === "connect"
              ? "ICReady reads from your pipeline sheet, runs overnight via n8n, and analyzes with Claude."
              : "Your review queue is waiting. Start with the guided Northwind demo or explore the dashboard."
      }
    >
      <div className="mb-6">
        <div className="flex justify-between text-xs font-medium text-stone-400">
          <span>
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-[#7a3344] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {step === "welcome" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <ol className="space-y-4 text-sm text-stone-600">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fdf2f4] text-xs font-bold text-[#7a3344]">
                  1
                </span>
                <span>
                  <strong className="text-stone-900">AI reviews overnight</strong> — compares
                  spreadsheets, memos, and models for contradictions.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fdf2f4] text-xs font-bold text-[#7a3344]">
                  2
                </span>
                <span>
                  <strong className="text-stone-900">You resolve gaps</strong> — fix mismatched
                  numbers and review the AI draft one-pager.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#fdf2f4] text-xs font-bold text-[#7a3344]">
                  3
                </span>
                <span>
                  <strong className="text-stone-900">You record the decision</strong> — export
                  unlocks only after Proceed, More Diligence, or Pass.
                </span>
              </li>
            </ol>
          </div>
          <AuthButton onClick={() => setStep("profile")}>Continue</AuthButton>
          <AuthFooterLink prompt="Already have an account?" href="/login" label="Sign in" />
        </div>
      )}

      {step === "profile" && (
        <div className="space-y-4">
          <AuthField
            label="Full name"
            id="name"
            value={name}
            onChange={setName}
            placeholder="Alex Rivera"
            autoComplete="name"
            required
          />
          <AuthField
            label="Work email"
            id="onboard-email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@sagard.com"
            autoComplete="email"
            required
          />
          <AuthField
            label="Create password"
            id="onboard-password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            required
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Your role</p>
            <div className="mt-2 space-y-2">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-left transition ${
                    role === opt.value
                      ? "border-[#7a3344] bg-[#fdf2f4]"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-stone-900">{opt.label}</p>
                  <p className="text-xs text-stone-500">{opt.hint}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <AuthButton variant="secondary" onClick={() => setStep("welcome")}>
              Back
            </AuthButton>
            <AuthButton disabled={submitting} onClick={handleProfileNext}>
              {submitting ? "Saving…" : "Continue"}
            </AuthButton>
          </div>
        </div>
      )}

      {step === "connect" && (
        <div className="space-y-4">
          <ul className="space-y-3">
            {INTEGRATIONS.map((item) => {
              const connected = integrations[item.key];
              const busy = connecting === item.key;
              return (
                <li
                  key={item.key}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{item.name}</p>
                    <p className="text-xs text-stone-500">{item.role}</p>
                  </div>
                  {connected ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Connected
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy || connecting !== null}
                      onClick={() => connectIntegration(item.key)}
                      className="rounded-lg bg-[#7a3344] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5a2533] disabled:opacity-50"
                    >
                      {busy ? "Connecting…" : "Connect"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <AuthButton
            variant="secondary"
            disabled={connecting !== null}
            onClick={connectAll}
          >
            Connect all
          </AuthButton>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <AuthButton variant="secondary" onClick={() => setStep("profile")}>
              Back
            </AuthButton>
            <AuthButton
              disabled={
                submitting ||
                !integrations.sheets ||
                !integrations.n8n ||
                !integrations.claude
              }
              onClick={() => setStep("ready")}
            >
              Continue
            </AuthButton>
          </div>
        </div>
      )}

      {step === "ready" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#7a3344]/20 bg-[#fdf2f4]/50 p-5">
            <p className="text-sm font-semibold text-stone-900">Workspace ready for {name.split(" ")[0]}</p>
            <p className="mt-2 text-sm text-stone-600">
              {INTEGRATIONS.filter((i) => integrations[i.key]).length} integrations connected.
              Your review queue includes deals with cross-source conflicts waiting for you.
            </p>
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <AuthButton disabled={submitting} onClick={() => handleFinish("northwind")}>
            {submitting ? "Opening…" : "Start with Northwind demo →"}
          </AuthButton>
          <AuthButton
            variant="secondary"
            disabled={submitting}
            onClick={() => handleFinish("dashboard")}
          >
            Go to dashboard
          </AuthButton>
        </div>
      )}
    </AuthShell>
  );
}
