import type { AnalysisResult } from "./types";
import { buildExportMarkdown, runAnalysis } from "./analysis";

export { buildExportMarkdown };

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
