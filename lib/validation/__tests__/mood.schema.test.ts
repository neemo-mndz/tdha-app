import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { saveMoodSchema, saveMoodNoteSchema, MOOD_VALUES } from '../mood.schema';

// Feature: mood-tracking, Property 5: Mood value validation accepts only valid enums
// Feature: mood-tracking, Property 7: Mood note validation

// Valid date for use in schema tests
const VALID_DATE = '2024-07-14';

// Helper: generate valid dates in yyyy-MM-dd format
const validDateArb = fc.tuple(
  fc.integer({ min: 2000, max: 2099 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 })
).map(([year, month, day]) => {
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
});

// Helper: generate strings with at least 1 non-whitespace char, length 1-80
const validNoteArb = fc
  .string({ minLength: 1, maxLength: 80 })
  .filter((s) => s.trim().length > 0);

// Helper: generate whitespace-only strings (spaces, tabs, newlines)
const whitespaceOnlyArb = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 80 })
  .map((arr) => arr.join(''));

// Helper: generate strings longer than 80 chars
const tooLongStringArb = fc.string({ minLength: 81, maxLength: 200 });

describe('saveMoodSchema — Property 5: Mood value validation accepts only valid enums', () => {
  // **Validates: Requirements 3.5**

  it('accepts any valid MoodValue', () => {
    fc.assert(
      fc.property(fc.constantFrom(...MOOD_VALUES), (mood) => {
        const result = saveMoodSchema.safeParse({ date: VALID_DATE, mood });
        return result.success === true;
      }),
      { numRuns: 100 }
    );
  });

  it('rejects any arbitrary string that is not a valid MoodValue', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !(MOOD_VALUES as readonly string[]).includes(s)),
        (mood) => {
          const result = saveMoodSchema.safeParse({ date: VALID_DATE, mood });
          return result.success === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts null as a valid mood value (clear mood)', () => {
    const result = saveMoodSchema.safeParse({ date: VALID_DATE, mood: null });
    expect(result.success).toBe(true);
  });

  // Edge cases: substrings, mixed case, whitespace variants of valid values
  it('rejects substrings and case variants of valid mood values', () => {
    const invalidVariants = [
      'Great', 'GREAT', 'gReAt',   // case variants
      'goo', 'neutra', 'awfu',     // substrings
      'good ', ' good', ' good ',  // whitespace-padded
      'neutrall', 'goood',         // typos
      '', ' ', '\t', '\n',         // whitespace/empty
    ];

    for (const mood of invalidVariants) {
      const result = saveMoodSchema.safeParse({ date: VALID_DATE, mood });
      expect(result.success, `Expected "${mood}" to be rejected`).toBe(false);
    }
  });
});

describe('saveMoodNoteSchema — Property 7: Mood note validation', () => {
  // **Validates: Requirements 3.7, 4.5**

  it('accepts note with 1–80 chars containing at least 1 non-whitespace character', () => {
    fc.assert(
      fc.property(validNoteArb, validDateArb, (note, date) => {
        const result = saveMoodNoteSchema.safeParse({ date, note });
        // Should parse successfully
        if (!result.success) return false;
        // Output note should be non-null (trimmed value)
        return result.data.note !== null;
      }),
      { numRuns: 100 }
    );
  });

  it('rejects note longer than 80 characters', () => {
    fc.assert(
      fc.property(tooLongStringArb, validDateArb, (note, date) => {
        const result = saveMoodNoteSchema.safeParse({ date, note });
        // Should fail validation (max 80 chars)
        return result.success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('transforms whitespace-only note to null (not accepted as valid note)', () => {
    fc.assert(
      fc.property(whitespaceOnlyArb, validDateArb, (note, date) => {
        const result = saveMoodNoteSchema.safeParse({ date, note });
        // Should parse successfully but output null
        if (!result.success) return false;
        return result.data.note === null;
      }),
      { numRuns: 100 }
    );
  });

  it('transforms empty string to null (not accepted as valid note)', () => {
    fc.assert(
      fc.property(validDateArb, (date) => {
        const result = saveMoodNoteSchema.safeParse({ date, note: '' });
        // Should parse successfully but output null
        if (!result.success) return false;
        return result.data.note === null;
      }),
      { numRuns: 100 }
    );
  });

  it('bidirectional: note produces non-null output iff length 1–80 AND has non-whitespace', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 80 }), validDateArb, (note, date) => {
        const result = saveMoodNoteSchema.safeParse({ date, note });
        if (!result.success) return false;

        const hasNonWhitespace = note.trim().length > 0;
        const hasValidLength = note.length >= 1 && note.length <= 80;
        const shouldAccept = hasValidLength && hasNonWhitespace;

        // Output note is non-null iff both conditions are met
        return (result.data.note !== null) === shouldAccept;
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: mood-tracking, Property 8: Whitespace-only note transforms to null
describe('saveMoodNoteSchema — Property 8: Whitespace-only note transforms to null', () => {
  // **Validates: Requirements 4.6**

  const validDateArb8 = fc.tuple(
    fc.integer({ min: 2000, max: 2099 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  ).map(([year, month, day]) => {
    const monthStr = String(month).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  });

  // Generate strings composed only of whitespace (spaces, tabs, newlines, or empty)
  const whitespaceOnlyArb8 = fc
    .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 80 })
    .map((arr) => arr.join(''));

  it('transforms any whitespace-only string (spaces, tabs, newlines, empty) to null', () => {
    fc.assert(
      fc.property(whitespaceOnlyArb8, validDateArb8, (note, date) => {
        const result = saveMoodNoteSchema.safeParse({ date, note });
        if (!result.success) return false;
        return result.data.note === null;
      }),
      { numRuns: 100 }
    );
  });
});
