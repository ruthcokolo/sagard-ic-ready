/**
 * Turns a raw conflict into a short headline like "Annual revenue mismatch: $12M vs $9M"
 * so users can scan the queue without reading full details.
 */

import type { Contradiction } from "@/lib/types";

/** Pulls a percentage out of a value string (e.g. "42% revenue" → "42%"). */
function extractPercent(value: string): string | null {
  const match = value.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? `${match[1]}%` : null;
}

/** Pulls a runway length in months from strings like "22mo runway". */
function extractRunwayMonths(value: string): string | null {
  const mo = value.match(/(\d+)\s*mo(?:nth)?(?:\s|$|runway)/i);
  if (mo) return `${mo[1]} months`;
  const month = value.match(/(\d+)[-\s]month/i);
  if (month) return `${month[1]} months`;
  return null;
}

/** Maps a conflict field name to a plain-English mismatch label. */
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
