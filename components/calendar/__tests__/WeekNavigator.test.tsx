import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { WeekNavigator } from '../WeekNavigator';
import type { WeekNavigatorProps } from '../WeekNavigator';
import { addWeeks, subWeeks, differenceInDays } from 'date-fns';
import { currentWeekStart, weekPath, weekLabel } from '@/lib/utils/date';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

function renderWeekNavigator(overrides: Partial<WeekNavigatorProps> = {}) {
  const today = new Date(2025, 6, 2); // July 2, 2025 (Wednesday)
  const defaultProps: WeekNavigatorProps = {
    weekStart: currentWeekStart(today), // Monday June 30, 2025
    today,
  };
  return render(<WeekNavigator {...defaultProps} {...overrides} />);
}

describe('WeekNavigator', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('Week label', () => {
    it('displays the week label for the current weekStart', () => {
      const weekStart = new Date(2025, 5, 30); // June 30, 2025 (Monday)
      renderWeekNavigator({ weekStart });
      expect(screen.getByText(weekLabel(weekStart))).toBeInTheDocument();
    });
  });

  describe('Previous week navigation', () => {
    it('renders a "semana anterior" button', () => {
      renderWeekNavigator();
      expect(screen.getByLabelText('Semana anterior')).toBeInTheDocument();
    });

    it('navigates to previous week on click using router.push', () => {
      const weekStart = new Date(2025, 5, 30); // June 30 (Monday)
      const today = new Date(2025, 6, 2);
      renderWeekNavigator({ weekStart, today });

      fireEvent.click(screen.getByLabelText('Semana anterior'));

      const expectedPath = weekPath(subWeeks(weekStart, 1));
      expect(mockPush).toHaveBeenCalledWith(expectedPath);
    });
  });

  describe('Next week navigation', () => {
    it('renders a "próxima semana" button', () => {
      renderWeekNavigator();
      expect(screen.getByLabelText('Próxima semana')).toBeInTheDocument();
    });

    it('navigates to next week on click using router.push', () => {
      const weekStart = new Date(2025, 5, 30); // June 30 (Monday)
      const today = new Date(2025, 6, 2);
      renderWeekNavigator({ weekStart, today });

      fireEvent.click(screen.getByLabelText('Próxima semana'));

      const expectedPath = weekPath(addWeeks(weekStart, 1));
      expect(mockPush).toHaveBeenCalledWith(expectedPath);
    });
  });

  describe('"Hoje" button visibility', () => {
    it('does NOT render "hoje" button when viewing current week', () => {
      const today = new Date(2025, 6, 2); // Wednesday July 2
      const weekStart = currentWeekStart(today); // Monday June 30
      renderWeekNavigator({ weekStart, today });

      expect(screen.queryByLabelText('Voltar para semana atual')).not.toBeInTheDocument();
    });

    it('renders "hoje" button when viewing a different week', () => {
      const today = new Date(2025, 6, 2);
      const weekStart = new Date(2025, 5, 23); // June 23 (previous week Monday)
      renderWeekNavigator({ weekStart, today });

      expect(screen.getByLabelText('Voltar para semana atual')).toBeInTheDocument();
    });

    it('"hoje" button navigates to "/" using router.push', () => {
      const today = new Date(2025, 6, 2);
      const weekStart = new Date(2025, 5, 23); // previous week
      renderWeekNavigator({ weekStart, today });

      fireEvent.click(screen.getByLabelText('Voltar para semana atual'));

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('Accessibility', () => {
    it('renders as a nav element with aria-label', () => {
      renderWeekNavigator();
      const nav = screen.getByRole('navigation', { name: 'Navegação de semanas' });
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Uses router.push (not replace) for history stacking', () => {
    it('previous week uses push', () => {
      const today = new Date(2025, 6, 2);
      const weekStart = currentWeekStart(today);
      renderWeekNavigator({ weekStart, today });

      fireEvent.click(screen.getByLabelText('Semana anterior'));
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('next week uses push', () => {
      const today = new Date(2025, 6, 2);
      const weekStart = currentWeekStart(today);
      renderWeekNavigator({ weekStart, today });

      fireEvent.click(screen.getByLabelText('Próxima semana'));
      expect(mockPush).toHaveBeenCalledTimes(1);
    });
  });
});


// ─── Property-Based Tests ────────────────────────────────────────────────────
import fc from 'fast-check';

// Gera um weekStart arbitrário (sempre segunda-feira, normalizado a meia-noite)
const arbWeekStart = fc
  .date({ min: new Date('2015-01-06'), max: new Date('2035-12-29') })
  .map(d => currentWeekStart(d))
  .filter(d => !isNaN(d.getTime()));

// Gera uma data "today" arbitrária
const arbToday = fc
  .date({ min: new Date('2015-01-06'), max: new Date('2035-12-29') })
  .filter(d => !isNaN(d.getTime()));

describe('WeekNavigator — Property-Based Tests', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  // Feature: weekly-calendar, Property 3: Controle "voltar à semana atual" aparece se e somente se a semana exibida não é a atual
  // **Validates: Requirements 1.5**
  it('today button appears if and only if weekStart !== currentWeekStart(today)', () => {
    fc.assert(
      fc.property(arbWeekStart, arbToday, (weekStart, today) => {
        cleanup();
        const { container } = render(<WeekNavigator weekStart={weekStart} today={today} />);

        const todayBtn = container.querySelector('.week-navigator__btn--today');
        const isOnCurrentWeek = currentWeekStart(today).getTime() === weekStart.getTime();

        if (isOnCurrentWeek) {
          expect(todayBtn).toBeNull();
        } else {
          expect(todayBtn).not.toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  // Feature: weekly-calendar, Property 4: Navegação prev/next move a semana em exatamente ±7 dias
  // **Validates: Requirements 2.1**
  it('prev/next navigation moves week by exactly ±7 days', () => {
    fc.assert(
      fc.property(arbWeekStart, arbToday, (weekStart, today) => {
        cleanup();
        mockPush.mockClear();

        render(<WeekNavigator weekStart={weekStart} today={today} />);

        // Test previous week
        fireEvent.click(screen.getByLabelText('Semana anterior'));
        const prevTarget = weekPath(subWeeks(weekStart, 1));
        expect(mockPush).toHaveBeenCalledWith(prevTarget);

        // Verify it's exactly -7 days (using differenceInDays to handle DST)
        const prevWeekStart = subWeeks(weekStart, 1);
        expect(differenceInDays(weekStart, prevWeekStart)).toBe(7);

        // Test next week
        mockPush.mockClear();
        fireEvent.click(screen.getByLabelText('Próxima semana'));
        const nextTarget = weekPath(addWeeks(weekStart, 1));
        expect(mockPush).toHaveBeenCalledWith(nextTarget);

        // Verify it's exactly +7 days (using differenceInDays to handle DST)
        const nextWeekStart = addWeeks(weekStart, 1);
        expect(differenceInDays(nextWeekStart, weekStart)).toBe(7);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Example Tests for Task 4.3 ──────────────────────────────────────────────
describe('WeekNavigator — Example Tests', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  // Feature: weekly-calendar, Task 4.3: Testes de exemplo para WeekNavigator
  // **Validates: Requirements 1.5**
  describe('Hoje button visibility — example tests', () => {
    it('current week → "hoje" button is NOT present in DOM', () => {
      const today = new Date(2025, 6, 2); // Wednesday July 2
      const weekStart = currentWeekStart(today); // Monday June 30

      renderWeekNavigator({ weekStart, today });

      const todayBtn = screen.queryByLabelText('Voltar para semana atual');
      expect(todayBtn).not.toBeInTheDocument();
    });

    it('different week → "hoje" button IS present in DOM and points to /', () => {
      const today = new Date(2025, 6, 2); // Wednesday July 2
      const weekStart = new Date(2025, 5, 23); // June 23 (previous week Monday)

      renderWeekNavigator({ weekStart, today });

      const todayBtn = screen.getByLabelText('Voltar para semana atual');
      expect(todayBtn).toBeInTheDocument();

      fireEvent.click(todayBtn);

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});
