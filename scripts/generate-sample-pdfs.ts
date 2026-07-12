/**
 * Generates synthetic company-formatted portfolio reporting PDFs.
 * Run: npm run generate:sample-pdfs
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";
import { samplePdfRoots, writeSamplePdf } from "./pdf-output";
import type { CompanyFormattedReportSpec } from "./company-formatted-report-types";
import { Q1_COMPANY_FORMATTED_REPORTS } from "./q1-company-reports";

const { SAMPLE_ROOT } = samplePdfRoots();

const REPORTS: CompanyFormattedReportSpec[] = [
  {
    fileName: "Northwind Logistics - Q2 2026 Board Pack.pdf",
    cover: {
      companyName: "Northwind Logistics",
      reportTitle: "Quarterly Board Reporting Package",
      period: "Q2 2026",
      reportType: "Board Pack · Portfolio Company Submission",
      submittedDate: "July 5, 2026",
      confidentiality:
        "CONFIDENTIAL — Prepared for Sagard Holdings portfolio review. Do not distribute externally.",
    },
    sections: [
      {
        heading: "Executive Summary",
        blocks: [
          {
            type: "paragraph",
            text: "Northwind Logistics delivered strong Q2 2026 results across enterprise logistics contracts. Recurring revenue growth remained above plan while the team maintained stable unit economics on core routes.",
          },
          {
            type: "paragraph",
            text: "Management notes that Q1 2026 revenue was $48.2M (prior period — for reference only). Internal forecast for Q3 2026 revenue is approximately $54M (projection, not actual).",
          },
        ],
      },
      {
        heading: "Financial Overview — Q2 2026 Actuals",
        pageBreakBefore: true,
        blocks: [
          { type: "table-header", cols: ["Metric", "Q2 2026 Actual", "Q1 2026 Prior", "Budget Q2"] },
          { type: "table-row", cols: ["Total Revenue", "$52.1M", "$48.2M", "$50.0M"] },
          { type: "table-row", cols: ["Annual Recurring Revenue (ARR)", "$44.8M", "$42.1M", "$43.5M"] },
          { type: "table-row", cols: ["Adjusted EBITDA", "$10.2M", "$9.4M", "$9.8M"] },
          { type: "table-row", cols: ["Cash and cash equivalents", "$24.1M", "$22.6M", "—"] },
          { type: "line", text: "Note: Budget figures are internal planning targets, not reported actuals.", muted: true },
        ],
      },
      {
        heading: "Operating Metrics",
        pageBreakBefore: true,
        blocks: [
          { type: "line", text: "Total employees: 358 FTE at quarter end (includes contractors)." },
          { type: "line", text: "Logo churn: 1.9% quarterly (Q2 2026 actual)." },
          { type: "line", text: "Prior period logo churn (Q1 2026): 2.2% — historical reference.", muted: true },
        ],
      },
      {
        heading: "Management Commentary",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "The board approved continued investment in route optimization software and expanded enterprise sales coverage in North America.",
          },
        ],
      },
      {
        heading: "Key Risks & Follow-up Items",
        pageBreakBefore: true,
        blocks: [
          {
            type: "bullets",
            items: [
              "Fuel cost volatility may pressure gross margin in H2 2026.",
              "Follow-up: provide updated cohort retention analysis next quarter.",
              "Customer concentration remains elevated in top 5 accounts.",
            ],
          },
        ],
      },
    ],
  },
  {
    fileName: "Cyberdyne Systems - Q2 2026 Board Report.pdf",
    cover: {
      companyName: "Cyberdyne Systems",
      reportTitle: "Investor & Board Reporting Package",
      period: "Q2 2026",
      reportType: "Quarterly Board Report",
      submittedDate: "June 30, 2026",
      confidentiality:
        "PRIVATE & CONFIDENTIAL — For Sagard portfolio monitoring purposes only.",
    },
    sections: [
      {
        heading: "Executive Summary",
        blocks: [
          {
            type: "paragraph",
            text: "Cyberdyne expanded enterprise ARR while maintaining disciplined operating expense. Net revenue for the quarter reflects platform upsells and a stable renewal base.",
          },
          {
            type: "paragraph",
            text: "Prior year Q2 2025 net revenue was $29.8M (for comparison). Management forecast for full-year 2026 recurring revenue exceeds $32M (not actual).",
          },
        ],
      },
      {
        heading: "Financial Performance",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "Net revenue reached $34.2 million for Q2 2026, compared with $31.5M in Q1 2026 (prior quarter — for reference).",
          },
          { type: "table-header", cols: ["Metric", "Q2 2026 Actual", "Q1 2026 Prior"] },
          { type: "table-row", cols: ["Annual Recurring Revenue", "$30.5M", "$28.9M"] },
          { type: "table-row", cols: ["Adjusted EBITDA", "$5.6M", "$5.1M"] },
          { type: "table-row", cols: ["Cash balance", "$17.3M", "$16.2M"] },
        ],
      },
      {
        heading: "Operating Metrics",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "Total employees: 231 FTE across engineering and go-to-market at June 30, 2026. Prior year headcount (Q2 2025): 198 — historical reference only.",
          },
          {
            type: "line",
            text: "Churn metrics were not disclosed in this reporting package pending updated customer analytics.",
            muted: true,
          },
        ],
      },
      {
        heading: "Management Commentary",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "Product roadmap delivery remained on schedule. Sales pipeline conversion improved modestly versus Q1.",
          },
        ],
      },
      {
        heading: "Risks & Follow-up",
        pageBreakBefore: true,
        blocks: [
          {
            type: "bullets",
            items: [
              "Longer enterprise procurement cycles in regulated verticals.",
              "Follow-up: provide logo and revenue churn once analytics refresh completes.",
              "Competitive pricing pressure in mid-market segment.",
            ],
          },
        ],
      },
    ],
  },
  {
    fileName: "Helix Energy - Q1 2026 Report.pdf",
    cover: {
      companyName: "Helix Energy",
      reportTitle: "Quarterly Portfolio Report",
      period: "Q1 2026",
      reportType: "Company-Provided Quarterly Submission",
      submittedDate: "April 18, 2026",
      confidentiality:
        "CONFIDENTIAL — Sagard portfolio company reporting. Internal use only.",
    },
    sections: [
      {
        heading: "Executive Summary",
        blocks: [
          {
            type: "paragraph",
            text: "Helix Energy reported Q1 2026 operating results above internal plan. Revenue growth was driven by long-term offtake agreements and improved asset utilization.",
          },
        ],
      },
      {
        heading: "Financial Overview",
        pageBreakBefore: true,
        blocks: [
          { type: "line", text: "The following table summarizes reported financial metrics:", muted: true },
          { type: "table-header", cols: ["Line item", "Q1 2026 Actual", "Q4 2025 Prior", "FY26 Budget"] },
          { type: "table-row", cols: ["Sales", "$64.3M", "$61.1M", "$250M"] },
          { type: "table-row", cols: ["Recurring revenue", "$56.8M", "$54.2M", "—"] },
          { type: "table-row", cols: ["EBITDA", "$15.1M", "$14.0M", "$58M"] },
          {
            type: "table-row",
            cols: ["Liquidity position", "Not provided Q1", "See audit supplement", "—"],
            muted: true,
          },
          {
            type: "line",
            text: "Footnote: Q1 liquidity balance will be provided in the audited supplement. Prior period liquidity is disclosed in the Q4 2025 audit pack only.",
            muted: true,
          },
        ],
      },
      {
        heading: "Operating Metrics",
        pageBreakBefore: true,
        blocks: [
          { type: "line", text: "Headcount: 492 employees at quarter end." },
          { type: "line", text: "Net churn 1.4% for Q1 2026." },
        ],
      },
      {
        heading: "Management Commentary & Outlook",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "Capital projects remain on schedule for H2 2026. Management expects volumes to trend toward budget in Q2 subject to commodity pricing. Internal forecast for Q2 2026 net churn: ~1.6% (estimate only — not actual).",
          },
        ],
      },
      {
        heading: "Key Risks",
        pageBreakBefore: true,
        blocks: [
          {
            type: "bullets",
            items: [
              "Regulatory review timelines on two development assets.",
              "Follow-up: submit Q1 cash reconciliation with audit pack.",
            ],
          },
        ],
      },
    ],
  },
  {
    fileName: "Apex Manufacturing - Q1 2026 Results.pdf",
    cover: {
      companyName: "Apex Manufacturing",
      reportTitle: "Quarterly Results & Board Package",
      period: "Q1 2026",
      reportType: "Board Reporting Package",
      submittedDate: "April 22, 2026",
      confidentiality:
        "CONFIDENTIAL — Prepared for Sagard. Not for external distribution.",
    },
    sections: [
      {
        heading: "Executive Summary",
        blocks: [
          {
            type: "paragraph",
            text: "Apex Manufacturing posted solid industrial results with growing SaaS attach on the monitoring layer. Q4 2025 total revenue was $88.7M (prior period reference).",
          },
          {
            type: "line",
            text: "Cash position was not included in this submission pending treasury review.",
            muted: true,
          },
        ],
      },
      {
        heading: "Financial Highlights",
        pageBreakBefore: true,
        blocks: [
          { type: "line", text: "Total revenue $91.2M for Q1 2026 (+2.8% vs Q4 2025)." },
          { type: "line", text: "Run-rate revenue from monitoring layer: $13.4M (recurring component)." },
          { type: "line", text: "EBITDA $19.5M (18.2% margin)." },
          { type: "line", text: "Internal Q2 2026 EBITDA forecast: $20.5M (projection only).", muted: true },
        ],
      },
      {
        heading: "Workforce & Operations",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "Employees 628 across 4 production sites at March 31, 2026. Prior year headcount was 601 FTE (Q1 2025).",
          },
        ],
      },
      {
        heading: "Management Commentary",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "Revenue churn and cash balance were omitted from this package pending audit and customer success data refresh.",
          },
        ],
      },
      {
        heading: "Risks & Follow-up Items",
        pageBreakBefore: true,
        blocks: [
          {
            type: "bullets",
            items: ["Supply chain delays on two component lines."],
          },
        ],
      },
      {
        heading: "Follow-up Items",
        pageBreakBefore: true,
        blocks: [
          {
            type: "bullets",
            items: [
              "Provide liquidity and retention metrics in Q2 board supplement.",
            ],
          },
        ],
      },
    ],
  },
  {
    fileName: "Lumos Health - Q2 2026 Board Pack.pdf",
    cover: {
      companyName: "Lumos Health",
      reportTitle: "Board Reporting Package",
      period: "Q2 2026",
      reportType: "Company-Provided Board Pack",
      submittedDate: "July 2, 2026",
      confidentiality:
        "CONFIDENTIAL — Sagard portfolio monitoring. Do not forward.",
    },
    sections: [
      {
        heading: "Executive Summary",
        blocks: [
          {
            type: "paragraph",
            text: "Lumos Health grew net sales through expanded payer partnerships in Q2 2026. Clinical operations expansion remains a focus for H2.",
          },
          {
            type: "line",
            text: "Headcount detail was deferred to the next monthly operating update.",
            muted: true,
          },
        ],
      },
      {
        heading: "Financial Metrics",
        pageBreakBefore: true,
        blocks: [
          { type: "table-header", cols: ["Measure", "Q2 2026", "Q1 2026 Prior"] },
          { type: "table-row", cols: ["Net sales", "$26.8M", "$25.1M"] },
          { type: "table-row", cols: ["ARR", "$23.9M", "$22.4M"] },
          { type: "table-row", cols: ["Adjusted EBITDA", "$3.8M", "$3.2M"] },
          { type: "table-row", cols: ["Cash and cash equivalents", "$13.2M", "$12.4M"] },
          { type: "line", text: "FY 2026 revenue budget: $108M (planning target, not actual).", muted: true },
        ],
      },
      {
        heading: "Customer Metrics",
        pageBreakBefore: true,
        blocks: [
          { type: "line", text: "Gross churn: 3.1% quarterly (Q2 2026)." },
        ],
      },
      {
        heading: "Management Commentary",
        pageBreakBefore: true,
        blocks: [
          {
            type: "paragraph",
            text: "Payer contract renewals progressed on schedule. Product compliance investments continued ahead of enterprise RFP season.",
          },
        ],
      },
      {
        heading: "Key Risks & Follow-up",
        pageBreakBefore: true,
        blocks: [
          {
            type: "bullets",
            items: [
              "Payer reimbursement timing may affect collections next quarter.",
            ],
          },
        ],
      },
      {
        heading: "Follow-up Items",
        pageBreakBefore: true,
        blocks: [
          {
            type: "bullets",
            items: [
              "Share updated workforce census when HR closes Q2 reporting.",
            ],
          },
        ],
      },
    ],
  },
  ...Q1_COMPANY_FORMATTED_REPORTS,
];

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const LINE_HEIGHT = 14;
const HEADING_GAP = 8;
const SECTION_GAP = 14;
const TABLE_COL_WIDTHS = [200, 110, 110, 90];

async function renderCompanyFormattedReport(spec: CompanyFormattedReportSpec): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  let pageNum = 1;

  const newPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
    pageNum += 1;
    drawFooter();
  };

  const drawFooter = () => {
    page.drawText(`${spec.cover.companyName} · ${spec.cover.period} · Page ${pageNum}`, {
      x: MARGIN,
      y: 28,
      size: 8,
      font,
      color: rgb(0.55, 0.55, 0.55),
    });
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 24) newPage();
  };

  const drawTextLine = (text: string, opts?: { bold?: boolean; italic?: boolean; size?: number; muted?: boolean }) => {
    const size = opts?.size ?? 10;
    const lineH = size + 4;
    ensureSpace(lineH);
    page.drawText(text, {
      x: MARGIN,
      y,
      size,
      font: opts?.bold ? fontBold : opts?.italic ? fontOblique : font,
      color: opts?.muted ? rgb(0.45, 0.45, 0.45) : rgb(0.12, 0.12, 0.12),
    });
    y -= lineH;
  };

  const wrapParagraph = (text: string, muted = false) => {
    const words = text.split(/\s+/);
    let line = "";
    const maxChars = 92;
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars) {
        drawTextLine(line, { muted });
        line = word;
      } else {
        line = next;
      }
    }
    if (line) drawTextLine(line, { muted });
    y -= 4;
  };

  const drawTableRow = (cols: string[], bold = false, muted = false) => {
    ensureSpace(LINE_HEIGHT + 2);
    let x = MARGIN;
    cols.forEach((col, i) => {
      page.drawText(col, {
        x,
        y,
        size: 9,
        font: bold ? fontBold : font,
        color: muted ? rgb(0.5, 0.5, 0.5) : rgb(0.15, 0.15, 0.15),
        maxWidth: TABLE_COL_WIDTHS[i] ?? 100,
      });
      x += TABLE_COL_WIDTHS[i] ?? 100;
    });
    y -= LINE_HEIGHT + 2;
  };

  // —— Cover page ——
  y = PAGE_HEIGHT * 0.58;
  drawTextLine(spec.cover.companyName, { bold: true, size: 22 });
  y -= 6;
  drawTextLine(spec.cover.reportTitle, { size: 13 });
  y -= 4;
  drawTextLine(spec.cover.period, { bold: true, size: 16 });
  y -= 16;
  drawTextLine(spec.cover.reportType, { muted: true });
  drawTextLine(`Submitted: ${spec.cover.submittedDate}`, { muted: true });
  y -= 20;
  wrapParagraph(spec.cover.confidentiality, true);
  drawFooter();

  // —— Body (one section per page where marked) ——
  newPage();

  for (const section of spec.sections) {
    if (section.pageBreakBefore) {
      newPage();
    }
    y -= HEADING_GAP;
    drawTextLine(section.heading, { bold: true, size: 12 });
    y -= 4;

    for (const block of section.blocks) {
      switch (block.type) {
        case "paragraph":
          wrapParagraph(block.text);
          break;
        case "line":
          drawTextLine(block.text, { muted: block.muted });
          break;
        case "table-header":
          drawTableRow(block.cols, true);
          break;
        case "table-row":
          drawTableRow(block.cols, false, block.muted);
          break;
        case "bullets":
          for (const item of block.items) {
            wrapParagraph(`• ${item}`);
          }
          break;
      }
    }
    y -= SECTION_GAP;
  }

  return doc.save();
}

async function main() {
  fs.mkdirSync(SAMPLE_ROOT, { recursive: true });

  for (const spec of REPORTS) {
    const bytes = await renderCompanyFormattedReport(spec);
    writeSamplePdf(spec.fileName, bytes);
    console.log(`Wrote ${path.join(SAMPLE_ROOT, spec.fileName)}`);
  }

  console.log(`\nGenerated ${REPORTS.length} company-formatted PDFs in ${SAMPLE_ROOT} (+ public copy)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
