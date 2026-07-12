import type { PortfolioCompany, ReportingPackage } from "./types";
import { getDemoReportByFileName } from "./demo-report-catalog";

/** Demo-only seed package so re-uploading sagard auto report.pdf triggers the required duplicate warning. */
export function createSagardAutoDemoPackage(actorName = "Alex Rivera"): {
  company: PortfolioCompany;
  package: ReportingPackage & { fileHash?: string; fileSize?: number; activeVersion?: boolean };
} {
  const demo = getDemoReportByFileName("sagard auto report.pdf")!;
  const company: PortfolioCompany = {
    id: "sagard-auto",
    name: "Sagard Auto",
    sector: "Industrial",
    status: "Active",
    latestReportDate: demo.uploadedAtDemo ?? "2026-07-09T15:00:00.000Z",
    coverage: 75,
    metricsApproved: 0,
    metricsNeedsValidation: 3,
    metricsMissing: 1,
    createdAt: "2026-07-01T12:00:00.000Z",
    updatedAt: demo.uploadedAtDemo,
  };

  const pkg: ReportingPackage & {
    fileHash?: string;
    fileSize?: number;
    activeVersion?: boolean;
    versionNumber?: number;
    isDemoSeed?: boolean;
  } = {
    id: "pkg-sagard-auto-q2-2026",
    companyId: company.id,
    companyName: company.name,
    fileName: "sagard auto report.pdf",
    reportPeriod: "Q2 2026",
    uploadedAt: demo.uploadedAtDemo ?? "2026-07-09T15:00:00.000Z",
    processedAt: demo.uploadedAtDemo,
    runCount: 1,
    status: "Processed",
    pagesProcessed: 4,
    metricsExtracted: 3,
    needsValidation: 3,
    missingMetrics: 1,
    coverage: 75,
    sourceFormat: "Company-formatted PDF",
    // Placeholder hash — replaced when the real demo PDF is hashed on first ensure
    fileHash: undefined,
    activeVersion: true,
    versionNumber: 1,
    isDemoSeed: true,
  };

  void actorName;
  return { company, package: pkg };
}
