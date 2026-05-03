import { date, integer, pgTable } from "drizzle-orm/pg-core";

export const dailyBudget = pgTable("daily_budget", {
  date: date("date").primaryKey(),
  aiCalls: integer("ai_calls").notNull().default(0),
});

export type DailyBudget = typeof dailyBudget.$inferSelect;
