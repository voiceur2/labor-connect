import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { laborersTable } from "./laborers";

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  laborerId: integer("laborer_id").notNull().references(() => laborersTable.id, { onDelete: "cascade" }),
  laborerName: text("laborer_name").notNull(),
  hirerPhone: text("hirer_phone").notNull(),
  lastMessage: text("last_message"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertConversationSchema = createInsertSchema(conversationsTable).omit({ id: true, updatedAt: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversationsTable.$inferSelect;
