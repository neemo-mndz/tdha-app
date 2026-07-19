/**
 * Extracts initials from a user's name or email.
 *
 * Rules:
 * - If name has 2+ words: first letter of first word + first letter of last word
 * - If name is a single word: first letter of name
 * - If name is null/empty/whitespace-only: first letter of email
 * - Always returns uppercase
 */
export function getInitials(name: string | null, email: string): string {
  const trimmed = name?.trim() ?? '';
  const parts = trimmed.split(/\s+/).filter((p) => p.length > 0);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  // Fallback to email first character
  return email[0].toUpperCase();
}
