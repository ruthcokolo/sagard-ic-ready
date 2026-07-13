/**
 * Resolve real person names for activity / review attribution.
 * Never treat role labels like "Associate" as a person name.
 */

const PLACEHOLDER_ACTOR_NAMES = new Set([
  "associate",
  "principal",
  "partner",
  "reviewer",
  "system",
  "unknown",
  "unknown reviewer",
  "a team member",
]);

export function isPlaceholderActorName(name?: string | null): boolean {
  if (!name?.trim()) return true;
  return PLACEHOLDER_ACTOR_NAMES.has(name.trim().toLowerCase());
}

/** First non-placeholder person name from candidates. */
export function resolvePersonActorName(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    if (!isPlaceholderActorName(candidate)) {
      return candidate!.trim();
    }
  }
  return null;
}
