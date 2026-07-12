/** CLI test: checks sector classification for sample company text and optional PDFs. */
import { readFileSync } from "node:fs";
import { classifyCompanySector, resolveCompanySector } from "../lib/portfolio/sector-classification.ts";

const cases = [
  {
    name: "Stonegate Properties",
    text: "Stonegate Properties portfolio report. Occupancy rate 94%. Net operating income $18.2M. Commercial property portfolio across multifamily assets.",
    expected: "Real Estate",
  },
  {
    name: "Lumos Health",
    text: "Healthcare provider network expansion. Patient volume increased. HIPAA compliant clinical platform.",
    expected: "Healthcare",
  },
  {
    name: "Northwind Logistics",
    text: "Freight and fulfillment volumes increased. Route optimization and last mile delivery metrics.",
    expected: "Logistics & Transportation",
  },
];

for (const testCase of cases) {
  const sector = classifyCompanySector(testCase.name, testCase.text);
  const ok = sector === testCase.expected ? "OK" : "FAIL";
  console.log(`${ok} ${testCase.name}: ${sector} (expected ${testCase.expected})`);
}

const pdfPath = process.argv[2];
if (pdfPath) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const buf = readFileSync(pdfPath);
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + " ";
  }
  const sector = resolveCompanySector({
    companyId: "stonegate-properties",
    companyName: "Stonegate Properties",
    documentText: text,
  });
  console.log(`PDF ${pdfPath}: ${sector}`);
}
