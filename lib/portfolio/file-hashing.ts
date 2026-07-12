export async function hashArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return bufferToHex(digest);
  }
  // Node fallback for tests/scripts
  const { createHash } = await import("crypto");
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

export async function hashFile(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  return hashArrayBuffer(buffer);
}

export async function hashBytes(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes);
  return hashArrayBuffer(copy.buffer);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function normalizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, "");
}
