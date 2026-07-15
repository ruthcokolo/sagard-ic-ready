/**
 * Generate lib/portfolio/seed-processed-portfolio.generated.ts
 * by extracting metrics from 12 company-formatted demo PDFs.
 *
 * Run: npx tsx scripts/generate-processed-demo-seed.ts
 */
import "@/lib/portfolio/dom-matrix-polyfill";
import fs from "node:fs";
import path from "node:path";
import { createPortfolioCompany } from "../lib/portfolio/company-from-upload";
import { DEFAULT_EXTRACTION_RULES } from "../lib/portfolio/extraction-rules-default";
import {
  buildSectorDefaultExpectations,
  mapPortfolioSectorToExpectationKey,
} from "../lib/portfolio/metric-expectations";
import { buildMetricsFromExtraction } from "../lib/portfolio/metric-records";
import { extractMetricsFromPdfBuffer } from "../lib/portfolio/pdf-extract";
import { recomputeCompanies, recomputePackages } from "../lib/portfolio/selectors";
import type {
  ExtractedMetric,
  PortfolioCompany,
  ReportingPackage,
} from "../lib/portfolio/types";

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "lib/portfolio/seed-processed-portfolio.generated.ts");

/** 12 PDFs across 6 companies (2 quarters each). */
const SEED_PDFS = [
  {
    companyName: "Sagard Auto",
    sector: "Industrial & Manufacturing",
    reportPeriod: "Q2 2026",
    fileName: "sagard auto report.pdf",
    relativePath: "public/demo-reports/company-formatted/Sagard-Auto/sagard auto report.pdf",
  },
  {
    companyName: "Sagard Auto",
    sector: "Industrial & Manufacturing",
    reportPeriod: "Q1 2026",
    fileName: "Sagard_Auto_Q1_2026_Board_Update.pdf",
    relativePath:
      "public/demo-reports/company-formatted/Sagard-Auto/Sagard_Auto_Q1_2026_Board_Update.pdf",
  },
  {
    companyName: "Veridian Cloud Systems",
    sector: "Enterprise Software",
    reportPeriod: "Q2 2026",
    fileName: "Veridian_Cloud_Systems_Q2_2026_Board_Update.pdf",
    relativePath:
      "public/demo-reports/company-formatted/Veridian-Cloud-Systems/Veridian_Cloud_Systems_Q2_2026_Board_Update.pdf",
  },
  {
    companyName: "Veridian Cloud Systems",
    sector: "Enterprise Software",
    reportPeriod: "Q1 2026",
    fileName: "Veridian_Cloud_Systems_Q1_2026_Board_Update.pdf",
    relativePath:
      "public/demo-reports/company-formatted/Veridian-Cloud-Systems/Veridian_Cloud_Systems_Q1_2026_Board_Update.pdf",
  },
  {
    companyName: "Horizon Care Network",
    sector: "Healthcare",
    reportPeriod: "Q2 2026",
    fileName: "Horizon_Care_Network_Q2_2026_Operating_Review.pdf",
    relativePath:
      "public/demo-reports/company-formatted/Horizon-Care-Network/Horizon_Care_Network_Q2_2026_Operating_Review.pdf",
  },
  {
    companyName: "Horizon Care Network",
    sector: "Healthcare",
    reportPeriod: "Q1 2026",
    fileName: "Horizon_Care_Network_Q1_2026_Scanned_Appendix.pdf",
    relativePath:
      "public/demo-reports/company-formatted/Horizon-Care-Network/Horizon_Care_Network_Q1_2026_Scanned_Appendix.pdf",
  },
  {
    companyName: "Stonegate Properties",
    sector: "Real Estate",
    reportPeriod: "Q1 2026",
    fileName: "Stonegate_Properties_Q1_2026_Operating_Review.pdf",
    relativePath:
      "public/demo-reports/company-formatted/Stonegate-Properties/Stonegate_Properties_Q1_2026_Operating_Review.pdf",
  },
  {
    companyName: "Stonegate Properties",
    sector: "Real Estate",
    reportPeriod: "Q2 2026",
    fileName: "Stonegate_Properties_Q2_2026_Financial_Pack.pdf",
    relativePath:
      "public/demo-reports/company-formatted/Stonegate-Properties/Stonegate_Properties_Q2_2026_Financial_Pack.pdf",
  },
  {
    companyName: "Summit Industrial Solutions",
    sector: "Industrial & Manufacturing",
    reportPeriod: "Q1 2026",
    fileName: "Summit_Industrial_Q1_2026_Investor_Deck.pdf",
    relativePath:
      "public/demo-reports/company-formatted/Summit-Industrial-Solutions/Summit_Industrial_Q1_2026_Investor_Deck.pdf",
  },
  {
    companyName: "Summit Industrial Solutions",
    sector: "Industrial & Manufacturing",
    reportPeriod: "Q2 2026",
    fileName: "Summit_Industrial_Q2_2026_Management_Report.pdf",
    relativePath:
      "public/demo-reports/company-formatted/Summit-Industrial-Solutions/Summit_Industrial_Q2_2026_Management_Report.pdf",
  },
  {
    companyName: "Northwind Consumer Group",
    sector: "Consumer",
    reportPeriod: "Q2 2026",
    fileName: "Northwind_Consumer_Q2_2026_Board_Pack.pdf",
    relativePath:
      "public/demo-reports/company-formatted/Northwind-Consumer-Group/Northwind_Consumer_Q2_2026_Board_Pack.pdf",
  },
  {
    companyName: "Northwind Consumer Group",
    sector: "Consumer",
    reportPeriod: "Q1 2026",
    fileName: "Northwind_Consumer_Q1_2026_Category_Review.pdf",
    relativePath:
      "public/demo-reports/company-formatted/Northwind-Consumer-Group/Northwind_Consumer_Q1_2026_Category_Review.pdf",
  },
] as const;

const PROFILE_EXTRAS: Record<
  string,
  Partial<PortfolioCompany>
> = {
  "veridian-cloud-systems": {
    investmentDate: "2023-03-15",
    reportingFrequency: "Quarterly",
    assignedAssociateId: "user-alex",
    assignedAssociateName: "Alex Rivera",
    nextExpectedReportDate: "2026-10-15",
  },
  "stonegate-properties": {
    investmentDate: "2022-09-01",
    reportingFrequency: "Quarterly",
    assignedAssociateId: "user-jordan",
    assignedAssociateName: "Jordan Lee",
    nextExpectedReportDate: "2026-10-31",
  },
  "sagard-auto": {
    investmentDate: "2021-06-01",
    reportingFrequency: "Quarterly",
    assignedAssociateId: "user-alex",
    assignedAssociateName: "Alex Rivera",
    nextExpectedReportDate: "2026-10-15",
  },
  "horizon-care-network": {
    investmentDate: "2022-01-20",
    reportingFrequency: "Quarterly",
    assignedAssociateId: "user-sam",
    assignedAssociateName: "Sam Chen",
    nextExpectedReportDate: "2026-10-20",
  },
  "summit-industrial-solutions": {
    investmentDate: "2020-11-12",
    reportingFrequency: "Quarterly",
    assignedAssociateId: "user-jordan",
    assignedAssociateName: "Jordan Lee",
    nextExpectedReportDate: "2026-10-25",
  },
  "northwind-consumer-group": {
    investmentDate: "2023-08-01",
    reportingFrequency: "Quarterly",
    assignedAssociateId: "user-alex",
    assignedAssociateName: "Alex Rivera",
    nextExpectedReportDate: "2026-10-18",
  },
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const companiesById = new Map<string, PortfolioCompany>();
  const packages: ReportingPackage[] = [];
  const metrics: ExtractedMetric[] = [];
  const uploadedAtBase = Date.parse("2026-07-01T12:00:00.000Z");

  for (let i = 0; i < SEED_PDFS.length; i++) {
    const entry = SEED_PDFS[i];
    const abs = path.join(ROOT, entry.relativePath);
    if (!fs.existsSync(abs)) {
      throw new Error(`Missing PDF: ${abs}`);
    }

    const companyId = slugify(entry.companyName);
    if (!companiesById.has(companyId)) {
      companiesById.set(
        companyId,
        createPortfolioCompany(entry.companyName, entry.sector, {
          id: companyId,
          ...(PROFILE_EXTRAS[companyId] ?? {}),
        })
      );
    }
    const company = companiesById.get(companyId)!;

    const buffer = new Uint8Array(fs.readFileSync(abs));
    console.log(`Extracting ${entry.fileName}...`);
    const extraction = await extractMetricsFromPdfBuffer(
      buffer,
      entry.fileName,
      entry.companyName,
      DEFAULT_EXTRACTION_RULES
    );

    const packageId = `pkg-seed-${companyId}-${entry.reportPeriod.toLowerCase().replace(/\s+/g, "-")}`;
    const uploadedAt = new Date(uploadedAtBase + i * 3600_000).toISOString();
    const expectationSector = mapPortfolioSectorToExpectationKey(entry.sector);
    const expectations = buildSectorDefaultExpectations(expectationSector);
    const newMetrics = buildMetricsFromExtraction(
      packageId,
      companyId,
      entry.companyName,
      entry.reportPeriod,
      entry.fileName,
      extraction.candidates,
      extraction.missingMetrics,
      {
        expectations,
        sector: expectationSector,
        knownMetrics: DEFAULT_EXTRACTION_RULES.map((r) => r.metricName),
      }
    );

    const needsValidation = newMetrics.filter((m) => m.status === "Needs validation").length;
    const missingMetrics = newMetrics.filter((m) => m.status === "Missing from report").length;
    const metricsExtracted = newMetrics.filter((m) => m.status !== "Missing from report").length;
    const coverage =
      metricsExtracted + missingMetrics === 0
        ? 0
        : Math.round((metricsExtracted / (metricsExtracted + missingMetrics)) * 100);

    packages.push({
      id: packageId,
      companyId,
      companyName: entry.companyName,
      fileName: entry.fileName,
      reportPeriod: entry.reportPeriod,
      uploadedAt,
      uploadedBy: "Alex Rivera",
      processedAt: uploadedAt,
      runCount: 1,
      status: "Processed",
      pagesProcessed: extraction.pagesProcessed,
      metricsExtracted,
      needsValidation,
      missingMetrics,
      coverage,
      sourceFormat: extraction.sourceFormat,
      activeVersion: true,
      versionNumber: 1,
      isDemoSeed: true,
    });
    metrics.push(...newMetrics);

    console.log(
      `  pages=${extraction.pagesProcessed} candidates=${extraction.candidates.length} metrics=${newMetrics.length}`
    );
  }

  let companies = Array.from(companiesById.values());
  const draftState = {
    companies,
    packages,
    metrics,
  } as Parameters<typeof recomputePackages>[0];
  const derivedPackages = recomputePackages(draftState);
  companies = recomputeCompanies({
    ...draftState,
    packages: derivedPackages,
  });

  const payload = {
    companies,
    packages: derivedPackages,
    metrics,
  };

  const file = `/* AUTO-GENERATED by scripts/generate-processed-demo-seed.ts — do not edit by hand. */
import type { ExtractedMetric, PortfolioCompany, ReportingPackage } from "./types";

export const PROCESSED_DEMO_SEED = ${JSON.stringify(payload, null, 2)} as {
  companies: PortfolioCompany[];
  packages: ReportingPackage[];
  metrics: ExtractedMetric[];
};

export const PROCESSED_DEMO_SEED_PACKAGE_IDS = new Set(
  PROCESSED_DEMO_SEED.packages.map((p) => p.id)
);
`;

  fs.writeFileSync(OUT, file, "utf8");
  console.log(`Wrote ${OUT}`);
  console.log(
    `Seed: ${companies.length} companies, ${packages.length} packages, ${metrics.length} metrics`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
