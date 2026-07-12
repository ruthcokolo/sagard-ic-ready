/**
 * Helpers for turning PDF text into lines and short evidence snippets
 * that reviewers can see next to each extracted metric.
 */

/** Turn PDF.js text fragments into readable lines grouped by vertical position. */
export function pdfItemsToPageText(items: unknown[]): string {
  type Row = { y: number; x: number; str: string };

  const rows: Row[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object" || !("str" in item)) continue;
    const textItem = item as { str: string; transform?: number[] };
    const str = textItem.str;
    if (!str?.trim()) continue;
    const transform = textItem.transform ?? [];
    rows.push({
      y: Math.round(transform[5] ?? 0),
      x: transform[4] ?? 0,
      str,
    });
  }

  if (rows.length === 0) return "";

  const lineMap = new Map<number, Row[]>();
  for (const row of rows) {
    let key = row.y;
    for (const existingY of lineMap.keys()) {
      if (Math.abs(existingY - row.y) <= 3) {
        key = existingY;
        break;
      }
    }
    const list = lineMap.get(key) ?? [];
    list.push({ ...row, y: key });
    lineMap.set(key, list);
  }

  return [...lineMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, lineItems]) =>
      lineItems
        .sort((a, b) => a.x - b.x)
        .map((item) => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join("\n");
}

/** One concise sentence from source text that captures the metric and value. */
export function extractMetricEvidenceSentence(
  sourceText: string,
  matchedLabel: string,
  valueRaw: string
): string {
  const text = sourceText.trim().replace(/\s+/g, " ");
  if (!text) return `${matchedLabel}: ${valueRaw}`;

  const valueIndex = text.indexOf(valueRaw);
  const labelHints = matchedLabel
    .split(/\s+/)
    .filter((part) => part.length > 2)
    .map((part) => part.toLowerCase());

  const buildSnippet = (labelHint: string): { snippet: string; labelIndex: number } | null => {
    if (!labelHint || valueIndex < 0) return null;
    const searchStart = Math.max(0, valueIndex - 80);
    const labelIndex = text.toLowerCase().indexOf(labelHint, searchStart);
    if (labelIndex < 0 || labelIndex > valueIndex + valueRaw.length) return null;

    const afterValue = valueIndex + valueRaw.length;
    const rest = text.slice(afterValue);
    const stopAt = [
      rest.search(/^\s+(?:\$|\d)/),
      rest.search(/\s+and\s+(?:NOI|ARR|EBITDA|cash|revenue|total|the)\b/i),
      rest.search(/[;,]/),
      rest.search(/\.\s/),
      rest.search(/\s{2,}/),
    ]
      .filter((index) => index >= 0)
      .reduce((min, index) => Math.min(min, index), rest.length);
    const sliceEnd =
      stopAt < rest.length ? afterValue + stopAt : Math.min(text.length, afterValue + 24);
    const snippet = text.slice(labelIndex, sliceEnd).trim();
    if (snippet.includes(valueRaw) && snippet.length <= 160) {
      return { snippet, labelIndex };
    }
    return null;
  };

  let bestSnippet: { snippet: string; labelIndex: number } | null = null;
  for (const hint of labelHints) {
    const result = buildSnippet(hint);
    if (!result) continue;
    if (
      !bestSnippet ||
      result.labelIndex < bestSnippet.labelIndex ||
      (result.labelIndex === bestSnippet.labelIndex &&
        result.snippet.length < bestSnippet.snippet.length)
    ) {
      bestSnippet = result;
    }
  }
  if (bestSnippet) return bestSnippet.snippet;

  const labelHint = labelHints[0];
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const valueSentences = sentences.filter((part) => part.includes(valueRaw));
  if (valueSentences.length > 0) {
    const labeled =
      labelHint &&
      valueSentences.find((part) => part.toLowerCase().includes(labelHint));
    const pick = labeled ?? valueSentences.sort((a, b) => a.length - b.length)[0];
    if (pick.length <= 220) return pick;
  }

  // Table row or short line from PDF layout.
  const lineCandidates = sourceText
    .split(/\n/)
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter((part) => part.includes(valueRaw));
  if (lineCandidates.length > 0) {
    const labeled =
      labelHint &&
      lineCandidates.find((part) => part.toLowerCase().includes(labelHint));
    const pick = labeled ?? lineCandidates.sort((a, b) => a.length - b.length)[0];
    if (pick.length <= 120) return pick;
  }

  if (text.length <= 120 && text.includes(valueRaw)) {
    return text;
  }

  if (valueIndex >= 0) {
    const start = Math.max(0, valueIndex - 70);
    const end = Math.min(text.length, valueIndex + valueRaw.length + 70);
    return (
      (start > 0 ? "…" : "") +
      text.slice(start, end).trim() +
      (end < text.length ? "…" : "")
    );
  }

  return `${matchedLabel}: ${valueRaw}`;
}
