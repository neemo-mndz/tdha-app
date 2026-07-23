import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import fc from 'fast-check';
import { MoodSelector } from '../MoodSelector';
import type { MoodValue } from '@/lib/types/calendar';

// Feature: mood-tracking, Property 3: Optimistic UI highlight invariant
// **Validates: Requirements 2.4, 1.4**

describe('MoodSelector — Property-Based Tests', () => {
  afterEach(() => {
    cleanup();
  });

  // Feature: mood-tracking, Property 3: Optimistic UI highlight invariant
  it('when currentMood is a valid MoodValue, exactly 1 option is active and 4 are dimmed', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<MoodValue>('awful', 'bad', 'neutral', 'good', 'great'),
        (mood) => {
          cleanup();
          const { container } = render(
            <MoodSelector currentMood={mood} onSelect={() => {}} />
          );

          const options = container.querySelectorAll('.mood-selector__option');
          const activeOptions = container.querySelectorAll('.mood-selector__option--active');
          const dimmedOptions = container.querySelectorAll('.mood-selector__option--dimmed');

          expect(options).toHaveLength(5);
          expect(activeOptions).toHaveLength(1);
          expect(dimmedOptions).toHaveLength(4);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: mood-tracking, Property 3: Optimistic UI highlight invariant
  it('when currentMood is null, all 5 options have equal weight (no active, no dimmed)', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          cleanup();
          const { container } = render(
            <MoodSelector currentMood={null} onSelect={() => {}} />
          );

          const options = container.querySelectorAll('.mood-selector__option');
          const activeOptions = container.querySelectorAll('.mood-selector__option--active');
          const dimmedOptions = container.querySelectorAll('.mood-selector__option--dimmed');

          expect(options).toHaveLength(5);
          expect(activeOptions).toHaveLength(0);
          expect(dimmedOptions).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});


// ─── Example-Based Tests ─────────────────────────────────────────────────────
// **Validates: Requirements 1.5, 4.1**

describe('MoodSelector — Example Tests (Accessibility)', () => {
  afterEach(() => {
    cleanup();
  });

  it('has aria-labels in PT-BR for all 5 emoji options', () => {
    render(<MoodSelector currentMood={null} onSelect={() => {}} />);

    const expectedLabels = [
      'Humor: péssimo',
      'Humor: ruim',
      'Humor: neutro',
      'Humor: bom',
      'Humor: ótimo',
    ];

    for (const label of expectedLabels) {
      const button = screen.getByRole('radio', { name: label });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', label);
    }
  });

  it('radiogroup has aria-label "Seletor de humor"', () => {
    render(<MoodSelector currentMood={null} onSelect={() => {}} />);

    const radiogroup = screen.getByRole('radiogroup', { name: 'Seletor de humor' });
    expect(radiogroup).toBeInTheDocument();
  });

  it('active mood has aria-checked=true, others have aria-checked=false', () => {
    render(<MoodSelector currentMood="neutral" onSelect={() => {}} />);

    const neutralButton = screen.getByRole('radio', { name: 'Humor: neutro' });
    expect(neutralButton).toHaveAttribute('aria-checked', 'true');

    const otherButtons = [
      screen.getByRole('radio', { name: 'Humor: péssimo' }),
      screen.getByRole('radio', { name: 'Humor: ruim' }),
      screen.getByRole('radio', { name: 'Humor: bom' }),
      screen.getByRole('radio', { name: 'Humor: ótimo' }),
    ];

    for (const button of otherButtons) {
      expect(button).toHaveAttribute('aria-checked', 'false');
    }
  });
});
