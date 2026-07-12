/** Client-side helpers for bulk PDF upload (ZIP archives and folder drops). */

const PDF_MIME = "application/pdf";

/** True when a file looks like a PDF by type or extension. */
export function isPdfFile(file: File): boolean {
  return (
    file.type === PDF_MIME ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

/** True when a file looks like a ZIP archive by type or extension. */
export function isZipFile(file: File): boolean {
  return (
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed" ||
    file.name.toLowerCase().endsWith(".zip")
  );
}

/** Extract PDF entries from a ZIP archive in the browser. */
export async function extractPdfsFromZip(zipFile: File): Promise<File[]> {
  const JSZip = (await import("jszip")).default;
  const buffer = await zipFile.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const pdfs: File[] = [];

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const lower = path.toLowerCase();
    if (!lower.endsWith(".pdf")) continue;
    if (path.startsWith("__MACOSX/") || path.includes("/.")) continue;

    const blob = await entry.async("blob");
    const fileName = path.split("/").pop() ?? path;
    pdfs.push(new File([blob], fileName, { type: PDF_MIME }));
  }

  return pdfs;
}

/** Flatten a FileList / drag-drop list into individual PDF Files (expands ZIPs). */
export async function collectPdfFilesFromUpload(files: File[]): Promise<File[]> {
  const pdfs: File[] = [];

  for (const file of files) {
    if (isPdfFile(file)) {
      pdfs.push(file);
      continue;
    }
    if (isZipFile(file)) {
      const fromZip = await extractPdfsFromZip(file);
      pdfs.push(...fromZip);
    }
  }

  return pdfs;
}

/** Remove duplicate PDFs from a list (same name and file size). */
export function uniquePdfFiles(files: File[]): File[] {
  const seen = new Set<string>();
  const out: File[] = [];
  for (const f of files) {
    const key = `${f.name}::${f.size}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}
