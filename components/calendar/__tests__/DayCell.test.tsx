import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayCell } from '../DayCell';
import type { DayCellProps } from '../DayCell';
import type { MoodValue } from '@/lib/types/calendar';

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

function renderDayCell(overrides: Partial<DayCellProps> = {}) {
  const defaultProps: DayCellProps = {
    date: new Date(2025, 6, 2), // July 2, 2025
    logCount: 0,
    mood: null,
    isToday: false,
    isFuture: false,
  };
  return render(<DayCell {...defaultProps} {...overrides} />);
}

describe('DayCell', () => {
  describe('Link rendering', () => {
    it('renders as a link with href /day/YYYY-MM-DD', () => {
      renderDayCell({ date: new Date(2025, 6, 2) });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/day/2025-07-02');
    });

    it('renders link for future dates without aria-disabled', () => {
      renderDayCell({ date: new Date(2030, 0, 15), isFuture: true });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/day/2030-01-15');
      expect(link).not.toHaveAttribute('aria-disabled');
    });
  });

  describe('isToday highlighting', () => {
    it('applies aria-current="date" when isToday is true', () => {
      renderDayCell({ isToday: true });
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-current', 'date');
    });

    it('does not apply aria-current when isToday is false', () => {
      renderDayCell({ isToday: false });
      const link = screen.getByRole('link');
      expect(link).not.toHaveAttribute('aria-current');
    });

    it('applies today style class when isToday is true', () => {
      renderDayCell({ isToday: true });
      const link = screen.getByRole('link');
      expect(link.className).toContain('day-cell--today');
    });
  });

  describe('Log indicator', () => {
    it('renders log indicator when logCount > 0', () => {
      renderDayCell({ logCount: 3 });
      expect(screen.getByLabelText('tem registros')).toBeInTheDocument();
    });

    it('does not render log indicator when logCount is 0', () => {
      renderDayCell({ logCount: 0 });
      expect(screen.queryByLabelText('tem registros')).not.toBeInTheDocument();
    });
  });

  describe('Mood indicator', () => {
    it('renders mood indicator when mood is not null', () => {
      renderDayCell({ mood: 'great' });
      expect(screen.getByLabelText('humor: great')).toBeInTheDocument();
    });

    it('does not render mood indicator when mood is null', () => {
      renderDayCell({ mood: null });
      expect(screen.queryByLabelText(/humor:/)).not.toBeInTheDocument();
    });

    it.each(['great', 'good', 'neutral', 'bad', 'awful'] as MoodValue[])(
      'renders mood indicator with data-mood="%s"',
      (moodValue) => {
        renderDayCell({ mood: moodValue });
        const indicator = screen.getByLabelText(`humor: ${moodValue}`);
        expect(indicator).toHaveAttribute('data-mood', moodValue);
      }
    );
  });

  describe('Log count display', () => {
    it('displays logCount as number', () => {
      renderDayCell({ logCount: 5 });
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays "99+" for logCount >= 100', () => {
      renderDayCell({ logCount: 100 });
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('displays "99+" for logCount = 150', () => {
      renderDayCell({ logCount: 150 });
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('displays "99" for logCount = 99', () => {
      renderDayCell({ logCount: 99 });
      expect(screen.getByText('99')).toBeInTheDocument();
    });

    it('displays "0" for logCount = 0', () => {
      renderDayCell({ logCount: 0 });
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('No guilt metrics', () => {
    it('does not render streak counters or guilt messages', () => {
      const { container } = renderDayCell({ logCount: 0, mood: null });
      const text = container.textContent || '';
      expect(text).not.toMatch(/streak/i);
      expect(text).not.toMatch(/dias sem/i);
      expect(text).not.toMatch(/consecutiv/i);
    });
  });
});


// ─── Property-Based Tests ────────────────────────────────────────────────────
import fc from 'fast-check';
import { cleanup } from '@testing-library/react';
import { addDays } from 'date-fns';
import { currentWeekStart, formatDateParam } from '@/lib/utils/date';

// Gera um weekStart arbitrário (sempre segunda-feira, sempre válido)
const arbWeekStart = fc
  .date({ min: new Date('2015-01-01'), max: new Date('2035-12-31') })
  .filter(d => !isNaN(d.getTime()))
  .map(d => currentWeekStart(d));

// Gera DayCellProps com valores aleatórios
const arbDayCellProps = fc.record({
  date: arbWeekStart.chain(ws =>
    fc.integer({ min: 0, max: 6 }).map(n => addDays(ws, n))
  ).filter(d => !isNaN(d.getTime())),
  logCount: fc.nat({ max: 50 }),
  mood: fc.option(fc.constantFrom('great' as const, 'good' as const, 'neutral' as const, 'bad' as const, 'awful' as const), { nil: null }),
  isToday: fc.boolean(),
  isFuture: fc.boolean(),
});

describe('DayCell — Property-Based Tests', () => {
  afterEach(() => {
    cleanup();
  });

  // Feature: weekly-calendar, Property 7: Indicador de presença de log aparece se e somente se logCount > 0
  // **Validates: Requirements 3.1**
  it('log indicator appears if and only if logCount > 0', () => {
    fc.assert(
      fc.property(arbDayCellProps, (props) => {
        cleanup();
        const { container } = render(<DayCell {...props} />);
        const indicator = container.querySelector('.day-cell__log-indicator');

        if (props.logCount > 0) {
          expect(indicator).not.toBeNull();
        } else {
          expect(indicator).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: weekly-calendar, Property 8: Indicador de humor aparece se e somente se mood não é null
  // **Validates: Requirements 3.2**
  it('mood indicator appears if and only if mood is not null', () => {
    fc.assert(
      fc.property(arbDayCellProps, (props) => {
        cleanup();
        const { container } = render(<DayCell {...props} />);
        const indicator = container.querySelector('.day-cell__mood-indicator');

        if (props.mood !== null) {
          expect(indicator).not.toBeNull();
          expect(indicator!.getAttribute('data-mood')).toBe(props.mood);
        } else {
          expect(indicator).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: weekly-calendar, Property 9: Contagem de logs exibida corretamente
  // **Validates: Requirements 3.3**
  it('log count is displayed correctly (capped at 99+)', () => {
    const arbDayCellPropsWithHighCount = fc.record({
      date: arbWeekStart.chain(ws =>
        fc.integer({ min: 0, max: 6 }).map(n => addDays(ws, n))
      ).filter(d => !isNaN(d.getTime())),
      logCount: fc.nat({ max: 200 }),
      mood: fc.option(fc.constantFrom('great' as const, 'good' as const, 'neutral' as const, 'bad' as const, 'awful' as const), { nil: null }),
      isToday: fc.boolean(),
      isFuture: fc.boolean(),
    });

    fc.assert(
      fc.property(arbDayCellPropsWithHighCount, (props) => {
        cleanup();
        const { container } = render(<DayCell {...props} />);
        const countEl = container.querySelector('.day-cell__log-count');
        expect(countEl).not.toBeNull();

        const expectedText = props.logCount >= 100 ? '99+' : String(props.logCount);
        expect(countEl!.textContent).toBe(expectedText);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: weekly-calendar, Property 10: DayCell sempre renderiza link para /day/[date]
  // **Validates: Requirements 4.1**
  it('always renders a link with href /day/[date]', () => {
    fc.assert(
      fc.property(arbDayCellProps, (props) => {
        cleanup();
        const { container } = render(<DayCell {...props} />);
        const link = container.querySelector('a');
        expect(link).not.toBeNull();
        const expectedHref = `/day/${formatDateParam(props.date)}`;
        expect(link!.getAttribute('href')).toBe(expectedHref);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: weekly-calendar, Property 11: Dias futuros são navegáveis (não bloqueados)
  // **Validates: Requirements 4.3**
  it('future days are navigable (not blocked)', () => {
    const arbFutureDayCellProps = fc.record({
      date: arbWeekStart.chain(ws =>
        fc.integer({ min: 0, max: 6 }).map(n => addDays(ws, n))
      ).filter(d => !isNaN(d.getTime())),
      logCount: fc.nat({ max: 50 }),
      mood: fc.option(fc.constantFrom('great' as const, 'good' as const, 'neutral' as const, 'bad' as const, 'awful' as const), { nil: null }),
      isToday: fc.boolean(),
      isFuture: fc.constant(true),
    });

    fc.assert(
      fc.property(arbFutureDayCellProps, (props) => {
        cleanup();
        const { container } = render(<DayCell {...props} />);
        const link = container.querySelector('a');

        // Link must exist and be navigable
        expect(link).not.toBeNull();
        expect(link!.getAttribute('href')).toBeTruthy();
        expect(link!.getAttribute('aria-disabled')).not.toBe('true');
        // Should not have pointer-events: none inline style
        expect(link!.style.pointerEvents).not.toBe('none');
      }),
      { numRuns: 100 }
    );
  });
});
