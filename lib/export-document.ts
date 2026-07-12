/**
 * Print-ready HTML builders and browser download triggers for IC packages
 * and archived export records (PDF via print dialog, Word via blob).
 */

import type { AnalysisResult } from "./types";
import type { ExportHistoryItem } from "./exports-mock";

const DOC_STYLES = `
  @page { margin: 1in; }
  body {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #1c1917;
    max-width: 7in;
    margin: 0 auto;
  }
  h1 {
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-size: 20pt;
    font-weight: 600;
    color: #7a3344;
    margin: 0 0 4pt;
    border-bottom: 2px solid #7a3344;
    padding-bottom: 8pt;
  }
  h2 {
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-size: 12pt;
    font-weight: 600;
    color: #44403c;
    margin: 18pt 0 6pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  h3 {
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-size: 11pt;
    font-weight: 600;
    margin: 12pt 0 4pt;
  }
  .meta {
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-size: 10pt;
    color: #57534e;
    margin-bottom: 16pt;
  }
  .meta p { margin: 2pt 0; }
  .meta strong { color: #292524; }
  ul { margin: 4pt 0 8pt; padding-left: 18pt; }
  li { margin-bottom: 3pt; }
  .conflict {
    border-left: 3px solid #d6a3ae;
    padding-left: 10pt;
    margin: 10pt 0;
  }
  .quote { font-style: italic; color: #57534e; font-size: 10pt; }
  .footer {
    margin-top: 24pt;
    padding-top: 8pt;
    border-top: 1px solid #d6d3d1;
    font-size: 9pt;
    color: #78716c;
    font-family: "Helvetica Neue", Arial, sans-serif;
  }
`;

/** Escapes HTML special characters so user text is safe inside export documents. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Maps internal decision codes to the labels shown in exported documents. */
function formatDecision(decision: string): string {
  const map: Record<string, string> = {
    proceed: "Recommend to committee",
    more_diligence: "Need more research",
    pass: "Don't invest",
  };
  return map[decision] ?? decision.replace(/_/g, " ");
}

/** Wraps body HTML in a full document with shared print styles. */
function wrapDocument(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${DOC_STYLES}</style>
</head>
<body>${body}</body>
</html>`;
}

/** Builds styled HTML for a live IC package from analysis and decision input. */
export function buildIcPackageHtml(
  analysis: AnalysisResult,
  decision: string,
  rationale: string,
): string {
  const { deal, onePager, readinessScore, contradictions, checklist } = analysis;
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const openItems = checklist.filter((i) => !i.done);

  const conflictBlocks = contradictions
    .map(
      (c) => `
    <div class="conflict">
      <h3>${escapeHtml(c.field)} <span style="font-weight:400;color:#78716c">(${c.severity})</span></h3>
      <p><strong>${escapeHtml(c.sourceA.name)}:</strong> ${escapeHtml(c.sourceA.value)}</p>
      <p class="quote">"${escapeHtml(c.sourceA.quote)}"</p>
      <p><strong>${escapeHtml(c.sourceB.name)}:</strong> ${escapeHtml(c.sourceB.value)}</p>
      <p class="quote">"${escapeHtml(c.sourceB.quote)}"</p>
      <p><strong>Why it matters:</strong> ${escapeHtml(c.whyItMatters)}</p>
      <p><strong>Recommended action:</strong> ${escapeHtml(c.suggestedAction)}</p>
    </div>`,
    )
    .join("");

  const unsupported = (analysis.unsupportedClaims ?? [])
    .map(
      (u) =>
        `<li>"${escapeHtml(u.claim)}" (${escapeHtml(u.source)}) — ${escapeHtml(u.evidenceStatus.replace(/_/g, " "))}</li>`,
    )
    .join("");

  const checklistItems = openItems
    .map(
      (i) =>
        `<li>[${i.priority.toUpperCase()}] ${escapeHtml(i.label)}${i.linkedRisk ? ` (${escapeHtml(i.linkedRisk)})` : ""}</li>`,
    )
    .join("");

  const body = `
    <h1>IC Package — ${escapeHtml(deal.name)}</h1>
    <div class="meta">
      <p><strong>Exported:</strong> ${escapeHtml(date)}</p>
      <p><strong>Decision:</strong> ${escapeHtml(formatDecision(decision))}</p>
      <p><strong>Rationale:</strong> ${escapeHtml(rationale)}</p>
      <p><strong>Prepared by:</strong> ${escapeHtml(deal.owner)}</p>
      <p><strong>Readiness score:</strong> ${readinessScore}/10</p>
    </div>

    <h2>Investment thesis</h2>
    <p>${escapeHtml(onePager.thesis)}</p>

    <h2>Why now</h2>
    <p>${escapeHtml(onePager.whyNow)}</p>

    <h2>Key risks</h2>
    <ul>${onePager.keyRisks.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>

    <h2>Mitigants</h2>
    <ul>${onePager.mitigants.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul>

    <h2>Cross-source contradictions</h2>
    ${conflictBlocks || "<p>None identified.</p>"}

    ${unsupported ? `<h2>Claims needing support</h2><ul>${unsupported}</ul>` : ""}

    ${checklistItems ? `<h2>Open diligence items</h2><ul>${checklistItems}</ul>` : ""}

    <p class="footer">Generated by ICReady AI. Human decision recorded before export.</p>
  `;

  return wrapDocument(`IC Package — ${deal.name}`, body);
}

/** Builds styled HTML for a saved export archive entry. */
export function buildExportArchiveHtml(item: ExportHistoryItem): string {
  const exportedDate = item.exportedAt.split(" ")[0] ?? item.exportedAt;

  const body = `
    <h1>IC Package — ${escapeHtml(item.company)}</h1>
    <div class="meta">
      <p><strong>Exported:</strong> ${escapeHtml(exportedDate)}</p>
      <p><strong>Decision:</strong> ${escapeHtml(item.decision)}</p>
      <p><strong>Rationale:</strong> ${escapeHtml(item.rationalePreview)}</p>
      <p><strong>Prepared by:</strong> ${escapeHtml(item.owner)}</p>
      <p><strong>Readiness score at export:</strong> ${item.readiness}/10</p>
      <p><strong>Open issues at download:</strong> ${item.blockersAtExport}</p>
    </div>

    <h2>Decision record</h2>
    <p>This package was exported from ICReady after a human sign-off. The AI prepared diligence materials; the associate or partner recorded the final decision above.</p>

    <h2>Archive note</h2>
    <p>This is a compliance archive copy. Source contradictions, checklist items, and one-pager content from the original export session are retained in the ICReady audit trail.</p>

    <p class="footer">Generated by ICReady AI. Human decision recorded before export.</p>
  `;

  return wrapDocument(`IC Package — ${item.company}`, body);
}

/** Opens a new browser tab and triggers the print dialog for PDF saving. */
function openPrintDialog(html: string, title: string): void {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.title = title;
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 300);
}

/** Downloads HTML content as a Word-compatible .doc file via a blob link. */
function downloadWord(html: string, filename: string): void {
  const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:w="urn:schemas-microsoft-com:office:word"
    xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>IC Package</title></head>
<body>${html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html}</body></html>`;
  const blob = new Blob(["\ufeff", wordHtml], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".doc") ? filename : `${filename}.doc`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Opens a print dialog with the live IC package HTML. */
export function downloadIcPackagePdf(
  analysis: AnalysisResult,
  decision: string,
  rationale: string,
): void {
  const html = buildIcPackageHtml(analysis, decision, rationale);
  const title = `IC-Package-${analysis.deal.name.replace(/\s+/g, "-")}`;
  openPrintDialog(html, title);
}

/** Downloads the live IC package as a Word-compatible HTML document. */
export function downloadIcPackageWord(
  analysis: AnalysisResult,
  decision: string,
  rationale: string,
): void {
  const html = buildIcPackageHtml(analysis, decision, rationale);
  const filename = `IC-Package-${analysis.deal.name.replace(/\s+/g, "-")}.doc`;
  downloadWord(html, filename);
}

/** Opens a print dialog with a saved export archive entry. */
export function downloadExportArchivePdf(item: ExportHistoryItem): void {
  const html = buildExportArchiveHtml(item);
  const title = `IC-Package-${item.company.replace(/\s+/g, "-")}-${item.id}`;
  openPrintDialog(html, title);
}

/** Downloads a saved export archive entry as a Word-compatible document. */
export function downloadExportArchiveWord(item: ExportHistoryItem): void {
  const html = buildExportArchiveHtml(item);
  const filename = `IC-Package-${item.company.replace(/\s+/g, "-")}-${item.id}.doc`;
  downloadWord(html, filename);
}
