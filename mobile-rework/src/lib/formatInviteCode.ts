// T354 (Sprint 61) — shared invite-code formatting helpers. Before this, 3
// surfaces (Dashboard ShareCodeCard, Profile settings row, InviteCodeSheet)
// each had their own copy — and the row surface used `.toUpperCase()` alone,
// producing "ABCD1234" while the others rendered "ABCD 1234". Boss read the
// two different formats as two different codes.
//
// Canonical display format: uppercase 8-hex with a single space between the
// two 4-char halves ("ABCD 1234"). Share/URL payload is the raw lowercase
// code ("abcd1234") — what BE expects on POST /api/couple/join and what the
// /join/:code web landing parses.

export function formatInviteCode(code: string | null | undefined): string {
  if (!code) return '';
  const upper = code.toUpperCase();
  if (upper.length !== 8) return upper;
  return `${upper.slice(0, 4)} ${upper.slice(4)}`;
}

export function toInvitePayload(code: string): string {
  return code.toLowerCase();
}
