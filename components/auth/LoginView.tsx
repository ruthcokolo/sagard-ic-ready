"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/auth-constants";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AuthButton,
  AuthDivider,
  AuthField,
  AuthFooterLink,
  AuthShell,
} from "@/components/auth/AuthShell";

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const next = searchParams.get("next");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await login(email.trim(), password);

    if (!result.ok) {
      setError(result.error ?? "Sign in failed.");
      setSubmitting(false);
      return;
    }

    const sessionRes = await fetch("/api/auth/session", { credentials: "include" });
    const sessionData = await sessionRes.json();
    const user = sessionData.user;

    if (user?.onboardingComplete) {
      router.push(next && next.startsWith("/") ? next : "/dashboard");
    } else {
      router.push("/onboarding");
    }
    router.refresh();
  };

  const fillDemo = () => {
    const demo = DEMO_ACCOUNTS[0];
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your ICReady workspace. Review overnight findings, resolve conflicts, and record IC decisions."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Work email"
          id="email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@sagard.com"
          autoComplete="email"
          required
        />
        <AuthField
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <AuthButton type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </AuthButton>
      </form>

      <AuthDivider label="or try the demo" />

      <AuthButton variant="secondary" onClick={fillDemo}>
        Use demo account ({DEMO_ACCOUNTS[0].user.name})
      </AuthButton>

      <p className="mt-3 text-center text-xs text-stone-400">
        Demo password: <span className="font-mono text-stone-600">{DEMO_PASSWORD}</span>
      </p>

      <AuthFooterLink prompt="New to ICReady?" href="/onboarding" label="Set up your workspace" />
    </AuthShell>
  );
}
