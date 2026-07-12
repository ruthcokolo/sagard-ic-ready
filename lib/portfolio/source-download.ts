/**
 * Finds download URLs for source PDFs and triggers browser downloads for
 * stored files or sample catalog entries.
 */

import { COMPANY_FORMATTED_PDF_CATALOG, TEMPLATE_PDF_CATALOG } from "./sample-pdf-catalog";
import { DEMO_PDF_LIBRARY } from "./demo-pdf-library";

export type SourceDownload = {
  url: string | null;
  fileName: string;
};

type CatalogLike = { fileName: string; publicPath: string; companyId?: string; reportPeriod?: string };

const ALL_KNOWN_PDFS: CatalogLike[] = [
  ...DEMO_PDF_LIBRARY.map((e) => ({
    fileName: e.fileName,
    publicPath: e.publicPath,
    reportPeriod: e.reportPeriod,
  })),
  ...COMPANY_FORMATTED_PDF_CATALOG,
  ...TEMPLATE_PDF_CATALOG,
];

function normalizeFileKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, "");
}

/** Exact or normalized filename match only — never a different period/report for the same company. */
function findCatalogEntry(sourceFile: string): CatalogLike | null {
  const fileName = sourceFile?.trim() || "report.pdf";
  const exact = ALL_KNOWN_PDFS.find(
    (entry) => entry.fileName.toLowerCase() === fileName.toLowerCase()
  );
  if (exact) return exact;

  const normalized = normalizeFileKey(fileName);
  if (!normalized) return null;

  const exactNormalized = ALL_KNOWN_PDFS.filter(
    (entry) => normalizeFileKey(entry.fileName) === normalized
  );
  if (exactNormalized.length === 1) return exactNormalized[0];

  return null;
}

/** Resolve a download URL for a source PDF from stored URL or sample catalog. */
export function resolveSourceDownload(input: {
  sourceFile: string;
  companyId?: string;
  fileUrl?: string | null;
}): SourceDownload {
  const fileName = input.sourceFile?.trim() || "report.pdf";

  // Explicit blob / stored URL always wins when the package owns that bytes.
  if (input.fileUrl) {
    return { url: input.fileUrl, fileName };
  }

  const entry = findCatalogEntry(fileName);
  if (entry) {
    return {
      url: entry.publicPath,
      fileName: fileName || entry.fileName,
    };
  }

  return { url: null, fileName };
}

/** Force a real file download (works for same-origin public PDFs and blob URLs). */
export async function triggerSourceDownload(url: string, fileName: string): Promise<boolean> {
  try {
    let blobUrl = url;
    let revoke: string | null = null;

    if (!url.startsWith("blob:")) {
      const res = await fetch(url);
      if (!res.ok) return false;
      const blob = await res.blob();
      revoke = URL.createObjectURL(blob);
      blobUrl = revoke;
    }

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || "report.pdf";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (revoke) {
      window.setTimeout(() => URL.revokeObjectURL(revoke!), 2_000);
    }
    return true;
  } catch {
    return false;
  }
}

/** Download a File / Blob immediately without navigation. */
export function triggerBlobDownload(file: Blob, fileName: string) {
  const url = URL.createObjectURL(file);
  void triggerSourceDownload(url, fileName).finally(() => {
    window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
  });
}
