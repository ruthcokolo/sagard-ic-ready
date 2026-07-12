/**
 * Runs AI diligence on deal documents — calls Claude when an API key exists,
 * otherwise falls back to the Northwind demo analysis.
 */

import type { AnalysisResult } from "./types";
import { enrichAnalysis, enrichContradiction } from "./enrich-analysis";
import { northwindAnalysis } from "./mock-deal";
import { getDealById } from "./deals-pipeline";

const SYSTEM_PROMPT = `You are an IC diligence assistant for a private equity investments team.
Analyze deal inputs and return ONLY valid JSON matching this schema:
{
  "onePager": { "thesis": string, "whyNow": string, "keyRisks": string[], "mitigants": string[] },
  "readinessScore": number (1-10),
  "openQuestions": number,
  "contradictions": [{
    "id": string, "field": string,
    "sourceA": { "name": string, "value": string, "quote": string },
    "sourceB": { "name": string, "value": string, "quote": string },
    "severity": "high"|"medium"|"low",
    "suggestedAction": string
  }],
  "checklist": [{ "id": string, "label": string, "priority": "high"|"medium"|"low", "linkedRisk": string, "done": false }]
}`;

/** Runs diligence analysis — live AI when configured, demo data otherwise. */
export async function runAnalysis(): Promise<AnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const deal = getDealById("northwind-logistics");
    return enrichAnalysis(deal!, {
      ...northwindAnalysis,
      analyzedAt: new Date().toISOString(),
      usedLiveAI: false,
    });
  }

  try {
    const userPrompt = buildPromptFromMock();
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    const highCount = (parsed.contradictions ?? []).filter(
      (c: { severity: string }) => c.severity === "high",
    ).length;

    const deal = getDealById("northwind-logistics");
    return enrichAnalysis(deal!, {
      ...northwindAnalysis,
      onePager: parsed.onePager ?? northwindAnalysis.onePager,
      readinessScore: parsed.readinessScore ?? northwindAnalysis.readinessScore,
      openQuestions: parsed.openQuestions ?? northwindAnalysis.openQuestions,
      contradictions: (parsed.contradictions ?? northwindAnalysis.contradictions).map(
        (c: ContradictionLike) => enrichContradiction(c),
      ),
      checklist: parsed.checklist ?? northwindAnalysis.checklist,
      blockingConflictCount: highCount,
      analyzedAt: new Date().toISOString(),
      usedLiveAI: true,
    });
  } catch {
    const deal = getDealById("northwind-logistics");
    return enrichAnalysis(deal!, {
      ...northwindAnalysis,
      analyzedAt: new Date().toISOString(),
      usedLiveAI: false,
    });
  }
}

type ContradictionLike = {
  id: string;
  field: string;
  sourceA: { name: string; value: string; quote: string };
  sourceB: { name: string; value: string; quote: string };
  severity: "high" | "medium" | "low";
  suggestedAction: string;
  whyItMatters?: string;
  whyItBlocksIC?: string;
  status?: "unresolved" | "resolved" | "acknowledged";
};

/** Builds the text prompt sent to Claude using Northwind sample documents. */
function buildPromptFromMock(): string {
  return `Analyze this deal for IC readiness.

Google Sheet (Deal Pipeline):
- Company: Northwind Logistics
- ARR 2024: $12.0M, growth +28% YoY
- Customer concentration: Top 3 = 42% revenue

Management Memo excerpts:
- FY24 ARR approximately $9M, flat YoY
- Blended gross margin 72%

CIM Extract:
- Top 3 customers represent 68% of revenue

Financial Model:
- Gross margin 64% in base case

Find contradictions, draft a one-pager, readiness score, and checklist.`;
}

/** Turns analysis plus a human decision into a markdown IC package for download. */
export function buildExportMarkdown(
  analysis: AnalysisResult,
  decision: string,
  rationale: string,
): string {
  const { deal, onePager, readinessScore, contradictions, checklist } = analysis;
  const date = new Date().toISOString().split("T")[0];

  return `# IC Package — ${deal.name}
**Exported:** ${date}  
**Decision:** ${decision.replace("_", " ").toUpperCase()}  
**Rationale:** ${rationale}  
**Prepared by:** ${deal.owner}  
**Readiness score:** ${readinessScore}/10

---

## Investment thesis
${onePager.thesis}

## Why now
${onePager.whyNow}

## Key risks
${onePager.keyRisks.map((r) => `- ${r}`).join("\n")}

## Mitigants
${onePager.mitigants.map((m) => `- ${m}`).join("\n")}

---

## Cross-source contradictions
${contradictions
  .map(
    (c) =>
      `### ${c.field} (${c.severity})
- **${c.sourceA.name}:** ${c.sourceA.value} — "${c.sourceA.quote}"
- **${c.sourceB.name}:** ${c.sourceB.value} — "${c.sourceB.quote}"
- **Why it matters:** ${c.whyItMatters}
- **Action:** ${c.suggestedAction}`,
  )
  .join("\n\n")}

---

## Claims needing support
${(analysis.unsupportedClaims ?? [])
  .map(
    (u) =>
      `- "${u.claim}" (${u.source}) — ${u.evidenceStatus.replace("_", " ")} — proof: ${u.requiredProof}`,
  )
  .join("\n")}

---

## Open diligence items
${checklist
  .filter((i) => !i.done)
  .map((i) => `- [ ] [${i.priority.toUpperCase()}] ${i.label}${i.linkedRisk ? ` (${i.linkedRisk})` : ""}`)
  .join("\n")}

---

*Generated by ICReady AI. Human decision recorded before export.*
`;
}
