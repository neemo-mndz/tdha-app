export interface TaskLibraryItem {
  id: string;
  name: string;
  defaultQty: number;
}

export interface ActiveTaskDisplay {
  weekPlanTaskId: string;
  taskId: string;
  name: string;
  goal: number;
  done: number;
}

export interface WeekPlanSummary {
  weekPlanId: string;
  weekStart: string;
  tasks: ActiveTaskDisplay[];
}
