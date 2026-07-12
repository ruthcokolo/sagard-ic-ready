"use client";

import { useState } from "react";

export function ComparisonNotice({
  message,
  excludedCompanies,
}: {
  message: string;
  excludedCompanies: { id: string; name: string; reason: string }[];
}) {
  const [expanded, setExpanded] = useState(false);

  if (!message) return null;

  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
      <p>{message}</p>
      {excludedCompanies.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-semibold text-[#7a3344] hover:underline"
          >
            {expanded ? "Hide excluded companies" : "View excluded companies"}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1 text-xs text-amber-900/90">
              {excludedCompanies.map((company) => (
                <li key={company.id} className="min-w-0 break-words">
                  <span className="font-semibold" title={company.name}>
                    {company.name}
                  </span>{" "}
                  — {company.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
