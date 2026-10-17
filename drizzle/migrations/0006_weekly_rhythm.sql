ALTER TABLE week_plan_tasks ADD COLUMN IF NOT EXISTS completed_dates text[] NOT NULL DEFAULT '{}';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS week_plan_tasks_week_plan_id_task_id_unique ON week_plan_tasks (week_plan_id, task_id);
--> statement-breakpoint
UPDATE week_plan_tasks wpt SET
    completed_dates = ARRAY(SELECT DISTINCT d FROM unnest(wpt.completed_dates || source.dates) d ORDER BY d),
    done = GREATEST(wpt.done, cardinality(ARRAY(SELECT DISTINCT d FROM unnest(wpt.completed_dates || source.dates) d)))
    FROM (
      SELECT l.week_plan_task_id AS id, array_agg(DISTINCT d.date::text) AS dates
      FROM logs l JOIN days d ON d.id = l.day_id
      JOIN week_plan_tasks t ON t.id = l.week_plan_task_id
      JOIN week_plans p ON p.id = t.week_plan_id
      WHERE d.user_id = p.user_id AND d.date BETWEEN p.week_start AND p.week_start + 6
      GROUP BY l.week_plan_task_id
    ) source WHERE wpt.id = source.id;
