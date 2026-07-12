"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ICReadyDashboard } from "@/components/ICReadyDashboard";
import { downloadIcPackagePdf } from "@/lib/export-document";
import { northwindAnalysis } from "@/lib/mock-deal";
import type { AnalysisResult, Decision } from "@/lib/types";

export function DealReadinessPage() {
  const [analysis, setAnalysis] = useState<AnalysisResult>(northwindAnalysis);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<Decision>(null);
  const [rationale, setRationale] = useState(
    "Material contradictions in revenue figures and incomplete diligence on customer concentration and legal.",
  );

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const data = (await res.json()) as AnalysisResult;
      setAnalysis(data);
    } catch {
      setAnalysis({ ...northwindAnalysis, analyzedAt: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runAnalysis();
  }, [runAnalysis]);

  const canExport =
    decision !== null && rationale.trim().length > 0;

  const handleExport = () => {
    if (!canExport || !decision) return;
    downloadIcPackagePdf(analysis, decision, rationale.trim());
  };

  return (
    <ICReadyDashboard
      analysis={analysis}
      loading={loading}
      onRefresh={runAnalysis}
      decision={decision}
      rationale={rationale}
      onDecisionChange={setDecision}
      onRationaleChange={setRationale}
      onExport={handleExport}
      canExport={canExport}
    />
  );
}
