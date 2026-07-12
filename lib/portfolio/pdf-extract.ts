import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { pdfItemsToPageText } from "./pdf-text";
import {
  buildMissingCandidates,
  extractMetricsFromPages,
} from "./extraction";
import { classifyCompanySector } from "./sector-classification";
import { detectSourceFormat } from "./template-extraction";
import { DEFAULT_EXTRACTION_RULES } from "./extraction-rules-default";
import { parsePdfFileName } from "./company-from-upload";
import { ALL_METRICS } from "./types";
import type {
  ExtractionCandidate,
  ExtractionRule,
  PackageSourceFormat,
  PageText,
} from "./types";

export type PdfExtractionResult = {
  candidates: ExtractionCandidate[];
  missingMetrics: string[];
  pagesProcessed: number;
  sourceFormat: PackageSourceFormat;
  documentText: string;
  sector: string;
  warning?: string;
};

/**
 * pdfjs-dist 5.x uses a process-wide PagesMapper singleton. Concurrent
 * getDocument/getPage calls overwrite each other's page counts and throw
 * "Invalid page request." Serialize all Node extractions in this process.
 */
let pdfExtractQueue: Promise<void> = Promise.resolve();

function withPdfExtractLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = pdfExtractQueue.then(fn, fn);
  pdfExtractQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function copyPdfBytes(buffer: Uint8Array): Uint8Array {
  // getDocument transfers/detaches the underlying ArrayBuffer; always pass a copy.
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return copy;
}

async function readPdfPagesFromBuffer(buffer: Uint8Array): Promise<PageText[]> {
  return withPdfExtractLock(async () => {
    const loadingTask = pdfjs.getDocument({
      data: copyPdfBytes(buffer),
      useSystemFonts: true,
      isEvalSupported: false,
      disableFontFace: true,
    });
    const pdf = await loadingTask.promise;
    const pages: PageText[] = [];

    try {
      const pageCount = pdf.numPages;
      for (let i = 1; i <= pageCount; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = pdfItemsToPageText(content.items as unknown[]);
        pages.push({ page: i, text });
      }
    } finally {
      try {
        await pdf.destroy();
      } catch {
        /* ignore destroy errors */
      }
    }

    return pages;
  });
}

/** Server-side PDF metric extraction — no web worker required. */
export async function extractMetricsFromPdfBuffer(
  buffer: Uint8Array,
  fileName: string,
  companyName: string,
  rules: ExtractionRule[] = DEFAULT_EXTRACTION_RULES
): Promise<PdfExtractionResult> {
  let pages: PageText[] = [];
  let readWarning: string | undefined;

  try {
    pages = await readPdfPagesFromBuffer(buffer);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "PDF text could not be parsed on the server.";
    // One automatic retry for transient PagesMapper races from older callers.
    if (/invalid page request/i.test(message)) {
      try {
        pages = await readPdfPagesFromBuffer(buffer);
      } catch (retryError) {
        readWarning =
          retryError instanceof Error ? retryError.message : message;
        pages = [];
      }
    } else {
      readWarning = message;
      pages = [];
    }
  }

  const documentText = pages.map((p) => p.text).join(" ").trim();
  if (pages.length > 0 && !documentText) {
    readWarning =
      readWarning ??
      "No selectable text found in this PDF. Metrics will be marked missing from report.";
  }

  const { reportPeriod } = parsePdfFileName(fileName);

  const candidates: ExtractionCandidate[] = documentText
    ? extractMetricsFromPages(pages, rules, reportPeriod)
    : [];
  const missingMetrics = documentText
    ? buildMissingCandidates(candidates, rules)
    : [...ALL_METRICS];
  const sourceFormat = documentText
    ? detectSourceFormat(pages, fileName)
    : "Company-formatted PDF";
  const sector = classifyCompanySector(companyName, documentText);

  return {
    candidates,
    missingMetrics,
    pagesProcessed: pages.length,
    sourceFormat,
    documentText,
    sector,
    warning: readWarning,
  };
}

export { inferCompanyNameFromFileName } from "./pdf-filename";
