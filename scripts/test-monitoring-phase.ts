/** CLI test: runs portfolio monitoring logic checks (duplicates, templates, batches, etc.). */
import assert from "node:assert/strict";
import { detectPackageDuplicate } from "../lib/portfolio/duplicate-detection";
import {
  classifyMetricResolution,
  getMetricExpectation,
  createCompanyOverride,
  buildSectorDefaultExpectations,
  mapPortfolioSectorToExpectationKey,
} from "../lib/portfolio/metric-expectations";
import { suggestMetricApplicability } from "../lib/portfolio/metric-applicability";
import {
  renderCommunicationTemplate,
  validateTemplateSyntax,
  createDefaultCommunicationTemplates,
} from "../lib/portfolio/communication-templates";
import { findOpenMissingMetricRequests } from "../lib/portfolio/outbound-request-detection";
import { normalizeFileName } from "../lib/portfolio/file-hashing";
import { parseValueFromSegment } from "../lib/portfolio/extraction-parse";
import { buildMetricsFromExtraction } from "../lib/portfolio/metric-records";
import { summarizeUploadBatch, createUploadBatch } from "../lib/portfolio/upload-batch";
import type { UploadQueueFile } from "../lib/portfolio/monitoring-phase-types";

function testDuplicates() {
  const packages = [
    {
      id: "pkg-1",
      companyId: "sagard-auto",
      companyName: "Sagard Auto",
      fileName: "sagard auto report.pdf",
      reportPeriod: "Q2 2026",
      uploadedAt: "2026-07-09T15:00:00.000Z",
      runCount: 1,
      status: "Processed" as const,
      pagesProcessed: 4,
      metricsExtracted: 3,
      needsValidation: 3,
      missingMetrics: 1,
      coverage: 75,
      sourceFormat: "Company-formatted PDF" as const,
      fileHash: "abc123",
      fileSize: 1000,
    },
  ];

  const exact = detectPackageDuplicate(packages, {
    fileName: "sagard auto report.pdf",
    fileHash: "abc123",
    companyId: "sagard-auto",
    reportPeriod: "Q2 2026",
  });
  assert.equal(exact.type, "exact_duplicate");
  assert.ok(exact.reasons.includes("same_file_hash"));

  const revision = detectPackageDuplicate(packages, {
    fileName: "sagard auto report.pdf",
    fileHash: "different",
    companyId: "sagard-auto",
    reportPeriod: "Q2 2026",
  });
  assert.equal(revision.type, "possible_revision");

  const related = detectPackageDuplicate(packages, {
    fileName: "Sagard_Auto_Q2_Supplement.pdf",
    fileHash: "zzz",
    companyId: "sagard-auto",
    reportPeriod: "Q2 2026",
  });
  assert.equal(related.type, "same_period_related_document");
}

function testExpectations() {
  assert.equal(mapPortfolioSectorToExpectationKey("Fintech"), "Financial Services");
  assert.equal(
    mapPortfolioSectorToExpectationKey("Industrial & Manufacturing"),
    "Industrial"
  );

  const sector = buildSectorDefaultExpectations("Real Estate");
  const arr = getMetricExpectation(sector, {
    companyId: "stonegate",
    sector: "Real Estate",
    metricName: "ARR",
  });
  assert.equal(arr.requirement, "not_applicable");

  const fintech = buildSectorDefaultExpectations("Fintech");
  const rev = getMetricExpectation(fintech, {
    companyId: "nova",
    sector: "Fintech",
    metricName: "Revenue",
  });
  assert.equal(rev.requirement, "required");

  const override = createCompanyOverride({
    companyId: "stonegate",
    metricName: "ARR",
    requirement: "required",
    reason: "Board requested ARR tracking",
    configuredBy: "Alex Rivera",
  });
  const effective = getMetricExpectation([override, ...sector], {
    companyId: "stonegate",
    sector: "Real Estate",
    metricName: "ARR",
  });
  assert.equal(effective.requirement, "required");

  assert.equal(
    classifyMetricResolution({ requirement: "required", found: false }),
    "Missing from report"
  );
  assert.equal(
    classifyMetricResolution({ requirement: "optional", found: false }),
    "Optional metric not reported"
  );
  assert.equal(
    classifyMetricResolution({ requirement: "not_applicable", found: false }),
    "Not applicable"
  );
  assert.equal(
    classifyMetricResolution({ requirement: "not_configured", found: false }),
    "Not configured"
  );
}

function testExtractionExpectationWiring() {
  const sector = buildSectorDefaultExpectations("Real Estate");
  const metrics = buildMetricsFromExtraction(
    "pkg-x",
    "stonegate",
    "Stonegate Properties",
    "Q1 2026",
    "stonegate.pdf",
    [
      {
        metricName: "Revenue",
        extractedValue: "$28.4M",
        normalizedValue: 28400000,
        unit: "USD",
        sourcePage: 1,
        evidenceText: "Revenue $28.4M",
        confidence: "High",
      },
    ] as never,
    ["ARR", "Cash"],
    { expectations: sector, sector: "Real Estate" }
  );
  const arr = metrics.find((m) => m.metricName === "ARR");
  assert.equal(arr?.status, "Not applicable");
  const cash = metrics.find((m) => m.metricName === "Cash");
  assert.equal(cash?.status, "Missing from report");
}

function testDashNotZero() {
  assert.equal(parseValueFromSegment("—", "Cash"), null);
  assert.equal(parseValueFromSegment("-", "Cash"), null);
  assert.equal(parseValueFromSegment("n/a", "Revenue"), null);
  const neg = parseValueFromSegment("(2.7M)", "EBITDA");
  assert.ok(neg);
  assert.ok((neg?.normalized ?? 0) < 0);
}

function testBatchSummary() {
  const batch = createUploadBatch("Alex");
  const files: UploadQueueFile[] = [
    {
      id: "1",
      fileName: "a.pdf",
      fileSize: 1,
      state: "ready",
      readinessLabel: "Ready",
      actionLabel: "Process",
    },
    {
      id: "2",
      fileName: "b.pdf",
      fileSize: 1,
      state: "duplicate_found",
      readinessLabel: "Waiting",
      actionLabel: "Review",
    },
    {
      id: "3",
      fileName: "c.pdf",
      fileSize: 1,
      state: "failed",
      readinessLabel: "Failed",
      actionLabel: "Retry",
    },
  ];
  const s = summarizeUploadBatch({ ...batch, files });
  assert.equal(s.total, 3);
  assert.equal(s.ready, 1);
  assert.equal(s.duplicate, 1);
  assert.equal(s.failed, 1);
}

function testApplicability() {
  const sector = buildSectorDefaultExpectations("Real Estate");
  const suggestion = suggestMetricApplicability({
    companyId: "stonegate",
    companyName: "Stonegate Properties",
    sector: "Real Estate",
    metricName: "ARR",
    found: false,
    expectations: sector,
  });
  assert.equal(suggestion, null);

  const saasDefaults = buildSectorDefaultExpectations("Enterprise Software");
  const realEstateOverrideMissing = suggestMetricApplicability({
    companyId: "stonegate",
    companyName: "Stonegate Properties",
    sector: "Real Estate",
    metricName: "ARR",
    found: false,
    expectations: saasDefaults.map((e) =>
      e.metricName === "ARR" ? { ...e, requirement: "required", sector: "Real Estate" } : e
    ),
  });
  assert.ok(realEstateOverrideMissing);
  assert.equal(realEstateOverrideMissing?.suggestion, "possibly_not_applicable");
}

function testTemplates() {
  const templates = createDefaultCommunicationTemplates();
  const missing = templates.find((t) => t.category === "missing_required_metrics")!;
  const issues = validateTemplateSyntax(missing.subject, missing.body);
  assert.equal(issues.length, 0);

  const bad = validateTemplateSyntax("Hi {{company_name}", "Body {{unknown_var}}");
  assert.ok(bad.length >= 1);

  const rendered = renderCommunicationTemplate(missing, {
    company_name: "Veridian",
    contact_name: "Jamie",
    reporting_period: "Q2 2026",
    report_name: "Board Update",
    missing_metrics_list: "• Cash",
    monitoring_reason: "liquidity",
    requested_due_date: "July 25, 2026",
    reviewer_name: "Alex Rivera",
    reviewer_title: "Associate",
  });
  assert.match(rendered.subject, /Veridian/);
  assert.match(rendered.body, /Cash/);
}

function testOutboundDedup() {
  const open = findOpenMissingMetricRequests(
    [
      {
        id: "c1",
        companyId: "v1",
        type: "missing_metrics_request",
        subject: "x",
        body: "y",
        status: "copied",
        requestedMetricNames: ["Cash", "EBITDA"],
        createdBy: "Alex",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
      },
    ],
    { companyId: "v1", metricNames: ["Cash"] }
  );
  assert.equal(open.length, 1);
}

function testNormalize() {
  assert.equal(normalizeFileName("sagard auto report.pdf"), "sagardautoreport");
}

testDuplicates();
testExpectations();
testExtractionExpectationWiring();
testDashNotZero();
testBatchSummary();
testApplicability();
testTemplates();
testOutboundDedup();
testNormalize();
console.log("All portfolio monitoring phase tests passed.");
