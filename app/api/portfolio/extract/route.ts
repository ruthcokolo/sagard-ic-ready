/** POST /api/portfolio/extract — extract metrics from an uploaded PDF. */
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_EXTRACTION_RULES } from "@/lib/portfolio/extraction-rules-default";
import {
  extractMetricsFromPdfBuffer,
  inferCompanyNameFromFileName,
} from "@/lib/portfolio/pdf-extract";
import type { ExtractionRule } from "@/lib/portfolio/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const rulesJson = formData.get("rules");
    const companyNameInput = formData.get("companyName");

    let rules: ExtractionRule[] = DEFAULT_EXTRACTION_RULES;
    if (typeof rulesJson === "string") {
      try {
        rules = JSON.parse(rulesJson) as ExtractionRule[];
      } catch {
        /* use defaults */
      }
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Upload a PDF file to extract metrics.",
          pages: [],
          candidates: [],
          missingMetrics: [],
        },
        { status: 422 }
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const companyName =
      typeof companyNameInput === "string" && companyNameInput.trim()
        ? companyNameInput.trim()
        : inferCompanyNameFromFileName(file.name);

    const result = await extractMetricsFromPdfBuffer(
      buffer,
      file.name,
      companyName,
      rules
    );

    return NextResponse.json({
      success: true,
      pagesProcessed: result.pagesProcessed,
      candidates: result.candidates,
      missingMetrics: result.missingMetrics,
      sourceFormat: result.sourceFormat,
      documentText: result.documentText,
      sector: result.sector,
      extractionMode: result.sourceFormat === "ICReady template" ? "template" : "flexible",
      warning: result.warning,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Extraction failed",
      },
      { status: 500 }
    );
  }
}
