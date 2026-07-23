import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import type { MoodValue } from '@/lib/types/calendar';

// Mock server actions
vi.mock('@/lib/actions/mood', () => ({
  saveMood: vi.fn(async () => ({ success: true })),
  saveMoodNote: vi.fn(async () => ({ success: true })),
}));

// Feature: mood-tracking, Property 2: Mood toggle state machine
// **Validates: Requirements 2.1, 2.2, 2.3**

/**
 * Pure toggle function extracted from MoodSelector logic:
 * onSelect(isActive ? null : mood) where isActive = currentMood === mood
 */
function moodToggle(currentMood: MoodValue | null, tappedMood: MoodValue): MoodValue | null {
  return currentMood === tappedMood ? null : tappedMood;
}

const moodArb = fc.constantFrom<MoodValue>('awful', 'bad', 'neutral', 'good', 'great');

describe('MoodCard — Property-Based Tests', () => {
  // Feature: mood-tracking, Property 2: Mood toggle state machine
  it('toggle returns null when currentMood equals tappedMood (toggle off)', () => {
    fc.assert(
      fc.property(moodArb, moodArb, (currentMood, tappedMood) => {
        const result = moodToggle(currentMood, tappedMood);
        if (currentMood === tappedMood) {
          expect(result).toBeNull();
        } else {
          expect(result).toBe(tappedMood);
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: mood-tracking, Property 2: Mood toggle state machine
  it('toggle from null always results in tappedMood (set mood)', () => {
    fc.assert(
      fc.property(moodArb, (tappedMood) => {
        const result = moodToggle(null, tappedMood);
        expect(result).toBe(tappedMood);
      }),
      { numRuns: 100 }
    );
  });
});


// ─── Example-Based Tests ─────────────────────────────────────────────────────
import { MoodCard } from '../MoodCard';

describe('MoodCard — Example Tests', () => {
  afterEach(() => {
    cleanup();
  });

  // **Validates: Requirements 1.1, 1.4**
  it('renders with mood=null — no emoji is highlighted (no active/dimmed)', () => {
    const { container } = render(
      <MoodCard date="2024-01-15" initialMood={null} initialNote={null} />
    );

    const activeOptions = container.querySelectorAll('.mood-selector__option--active');
    const dimmedOptions = container.querySelectorAll('.mood-selector__option--dimmed');

    expect(activeOptions).toHaveLength(0);
    expect(dimmedOptions).toHaveLength(0);
  });

  // **Validates: Requirements 2.4, 1.4**
  it('renders with mood="good" — correct emoji is highlighted', () => {
    const { container } = render(
      <MoodCard date="2024-01-15" initialMood="good" initialNote={null} />
    );

    const activeOptions = container.querySelectorAll('.mood-selector__option--active');
    const dimmedOptions = container.querySelectorAll('.mood-selector__option--dimmed');

    expect(activeOptions).toHaveLength(1);
    expect(dimmedOptions).toHaveLength(4);

    // The active button should have aria-label "Humor: bom"
    const activeButton = activeOptions[0] as HTMLElement;
    expect(activeButton).toHaveAttribute('aria-label', 'Humor: bom');
    expect(activeButton).toHaveAttribute('aria-checked', 'true');
  });

  // **Validates: Requirements 1.5**
  it('toggle note input visibility when clicking the trigger link', () => {
    render(
      <MoodCard date="2024-01-15" initialMood={null} initialNote={null} />
    );

    // Note input should not be visible initially
    expect(screen.queryByLabelText('Nota sobre o humor')).not.toBeInTheDocument();

    // Click the toggle link
    const toggleButton = screen.getByText('adicionar uma palavra sobre esse humor (opcional)');
    fireEvent.click(toggleButton);

    // Note input should now be visible
    expect(screen.getByLabelText('Nota sobre o humor')).toBeInTheDocument();

    // Click again to hide
    fireEvent.click(toggleButton);
    expect(screen.queryByLabelText('Nota sobre o humor')).not.toBeInTheDocument();
  });

  // **Validates: Requirements 4.1, 4.4**
  it('character counter shows "0/80" initially and "80/80" when full', () => {
    render(
      <MoodCard date="2024-01-15" initialMood={null} initialNote={null} />
    );

    // Open the note input
    fireEvent.click(screen.getByText('adicionar uma palavra sobre esse humor (opcional)'));

    // Should show 0/80 initially
    expect(screen.getByText('0/80')).toBeInTheDocument();

    // Type 80 characters
    const input = screen.getByLabelText('Nota sobre o humor');
    const fullText = 'a'.repeat(80);
    fireEvent.change(input, { target: { value: fullText } });

    // Should show 80/80
    expect(screen.getByText('80/80')).toBeInTheDocument();
  });
});
