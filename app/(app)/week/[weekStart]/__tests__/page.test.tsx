import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { startOfWeek, parseISO, isValid } from 'date-fns';

/**
 * WeekStartSchema - Zod schema for validating weekStart route parameter
 * This is extracted from the page.tsx for testability
 *
 * **Validates: Requirements 1.6, 4.4**
 */
const WeekStartSchema = z
  .string()
  .refine((s) => isValid(parseISO(s)), { message: 'Data inválida' })
  .transform((s) => parseISO(s))
  .refine(
    (d) => startOfWeek(d, { weekStartsOn: 1 }).getTime() === d.getTime(),
    { message: 'A data deve ser uma segunda-feira' },
  );

describe('WeekStart Route Parameter Validation', () => {
  describe('Valid weekStart parameters', () => {
    it('accepts "2025-06-30" (segunda-feira)', () => {
      const result = WeekStartSchema.safeParse('2025-06-30');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.toISOString()).toContain('2025-06-30');
      }
    });

    it('accepts "2025-01-06" (segunda-feira)', () => {
      const result = WeekStartSchema.safeParse('2025-01-06');
      expect(result.success).toBe(true);
      if (result.success) {
        // Verify it's a Monday
        expect(result.data.getDay()).toBe(1);
      }
    });

    it('accepts "2020-02-03" (segunda-feira)', () => {
      const result = WeekStartSchema.safeParse('2020-02-03');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getDay()).toBe(1);
      }
    });
  });

  describe('Invalid weekStart parameters', () => {
    it('rejects "2025-07-01" (terça-feira)', () => {
      const result = WeekStartSchema.safeParse('2025-07-01');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('A data deve ser uma segunda-feira');
      }
    });

    it('rejects "2025-06-29" (domingo)', () => {
      const result = WeekStartSchema.safeParse('2025-06-29');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('A data deve ser uma segunda-feira');
      }
    });

    it('rejects "semana-invalida" (non-ISO string)', () => {
      const result = WeekStartSchema.safeParse('semana-invalida');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Data inválida');
      }
    });

    it('rejects "2025-02-30" (invalid date)', () => {
      const result = WeekStartSchema.safeParse('2025-02-30');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Data inválida');
      }
    });

    it('rejects "2025-13-01" (invalid month)', () => {
      const result = WeekStartSchema.safeParse('2025-13-01');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Data inválida');
      }
    });

    it('rejects "not-a-date" (arbitrary string)', () => {
      const result = WeekStartSchema.safeParse('not-a-date');
      expect(result.success).toBe(false);
    });

    it('rejects empty string', () => {
      const result = WeekStartSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    it('rejects null (non-string)', () => {
      const result = WeekStartSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it('rejects undefined', () => {
      const result = WeekStartSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it('rejects "2025/06/30" (wrong format)', () => {
      const result = WeekStartSchema.safeParse('2025/06/30');
      expect(result.success).toBe(false);
    });

    it('rejects "30-06-2025" (wrong format)', () => {
      const result = WeekStartSchema.safeParse('30-06-2025');
      expect(result.success).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('accepts valid Monday at year start', () => {
      const result = WeekStartSchema.safeParse('2025-01-06');
      expect(result.success).toBe(true);
    });

    it('accepts valid Monday at year end', () => {
      const result = WeekStartSchema.safeParse('2024-12-23');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getDay()).toBe(1);
      }
    });
  });

  describe('Schema transformation correctness', () => {
    it('transforms valid ISO string to Date object', () => {
      const result = WeekStartSchema.safeParse('2025-06-30');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(Date);
      }
    });

    it('parses date correctly (year, month, day)', () => {
      const result = WeekStartSchema.safeParse('2025-06-30');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getFullYear()).toBe(2025);
        expect(result.data.getMonth()).toBe(5); // June is month 5 (0-indexed)
        expect(result.data.getDate()).toBe(30);
      }
    });

    it('preserves date precision through parsing', () => {
      const input = '2025-06-30';
      const result = WeekStartSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        const isoString = result.data.toISOString();
        expect(isoString.substring(0, 10)).toBe(input);
      }
    });
  });
});
