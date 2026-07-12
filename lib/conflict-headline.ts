import type { Contradiction } from "@/lib/types";

function extractPercent(value: string): string | null {
  const match = value.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? `${match[1]}%` : null;
}

function extractRunwayMonths(value: string): string | null {
  const mo = value.match(/(\d+)\s*mo(?:nth)?(?:\s|$|runway)/i);
  if (mo) return `${mo[1]} months`;
  const month = value.match(/(\d+)[-\s]month/i);
  if (month) return `${month[1]} months`;
  return null;
}

function mismatchLabel(field: string): string {
  const f = field.toLowerCase();
  if (f.includes("arr")) return "Annual revenue mismatch";
  if (f.includes("margin")) return "Profit margin mismatch";
  if (f.includes("concentration")) return "Customer concentration mismatch";
  if (f.includes("headcount")) return "Team size mismatch";
  if (f.includes("burn") || f.includes("runway")) return "Cash runway mismatch";
  if (f.includes("retention")) return "Retention mismatch";
  return `${field} mismatch`;
}

/** Scannable headline, e.g. "Cash runway mismatch: 22 months vs 17 months". */
export function conflictHeadline(c: Contradiction): string {
  const label = mismatchLabel(c.field);
  const field = c.field.toLowerCase();

  if (field.includes("burn") || field.includes("runway")) {
    const a = extractRunwayMonths(c.sourceA.value);
    const b = extractRunwayMonths(c.sourceB.value);
    if (a && b) return `${label}: ${a} vs ${b}`;
  }

  if (field.includes("concentration")) {
    const a = extractPercent(c.sourceA.value);
    const b = extractPercent(c.sourceB.value);
    if (a && b) return `${label}: ${a} vs ${b}`;
  }

  return `${label}: ${c.sourceA.value} vs ${c.sourceB.value}`;
}
