import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeeklyTasksPanel } from '../WeeklyTasksPanel';
import { bumpTask, toggleTaskDay } from '@/lib/actions/weekPlans';
vi.mock('@/lib/actions/weekPlans', () => ({ bumpTask: vi.fn(), toggleTaskDay: vi.fn() }));
vi.mock('../ModalEditarTarefas', () => ({ ModalEditarTarefas: () => null }));
vi.mock('../ModalPlanejarSemana', () => ({ ModalPlanejarSemana: () => null }));
const task = { weekPlanTaskId: 'one', taskId: 'task', name: 'Leitura', done: 1, goal: 3, completedDates: ['2026-10-12'] };
function panel(weekStart = '2026-10-12') {
  return render(<WeeklyTasksPanel weekStart={weekStart} today="2026-10-15" activeTasks={[task]} allTasks={[]} />);
}
beforeEach(() => {
  vi.mocked(toggleTaskDay).mockResolvedValue({ success: true });
  vi.mocked(bumpTask).mockResolvedValue({ success: true });
});
describe('WeeklyTasksPanel rhythm', () => {
  it('shows seven accessible days with future days disabled', () => {
    panel();
    expect(screen.getAllByRole('button', { pressed: false })).toHaveLength(6);
    expect(screen.getByRole('button', { name: /Leitura: SEG/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Leitura: SEX/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Leitura: QUI/ })).toBeEnabled();
  });
  it('sends the selected past date to the action', async () => {
    panel();
    fireEvent.click(screen.getByRole('button', { name: /Leitura: TER/ }));
    await waitFor(() => expect(toggleTaskDay).toHaveBeenCalledWith({ weekPlanTaskId: 'one', date: '2026-10-13' }));
  });
  it('sends today when bumping the current week', async () => {
    panel();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar +1 em Leitura' }));
    await waitFor(() => expect(bumpTask).toHaveBeenCalledWith({ weekPlanTaskId: 'one', todayDate: '2026-10-15' }));
  });
  it('reports failure and rolls back the optimistic marking', async () => {
    vi.mocked(toggleTaskDay).mockResolvedValue({ success: false, error: 'Não autorizado' });
    panel();
    fireEvent.click(screen.getByRole('button', { name: /Leitura: TER/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não autorizado');
    expect(screen.getByRole('button', { name: /Leitura: TER/ })).toHaveAttribute('aria-pressed', 'false');
  });
});
