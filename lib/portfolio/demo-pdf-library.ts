/**
 * Unified library of generated demo / sample PDFs for the upload drawer.
 * Company-formatted + ICReady template portfolios under /public.
 */

export type DemoPdfLibraryItem = {
  id: string;
  companyName: string;
  reportPeriod: string;
  fileName: string;
  publicPath: string;
  group: "company_formatted" | "icready_template";
  groupLabel: string;
};

function item(
  group: DemoPdfLibraryItem["group"],
  companyName: string,
  reportPeriod: string,
  publicPath: string
): DemoPdfLibraryItem {
  const fileName = publicPath.split("/").pop() ?? publicPath;
  return {
    id: `${group}:${fileName}`,
    companyName,
    reportPeriod,
    fileName,
    publicPath,
    group,
    groupLabel:
      group === "company_formatted" ? "Company-formatted PDFs" : "ICReady template PDFs",
  };
}

/** All generated company-formatted demo + sample PDFs. */
const COMPANY_FORMATTED: DemoPdfLibraryItem[] = [
  item("company_formatted", "Sagard Auto", "Q2 2026", "/demo-reports/company-formatted/Sagard-Auto/sagard auto report.pdf"),
  item("company_formatted", "Sagard Auto", "Q1 2026", "/demo-reports/company-formatted/Sagard-Auto/Sagard_Auto_Q1_2026_Board_Update.pdf"),
  item("company_formatted", "Veridian Cloud Systems", "Q2 2026", "/demo-reports/company-formatted/Veridian-Cloud-Systems/Veridian_Cloud_Systems_Q2_2026_Board_Update.pdf"),
  item("company_formatted", "Veridian Cloud Systems", "Q1 2026", "/demo-reports/company-formatted/Veridian-Cloud-Systems/Veridian_Cloud_Systems_Q1_2026_Board_Update.pdf"),
  item("company_formatted", "Horizon Care Network", "Q2 2026", "/demo-reports/company-formatted/Horizon-Care-Network/Horizon_Care_Network_Q2_2026_Operating_Review.pdf"),
  item("company_formatted", "Horizon Care Network", "Q1 2026", "/demo-reports/company-formatted/Horizon-Care-Network/Horizon_Care_Network_Q1_2026_Scanned_Appendix.pdf"),
  item("company_formatted", "Stonegate Properties", "Q1 2026", "/demo-reports/company-formatted/Stonegate-Properties/Stonegate_Properties_Q1_2026_Operating_Review.pdf"),
  item("company_formatted", "Stonegate Properties", "Q2 2026", "/demo-reports/company-formatted/Stonegate-Properties/Stonegate_Properties_Q2_2026_Financial_Pack.pdf"),
  item("company_formatted", "Summit Industrial Solutions", "Q1 2026", "/demo-reports/company-formatted/Summit-Industrial-Solutions/Summit_Industrial_Q1_2026_Investor_Deck.pdf"),
  item("company_formatted", "Summit Industrial Solutions", "Q2 2026", "/demo-reports/company-formatted/Summit-Industrial-Solutions/Summit_Industrial_Q2_2026_Management_Report.pdf"),
  item("company_formatted", "Northwind Consumer Group", "Q2 2026", "/demo-reports/company-formatted/Northwind-Consumer-Group/Northwind_Consumer_Q2_2026_Board_Pack.pdf"),
  item("company_formatted", "Northwind Consumer Group", "Q1 2026", "/demo-reports/company-formatted/Northwind-Consumer-Group/Northwind_Consumer_Q1_2026_Category_Review.pdf"),
  item("company_formatted", "Nova Financial Group", "H1 2026", "/demo-reports/company-formatted/Nova-Financial-Group/Nova_Financial_Group_H1_2026_Investor_Update.pdf"),
  item("company_formatted", "Northwind Logistics", "Q2 2026", "/sample-portfolio-pdfs/Northwind Logistics - Q2 2026 Board Pack.pdf"),
  item("company_formatted", "Northwind Logistics", "Q1 2026", "/sample-portfolio-pdfs/Northwind Logistics - Q1 2026 Operations Pack.pdf"),
  item("company_formatted", "Cyberdyne Systems", "Q2 2026", "/sample-portfolio-pdfs/Cyberdyne Systems - Q2 2026 Board Report.pdf"),
  item("company_formatted", "Cyberdyne Systems", "Q1 2026", "/sample-portfolio-pdfs/Cyberdyne Systems - Q1 2026 Investor Memo.pdf"),
  item("company_formatted", "Helix Energy", "Q1 2026", "/sample-portfolio-pdfs/Helix Energy - Q1 2026 Report.pdf"),
  item("company_formatted", "Apex Manufacturing", "Q1 2026", "/sample-portfolio-pdfs/Apex Manufacturing - Q1 2026 Results.pdf"),
  item("company_formatted", "Lumos Health", "Q2 2026", "/sample-portfolio-pdfs/Lumos Health - Q2 2026 Board Pack.pdf"),
  item("company_formatted", "Lumos Health", "Q1 2026", "/sample-portfolio-pdfs/Lumos Health - Q1 2026 Clinical & Finance Review.pdf"),
];

const ICREADY_DEMO_FOLDERS = [
  ["Atlas Logistics", "Atlas-Logistics"],
  ["BrightPeak Energy", "BrightPeak-Energy"],
  ["Crestline Software", "Crestline-Software"],
  ["Harbor Financial Partners", "Harbor-Financial-Partners"],
  ["Meridian Healthcare Services", "Meridian-Healthcare-Services"],
  ["Oakridge Consumer Products", "Oakridge-Consumer-Products"],
] as const;

const ICREADY_SAMPLE_SLUGS = [
  ["Atlas Logic", "Atlas_Logic"],
  ["Bright Cart", "BrightCart"],
  ["Carbon Track", "CarbonTrack"],
  ["Cascade Payments", "Cascade_Payments"],
  ["Clear Bank Systems", "ClearBank_Systems"],
  ["Cloud Metrics", "CloudMetrics"],
  ["Data Harbor", "DataHarbor"],
  ["Estate Flow", "EstateFlow"],
  ["Forge Works", "ForgeWorks"],
  ["Green Pulse", "GreenPulse"],
  ["Medivion", "Medivion"],
  ["Nova Ledger", "NovaLedger"],
  ["Pay Relay", "PayRelay"],
  ["Plant OS", "PlantOS"],
  ["Route Mind", "RouteMind"],
  ["Shop Sphere", "ShopSphere"],
  ["Signal Stack", "SignalStack"],
  ["Transit Core", "TransitCore"],
  ["Vault Realty Capital", "Vault_Realty_Capital"],
  ["Vital Signs", "VitalSigns"],
] as const;

/** All generated ICReady template demo + sample PDFs (Q1 + Q2). */
const ICREADY_TEMPLATE: DemoPdfLibraryItem[] = [
  ...ICREADY_DEMO_FOLDERS.flatMap(([name, folder]) =>
    (["Q2 2026", "Q1 2026"] as const).map((period) =>
      item(
        "icready_template",
        name,
        period,
        `/demo-reports/icready-template/${folder}/ICReady_Template_${folder.replace(/-/g, "_")}_${period.replace(/\s+/g, "_")}.pdf`
      )
    )
  ),
  ...ICREADY_SAMPLE_SLUGS.flatMap(([name, slug]) =>
    (["Q2 2026", "Q1 2026"] as const).map((period) =>
      item(
        "icready_template",
        name,
        period,
        `/sample-portfolio-pdfs/icready-template/ICReady_Template_${slug}_${period.replace(/\s+/g, "_")}.pdf`
      )
    )
  ),
];

export const DEMO_PDF_LIBRARY: DemoPdfLibraryItem[] = [...COMPANY_FORMATTED, ...ICREADY_TEMPLATE];

export function getDemoPdfLibraryGrouped(): {
  companyFormatted: DemoPdfLibraryItem[];
  icreadyTemplate: DemoPdfLibraryItem[];
} {
  return {
    companyFormatted: COMPANY_FORMATTED,
    icreadyTemplate: ICREADY_TEMPLATE,
  };
}

/** Encode a public path so spaces and special chars fetch correctly. */
export function encodePublicPath(publicPath: string): string {
  const encoded = publicPath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/")
    .replace(/%2F/g, "/");
  return encoded.startsWith("/") ? encoded : `/${encoded}`;
}

export async function fetchDemoPdfAsFile(entry: DemoPdfLibraryItem): Promise<File | null> {
  const res = await fetch(encodePublicPath(entry.publicPath));
  if (!res.ok) return null;
  const blob = await res.blob();
  return new File([blob], entry.fileName, { type: "application/pdf" });
}

export async function fetchDemoPdfsAsFiles(
  entries: DemoPdfLibraryItem[]
): Promise<{ files: File[]; missing: string[] }> {
  const files: File[] = [];
  const missing: string[] = [];
  for (const entry of entries) {
    const file = await fetchDemoPdfAsFile(entry);
    if (file) files.push(file);
    else missing.push(entry.fileName);
  }
  return { files, missing };
}
