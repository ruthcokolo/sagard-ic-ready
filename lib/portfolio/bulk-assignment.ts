import { DEMO_ACCOUNTS, ROLE_LABELS } from "@/lib/auth-constants";
import type { UserRole } from "@/lib/auth-types";
import type { CompanyReviewLandingRow } from "./metric-review-landing-selectors";
import { getPackageReviewSummary } from "./metric-review-selectors";
import type {
  CompanyReviewStatus,
  PortfolioState,
  ReportingPackage,
  ReviewPriority,
} from "./types";

export type BulkPackageScope = "latest_active" | "all_active";

export type BulkAssignmentPriority = ReviewPriority | "keep_existing";

export type BulkAssignmentPayload = {
  companyIds: string[];
  packageScope: BulkPackageScope;
  reviewerId: string | null;
  reviewerName: string | null;
  dueDate?: string | null;
  priority?: BulkAssignmentPriority;
  note?: string;
  assignedById: string;
  assignedByName: string;
  mode?: "bulk" | "individual";
};

export type PortfolioReviewerOption = {
  id: string;
  name: string;
  roleLabel: string;
  /** Present only when known from real data — never fabricated. */
  activeReviewCount?: number;
};

/** Case-insensitive, whitespace-collapsed associate / reviewer name key. */
export function normalizeAssociateName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Map a free-text associate/reviewer name to a known account when possible.
 * Falls back to a stable slug id for unknown names.
 */
export function resolvePortfolioAssociateIdentity(name: string): {
  id: string;
  name: string;
  roleLabel: string;
} {
  const trimmed = name.trim();
  const key = normalizeAssociateName(trimmed);
  const account = DEMO_ACCOUNTS.find(
    (a) => normalizeAssociateName(a.user.name) === key
  );
  if (account) {
    return {
      id: account.user.id,
      name: account.user.name,
      roleLabel: ROLE_LABELS[account.user.role] ?? account.user.role,
    };
  }
  return {
    id: `reviewer-${key.replace(/\s+/g, "-")}`,
    name: trimmed,
    roleLabel: "Reviewer",
  };
}

export function canAssignPortfolioReviews(role: UserRole | undefined | null): boolean {
  return role === "associate" || role === "principal" || role === "partner";
}

export function isCompanyAssignable(
  reviewStatus: CompanyReviewStatus,
  hasPackage: boolean
): { assignable: boolean; reason?: string } {
  if (!hasPackage && reviewStatus === "Awaiting report") {
    return { assignable: true }; // follow-up ownership allowed
  }
  if (!hasPackage) {
    return { assignable: false, reason: "No active package — assignment unavailable" };
  }
  // Including Completed — ownership can still be assigned or reassigned.
  return { assignable: true };
}

export function isLandingRowAssignable(row: CompanyReviewLandingRow): {
  assignable: boolean;
  reason?: string;
} {
  return isCompanyAssignable(row.reviewStatus, Boolean(row.packageId));
}

/** Active packages: processing, failed, or processed with unresolved work. */
export function getActivePackagesForCompany(
  state: PortfolioState,
  companyId: string
): ReportingPackage[] {
  return state.packages
    .filter((p) => p.companyId === companyId)
    .filter((p) => {
      if (p.status === "Processing" || p.status === "Failed") return true;
      if (p.status !== "Processed") return false;
      const summary = getPackageReviewSummary(state, p.id);
      return summary.needsValidation > 0 || summary.totalMetrics === 0;
    })
    .sort(
      (a, b) =>
        new Date(b.processedAt ?? b.uploadedAt).getTime() -
        new Date(a.processedAt ?? a.uploadedAt).getTime()
    );
}

export function resolveAssignmentPackages(
  state: PortfolioState,
  companyIds: string[],
  scope: BulkPackageScope
): { companyId: string; packageId: string }[] {
  const targets: { companyId: string; packageId: string }[] = [];
  for (const companyId of companyIds) {
    const active = getActivePackagesForCompany(state, companyId);
    if (active.length === 0) {
      const latest = state.packages
        .filter((p) => p.companyId === companyId)
        .sort(
          (a, b) =>
            new Date(b.processedAt ?? b.uploadedAt).getTime() -
            new Date(a.processedAt ?? a.uploadedAt).getTime()
        )[0];
      if (latest) targets.push({ companyId, packageId: latest.id });
      continue;
    }
    if (scope === "latest_active") {
      targets.push({ companyId, packageId: active[0].id });
    } else {
      for (const pkg of active) {
        targets.push({ companyId, packageId: pkg.id });
      }
    }
  }
  return targets;
}

export function countCompaniesWithMultipleActivePackages(
  state: PortfolioState,
  companyIds: string[]
): number {
  return companyIds.filter(
    (id) => getActivePackagesForCompany(state, id).length > 1
  ).length;
}

function preferCanonicalAssociateId(existingId: string, candidateId: string): boolean {
  const existingGenerated = existingId.startsWith("reviewer-");
  const candidateGenerated = candidateId.startsWith("reviewer-");
  if (existingGenerated && !candidateGenerated) return true;
  if (!existingGenerated && candidateGenerated) return false;
  if (candidateId.startsWith("user-") && !existingId.startsWith("user-")) return true;
  return false;
}

/**
 * Unique associate/reviewer options for assignment UI.
 * Dedupes by normalized display name so the same person never appears twice
 * even when historic records used alternate ids (e.g. reviewer-alex-rivera vs user-alex).
 */
export function getPortfolioReviewerOptions(
  state: PortfolioState
): PortfolioReviewerOption[] {
  type MutableOption = PortfolioReviewerOption & { aliasIds: Set<string> };
  const byName = new Map<string, MutableOption>();

  function upsert(
    id: string,
    name: string,
    roleLabel: string,
    opts?: { prefer?: boolean }
  ) {
    const key = normalizeAssociateName(name);
    if (!key || !id) return;
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, {
        id,
        name: name.trim(),
        roleLabel,
        aliasIds: new Set([id]),
      });
      return;
    }
    existing.aliasIds.add(id);
    if (opts?.prefer || preferCanonicalAssociateId(existing.id, id)) {
      existing.id = id;
      existing.name = name.trim();
      if (opts?.prefer) existing.roleLabel = roleLabel;
    }
  }

  for (const account of DEMO_ACCOUNTS) {
    upsert(account.user.id, account.user.name, ROLE_LABELS[account.user.role] ?? account.user.role, {
      prefer: true,
    });
  }

  for (const pkg of state.packages) {
    if (!pkg.assignedReviewerId || !pkg.assignedReviewerName) continue;
    upsert(pkg.assignedReviewerId, pkg.assignedReviewerName, "Reviewer");
  }

  for (const company of state.companies) {
    if (!company.assignedAssociateId || !company.assignedAssociateName) continue;
    upsert(company.assignedAssociateId, company.assignedAssociateName, "Associate");
  }

  for (const wait of state.reviewWaitlist ?? []) {
    if (!wait.assignedReviewerId || !wait.assignedReviewerName) continue;
    upsert(wait.assignedReviewerId, wait.assignedReviewerName, "Reviewer");
  }

  for (const option of byName.values()) {
    const nameKey = normalizeAssociateName(option.name);
    const count = state.packages.filter((p) => {
      const matchesPerson =
        (p.assignedReviewerId != null && option.aliasIds.has(p.assignedReviewerId)) ||
        normalizeAssociateName(p.assignedReviewerName ?? "") === nameKey;
      if (!matchesPerson) return false;
      return getPackageReviewSummary(state, p.id).needsValidation > 0;
    }).length;
    if (count > 0) option.activeReviewCount = count;
  }

  return [...byName.values()]
    .map(({ aliasIds: _aliasIds, ...option }) => option)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getBulkAssignButtonLabel(rows: CompanyReviewLandingRow[]): string {
  const assigned = rows.filter((r) => Boolean(r.assigneeId)).length;
  const unassigned = rows.length - assigned;
  if (assigned > 0 && unassigned > 0) return "Assign / reassign";
  if (assigned > 0) return "Reassign";
  return "Assign";
}

export function endOfWeekIso(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(17, 0, 0, 0);
  return d.toISOString();
}

export function startOfDayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(17, 0, 0, 0);
  return d.toISOString();
}
