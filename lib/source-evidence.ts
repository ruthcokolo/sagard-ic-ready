export type SourceEvidence = {
  sourceName: string;
  location: string;
  excerpt: string;
  meta: string[];
};

export function buildSourceEvidence(
  sourceName: string,
  quote: string,
  field: string,
  owner = "Alex Rivera",
): SourceEvidence {
  const synced = "Last synced: 2 min ago";
  const lower = sourceName.toLowerCase();

  if (lower.includes("sheet")) {
    return {
      sourceName: "Google Sheet",
      location: "Deal Pipeline · Row 14",
      excerpt: quote.replace(/^Row 14:\s*/i, ""),
      meta: [field, synced, "Source: Google Sheets intake"],
    };
  }
  if (lower.includes("memo")) {
    return {
      sourceName: "Investor memo",
      location: "Section 2 · Financial overview",
      excerpt: quote.replace(/^Section 2:\s*/i, ""),
      meta: [`Uploaded by: ${owner}`, "Received: May 28, 2026"],
    };
  }
  if (lower.includes("cim")) {
    return {
      sourceName: "CIM extract",
      location: "Appendix B · Customer concentration",
      excerpt: quote.replace(/^Appendix B:\s*/i, ""),
      meta: ["Data room file", synced],
    };
  }
  if (lower.includes("model") || lower.includes("financial")) {
    return {
      sourceName: "Financial model",
      location: "P&L tab · Base case",
      excerpt: quote,
      meta: ["Model version 3.2", `Owner: ${owner}`],
    };
  }
  if (lower.includes("deck") || lower.includes("pitch")) {
    return {
      sourceName: sourceName,
      location: "Uploaded deck",
      excerpt: quote,
      meta: [`Uploaded by: ${owner}`, synced],
    };
  }

  return {
    sourceName,
    location: field,
    excerpt: quote,
    meta: [synced],
  };
}
