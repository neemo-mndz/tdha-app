import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';

// Mock next/navigation (used by WeekNavigator inside HomeCalendarSection)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock server actions used by the components
vi.mock('@/lib/actions/mood', () => ({
  saveMood: vi.fn(async () => ({ success: true })),
  saveMoodNote: vi.fn(async () => ({ success: true })),
}));

vi.mock('@/lib/actions/logs', () => ({
  createLog: vi.fn(async () => ({ success: true })),
  getLogsForDate: vi.fn(async () => []),
  getMonthStatusAction: vi.fn(async () => []),
}));

vi.mock('@/lib/actions/weekPlans', () => ({
  bumpTask: vi.fn(async () => ({ success: true })),
}));

import { HomeCalendarSection } from "@/components/home/HomeCalendarSection";
import { MoodCard } from "@/components/mood/MoodCard";
import { DailyLogPanel } from "@/components/home/DailyLogPanel";
import { WeeklyTasksPanel } from "@/components/home/WeeklyTasksPanel";
import { TodayLogsCard } from "@/components/home/TodayLogsCard";
import { LogsProvider } from "@/components/home/LogsProvider";
import { InsightPanel } from "@/components/home/InsightPanel";

/**
 * Integration tests for HomePage section order and separation.
 *
 * Since HomePage is an async RSC (Server Component), we test the rendered
 * structure by composing the same client components in the same DOM order
 * that the server renders, then verifying structural invariants.
 *
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.5 */
const TODAY = '2024-07-15';
const WEEK_START = '2024-07-15';

const mockDays = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(2024, 6, 15 + i),
  logCount: 0,
  mood: null,
}));

/**
 * Renders the HomePage layout in the same structure as the actual page.tsx.
 * This mirrors the RSC output without needing to invoke the async server component.
 */
function renderHomePageLayout() {
  return render(
    <div className="shell">
      {/* CONTEXTO */}
      <div className="context-section">
        <HomeCalendarSection
          weekStart={WEEK_START}
          days={mockDays}
        />
      </div>

      {/* AGORA / MEU DIA */}
      <div className="now-section">
        <LogsProvider initialLogs={[]} todayStr={TODAY}>
          <DailyLogPanel activeTasks={[]} />
          <MoodCard
            date={TODAY}
            initialMood={null}
            initialNote={null}
          />
          <TodayLogsCard allUserTags={[]} />
        </LogsProvider>
      </div>

      {/* REFLEXÃO */}
      <div className="reflection-section">
        <InsightPanel date={TODAY} />
      </div>

      {/* ACOMPANHAMENTO */}
      <div className="accompaniment-section">
        <WeeklyTasksPanel
          weekStart={WEEK_START}
          activeTasks={[]}
          allTasks={[]}
        />
      </div>
    </div>
  );
}

describe('HomePage Integration — Section Order and Separation', () => {
  afterEach(() => {
    cleanup();
  });

  // **Validates: Requirements 5.5**
  it('renders sections in correct order: Context → Now/Day → Reflection → Accompaniment', () => {
    renderHomePageLayout();

    // Get identifiable section markers in document order
    // HomeCalendarSection contains the "Ver calendário" toggle button
    const calendarToggle = screen.getByText('Ver calendário');

    // TodayLogsCard renders heading "Registros de hoje" (inside HomeCalendarSection)
    const todayLogsHeading = screen.getByText('Registros de hoje');

    // MoodCard has heading "Humor de hoje"
    const moodHeading = screen.getByText('Humor de hoje');

    // DailyLogPanel has heading "Registro do dia"
    const dailyLogHeading = screen.getByText('Registro do dia');

    // InsightPanel has heading "Insight do dia" (in empty state) or the insight text
    // We'll use the empty state text for now
    const insightHeading = screen.getByText('Como foi seu dia no geral?');

    // WeeklyTasksPanel has heading "Tarefas da semana"
    const weeklyHeading = screen.getByText('Tarefas da semana');

    // Order: Context section (calendar toggle) → Now-section (DailyLogPanel, MoodCard, TodayLogsCard) → Reflection-section (InsightPanel) → Accompaniment-section (WeeklyTasksPanel)
    // Within now-section, the order is: DailyLogPanel → MoodCard → TodayLogsCard

    // 1. Calendar toggle (context-section)
    expect(
      calendarToggle.compareDocumentPosition(dailyLogHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    // 2. DailyLogPanel (now-section, first child)
    expect(
      dailyLogHeading.compareDocumentPosition(moodHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    // 3. MoodCard (now-section, second child)
    expect(
      moodHeading.compareDocumentPosition(todayLogsHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    // 4. TodayLogsCard (now-section, third child)
    expect(
      todayLogsHeading.compareDocumentPosition(insightHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    // 5. InsightPanel (reflection-section)
    expect(
      insightHeading.compareDocumentPosition(weeklyHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    // 6. WeeklyTasksPanel (accompaniment-section)
  });

  // **Validates: Requirements 5.1**
  it('MoodCard and DailyLogPanel are in separate containers', () => {
    const { container } = renderHomePageLayout();

    // MoodCard is rendered as a <section> element
    const moodSection = container.querySelector('section.mood-card');
    expect(moodSection).not.toBeNull();

    // DailyLogPanel is rendered as a div (we find it by its heading and then get its parent element)
    const dailyLogHeading = screen.getByText('Registro do dia');
    const dailyLogPanel = dailyLogHeading.parentElement;
    expect(dailyLogPanel).toBeInstanceOf(HTMLDivElement);

    // They should not be the same element
    expect(moodSection).not.toBe(dailyLogPanel);

    // Additionally, we can check that they are both inside the now-section.
    const nowSection = container.querySelector('div.now-section');
    expect(nowSection).not.toBeNull();
    expect(nowSection.contains(moodSection)).toBeTruthy();
    expect(nowSection.contains(dailyLogPanel)).toBeTruthy();
  });

  // **Validates: Requirements 5.3**
  it('MoodCard does NOT contain a textarea or free-text log input', () => {
    const { container } = renderHomePageLayout();

    // Find the MoodCard section
    const moodSection = container.querySelector('section.mood-card');
    expect(moodSection).not.toBeNull();

    // MoodCard should NOT contain a textarea element
    const textareas = moodSection.querySelectorAll('textarea');
    expect(textareas).toHaveLength(0);

    // MoodCard should NOT contain an input with aria-label "Novo registro do dia"
    const logInput = within(moodSection as HTMLElement).queryByLabelText('Novo registro do dia');
    expect(logInput).toBeNull();
  });

  // **Validates: Requirements 5.2**
  it('DailyLogPanel does NOT contain a mood selector (no radiogroup for mood)', () => {
    const { container } = renderHomePageLayout();

    // Find the DailyLogPanel by its heading
    const dailyLogHeading = screen.getByText('Registro do dia');
    const dailyLogPanel = dailyLogHeading.parentElement;

    // DailyLogPanel should NOT contain a radiogroup (mood selector)
    const radiogroups = dailyLogPanel.querySelectorAll('[role="radiogroup"]');
    expect(radiogroups).toHaveLength(0);

    // DailyLogPanel should NOT contain mood emoji buttons
    const moodButtons = dailyLogPanel.querySelectorAll('[role="radio"]');
    expect(moodButtons).toHaveLength(0);
  });
});