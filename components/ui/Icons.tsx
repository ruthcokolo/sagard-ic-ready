/** Inline SVG icons used across navigation and action buttons. */

export function NavIcon({ name, className = "h-[18px] w-[18px]" }: { name: string; className?: string }) {
  const props = { className, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 1.75 };

  switch (name) {
    case "dashboard":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "pipeline":
      return (
        <svg {...props}>
          <path d="M4 7h16M4 12h10M4 17h14" strokeLinecap="round" />
        </svg>
      );
    case "readiness":
      return (
        <svg {...props}>
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3" y="4" width="18" height="16" rx="2" />
        </svg>
      );
    case "exports":
      return (
        <svg {...props}>
          <path d="M12 3v12M8 11l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 19h16" strokeLinecap="round" />
        </svg>
      );
    case "portfolio":
      return (
        <svg {...props}>
          <path d="M7 4h10a2 2 0 012 2v14H5V6a2 2 0 012-2z" />
          <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

/** Renders the icon briefcase UI. */
export function IconBriefcase({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

/** Renders the icon clock UI. */
export function IconClock({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

/** Renders the icon check UI. */
export function IconCheck({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Renders the icon chevron right UI. */
export function IconChevronRight({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Renders the icon chevron left UI. */
export function IconChevronLeft({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Renders the icon search UI. */
export function IconSearch({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}

/** Renders the icon filter UI. */
export function IconFilter({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  );
}

/** Renders the icon document UI. */
export function IconDocument({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path d="M8 4h6l4 4v12H8V4z" strokeLinejoin="round" />
      <path d="M14 4v4h4" strokeLinejoin="round" />
      <path d="M10 12h4M10 15h4" strokeLinecap="round" />
    </svg>
  );
}

/** @deprecated Use IconDocument */
export const IconDocumentSparkle = IconDocument;

/** Renders the icon layers UI. */
export function IconLayers({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path d="M12 4l8 4.5L12 13 4 8.5 12 4z" strokeLinejoin="round" />
      <path d="M4 12l8 4.5L20 12" strokeLinejoin="round" />
      <path d="M4 16l8 4.5L20 16" strokeLinejoin="round" />
    </svg>
  );
}

/** Renders the icon alert triangle UI. */
export function IconAlertTriangle({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        d="M10.29 3.86 2.82 17.5A1.5 1.5 0 0 0 4.13 19.5h15.74a1.5 1.5 0 0 0 1.31-2.16L13.71 3.86a1.5 1.5 0 0 0-2.58 0z"
        strokeLinejoin="round"
      />
      <path d="M12 9v4" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.85" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Renders the icon user UI. */
export function IconUser({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" strokeLinecap="round" />
    </svg>
  );
}

/** Renders the icon hourglass UI. */
export function IconHourglass({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
      <path d="M6 4h12M6 20h12" strokeLinecap="round" />
      <path
        d="M8 4c0 2.2 2.2 4 4 5.8C14.2 8 16 6.2 16 4M8 20c0-2.2 2.2-4 4-5.8C14.2 16 16 17.8 16 20"
        strokeLinejoin="round"
      />
      <path fill="currentColor" fillOpacity="0.22" stroke="none" d="M9.5 6.5 12 9l2.5-2.5H9.5z" />
      <path fill="currentColor" fillOpacity="0.4" stroke="none" d="M9.5 17.5 12 15l2.5 2.5H9.5z" />
    </svg>
  );
}

/** Renders the icon edit check UI. */
export function IconEditCheck({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4l2 2" strokeLinecap="round" />
    </svg>
  );
}

/** Renders the icon clipboard check UI. */
export function IconClipboardCheck({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M9 4h6v2H9V4z" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Renders the icon refresh check UI. */
export function IconRefreshCheck({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Renders the icon lock UI. */
export function IconLock({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" strokeLinecap="round" />
    </svg>
  );
}

/** Renders the icon external link UI. */
export function IconExternalLink({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path d="M14 4h6v6M10 14L20 4M15 4H5v16h16v-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
