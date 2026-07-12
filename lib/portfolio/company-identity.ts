/**
 * Display helpers for portfolio companies: readable names, avatar colors,
 * and initials shown in lists and review screens.
 */

export type CompanyAvatarPalette = {
  bgHex: string;
};

const AVATAR_PALETTE: CompanyAvatarPalette[] = [
  { bgHex: "#7a3344" }, // burgundy
  { bgHex: "#047857" }, // forest green
  { bgHex: "#1e293b" }, // navy
  { bgHex: "#6d28d9" }, // purple
  { bgHex: "#0f766e" }, // teal
  { bgHex: "#c2410c" }, // burnt orange
  { bgHex: "#1d4ed8" }, // cobalt blue
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Title-case slug/filename-like names for display (never show raw slugs). */
export function formatCompanyDisplayName(name: string): string {
  const trimmed = name?.trim() || "Unknown Company";
  if (/\s/.test(trimmed)) return trimmed;
  if (!/[-_]/.test(trimmed)) return trimmed;
  return trimmed
    .replace(/\.pdf$/i, "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/** Stable avatar colour from company id or display name. */
export function getCompanyAvatarColor(
  companyId: string,
  companyName: string
): CompanyAvatarPalette {
  const key = (companyId || companyName).trim().toLowerCase();
  return AVATAR_PALETTE[hashString(key) % AVATAR_PALETTE.length];
}

/** Initials from display name — first letter of the first two words. */
export function getCompanyInitials(companyName: string): string {
  const display = formatCompanyDisplayName(companyName);
  const parts = display.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CO";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

/** Bundle of display fields (name, initials, color) for one company. */
export function getCompanyIdentity(companyId: string, companyName: string) {
  const palette = getCompanyAvatarColor(companyId, companyName);
  const displayName = formatCompanyDisplayName(companyName);
  return {
    companyId,
    companyName: displayName,
    initials: getCompanyInitials(companyName),
    bgHex: palette.bgHex,
  };
}
