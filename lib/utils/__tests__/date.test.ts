import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { addWeeks, subWeeks, parseISO } from 'date-fns';
import { currentWeekStart, formatWeekParam } from '../date';

// Generator: produces valid weekStart dates (always a Monday)
const arbWeekStart = fc
  .date({ min: new Date('2015-01-01'), max: new Date('2035-12-31') })
  .filter((d) => !isNaN(d.getTime()))
  .map((d) => currentWeekStart(d));

describe('Date helpers - Property-Based Tests', () => {
  // Feature: weekly-calendar, Property 4: Navegação prev/next move a semana em exatamente ±7 dias
  // **Validates: Requirements 2.1**
  it('Property 4: prev/next week navigation moves by exactly ±7 days', () => {
    fc.assert(
      fc.property(arbWeekStart, (weekStart) => {
        const prevWeek = subWeeks(weekStart, 1);
        const nextWeek = addWeeks(weekStart, 1);

        // Compare calendar days to avoid DST millisecond drift
        const diffPrevDays = Math.round(
          (weekStart.getTime() - prevWeek.getTime()) / (1000 * 60 * 60 * 24)
        );
        const diffNextDays = Math.round(
          (nextWeek.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
        );

        expect(diffPrevDays).toBe(7);
        expect(diffNextDays).toBe(7);

        // All results must also be Mondays
        expect(prevWeek.getDay()).toBe(1);
        expect(nextWeek.getDay()).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: weekly-calendar, Property 5: Round-trip URL ↔ weekStart
  // **Validates: Requirements 2.2**
  it('Property 5: round-trip formatWeekParam → parseISO produces the same date', () => {
    fc.assert(
      fc.property(arbWeekStart, (weekStart) => {
        const param = formatWeekParam(weekStart);
        const parsed = parseISO(param);

        expect(parsed.getFullYear()).toBe(weekStart.getFullYear());
        expect(parsed.getMonth()).toBe(weekStart.getMonth());
        expect(parsed.getDate()).toBe(weekStart.getDate());
      }),
      { numRuns: 100 }
    );
  });
});

describe('Date helpers - Example Tests', () => {
  // **Validates: Requirements 1.4**
  describe('currentWeekStart returns Monday for any day of the week', () => {
    // Week of 2025-06-30 (Monday) to 2025-07-06 (Sunday)
    const expectedMonday = new Date(2025, 5, 30); // June 30, 2025 (Monday)

    it('given a Monday, returns the same Monday', () => {
      const monday = new Date(2025, 5, 30); // June 30, 2025
      const result = currentWeekStart(monday);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5); // June
      expect(result.getDate()).toBe(30);
      expect(result.getDay()).toBe(1); // Monday
    });

    it('given a Tuesday, returns the previous Monday', () => {
      const tuesday = new Date(2025, 6, 1); // July 1, 2025
      const result = currentWeekStart(tuesday);
      expect(result.getFullYear()).toBe(expectedMonday.getFullYear());
      expect(result.getMonth()).toBe(expectedMonday.getMonth());
      expect(result.getDate()).toBe(expectedMonday.getDate());
      expect(result.getDay()).toBe(1);
    });

    it('given a Wednesday, returns the previous Monday', () => {
      const wednesday = new Date(2025, 6, 2); // July 2, 2025
      const result = currentWeekStart(wednesday);
      expect(result.getFullYear()).toBe(expectedMonday.getFullYear());
      expect(result.getMonth()).toBe(expectedMonday.getMonth());
      expect(result.getDate()).toBe(expectedMonday.getDate());
      expect(result.getDay()).toBe(1);
    });

    it('given a Thursday, returns the previous Monday', () => {
      const thursday = new Date(2025, 6, 3); // July 3, 2025
      const result = currentWeekStart(thursday);
      expect(result.getFullYear()).toBe(expectedMonday.getFullYear());
      expect(result.getMonth()).toBe(expectedMonday.getMonth());
      expect(result.getDate()).toBe(expectedMonday.getDate());
      expect(result.getDay()).toBe(1);
    });

    it('given a Friday, returns the previous Monday', () => {
      const friday = new Date(2025, 6, 4); // July 4, 2025
      const result = currentWeekStart(friday);
      expect(result.getFullYear()).toBe(expectedMonday.getFullYear());
      expect(result.getMonth()).toBe(expectedMonday.getMonth());
      expect(result.getDate()).toBe(expectedMonday.getDate());
      expect(result.getDay()).toBe(1);
    });

    it('given a Saturday, returns the previous Monday', () => {
      const saturday = new Date(2025, 6, 5); // July 5, 2025
      const result = currentWeekStart(saturday);
      expect(result.getFullYear()).toBe(expectedMonday.getFullYear());
      expect(result.getMonth()).toBe(expectedMonday.getMonth());
      expect(result.getDate()).toBe(expectedMonday.getDate());
      expect(result.getDay()).toBe(1);
    });

    it('given a Sunday, returns the previous Monday', () => {
      const sunday = new Date(2025, 6, 6); // July 6, 2025
      const result = currentWeekStart(sunday);
      expect(result.getFullYear()).toBe(expectedMonday.getFullYear());
      expect(result.getMonth()).toBe(expectedMonday.getMonth());
      expect(result.getDate()).toBe(expectedMonday.getDate());
      expect(result.getDay()).toBe(1);
    });
  });
});
