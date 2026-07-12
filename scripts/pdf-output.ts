/** Shared paths and helper to save sample PDFs to disk and public folder. */
import fs from "node:fs";
import path from "node:path";

const SAMPLE_ROOT = path.join(process.cwd(), "sample-portfolio-pdfs");
const PUBLIC_ROOT = path.join(process.cwd(), "public", "sample-portfolio-pdfs");

/** Write PDF to project-root sample folder and public/ for Next.js serving. */
export function writeSamplePdf(relativePath: string, bytes: Uint8Array) {
  const rootPath = path.join(SAMPLE_ROOT, relativePath);
  const publicPath = path.join(PUBLIC_ROOT, relativePath);
  fs.mkdirSync(path.dirname(rootPath), { recursive: true });
  fs.mkdirSync(path.dirname(publicPath), { recursive: true });
  fs.writeFileSync(rootPath, bytes);
  fs.writeFileSync(publicPath, bytes);
}

/** Returns the sample and public folder paths for generated PDFs. */
export function samplePdfRoots() {
  return { SAMPLE_ROOT, PUBLIC_ROOT };
}
