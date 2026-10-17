import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { toggleTaskDay, bumpTask, saveWeekPlan } from '../weekPlans';
import { getCurrentUserId } from '@/lib/auth';
import { getWeekPlanTaskOwner, toggleWeekPlanTaskDay, bumpWeekPlanTask, syncWeekPlanTasks, upsertWeekPlan } from '@/lib/db/queries/weekPlans';
import { getTaskOwner } from '@/lib/db/queries/tasks';
import { revalidatePath } from 'next/cache';
vi.mock('@/lib/auth', () => ({ getCurrentUserId: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/db/queries/tasks', () => ({ getTaskOwner: vi.fn() }));
vi.mock('@/lib/db/queries/weekPlans', () => ({
  getWeekPlanTaskOwner: vi.fn(), toggleWeekPlanTaskDay: vi.fn(), bumpWeekPlanTask: vi.fn(),
  upsertWeekPlan: vi.fn(), syncWeekPlanTasks: vi.fn(),
}));
const id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-15T15:00:00Z'));
  vi.mocked(getCurrentUserId).mockResolvedValue('user');
  vi.mocked(getWeekPlanTaskOwner).mockResolvedValue({ userId: 'user', weekStart: '2026-10-12' });
});
afterEach(() => vi.useRealTimers());
describe('week plan server actions', () => {
  it('toggles an owned past day and revalidates home and week', async () => {
    expect(await toggleTaskDay({ weekPlanTaskId: id, date: '2026-10-13' })).toEqual({ success: true });
    expect(toggleWeekPlanTaskDay).toHaveBeenCalledWith(id, '2026-10-13');
    expect(revalidatePath).toHaveBeenCalledWith('/');
    expect(revalidatePath).toHaveBeenCalledWith('/week/[weekStart]', 'page');
  });
  it.each(['2026-10-16', '2026-10-11', '2026-10-19', '2026-02-30'])( 'rejects disallowed date %s before writing', async (date) => {
    expect((await toggleTaskDay({ weekPlanTaskId: id, date })).success).toBe(false);
    expect(toggleWeekPlanTaskDay).not.toHaveBeenCalled();
  });
  it('rejects another user task', async () => {
    vi.mocked(getWeekPlanTaskOwner).mockResolvedValue({ userId: 'other', weekStart: '2026-10-12' });
    expect((await toggleTaskDay({ weekPlanTaskId: id, date: '2026-10-13' })).success).toBe(false);
    expect(toggleWeekPlanTaskDay).not.toHaveBeenCalled();
  });
  it('bump passes today to the atomic update', async () => {
    expect((await bumpTask({ weekPlanTaskId: id, todayDate: '2026-10-15' })).success).toBe(true);
    expect(bumpWeekPlanTask).toHaveBeenCalledWith(id, '2026-10-15');
  });
  it('prevents adding someone else task to a plan', async () => {
    vi.mocked(getTaskOwner).mockResolvedValue({ userId: 'other' });
    expect((await saveWeekPlan({ weekStart: '2026-10-12', tasks: [{ taskId: id, goal: 3 }] })).success).toBe(false);
    expect(upsertWeekPlan).not.toHaveBeenCalled();
    expect(syncWeekPlanTasks).not.toHaveBeenCalled();
  });
});
