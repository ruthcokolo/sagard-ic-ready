"use client";

/** Personalized greeting with quick stats for the signed-in user. */
import { useState } from "react";
import Link from "next/link";
import { DEMO_DEAL_ID } from "@/lib/insights";
import { firstName } from "@/lib/auth-session";
import { useAuth } from "@/components/auth/AuthProvider";

/** Renders the welcome banner UI. */
export function WelcomeBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!user || dismissed) return null;

  return (
    <section className="mx-8 mb-6 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Workspace ready
          </p>
          <h2 className="mt-1 text-lg font-semibold text-stone-900">
            Welcome, {firstName(user.name)}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-stone-600">
            Your review queue is live. Start with the Northwind Logistics demo to walk through
            conflict resolution, AI drafting, and the human decision gate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/companies/${DEMO_DEAL_ID}?from=dashboard`}
            className="rounded-xl bg-[#7a3344] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a2533]"
          >
            Review Northwind →
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Dismiss
          </button>
        </div>
      </div>
    </section>
  );
}
