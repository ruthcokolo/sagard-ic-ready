/** Believable deal IDs shown first in demo tables (IC queue, pipeline). */
export const CURATED_DEAL_IDS = [
  "northwind-logistics",
  "helix-health",
  "stonegate-properties",
  "meridian-analytics",
  "cascade-payments",
  "vault-realty-capital",
  "clearbank-systems",
  "brightcart",
  "lumen-home",
  "atlas-logic",
] as const;

/** First rows on the pipeline table (matches demo mockup). */
export const PIPELINE_TOP_IDS = [
  "northwind-logistics",
  "stonegate-properties",
  "meridian-analytics",
  "vault-realty-capital",
  "brightcart",
] as const;

export function prioritizePipelineDeals<T extends { id: string }>(deals: T[]): T[] {
  const top = PIPELINE_TOP_IDS.map((id) => deals.find((d) => d.id === id)).filter(
    (d): d is T => Boolean(d),
  );
  const rest = deals.filter(
    (d) => !PIPELINE_TOP_IDS.includes(d.id as (typeof PIPELINE_TOP_IDS)[number]),
  );
  return [...top, ...rest];
}

export function prioritizeCuratedDeals<T extends { id: string }>(deals: T[]): T[] {
  const curated = CURATED_DEAL_IDS.map((id) => deals.find((d) => d.id === id)).filter(
    (d): d is T => Boolean(d),
  );
  const rest = deals.filter((d) => !CURATED_DEAL_IDS.includes(d.id as (typeof CURATED_DEAL_IDS)[number]));
  return [...curated, ...rest];
}
