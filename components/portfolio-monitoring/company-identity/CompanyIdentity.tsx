"use client";

/**
 * Combined company name, avatar, and sector display.
 */
import { formatCompanyDisplayName } from "@/lib/portfolio/company-identity";
import { CompanyAvatar, type CompanyAvatarSize } from "./CompanyAvatar";

/** Combined display of company avatar, name, and sector. */
export function CompanyIdentity({
  companyId,
  companyName,
  secondaryText,
  size = "sm",
  href,
  onNameClick,
  nameClassName = "",
  className = "",
}: {
  companyId: string;
  companyName: string;
  secondaryText?: string;
  size?: CompanyAvatarSize;
  href?: string;
  /** Prefer over href when navigating within an in-app workflow (e.g. Metric Review). */
  onNameClick?: () => void;
  nameClassName?: string;
  className?: string;
}) {
  const displayName = formatCompanyDisplayName(companyName);

  const nameEl = onNameClick ? (
    <button
      type="button"
      title={displayName}
      onClick={onNameClick}
      className={`block w-full truncate text-left text-[13px] font-medium text-stone-900 hover:text-[#7a3344] ${nameClassName}`}
    >
      {displayName}
    </button>
  ) : href ? (
    <a
      href={href}
      title={displayName}
      className={`block truncate text-[13px] font-medium text-stone-900 hover:text-[#7a3344] ${nameClassName}`}
    >
      {displayName}
    </a>
  ) : (
    <span
      title={displayName}
      className={`block truncate text-[13px] font-medium text-stone-900 ${nameClassName}`}
    >
      {displayName}
    </span>
  );

  return (
    <div className={`flex min-w-0 max-w-full items-center gap-2 overflow-hidden ${className}`}>
      <CompanyAvatar companyId={companyId} companyName={companyName} size={size} />
      <div className="min-w-0 flex-1 overflow-hidden">
        {nameEl}
        {secondaryText ? (
          <p className="truncate text-[11px] leading-snug text-stone-500" title={secondaryText}>
            {secondaryText}
          </p>
        ) : null}
      </div>
    </div>
  );
}
