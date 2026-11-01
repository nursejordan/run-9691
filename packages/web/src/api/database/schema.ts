import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export * from "./auth-schema";
export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    body: text("body").notNull(),
    summary: text("summary"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("notes_user").on(table.userId)],
);
export const followups = sqliteTable(
  "followups",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    noteId: text("note_id"),
    title: text("title").notNull(),
    status: text("status").notNull().default("open"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [index("followups_user").on(table.userId)],
);
