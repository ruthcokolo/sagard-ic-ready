const PDF_MIME = "application/pdf";

export function isPdfFile(file: File): boolean {
  return (
    file.type === PDF_MIME ||
    file.name.toLowerCase().endsWith(".pdf")
  );
}

export function isZipFile(file: File): boolean {
  return (
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed" ||
    file.name.toLowerCase().endsWith(".zip")
  );
}

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
