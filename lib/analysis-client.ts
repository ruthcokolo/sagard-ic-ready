/**
 * Browser-side wrappers for running analysis and building export markdown.
 * Tries the API first, then falls back to local demo data.
 */

import type { AnalysisResult } from "./types";
import { buildExportMarkdown, runAnalysis } from "./analysis";

export { buildExportMarkdown };

/** Calls the /api/analyze endpoint from the browser; uses demo data if it fails. */
export async function runAnalysisClient(): Promise<AnalysisResult> {
  try {
    const res = await fetch("/api/analyze", { method: "POST" });
    if (!res.ok) throw new Error("Analysis failed");
    return (await res.json()) as AnalysisResult;
  } catch {
    const { northwindAnalysis } = await import("./mock-deal");
    return { ...northwindAnalysis, analyzedAt: new Date().toISOString() };
  }
}

export { runAnalysis };
