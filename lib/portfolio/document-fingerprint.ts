/** Lightweight document fingerprint / similarity for PDF text. */

export function buildDocumentFingerprint(text: string): string {
  const tokens = tokenize(text);
  const top = [...tokens.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 48)
    .map(([t]) => t);
  return top.join("|");
}

/** Jaccard-like token overlap score between two document texts. */
export function documentSimilarity(a: string, b: string): number {
  if (!a.trim() || !b.trim()) return 0;
  const ta = new Set(tokenize(a).keys());
  const tb = new Set(tokenize(b).keys());
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap += 1;
  return overlap / Math.max(ta.size, tb.size);
}

function tokenize(text: string): Map<string, number> {
  const map = new Map<string, number>();
  const parts = text
    .toLowerCase()
    .replace(/[^a-z0-9$%\s.]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
  for (const p of parts) {
    map.set(p, (map.get(p) ?? 0) + 1);
  }
  return map;
}
