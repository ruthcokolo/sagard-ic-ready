/** Sidebar links for the main IC readiness app (dashboard, pipeline, queue, etc.). */

export const navItems = [
  {
    label: "Dashboard",
    hint: "Today's overview",
    href: "/dashboard",
    icon: "dashboard",
    match: (p: string) => p === "/dashboard",
  },
  {
    label: "Pipeline",
    hint: "All companies",
    href: "/pipeline",
    icon: "pipeline",
    match: (p: string) => p === "/pipeline",
  },
  {
    label: "Review queue",
    hint: "Needs your attention",
    href: "/ic-readiness",
    icon: "readiness",
    badge: 73,
    match: (p: string) =>
      p === "/ic-readiness" || p.startsWith("/dashboard/companies"),
  },
  {
    label: "Exports",
    hint: "Past decisions",
    href: "/exports",
    icon: "exports",
    match: (p: string) => p === "/exports",
  },
  {
    label: "Settings",
    hint: "Connections & rules",
    href: "/settings",
    icon: "settings",
    match: (p: string) => p === "/settings",
  },
] as const;
