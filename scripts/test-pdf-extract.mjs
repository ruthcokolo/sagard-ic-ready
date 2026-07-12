import { readFileSync } from "node:fs";
import { extractMetricsFromPdfBuffer } from "../lib/portfolio/pdf-extract.ts";

const pdfPath =
  process.argv[2] ??
  "/Users/admin/Downloads/Stonegate_Properties_Q2_2026_Portfolio_Report.pdf";

const buf = readFileSync(pdfPath);
const result = await extractMetricsFromPdfBuffer(
  new Uint8Array(buf),
  "Stonegate_Properties_Q2_2026_Portfolio_Report.pdf",
  "Stonegate Properties"
);

console.log(
  JSON.stringify(
    {
      pages: result.pagesProcessed,
      candidates: result.candidates.length,
      metrics: result.candidates.map((c) => ({
        name: c.metricName,
        value: c.extractedValue,
        evidence: c.evidenceText,
      })),
      warning: result.warning,
    },
    null,
    2
  )
);
