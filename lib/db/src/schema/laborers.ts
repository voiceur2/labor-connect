import { pgTable, serial, text, timestamp, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const laborersTable = pgTable("laborers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  workType: text("work_type").notNull(),
  bio: text("bio"),
  dailyRate: doublePrecision("daily_rate"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  isAvailable: boolean("is_available").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLaborerSchema = createInsertSchema(laborersTable).omit({ id: true, createdAt: true });
export type InsertLaborer = z.infer<typeof insertLaborerSchema>;
export type Laborer = typeof laborersTable.$inferSelect;
