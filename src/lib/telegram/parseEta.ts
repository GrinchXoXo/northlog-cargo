/**
 * Converts flexible operator input ("48 hours", "14 Aug 2026 14:00") into
 * the canonical estimated_delivery_at timestamp. Deliberately simple:  * the PRD is explicit about not building natural-language date parsing
 * beyond what's reliable (section 11).
 */
export function parseEta(input: string): string | null {
  const trimmed = input.trim();

  const relativeMatch = trimmed.match(/^(\d+)\s*(hours?|hrs?)$/i);
  if (relativeMatch) {
    const hours = parseInt(relativeMatch[1], 10);
    const date = new Date(Date.now() + hours * 60 * 60 * 1000);
    return date.toISOString();
  }

  const relativeDaysMatch = trimmed.match(/^(\d+)\s*(days?)$/i);
  if (relativeDaysMatch) {
    const days = parseInt(relativeDaysMatch[1], 10);
    const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return date.toISOString();
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }

  return null;
}
