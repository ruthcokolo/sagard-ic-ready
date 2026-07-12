/** Synthetic portfolio companies for ICReady template PDF demos. */
export type TemplateCompanySpec = {
  id: string;
  name: string;
  sector: string;
  slug: string;
  reportPeriod: string;
  metrics: {
    revenue: string;
    arr: string;
    ebitda: string;
    cash: string;
    employees: string;
    logoChurn: string;
    revenueChurn: string;
    customers: string;
  };
};

function scaleMoney(value: string, factor: number): string {
  const match = value.match(/^\$([\d,]+(?:\.\d+)?)([MBK]?)$/i);
  if (!match) return value;
  const n = parseFloat(match[1].replace(/,/g, "")) * factor;
  const suffix = match[2] || "";
  const rounded = n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
  const formatted = Number.isInteger(rounded)
    ? rounded.toLocaleString("en-US")
    : rounded.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `$${formatted}${suffix}`;
}

function scalePercent(value: string, delta: number): string {
  const match = value.match(/^([\d.]+)%$/);
  if (!match) return value;
  const n = Math.max(0.1, Math.round((parseFloat(match[1]) + delta) * 10) / 10);
  return `${n}%`;
}

function scaleCount(value: string, factor: number): string {
  const match = value.match(/^([\d,]+)\s*(.*)$/);
  if (!match) return value;
  const n = Math.round(parseFloat(match[1].replace(/,/g, "")) * factor);
  const rest = match[2] ? ` ${match[2]}` : "";
  return `${n.toLocaleString("en-US")}${rest}`;
}

/** Derive a credible Q1 2026 spec (~6–10% below Q2) from a Q2 template company. */
export function toQ1TemplateSpec(spec: TemplateCompanySpec): TemplateCompanySpec {
  const m = spec.metrics;
  return {
    ...spec,
    id: `${spec.id}-q1`,
    reportPeriod: "Q1 2026",
    metrics: {
      revenue: scaleMoney(m.revenue, 0.92),
      arr: scaleMoney(m.arr, 0.94),
      ebitda: scaleMoney(m.ebitda, 0.9),
      cash: scaleMoney(m.cash, 0.93),
      employees: scaleCount(m.employees, 0.97),
      logoChurn: scalePercent(m.logoChurn, 0.2),
      revenueChurn: scalePercent(m.revenueChurn, 0.2),
      customers: scaleCount(m.customers, 0.95),
    },
  };
}

export const TEMPLATE_COMPANY_SPECS: TemplateCompanySpec[] = [
  { id: "atlas-logic", name: "Atlas Logic", sector: "SaaS", slug: "Atlas_Logic", reportPeriod: "Q2 2026", metrics: { revenue: "$12.4M", arr: "$10.8M", ebitda: "$2.1M", cash: "$8.7M", employees: "142 FTE", logoChurn: "2.1%", revenueChurn: "1.8%", customers: "384" } },
  { id: "brightcart", name: "Bright Cart", sector: "Retail Technology", slug: "BrightCart", reportPeriod: "Q2 2026", metrics: { revenue: "$18.6M", arr: "$15.2M", ebitda: "$3.4M", cash: "$11.2M", employees: "198 FTE", logoChurn: "1.6%", revenueChurn: "1.2%", customers: "512" } },
  { id: "clearbank-systems", name: "Clear Bank Systems", sector: "Fintech", slug: "ClearBank_Systems", reportPeriod: "Q2 2026", metrics: { revenue: "$24.3M", arr: "$21.7M", ebitda: "$5.8M", cash: "$19.4M", employees: "267 FTE", logoChurn: "1.4%", revenueChurn: "1.1%", customers: "890" } },
  { id: "cascade-payments", name: "Cascade Payments", sector: "Payments", slug: "Cascade_Payments", reportPeriod: "Q2 2026", metrics: { revenue: "$31.5M", arr: "$28.2M", ebitda: "$7.2M", cash: "$14.8M", employees: "312 FTE", logoChurn: "2.3%", revenueChurn: "2.0%", customers: "1,240" } },
  { id: "vault-realty-capital", name: "Vault Realty Capital", sector: "Real Estate Technology", slug: "Vault_Realty_Capital", reportPeriod: "Q2 2026", metrics: { revenue: "$9.8M", arr: "$8.1M", ebitda: "$1.6M", cash: "$6.3M", employees: "89 FTE", logoChurn: "2.8%", revenueChurn: "2.4%", customers: "156" } },
  { id: "signalstack", name: "Signal Stack", sector: "Data Infrastructure", slug: "SignalStack", reportPeriod: "Q2 2026", metrics: { revenue: "$22.1M", arr: "$19.6M", ebitda: "$4.9M", cash: "$16.7M", employees: "224 FTE", logoChurn: "1.9%", revenueChurn: "1.5%", customers: "678" } },
  { id: "medivion", name: "Medivion", sector: "Healthcare IT", slug: "Medivion", reportPeriod: "Q2 2026", metrics: { revenue: "$15.7M", arr: "$13.9M", ebitda: "$2.8M", cash: "$9.5M", employees: "176 FTE", logoChurn: "1.2%", revenueChurn: "0.9%", customers: "421" } },
  { id: "routemind", name: "Route Mind", sector: "Logistics", slug: "RouteMind", reportPeriod: "Q2 2026", metrics: { revenue: "$28.9M", arr: "$24.1M", ebitda: "$6.1M", cash: "$13.2M", employees: "341 FTE", logoChurn: "2.0%", revenueChurn: "1.7%", customers: "892" } },
  { id: "forgeworks", name: "Forge Works", sector: "Manufacturing Software", slug: "ForgeWorks", reportPeriod: "Q2 2026", metrics: { revenue: "$19.2M", arr: "$16.4M", ebitda: "$3.9M", cash: "$10.8M", employees: "203 FTE", logoChurn: "1.7%", revenueChurn: "1.4%", customers: "534" } },
  { id: "greenpulse", name: "Green Pulse", sector: "Climate Software", slug: "GreenPulse", reportPeriod: "Q2 2026", metrics: { revenue: "$11.3M", arr: "$9.7M", ebitda: "$1.9M", cash: "$7.4M", employees: "118 FTE", logoChurn: "2.5%", revenueChurn: "2.1%", customers: "287" } },
  { id: "novaledger", name: "Nova Ledger", sector: "Fintech", slug: "NovaLedger", reportPeriod: "Q2 2026", metrics: { revenue: "$26.8M", arr: "$23.5M", ebitda: "$6.4M", cash: "$18.1M", employees: "289 FTE", logoChurn: "1.3%", revenueChurn: "1.0%", customers: "945" } },
  { id: "shopsphere", name: "Shop Sphere", sector: "Retail Technology", slug: "ShopSphere", reportPeriod: "Q2 2026", metrics: { revenue: "$16.5M", arr: "$14.0M", ebitda: "$3.1M", cash: "$9.9M", employees: "167 FTE", logoChurn: "1.8%", revenueChurn: "1.5%", customers: "445" } },
  { id: "dataharbor", name: "Data Harbor", sector: "Data Infrastructure", slug: "DataHarbor", reportPeriod: "Q2 2026", metrics: { revenue: "$33.4M", arr: "$29.8M", ebitda: "$8.2M", cash: "$21.5M", employees: "378 FTE", logoChurn: "1.5%", revenueChurn: "1.2%", customers: "1,102" } },
  { id: "payrelay", name: "Pay Relay", sector: "Payments", slug: "PayRelay", reportPeriod: "Q2 2026", metrics: { revenue: "$29.7M", arr: "$26.3M", ebitda: "$6.8M", cash: "$15.6M", employees: "298 FTE", logoChurn: "2.2%", revenueChurn: "1.9%", customers: "1,156" } },
  { id: "estateflow", name: "Estate Flow", sector: "Real Estate Technology", slug: "EstateFlow", reportPeriod: "Q2 2026", metrics: { revenue: "$10.6M", arr: "$8.9M", ebitda: "$1.8M", cash: "$6.8M", employees: "94 FTE", logoChurn: "2.6%", revenueChurn: "2.2%", customers: "178" } },
  { id: "cloudmetrics", name: "Cloud Metrics", sector: "SaaS", slug: "CloudMetrics", reportPeriod: "Q2 2026", metrics: { revenue: "$14.8M", arr: "$12.6M", ebitda: "$2.6M", cash: "$9.1M", employees: "155 FTE", logoChurn: "1.9%", revenueChurn: "1.6%", customers: "402" } },
  { id: "vitalsigns", name: "Vital Signs", sector: "Healthcare IT", slug: "VitalSigns", reportPeriod: "Q2 2026", metrics: { revenue: "$17.9M", arr: "$15.4M", ebitda: "$3.3M", cash: "$11.4M", employees: "189 FTE", logoChurn: "1.1%", revenueChurn: "0.8%", customers: "467" } },
  { id: "transitcore", name: "Transit Core", sector: "Logistics", slug: "TransitCore", reportPeriod: "Q2 2026", metrics: { revenue: "$32.1M", arr: "$27.4M", ebitda: "$7.0M", cash: "$14.9M", employees: "356 FTE", logoChurn: "1.7%", revenueChurn: "1.4%", customers: "978" } },
  { id: "carbontrack", name: "Carbon Track", sector: "Climate Software", slug: "CarbonTrack", reportPeriod: "Q2 2026", metrics: { revenue: "$13.2M", arr: "$11.5M", ebitda: "$2.3M", cash: "$8.2M", employees: "132 FTE", logoChurn: "2.4%", revenueChurn: "2.0%", customers: "312" } },
  { id: "plantos", name: "Plant OS", sector: "Manufacturing Software", slug: "PlantOS", reportPeriod: "Q2 2026", metrics: { revenue: "$21.4M", arr: "$18.2M", ebitda: "$4.5M", cash: "$12.3M", employees: "241 FTE", logoChurn: "1.6%", revenueChurn: "1.3%", customers: "589" } },
];

export const ICReady_TEMPLATE_MARKER = "ICReady Portfolio Reporting Template";
