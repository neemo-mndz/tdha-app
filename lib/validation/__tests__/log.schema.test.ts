import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { createLogSchema, updateLogSchema, deleteLogSchema } from '../log.schema';

// Generate valid dates in yyyy-MM-dd format
const validDateArb = fc.tuple(
  fc.integer({ min: 2000, max: 2099 }),
  fc.integer({ min: 1, max: 12 }),
  fc.integer({ min: 1, max: 28 })
).map(([year, month, day]) => {
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
});

const validContentArb = fc
  .string({ minLength: 1, maxLength: 2000 })
  .filter((s) => s.trim().length > 0);

const whitespaceArb = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 100 })
  .map((arr) => arr.join(''));

describe('createLogSchema — Property 1: Content Boundary Validation', () => {
  // Property test: Valid content (1-2000 chars non-whitespace)
  it('accepts content of 1–2000 chars non-whitespace (Property 1a)', () => {
    fc.assert(
      fc.property(validContentArb, validDateArb, (content, date) => {
        const result = createLogSchema.safeParse({ content, date });
        return result.success === true;
      }),
      { numRuns: 100 }
    );
  });

  // Property test: Reject empty content
  it('rejects empty content (Property 1b)', () => {
    fc.assert(
      fc.property(validDateArb, (date) => {
        const result = createLogSchema.safeParse({ content: '', date });
        return result.success === false;
      }),
      { numRuns: 50 }
    );
  });

  // Property test: Reject whitespace-only content
  it('rejects whitespace-only content (spaces, tabs, newlines) (Property 1c)', () => {
    fc.assert(
      fc.property(whitespaceArb, validDateArb, (content, date) => {
        const result = createLogSchema.safeParse({ content, date });
        return result.success === false;
      }),
      { numRuns: 100 }
    );
  });

  // Property test: Reject content > 2000 chars
  it('rejects content > 2000 chars (Property 1d)', () => {
    fc.assert(
      fc.property(validDateArb, (date) => {
        const overflowLength = fc.sample(fc.integer({ min: 2001, max: 5000 }), 1)[0];
        const content = 'x'.repeat(overflowLength);
        const result = createLogSchema.safeParse({ content, date });
        return result.success === false;
      }),
      { numRuns: 50 }
    );
  });

  // Example: 1 character (lower bound)
  it('accepts content of exactly 1 char', () => {
    const result = createLogSchema.safeParse({ content: 'x', date: '2024-07-14' });
    expect(result.success).toBe(true);
  });

  // Example: 2000 characters (upper bound)
  it('accepts content of exactly 2000 chars', () => {
    const content = 'a'.repeat(2000);
    const result = createLogSchema.safeParse({ content, date: '2024-07-14' });
    expect(result.success).toBe(true);
  });

  // Example: 2001 characters (exceeds upper bound)
  it('rejects content of 2001 chars', () => {
    const content = 'a'.repeat(2001);
    const result = createLogSchema.safeParse({ content, date: '2024-07-14' });
    expect(result.success).toBe(false);
  });

  // Example: Only spaces
  it('rejects content with only spaces', () => {
    const result = createLogSchema.safeParse({ content: '     ', date: '2024-07-14' });
    expect(result.success).toBe(false);
  });

  // Example: Only tabs
  it('rejects content with only tabs', () => {
    const result = createLogSchema.safeParse({ content: '\t\t\t', date: '2024-07-14' });
    expect(result.success).toBe(false);
  });

  // Example: Only newlines
  it('rejects content with only newlines', () => {
    const result = createLogSchema.safeParse({ content: '\n\n\n', date: '2024-07-14' });
    expect(result.success).toBe(false);
  });

  // Example: Mixed whitespace
  it('rejects content with mixed whitespace', () => {
    const result = createLogSchema.safeParse({ content: '  \t\n  \r  ', date: '2024-07-14' });
    expect(result.success).toBe(false);
  });

  // Example: Content with surrounding whitespace
  it('accepts content with surrounding whitespace (valid after trim)', () => {
    const result = createLogSchema.safeParse({
      content: '   valid content   ',
      date: '2024-07-14',
    });
    expect(result.success).toBe(true);
  });

  // Example: Valid dates
  it('accepts valid date 2024-07-14', () => {
    const result = createLogSchema.safeParse({ content: 'test', date: '2024-07-14' });
    expect(result.success).toBe(true);
  });

  it('accepts valid date 2000-01-01', () => {
    const result = createLogSchema.safeParse({ content: 'test', date: '2000-01-01' });
    expect(result.success).toBe(true);
  });

  it('accepts valid date format 2099-12-31', () => {
    const result = createLogSchema.safeParse({ content: 'test', date: '2099-12-31' });
    expect(result.success).toBe(true);
  });

  // Example: Invalid date formats
  it('rejects invalid date format (not yyyy-MM-dd) - with slashes', () => {
    const result = createLogSchema.safeParse({ content: 'test', date: '07/14/2024' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format (incomplete)', () => {
    const result = createLogSchema.safeParse({ content: 'test', date: '2024-07' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format (no leading zeros)', () => {
    const result = createLogSchema.safeParse({ content: 'test', date: '2024-7-14' });
    expect(result.success).toBe(false);
  });

  // Example: Error structure validation
  it('returns structured error for empty content', () => {
    const result = createLogSchema.safeParse({ content: '', date: '2024-07-14' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
      expect(result.error.issues[0].code).toBeDefined();
      expect(result.error.issues[0].message).toBeDefined();
    }
  });

  it('returns structured error for whitespace-only content', () => {
    const result = createLogSchema.safeParse({ content: '   ', date: '2024-07-14' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1);
      expect(result.error.issues[0].message).toContain('espaços');
    }
  });

  it('returns structured error for content > 2000 chars', () => {
    const result = createLogSchema.safeParse({
      content: 'a'.repeat(2001),
      date: '2024-07-14',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1);
      expect(result.error.issues[0].message).toContain('2000');
    }
  });
});

describe('updateLogSchema — Property 1 (extended to update schema)', () => {
  const validUuidArb = fc.uuid().map((id) => id.toString());

  it('updateLogSchema accepts valid content (1-2000 chars non-whitespace)', () => {
    fc.assert(
      fc.property(validUuidArb, validContentArb, validDateArb, (logId, content, date) => {
        const result = updateLogSchema.safeParse({ logId, content, date });
        return result.success === true;
      }),
      { numRuns: 100 }
    );
  });

  it('updateLogSchema rejects empty content', () => {
    fc.assert(
      fc.property(validUuidArb, validDateArb, (logId, date) => {
        const result = updateLogSchema.safeParse({ logId, content: '', date });
        return result.success === false;
      }),
      { numRuns: 50 }
    );
  });

  it('updateLogSchema rejects whitespace-only content', () => {
    fc.assert(
      fc.property(validUuidArb, whitespaceArb, validDateArb, (logId, content, date) => {
        const result = updateLogSchema.safeParse({ logId, content, date });
        return result.success === false;
      }),
      { numRuns: 100 }
    );
  });

  it('updateLogSchema rejects content > 2000 chars', () => {
    fc.assert(
      fc.property(validUuidArb, validDateArb, (logId, date) => {
        const content = 'a'.repeat(2001);
        const result = updateLogSchema.safeParse({ logId, content, date });
        return result.success === false;
      }),
      { numRuns: 50 }
    );
  });

  it('updateLogSchema requires valid UUID for logId', () => {
    const result = updateLogSchema.safeParse({
      logId: 'not-a-uuid',
      content: 'valid content',
      date: '2024-07-14',
    });
    expect(result.success).toBe(false);
  });

  it('updateLogSchema accepts valid UUID', () => {
    const validUuid = fc.sample(fc.uuid().map((id) => id.toString()), 1)[0];
    const result = updateLogSchema.safeParse({
      logId: validUuid,
      content: 'valid content',
      date: '2024-07-14',
    });
    expect(result.success).toBe(true);
  });
});

describe('deleteLogSchema — Date and LogId validation', () => {
  const validUuidArb = fc.uuid().map((id) => id.toString());

  it('deleteLogSchema accepts valid logId and date', () => {
    fc.assert(
      fc.property(validUuidArb, validDateArb, (logId, date) => {
        const result = deleteLogSchema.safeParse({ logId, date });
        return result.success === true;
      }),
      { numRuns: 100 }
    );
  });

  it('deleteLogSchema rejects invalid date format', () => {
    const validUuid = fc.sample(fc.uuid().map((id) => id.toString()), 1)[0];
    const result = deleteLogSchema.safeParse({
      logId: validUuid,
      date: 'invalid-date',
    });
    expect(result.success).toBe(false);
  });

  it('deleteLogSchema rejects invalid logId (not UUID)', () => {
    const result = deleteLogSchema.safeParse({
      logId: 'not-a-uuid',
      date: '2024-07-14',
    });
    expect(result.success).toBe(false);
  });

  it('deleteLogSchema accepts valid date and UUID', () => {
    const validUuid = fc.sample(fc.uuid().map((id) => id.toString()), 1)[0];
    const result = deleteLogSchema.safeParse({
      logId: validUuid,
      date: '2024-07-14',
    });
    expect(result.success).toBe(true);
  });
});
