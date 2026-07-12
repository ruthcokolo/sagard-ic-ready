/** API route: `/api/analyze` — runs the diligence AI analysis pipeline. */
import { NextResponse } from "next/server";
import { runAnalysis } from "@/lib/analysis";

/**
 * POST or GET: no input needed. Runs the diligence AI pipeline and returns
 * the full analysis result as JSON (scores, conflicts, draft sections, etc.).
 */
export async function POST() {
  const result = await runAnalysis();
  return NextResponse.json(result);
}

/** Same as POST — runs analysis and returns the result as JSON. */
export async function GET() {
  const result = await runAnalysis();
  return NextResponse.json(result);
}
