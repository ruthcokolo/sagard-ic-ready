/**
 * Generates ICReady standardized portfolio reporting template PDFs.
 * Run: npm run generate:template-pdfs
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";
import { TEMPLATE_COMPANY_SPECS, ICReady_TEMPLATE_MARKER, toQ1TemplateSpec } from "../lib/portfolio/template-companies";
import { samplePdfRoots, writeSamplePdf } from "./pdf-output";

const { SAMPLE_ROOT } = samplePdfRoots();
const TEMPLATE_SUBDIR = "icready-template";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const LINE_HEIGHT = 16;
const SECTION_GAP = 12;

async function renderTemplatePdf(
  spec: (typeof TEMPLATE_COMPANY_SPECS)[number],
  submittedDate: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const drawLine = (text: string, bold = false, size = 11) => {
    if (y < MARGIN + LINE_HEIGHT) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    page.drawText(text, {
      x: MARGIN,
      y,
      size: bold ? size + 2 : size,
      font: bold ? fontBold : font,
      color: rgb(0.12, 0.12, 0.12),
      maxWidth: PAGE_WIDTH - MARGIN * 2,
    });
    y -= bold ? LINE_HEIGHT + 4 : LINE_HEIGHT;
  };

  const { metrics: m } = spec;

  drawLine(ICReady_TEMPLATE_MARKER, true, 14);
  y -= SECTION_GAP;

  drawLine("Header", true);
  drawLine(`Company Name: ${spec.name}`);
  drawLine(`Reporting Period: ${spec.reportPeriod}`);
  drawLine("Report Type: Quarterly Portfolio Report");
  drawLine("Currency: USD");
  drawLine("Units: As stated");
  drawLine("Submitted By: CFO Office");
  drawLine(`Submitted Date: ${submittedDate}`);
  y -= SECTION_GAP;

  drawLine("Section 1: Required Financial Metrics", true);
  drawLine(`Total Revenue: ${m.revenue}`);
  drawLine(`Annual Recurring Revenue (ARR): ${m.arr}`);
  drawLine(`Adjusted EBITDA: ${m.ebitda}`);
  drawLine(`Cash and Cash Equivalents: ${m.cash}`);
  y -= SECTION_GAP;

  drawLine("Section 2: Required Operating Metrics", true);
  drawLine(`Total Employees: ${m.employees}`);
  drawLine(`Logo Churn: ${m.logoChurn}`);
  drawLine(`Revenue Churn: ${m.revenueChurn}`);
  drawLine(`Customer Count: ${m.customers}`);
  y -= SECTION_GAP;

  drawLine("Section 3: Commentary", true);
  drawLine(
    `Management Commentary: ${spec.name} delivered solid ${spec.reportPeriod} results in ${spec.sector}. Core KPIs remain on plan.`
  );
  drawLine(`Key Risks: Competitive pricing pressure and longer enterprise sales cycles.`);
  drawLine(`Follow-up Items: Provide updated cohort retention analysis next quarter.`);
  y -= SECTION_GAP;

  drawLine("Section 4: Certification", true);
  drawLine(
    "The company confirms that the metrics above reflect the reporting period listed in this package."
  );

  return doc.save();
}

async function main() {
  fs.mkdirSync(path.join(SAMPLE_ROOT, TEMPLATE_SUBDIR), { recursive: true });

  const allSpecs = [
    ...TEMPLATE_COMPANY_SPECS.map((s) => ({ spec: s, submittedDate: "June 28, 2026" })),
    ...TEMPLATE_COMPANY_SPECS.map((s) => ({
      spec: toQ1TemplateSpec(s),
      submittedDate: "April 14, 2026",
    })),
  ];

  for (const { spec, submittedDate } of allSpecs) {
    const fileName = `ICReady_Template_${spec.slug}_${spec.reportPeriod.replace(/\s+/g, "_")}.pdf`;
    const bytes = await renderTemplatePdf(spec, submittedDate);
    writeSamplePdf(path.join(TEMPLATE_SUBDIR, fileName), bytes);
    console.log(`Wrote ${path.join(SAMPLE_ROOT, TEMPLATE_SUBDIR, fileName)}`);
  }

  console.log(
    `\nGenerated ${allSpecs.length} ICReady template PDFs in ${path.join(SAMPLE_ROOT, TEMPLATE_SUBDIR)} (+ public copy)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
