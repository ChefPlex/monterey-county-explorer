import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  dailyMessages: integer("daily_messages").notNull().default(0),
  dailyResetAt: timestamp("daily_reset_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
