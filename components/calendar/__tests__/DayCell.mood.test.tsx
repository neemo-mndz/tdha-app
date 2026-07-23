// Feature: mood-tracking, Property 11: Mood dot presence and accessibility
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { DayCell } from '../DayCell';
import type { MoodValue } from '@/lib/types/calendar';

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// **Validates: Requirements 6.1, 6.3, 6.6**

describe('DayCell — Property 11: Mood dot presence and accessibility', () => {
  afterEach(() => {
    cleanup();
  });

  const fixedDate = new Date(2025, 6, 1); // July 1, 2025

  const arbValidMood = fc.constantFrom<MoodValue>(
    'awful',
    'bad',
    'neutral',
    'good',
    'great'
  );

  it('renders mood-dot with aria-label for any valid MoodValue', () => {
    fc.assert(
      fc.property(arbValidMood, (mood) => {
        cleanup();
        const { container } = render(
          <DayCell
            date={fixedDate}
            logCount={0}
            mood={mood}
            isToday={false}
            isFuture={false}
          />
        );

        const dot = container.querySelector('.day-cell__mood-dot');
        expect(dot).not.toBeNull();
        expect(dot!.getAttribute('aria-label')).toBe('Humor registrado');
        // Must not contain emoji text (requirement 6.2 — no emoji in calendar)
        expect(dot!.textContent).toBe('');
      }),
      { numRuns: 100 }
    );
  });

  it('does not render mood-dot when mood is null', () => {
    cleanup();
    const { container } = render(
      <DayCell
        date={fixedDate}
        logCount={0}
        mood={null}
        isToday={false}
        isFuture={false}
      />
    );

    const dot = container.querySelector('.day-cell__mood-dot');
    expect(dot).toBeNull();
  });
});


// ─── Example-Based Tests (Task 9.3) ─────────────────────────────────────────
// **Validates: Requirements 6.1, 6.2, 6.3, 6.6**

describe('DayCell — Example Tests: Mood indicator', () => {
  afterEach(() => {
    cleanup();
  });

  const fixedDate = new Date('2024-07-14T12:00:00Z');

  it('does not render mood-dot when mood is null', () => {
    const { container } = render(
      <DayCell
        date={fixedDate}
        logCount={0}
        mood={null}
        isToday={false}
        isFuture={false}
      />
    );

    const moodDot = container.querySelector('.day-cell__mood-dot');
    expect(moodDot).toBeNull();
  });

  it('renders mood-dot with aria-label when mood is a valid MoodValue', () => {
    const { container } = render(
      <DayCell
        date={fixedDate}
        logCount={0}
        mood={'good'}
        isToday={false}
        isFuture={false}
      />
    );

    const moodDot = container.querySelector('.day-cell__mood-dot');
    expect(moodDot).not.toBeNull();
    expect(moodDot!.getAttribute('aria-label')).toBe('Humor registrado');
    // Must not render emoji text (Req 6.2)
    expect(moodDot!.textContent).toBe('');
  });

  it('renders both log-dot and mood-dot simultaneously when mood and logCount > 0', () => {
    const { container } = render(
      <DayCell
        date={fixedDate}
        logCount={3}
        mood={'neutral'}
        isToday={false}
        isFuture={false}
      />
    );

    const logDot = container.querySelector('.day-cell__dot');
    const moodDot = container.querySelector('.day-cell__mood-dot');

    // Both indicators must be rendered
    expect(logDot).not.toBeNull();
    expect(moodDot).not.toBeNull();

    // They must be distinguishable (different elements with different class names)
    expect(logDot).not.toBe(moodDot);
    expect(logDot!.className).not.toBe(moodDot!.className);
  });
});
