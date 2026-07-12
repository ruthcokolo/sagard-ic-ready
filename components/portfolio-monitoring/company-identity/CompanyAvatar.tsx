"use client";

import { getCompanyAvatarColor, getCompanyInitials, formatCompanyDisplayName } from "@/lib/portfolio/company-identity";

export type CompanyAvatarSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<CompanyAvatarSize, string> = {
  sm: "h-[26px] w-[26px] text-[9px]",
  md: "h-[34px] w-[34px] text-[11px]",
  lg: "h-[36px] w-[36px] text-[12px]",
};

export function CompanyAvatar({
  companyId,
  companyName,
  size = "sm",
  className = "",
}: {
  companyId: string;
  companyName: string;
  size?: CompanyAvatarSize;
  className?: string;
}) {
  const displayName = formatCompanyDisplayName(companyName);
  const palette = getCompanyAvatarColor(companyId, companyName);
  const initials = getCompanyInitials(companyName);

  return (
    <span
      role="img"
      aria-label={`${displayName} company avatar`}
      style={{ backgroundColor: palette.bgHex }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${SIZE_CLASSES[size]} ${className}`}
    >
      {initials}
    </span>
  );
}
