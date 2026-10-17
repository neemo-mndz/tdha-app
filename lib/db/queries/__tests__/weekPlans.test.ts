import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syncWeekPlanTasks } from '../weekPlans';
const mock = vi.hoisted(() => ({ select: vi.fn(), update: vi.fn(), insert: vi.fn(), remove: vi.fn(), batch: vi.fn(), set: vi.fn(), values: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ db: {
  select: mock.select, update: mock.update, insert: mock.insert, delete: mock.remove, batch: mock.batch,
} }));
beforeEach(() => {
  vi.clearAllMocks();
  mock.select.mockReturnValue({ from: () => ({ where: async () => [{ id: 'retained', taskId: 'reading', done: 4, completedDates: ['2026-10-12'] }] }) });
  mock.update.mockReturnValue({ set: mock.set });
  mock.set.mockReturnValue({ where: () => 'update-query' });
  mock.insert.mockReturnValue({ values: mock.values });
  mock.values.mockReturnValue({ onConflictDoUpdate: () => 'insert-query' });
  mock.remove.mockReturnValue({ where: () => 'delete-query' });
});
describe('syncWeekPlanTasks real query function', () => {
  it('only updates the goal of retained tasks, preserving IDs, dates and counters', async () => {
    await syncWeekPlanTasks('plan', [{ taskId: 'reading', goal: 5 }]);
    expect(mock.set).toHaveBeenCalledWith({ goal: 5 });
    expect(mock.remove).not.toHaveBeenCalled();
    expect(mock.insert).not.toHaveBeenCalled();
    expect(mock.batch).toHaveBeenCalledWith(['update-query']);
  });
  it('batches removal and addition together', async () => {
    await syncWeekPlanTasks('plan', [{ taskId: 'movement', goal: 3 }]);
    expect(mock.values).toHaveBeenCalledWith({ weekPlanId: 'plan', taskId: 'movement', goal: 3 });
    expect(mock.batch).toHaveBeenCalledWith(['delete-query', 'insert-query']);
  });
});
