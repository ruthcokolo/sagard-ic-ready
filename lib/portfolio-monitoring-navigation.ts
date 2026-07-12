/** Sidebar links for the portfolio monitoring section of the dashboard. */

export type PortfolioNavItem = {
  label: string;
  hint: string;
  href: string;
  icon: string;
  badgeKey?: "needsValidation";
  match: (pathname: string) => boolean;
};

export const portfolioNavItems: PortfolioNavItem[] = [
  {
    label: "Portfolio Overview",
    hint: "Monitoring dashboard",
    href: "/dashboard/portfolio",
    icon: "overview",
    match: (p) => p === "/dashboard/portfolio",
  },
  {
    label: "Companies",
    hint: "Monitored portfolio",
    href: "/dashboard/portfolio/companies",
    icon: "companies",
    match: (p) => p.startsWith("/dashboard/portfolio/companies"),
  },
  {
    label: "Reporting Packages",
    hint: "Company-provided PDFs",
    href: "/dashboard/portfolio/reporting-packages",
    icon: "packages",
    match: (p) => p.startsWith("/dashboard/portfolio/reporting-packages"),
  },
  {
    label: "Metric Review",
    hint: "Needs validation",
    href: "/dashboard/portfolio/metric-review",
    icon: "review",
    badgeKey: "needsValidation",
    match: (p) => p.startsWith("/dashboard/portfolio/metric-review"),
  },
  {
    label: "Metrics Explorer",
    hint: "Compare & analyze",
    href: "/dashboard/portfolio/metrics-explorer",
    icon: "explorer",
    match: (p) => p.startsWith("/dashboard/portfolio/metrics-explorer"),
  },
  {
    label: "Exports",
    hint: "Approved metrics",
    href: "/dashboard/portfolio/exports",
    icon: "exports",
    match: (p) => p.startsWith("/dashboard/portfolio/exports"),
  },
  {
    label: "Extraction Rules",
    hint: "Parsing patterns",
    href: "/dashboard/portfolio/extraction-rules",
    icon: "rules",
    match: (p) => p.startsWith("/dashboard/portfolio/extraction-rules"),
  },
  {
    label: "Reporting Requirements",
    hint: "Metric expectations",
    href: "/dashboard/portfolio/reporting-requirements",
    icon: "requirements",
    match: (p) => p.startsWith("/dashboard/portfolio/reporting-requirements"),
  },
  {
    label: "Communication Templates",
    hint: "Follow-up emails",
    href: "/dashboard/portfolio/communication-templates",
    icon: "templates",
    match: (p) => p.startsWith("/dashboard/portfolio/communication-templates"),
  },
  {
    label: "Settings",
    hint: "Portfolio config",
    href: "/dashboard/portfolio/settings",
    icon: "settings",
    match: (p) => p.startsWith("/dashboard/portfolio/settings"),
  },
];

export const portfolioConfigNavStart = 6;
