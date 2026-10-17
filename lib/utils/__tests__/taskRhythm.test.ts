import { describe, expect, it } from 'vitest';
import { rhythmReducer, isDateInWeek } from '../taskRhythm';
import { toggleTaskDaySchema } from '@/lib/validation/weekPlan.schema';
import type { ActiveTaskDisplay } from '@/lib/types/tasks';

const task: ActiveTaskDisplay = { weekPlanTaskId: 'one', taskId: 'task', name: 'Leitura', goal: 3, done: 4, completedDates: ['2026-10-12'] };
describe('Ritmo semanal', () => {
  it('marks and unmarks a day without losing extra counts', () => {
    const marked = rhythmReducer([task], { type: 'toggleDay', weekPlanTaskId: 'one', date: '2026-10-13' });
    expect(marked[0]).toMatchObject({ done: 5, completedDates: ['2026-10-12', '2026-10-13'] });
    expect(rhythmReducer(marked, { type: 'toggleDay', weekPlanTaskId: 'one', date: '2026-10-13' })[0]).toEqual(task);
  });
  it('bump marks today once and continues counting extras', () => {
    const action = { type: 'bump', weekPlanTaskId: 'one', today: '2026-10-13' } as const;
    const result = rhythmReducer(rhythmReducer([task], action), action)[0];
    expect(result.done).toBe(6);
    expect(result.completedDates).toEqual(['2026-10-12', '2026-10-13']);
  });
  it('never makes done negative', () => {
    expect(rhythmReducer([{ ...task, done: 0 }], { type: 'toggleDay', weekPlanTaskId: 'one', date: '2026-10-12' })[0].done).toBe(0);
  });
  it('checks week boundaries across year changes', () => {
    expect(isDateInWeek('2027-01-03', '2026-12-28')).toBe(true);
    expect(isDateInWeek('2027-01-04', '2026-12-28')).toBe(false);
    expect(isDateInWeek('2026-12-27', '2026-12-28')).toBe(false);
  });
  it('rejects dates that match the format but do not exist', () => {
    expect(toggleTaskDaySchema.safeParse({ weekPlanTaskId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', date: '2026-02-30' }).success).toBe(false);
  });
});
