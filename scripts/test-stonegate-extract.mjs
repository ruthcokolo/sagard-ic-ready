/** CLI test: extracts metrics from a Stonegate PDF using page-level parsing. */
import { readFileSync } from "fs";
import { DEFAULT_EXTRACTION_RULES } from "../lib/portfolio/extraction-rules-default.ts";
import { extractMetricsFromPages } from "../lib/portfolio/extraction.ts";

const pdfPath =
  process.argv[2] ??
  "/Users/admin/Downloads/Stonegate_Properties_Q2_2026_Portfolio_Report.pdf";

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const buf = readFileSync(pdfPath);
const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise;

const pages = [];
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const content = await page.getTextContent();
  pages.push({
    page: i,
    text: content.items.map((item) => ("str" in item ? item.str : "")).join(" "),
  });
}

const candidates = extractMetricsFromPages(pages, DEFAULT_EXTRACTION_RULES);
console.log(
  JSON.stringify(
    {
      pages: pdf.numPages,
      candidates: candidates.map((c) => ({ metric: c.metricName, value: c.value })),
    },
    null,
    2
  )
);
