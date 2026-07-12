"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePortfolio } from "@/components/portfolio-monitoring/PortfolioProvider";
import { hasPortfolioPermission } from "@/lib/portfolio/portfolio-permissions";
import type { CompanyContact } from "@/lib/portfolio/monitoring-phase-types";

export function CompanyContactsPanel({ companyId }: { companyId: string }) {
  const { user } = useAuth();
  const { state, upsertCompanyContact } = usePortfolio();
  const canManage = hasPortfolioPermission(user?.role, "canManageCompanyContacts");
  const contacts = useMemo(
    () => (state.companyContacts ?? []).filter((c) => c.companyId === companyId),
    [state.companyContacts, companyId]
  );
  const suggested = contacts.filter((c) => !c.verified && c.source === "pdf_extracted");
  const confirmed = contacts.filter((c) => c.verified);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const addManual = () => {
    if (!canManage || !name.trim() || !email.trim()) return;
    const now = new Date().toISOString();
    const contact: CompanyContact = {
      id: `contact-${Date.now()}`,
      companyId,
      name: name.trim(),
      email: email.trim(),
      role: role.trim() || undefined,
      contactType: "primary_reporting",
      isPrimary: confirmed.length === 0,
      source: "manual",
      verified: true,
      createdAt: now,
      updatedAt: now,
    };
    upsertCompanyContact(contact);
    setName("");
    setEmail("");
    setRole("");
  };

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="text-[13px] font-semibold text-stone-900">Reporting contacts</h3>
      <p className="mt-1 text-[12px] text-stone-500">
        Extracted contacts are suggestions until confirmed. Do not email automatically.
      </p>

      {confirmed.length === 0 && suggested.length === 0 ? (
        <p className="mt-3 text-[12px] text-stone-500">
          No confirmed reporting contact. Add a contact or confirm an extracted suggestion.
        </p>
      ) : null}

      {confirmed.length > 0 ? (
        <ul className="mt-3 divide-y divide-stone-100 rounded-lg border border-stone-100">
          {confirmed.map((c) => (
            <li key={c.id} className="px-3 py-2 text-[13px]">
              <p className="font-medium text-stone-900">
                {c.name}
                {c.isPrimary ? (
                  <span className="ml-2 text-[10px] font-semibold uppercase text-[#7a3344]">
                    Primary
                  </span>
                ) : null}
              </p>
              <p className="text-[12px] text-stone-500">
                {c.email}
                {c.role ? ` · ${c.role}` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {suggested.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Suggested contacts
          </p>
          {suggested.map((c) => (
            <div
              key={c.id}
              className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-[12px]"
            >
              <p className="font-medium text-stone-800">
                {c.name} · {c.email}
              </p>
              <p className="text-stone-500">
                Source report{c.sourcePage ? ` · page ${c.sourcePage}` : ""} ·{" "}
                {c.sourceEvidence ?? "Extracted from PDF"}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() =>
                    upsertCompanyContact({
                      ...c,
                      verified: true,
                      isPrimary: confirmed.length === 0,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  className="rounded-md bg-[#63202e] px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
                >
                  Confirm contact
                </button>
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() =>
                    upsertCompanyContact({
                      ...c,
                      verified: false,
                      updatedAt: new Date().toISOString(),
                      // Keep record but mark ignored via non-primary unverified
                      isPrimary: false,
                    })
                  }
                  className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-600"
                >
                  Ignore
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {canManage ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-[12px]"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-[12px]"
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role (optional)"
            className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-[12px]"
          />
          <button
            type="button"
            onClick={addManual}
            className="sm:col-span-3 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-stone-700 hover:bg-stone-50"
          >
            Add confirmed contact
          </button>
        </div>
      ) : null}
    </section>
  );
}
