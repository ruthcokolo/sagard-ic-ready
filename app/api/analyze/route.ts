import { NextResponse } from "next/server";
import { runAnalysis } from "@/lib/analysis";

export async function POST() {
  const result = await runAnalysis();
  return NextResponse.json(result);
}

export async function GET() {
  const result = await runAnalysis();
  return NextResponse.json(result);
}
