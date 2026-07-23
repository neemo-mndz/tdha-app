import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getMoodEmoji, getMoodAriaLabel } from '../moodConstants';
import type { MoodValue } from '@/lib/types/calendar';

// Feature: mood-tracking, Property 1: Mood emoji mapping is complete and correct
// **Validates: Requirements 1.1, 1.5**

const EXPECTED_EMOJI: Record<MoodValue, string> = {
  awful: '😞',
  bad: '😕',
  neutral: '🙂',
  good: '😄',
  great: '🤩',
};

const EXPECTED_ARIA_LABEL: Record<MoodValue, string> = {
  awful: 'Humor: péssimo',
  bad: 'Humor: ruim',
  neutral: 'Humor: neutro',
  good: 'Humor: bom',
  great: 'Humor: ótimo',
};

describe('moodConstants — Property-Based Tests', () => {
  // Feature: mood-tracking, Property 1: Mood emoji mapping is complete and correct
  it('getMoodEmoji returns the correct emoji for any valid MoodValue', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<MoodValue>('awful', 'bad', 'neutral', 'good', 'great'),
        (mood) => {
          expect(getMoodEmoji(mood)).toBe(EXPECTED_EMOJI[mood]);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: mood-tracking, Property 1: Mood emoji mapping is complete and correct
  it('getMoodAriaLabel returns the correct PT-BR aria-label for any valid MoodValue', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<MoodValue>('awful', 'bad', 'neutral', 'good', 'great'),
        (mood) => {
          expect(getMoodAriaLabel(mood)).toBe(EXPECTED_ARIA_LABEL[mood]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
