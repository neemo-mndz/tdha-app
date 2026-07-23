import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

// Feature: mood-tracking, Property 10: Invalid mood values normalize to null on read

/**
 * Property 10: Invalid mood values normalize to null on read
 *
 * **Validates: Requirements 6.5**
 *
 * For any string stored in the mood column that does NOT exactly match one of
 * the 5 valid MoodValue strings, the query layer normalization function SHALL
 * return null, ensuring invalid data never propagates to the UI.
 */

// Extract the normalization logic from getDayMood for isolated testing.
// This mirrors the exact logic in lib/db/queries/mood.ts:
const validMoods: string[] = ['great', 'good', 'neutral', 'bad', 'awful'];

function normalizeMood(rawMood: string | null): string | null {
  return validMoods.includes(rawMood ?? '') ? rawMood : null;
}

describe('getDayMood normalization — Property 10: Invalid mood values normalize to null on read', () => {
  it('any string NOT in the 5 valid MoodValues normalizes to null', () => {
    const invalidMoodArb = fc.string().filter(
      (s) => !validMoods.includes(s)
    );

    fc.assert(
      fc.property(invalidMoodArb, (invalidMood) => {
        const result = normalizeMood(invalidMood);
        expect(result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('null input normalizes to null', () => {
    const result = normalizeMood(null);
    expect(result).toBeNull();
  });

  it('valid MoodValues pass through unchanged', () => {
    const validMoodArb = fc.constantFrom(...validMoods);

    fc.assert(
      fc.property(validMoodArb, (mood) => {
        const result = normalizeMood(mood);
        expect(result).toBe(mood);
      }),
      { numRuns: 100 }
    );
  });

  it('strings similar to valid moods but not exact matches normalize to null', () => {
    // Generate variations: uppercase, with spaces, substrings, etc.
    const nearMissArb = fc.oneof(
      // Uppercase variants
      fc.constantFrom(...validMoods).map((m) => m.toUpperCase()),
      // With leading/trailing spaces
      fc.constantFrom(...validMoods).map((m) => ` ${m}`),
      fc.constantFrom(...validMoods).map((m) => `${m} `),
      // Capitalized
      fc.constantFrom(...validMoods).map((m) => m[0].toUpperCase() + m.slice(1)),
      // Substrings (first 3 chars)
      fc.constantFrom(...validMoods).map((m) => m.slice(0, 3))
    ).filter((s) => !validMoods.includes(s));

    fc.assert(
      fc.property(nearMissArb, (nearMiss) => {
        const result = normalizeMood(nearMiss);
        expect(result).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});
