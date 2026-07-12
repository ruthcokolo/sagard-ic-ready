import type { UserRole } from "@/lib/auth-types";
import type { PortfolioPermission } from "./monitoring-phase-types";

const SHARED: PortfolioPermission[] = [
  "canUploadReports",
  "canReplacePackages",
  "canOverrideDuplicates",
  "canEditMetricExpectations",
  "canViewMetricRequirements",
  "canEditCompanyOverrides",
  "canResetCompanyOverrides",
  "canViewMetricAuditHistory",
  "canConfirmMetricApplicability",
  "canManageCompanyContacts",
  "canSendCompanyMessages",
  "canEditCommunicationTemplates",
  "canEnterManualMetrics",
];

const ROLE_PERMISSIONS: Record<UserRole, PortfolioPermission[]> = {
  associate: [...SHARED],
  principal: [...SHARED],
  partner: [...SHARED],
};

export function hasPortfolioPermission(
  role: UserRole | undefined | null,
  permission: PortfolioPermission
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPortfolioPermissions(role: UserRole | undefined | null): PortfolioPermission[] {
  if (!role) return [];
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}
