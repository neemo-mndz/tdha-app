import {
  pgTable,
  uuid,
  date,
  text,
  timestamp,
  integer,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * Tabela users — usuários do aplicativo
 * Referenciada por days via user_id
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Tabela days — agrupa logs por usuário e data
 * Tem unique constraint em (user_id, date) para suportar padrão upsertDay
 * sem race condition em ambiente serverless
 */
export const days = pgTable(
  "days",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userDateUnique: uniqueIndex("days_user_id_date_unique").on(
      table.userId,
      table.date
    ),
  })
);

/**
 * Tabela tasks — biblioteca de tarefas recorrentes do usuário
 */
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  defaultQty: integer("default_qty").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Tabela week_plans — plano semanal por usuário
 * Unique constraint em (userId, weekStart)
 */
export const weekPlans = pgTable(
  "week_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekStart: date("week_start").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userWeekUnique: uniqueIndex("week_plans_user_id_week_start_unique").on(
      table.userId,
      table.weekStart
    ),
  })
);

/**
 * Tabela week_plan_tasks — tarefas ativas em um plano semanal
 */
export const weekPlanTasks = pgTable("week_plan_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  weekPlanId: uuid("week_plan_id")
    .notNull()
    .references(() => weekPlans.id, { onDelete: "cascade" }),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "restrict" }),
  goal: integer("goal").notNull().default(1),
  done: integer("done").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Tabela logs — registros de texto criados pelo usuário
 * Associado a um Day via day_id
 * weekPlanTaskId vincula opcionalmente o log a uma tarefa ativa da semana
 */
export const logs = pgTable("logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayId: uuid("day_id")
    .notNull()
    .references(() => days.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  mood: integer("mood"), // nullable, para uso futuro
  weekPlanTaskId: uuid("week_plan_task_id").references(
    () => weekPlanTasks.id,
    { onDelete: "set null" }
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Tabela reminders — lembretes de notificação diária do usuário
 */
export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  hour: integer("hour").notNull(),
  minute: integer("minute").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, {
    fields: [reminders.userId],
    references: [users.id],
  }),
}));

/**
 * Relações Drizzle para facilitar queries com joins
 */
export const usersRelations = relations(users, ({ many }) => ({
  days: many(days),
  tasks: many(tasks),
  weekPlans: many(weekPlans),
  reminders: many(reminders),
}));

export const daysRelations = relations(days, ({ one, many }) => ({
  user: one(users, {
    fields: [days.userId],
    references: [users.id],
  }),
  logs: many(logs),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  day: one(days, {
    fields: [logs.dayId],
    references: [days.id],
  }),
  weekPlanTask: one(weekPlanTasks, {
    fields: [logs.weekPlanTaskId],
    references: [weekPlanTasks.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  weekPlanTasks: many(weekPlanTasks),
}));

export const weekPlansRelations = relations(weekPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [weekPlans.userId],
    references: [users.id],
  }),
  weekPlanTasks: many(weekPlanTasks),
}));

export const weekPlanTasksRelations = relations(weekPlanTasks, ({ one, many }) => ({
  weekPlan: one(weekPlans, {
    fields: [weekPlanTasks.weekPlanId],
    references: [weekPlans.id],
  }),
  task: one(tasks, {
    fields: [weekPlanTasks.taskId],
    references: [tasks.id],
  }),
  logs: many(logs),
}));

/**
 * Tipos TypeScript inferidos do schema
 */
export type User = typeof users.$inferSelect;
export type Log = typeof logs.$inferSelect;
export type Day = typeof days.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type WeekPlan = typeof weekPlans.$inferSelect;
export type WeekPlanTask = typeof weekPlanTasks.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
