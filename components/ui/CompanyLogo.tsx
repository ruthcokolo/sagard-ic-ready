/** Company logo or initials avatar with fallback colors. */

import type { ReactNode } from "react";

type LogoSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<LogoSize, string> = {
  sm: "h-11 w-11 rounded-xl text-[15px]",
  md: "h-16 w-16 rounded-2xl text-xl",
  lg: "h-20 w-20 rounded-3xl text-3xl",
  xl: "h-24 w-24 rounded-2xl text-4xl",
};

const logoStyles: Record<string, { shell: string; mark: ReactNode }> = {
  "northwind-logistics": {
    shell: "bg-gradient-to-br from-slate-700 to-slate-900 text-white",
    mark: (
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M7 6v12M7 6l9 12M16 6v12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  "helix-health": {
    shell: "bg-gradient-to-br from-teal-500 to-teal-700 text-white",
    mark: (
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none" stroke="currentColor" strokeWidth={2.25}>
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    ),
  },
  "meridian-analytics": {
    shell: "bg-gradient-to-br from-indigo-600 to-indigo-900 text-white",
    mark: (
      <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M5 18V10M12 18V6M19 18v-8" strokeLinecap="round" />
      </svg>
    ),
  },
};

const GENERATED_MARKS: ((className: string) => ReactNode)[] = [
  (cn) => (
    <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M5 18V10M12 18V6M19 18v-8" strokeLinecap="round" />
    </svg>
  ),
  (cn) => (
    <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 14c2-4 4-6 8-6s6 2 8 6" strokeLinecap="round" />
      <path d="M6 18c1.5-3 3.5-4.5 6-4.5s4.5 1.5 6 4.5" strokeLinecap="round" />
    </svg>
  ),
  (cn) => (
    <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M12 3c-4 6-6 9-6 12a6 6 0 0012 0c0-3-2-6-6-12z" strokeLinejoin="round" />
    </svg>
  ),
  (cn) => (
    <svg viewBox="0 0 24 24" className={cn} fill="currentColor">
      <path d="M4 20V10l8-6 8 6v10H4zm8-14.5L6 11v9h12v-9l-6-5.5z" />
    </svg>
  ),
  (cn) => (
    <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="5" y="11" width="14" height="10" rx="1.5" />
      <path d="M8 11V9a4 4 0 018 0v2" strokeLinecap="round" />
    </svg>
  ),
  (cn) => (
    <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M7 6v12M7 6l9 12M16 6v12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  (cn) => (
    <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
    </svg>
  ),
  (cn) => (
    <svg viewBox="0 0 24 24" className={cn} fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 7h16M4 12h10M4 17h14" strokeLinecap="round" />
    </svg>
  ),
];

function hashHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function hashIndex(id: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

function generatedShell(id: string) {
  const hue = hashHue(id);
  return `text-white [background:linear-gradient(135deg,hsl(${hue},45%,42%),hsl(${(hue + 40) % 360},50%,28%))]`;
}

/** Renders the company logo UI. */
export function CompanyLogo({
  companyId,
  name,
  size = "sm",
  className = "",
}: {
  companyId: string;
  name: string;
  size?: LogoSize;
  className?: string;
}) {
  const preset = logoStyles[companyId];
  const markIndex = hashIndex(companyId, GENERATED_MARKS.length);
  const Mark = GENERATED_MARKS[markIndex]!;
  const iconClass = "h-[55%] w-[55%]";

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-bold shadow-[0_1px_2px_rgba(0,0,0,0.08)] ${sizeClasses[size]} ${
        preset?.shell ?? generatedShell(companyId)
      } ${className}`}
      aria-hidden
      title={name}
    >
      {preset?.mark ?? Mark(iconClass)}
    </div>
  );
}
