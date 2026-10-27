import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import HomePage from '../page';
import { createLog, createPastLog } from '@/lib/actions/logs';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }), usePathname: () => '/' }));
vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn(async () => 'user') }));
vi.mock('@/lib/actions/mood', () => ({ saveMood: vi.fn(async () => ({ success: true })), saveMoodNote: vi.fn(async () => ({ success: true })) }));
vi.mock('@/lib/actions/logs', () => ({ createLog: vi.fn(async () => ({ success: true })), createPastLog: vi.fn(async () => ({ success: true, log: { id: 'past-log', dayId: 'day', content: 'Li algumas páginas', createdAt: new Date('2026-10-13T11:30:00Z'), weekPlanTaskId: null, taskName: null, tags: [] } })), getLogsForDate: vi.fn(async () => []), getMonthStatusAction: vi.fn(async () => []) }));
vi.mock('@/lib/actions/weekPlans', () => ({ bumpTask: vi.fn(async () => ({ success: true })), toggleTaskDay: vi.fn(async () => ({ success: true })) }));
vi.mock('@/lib/utils/date', async (original) => ({ ...await original<typeof import('@/lib/utils/date')>(), getBrazilNow: () => new Date(2026, 9, 15, 12) }));
vi.mock('@/lib/db/queries/weeks', () => ({ getWeekStatus: vi.fn(async () => Array.from({length: 7}, (_, i) => ({ date: new Date(2026, 9, 12+i), logCount: 0, mood: null }))) }));
vi.mock('@/lib/db/queries/tasks', () => ({ getUserTasks: vi.fn(async () => []) }));
vi.mock('@/lib/db/queries/weekPlans', () => ({ getWeekPlan: vi.fn(async () => null) }));
vi.mock('@/lib/db/queries/logs', () => ({ getDayLogs: vi.fn(async () => []) }));
vi.mock('@/lib/db/queries/mood', () => ({ getDayMood: vi.fn(async () => ({ mood: null, moodNote: null })) }));
vi.mock('@/lib/db/queries/insights', () => ({ getDayInsight: vi.fn(async () => null) }));
vi.mock('@/lib/db/queries/tags', () => ({ getUserTags: vi.fn(async () => []) }));
vi.mock('@/lib/db/queries/dayThoughts', () => ({ getDayThoughts: vi.fn(async () => []) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('Home — composição do protótipo com recursos existentes', () => {
  it('renders the actual page in calendar → records → rhythm → capture → mood → thoughts order', async () => {
    render(await HomePage());
    const elements = [
      screen.getByRole('region', { name: 'Calendário semanal' }),
      screen.getByText('Registros de hoje'),
      screen.getByRole('heading', { name: 'Tarefas da semana' }),
      screen.getByRole('heading', { name: 'Registrar agora' }),
      screen.getByRole('heading', { name: 'Humor de hoje' }),
      screen.getByRole('heading', { name: 'Insight diário' }),
    ];
    for (let i=1; i<elements.length; i++) expect(elements[i-1].compareDocumentPosition(elements[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('keeps mood and capture in separate panels', async () => {
    const { container } = render(await HomePage());
    const mood = container.querySelector('.mood-card')!;
    const capture = container.querySelector('.daily-log-panel')!;
    expect(mood).not.toBe(capture);
    expect(mood.querySelector('textarea')).toBeNull();
    expect(capture.querySelector('[role="radiogroup"]')).toBeNull();
  });
  it('saves on the selected past date and Today restores the capture date', async () => {
    render(await HomePage());
    const calendar = screen.getByRole('region', { name: 'Calendário semanal' });
    fireEvent.click(within(calendar).getByRole('link', { name: /ter.*13/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Adicionar atividade' }));
    fireEvent.change(screen.getByLabelText('Atividade'), { target: { value: 'Li algumas páginas' } });
    fireEvent.change(screen.getByLabelText('Horário'), { target: { value: '08:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(createPastLog).toHaveBeenCalledWith(expect.objectContaining({ content: 'Li algumas páginas', date: '2026-10-13', time: '08:30' })));
    await screen.findByText('Li algumas páginas');
    fireEvent.click(screen.getByRole('button', { name: 'Voltar para semana atual' }));
    await waitFor(() => expect(screen.getByText(/Anote algo rápido sobre qui/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Novo registro do dia'), { target: { value: 'Voltei hoje' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar registro' }));
    await waitFor(() => expect(createLog).toHaveBeenCalledWith({ content: 'Voltei hoje', date: '2026-10-15', weekPlanTaskId: null }));
  });
});
