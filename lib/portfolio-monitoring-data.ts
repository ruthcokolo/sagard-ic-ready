export type TrendDirection = "up" | "down" | "neutral";

export type PortfolioKpi = {
  id: string;
  label: string;
  value: string;
  helper: string;
  trend: string;
  trendDirection: TrendDirection;
  icon: "companies" | "reports" | "extracted" | "approved" | "validation" | "missing";
};

export type ExtractionTrendPoint = {
  day: string;
  extracted: number;
  approved: number;
  needsValidation: number;
  missing: number;
};

export type ValidationStatusSummary = {
  total: number;
  approved: { count: number; percent: number };
  needsValidation: { count: number; percent: number };
  missing: { count: number; percent: number };
};

export type RecentReport = {
  id: string;
  company: string;
  companySlug: string;
  fileName: string;
  receivedAt: string;
  status: "Processed" | "Processing" | "Failed";
};

export type ValidationStatus = "Approved" | "Needs validation" | "Missing data";

export type CompanyMetricCell = {
  value: string;
  change: string;
  changeDirection: TrendDirection;
};

export type CompanyPerformanceRow = {
  id: string;
  company: string;
  companySlug: string;
  logoColor: string;
  latestReportDate: string;
  latestReportFile: string;
  revenue: CompanyMetricCell;
  arr: CompanyMetricCell;
  ebitda: CompanyMetricCell;
  cash: CompanyMetricCell;
  headcount: CompanyMetricCell;
  validationStatus: ValidationStatus;
  coverage: number;
};

export type MetricValidationCount = {
  metric: string;
  count: number;
};

export type CompanyCoverage = {
  company: string;
  companySlug: string;
  coverage: number;
};

export const PORTFOLIO_KPIS: PortfolioKpi[] = [
  {
    id: "companies",
    label: "Companies monitored",
    value: "26",
    helper: "Monitored",
    trend: "+2 vs last 30 days",
    trendDirection: "up",
    icon: "companies",
  },
  {
    id: "reports",
    label: "Reports received",
    value: "38",
    helper: "Last 30 days",
    trend: "+4 vs last 30 days",
    trendDirection: "up",
    icon: "reports",
  },
  {
    id: "extracted",
    label: "Metrics extracted",
    value: "18,732",
    helper: "Last 30 days",
    trend: "+12% vs last 30 days",
    trendDirection: "up",
    icon: "extracted",
  },
  {
    id: "approved",
    label: "Approved for reporting",
    value: "15,892",
    helper: "84.8% of extracted",
    trend: "+5pp vs last 30 days",
    trendDirection: "up",
    icon: "approved",
  },
  {
    id: "validation",
    label: "Needs validation",
    value: "2,247",
    helper: "12.0% of extracted",
    trend: "+2pp vs last 30 days",
    trendDirection: "up",
    icon: "validation",
  },
  {
    id: "missing",
    label: "Missing from report",
    value: "593",
    helper: "3.2% of extracted",
    trend: "+1pp vs last 30 days",
    trendDirection: "up",
    icon: "missing",
  },
];

export const EXTRACTION_TREND: ExtractionTrendPoint[] = [
  { day: "Jun 8", extracted: 420, approved: 340, needsValidation: 62, missing: 18 },
  { day: "Jun 10", extracted: 510, approved: 418, needsValidation: 72, missing: 20 },
  { day: "Jun 12", extracted: 480, approved: 395, needsValidation: 68, missing: 17 },
  { day: "Jun 14", extracted: 620, approved: 512, needsValidation: 84, missing: 24 },
  { day: "Jun 16", extracted: 590, approved: 488, needsValidation: 78, missing: 24 },
  { day: "Jun 18", extracted: 710, approved: 598, needsValidation: 88, missing: 24 },
  { day: "Jun 20", extracted: 680, approved: 572, needsValidation: 82, missing: 26 },
  { day: "Jun 22", extracted: 750, approved: 632, needsValidation: 94, missing: 24 },
  { day: "Jun 24", extracted: 720, approved: 608, needsValidation: 88, missing: 24 },
  { day: "Jun 26", extracted: 810, approved: 688, needsValidation: 96, missing: 26 },
  { day: "Jun 28", extracted: 780, approved: 662, needsValidation: 92, missing: 26 },
  { day: "Jun 30", extracted: 860, approved: 732, needsValidation: 98, missing: 30 },
  { day: "Jul 2", extracted: 840, approved: 718, needsValidation: 94, missing: 28 },
  { day: "Jul 4", extracted: 920, approved: 788, needsValidation: 102, missing: 30 },
  { day: "Jul 6", extracted: 890, approved: 762, needsValidation: 98, missing: 30 },
  { day: "Jul 7", extracted: 952, approved: 812, needsValidation: 108, missing: 32 },
];

export const VALIDATION_STATUS: ValidationStatusSummary = {
  total: 18732,
  approved: { count: 15892, percent: 84.8 },
  needsValidation: { count: 2247, percent: 12.0 },
  missing: { count: 593, percent: 3.2 },
};

export const RECENT_REPORTING_PACKAGES: RecentReport[] = [
  {
    id: "r1",
    company: "Cyberdyne Systems",
    companySlug: "cyberdyne-systems",
    fileName: "Q2 2026 Board Report.pdf",
    receivedAt: "Jul 7, 2026, 9:14 AM",
    status: "Processed",
  },
  {
    id: "r2",
    company: "Northwind Logistics",
    companySlug: "northwind-logistics",
    fileName: "Q2 2026 Financials.pdf",
    receivedAt: "Jul 6, 2026, 4:22 PM",
    status: "Processed",
  },
  {
    id: "r3",
    company: "Helix Energy",
    companySlug: "helix-energy",
    fileName: "Q1 2026 Report.pdf",
    receivedAt: "Jul 6, 2026, 11:03 AM",
    status: "Processed",
  },
  {
    id: "r4",
    company: "Apex Manufacturing",
    companySlug: "apex-manufacturing",
    fileName: "Q1 2026 Results.pdf",
    receivedAt: "Jul 5, 2026, 2:18 PM",
    status: "Processed",
  },
  {
    id: "r5",
    company: "Lumos Health",
    companySlug: "lumos-health",
    fileName: "Q2 2026 Board Pack.pdf",
    receivedAt: "Jul 4, 2026, 9:47 AM",
    status: "Processed",
  },
];

export const COMPANY_PERFORMANCE: CompanyPerformanceRow[] = [
  {
    id: "northwind-logistics",
    company: "Northwind Logistics",
    companySlug: "northwind-logistics",
    logoColor: "from-slate-700 to-slate-900",
    latestReportDate: "Jul 6, 2026",
    latestReportFile: "Q2 2026 Financials.pdf",
    revenue: { value: "12.0M", change: "+18%", changeDirection: "up" },
    arr: { value: "15.4M", change: "+16%", changeDirection: "up" },
    ebitda: { value: "3.2M", change: "+22%", changeDirection: "up" },
    cash: { value: "8.7M", change: "+9%", changeDirection: "up" },
    headcount: { value: "142", change: "+6%", changeDirection: "up" },
    validationStatus: "Approved",
    coverage: 95,
  },
  {
    id: "cyberdyne-systems",
    company: "Cyberdyne Systems",
    companySlug: "cyberdyne-systems",
    logoColor: "from-zinc-800 to-zinc-950",
    latestReportDate: "Jul 7, 2026",
    latestReportFile: "Q2 2026 Board Report.pdf",
    revenue: { value: "9.6M", change: "+11%", changeDirection: "up" },
    arr: { value: "11.2M", change: "+12%", changeDirection: "up" },
    ebitda: { value: "2.1M", change: "+7%", changeDirection: "up" },
    cash: { value: "5.1M", change: "+4%", changeDirection: "up" },
    headcount: { value: "136", change: "+3%", changeDirection: "up" },
    validationStatus: "Needs validation",
    coverage: 88,
  },
  {
    id: "helix-energy",
    company: "Helix Energy",
    companySlug: "helix-energy",
    logoColor: "from-teal-600 to-teal-800",
    latestReportDate: "Jul 6, 2026",
    latestReportFile: "Q1 2026 Report.pdf",
    revenue: { value: "8.3M", change: "-4%", changeDirection: "down" },
    arr: { value: "9.1M", change: "+1%", changeDirection: "up" },
    ebitda: { value: "1.4M", change: "-8%", changeDirection: "down" },
    cash: { value: "6.2M", change: "-3%", changeDirection: "down" },
    headcount: { value: "97", change: "-2%", changeDirection: "down" },
    validationStatus: "Needs validation",
    coverage: 82,
  },
  {
    id: "apex-manufacturing",
    company: "Apex Manufacturing",
    companySlug: "apex-manufacturing",
    logoColor: "from-amber-700 to-amber-900",
    latestReportDate: "Jul 5, 2026",
    latestReportFile: "Q1 2026 Results.pdf",
    revenue: { value: "6.7M", change: "+9%", changeDirection: "up" },
    arr: { value: "8.0M", change: "+10%", changeDirection: "up" },
    ebitda: { value: "1.6M", change: "+15%", changeDirection: "up" },
    cash: { value: "4.3M", change: "+12%", changeDirection: "up" },
    headcount: { value: "101", change: "0%", changeDirection: "neutral" },
    validationStatus: "Approved",
    coverage: 91,
  },
  {
    id: "lumos-health",
    company: "Lumos Health",
    companySlug: "lumos-health",
    logoColor: "from-violet-600 to-violet-800",
    latestReportDate: "Jul 4, 2026",
    latestReportFile: "Q2 2026 Board Pack.pdf",
    revenue: { value: "4.1M", change: "+14%", changeDirection: "up" },
    arr: { value: "4.8M", change: "+13%", changeDirection: "up" },
    ebitda: { value: "0.6M", change: "0%", changeDirection: "neutral" },
    cash: { value: "2.0M", change: "-6%", changeDirection: "down" },
    headcount: { value: "68", change: "+4%", changeDirection: "up" },
    validationStatus: "Missing data",
    coverage: 74,
  },
];

export const TOP_METRICS_NEEDING_VALIDATION: MetricValidationCount[] = [
  { metric: "ARR", count: 512 },
  { metric: "Revenue", count: 488 },
  { metric: "EBITDA", count: 421 },
  { metric: "Headcount", count: 276 },
  { metric: "Cash balance", count: 210 },
];

export const COVERAGE_BY_COMPANY: CompanyCoverage[] = [
  { company: "Northwind Logistics", companySlug: "northwind-logistics", coverage: 95 },
  { company: "Cyberdyne Systems", companySlug: "cyberdyne-systems", coverage: 88 },
  { company: "Apex Manufacturing", companySlug: "apex-manufacturing", coverage: 91 },
  { company: "Helix Energy", companySlug: "helix-energy", coverage: 82 },
  { company: "Lumos Health", companySlug: "lumos-health", coverage: 74 },
];
