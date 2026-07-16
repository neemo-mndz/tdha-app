import {
  pgTable,
  uuid,
  date,
  text,
  timestamp,
  integer,
  uniqueIndex,
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
 * Tabela logs — registros de texto criados pelo usuário
 * Associado a um Day via day_id
 */
export const logs = pgTable("logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayId: uuid("day_id")
    .notNull()
    .references(() => days.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  mood: integer("mood"), // nullable, para uso futuro
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Relações Drizzle para facilitar queries com joins
 */
export const usersRelations = relations(users, ({ many }) => ({
  days: many(days),
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
}));

/**
 * Tipos TypeScript inferidos do schema
 */
export type User = typeof users.$inferSelect;
export type Log = typeof logs.$inferSelect;
export type Day = typeof days.$inferSelect;
