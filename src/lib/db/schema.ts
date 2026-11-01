import { sql } from "drizzle-orm";
import { check, pgTable, primaryKey, text, timestamp, unique } from "drizzle-orm/pg-core";

const DISPLAY_NAME_MIN_LENGTH = 1;
const DISPLAY_NAME_MAX_LENGTH = 40;

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("users_email_unique").on(table.email),
    check(
      "users_display_name_length",
      sql`char_length(${table.displayName}) between ${sql.raw(String(DISPLAY_NAME_MIN_LENGTH))} and ${sql.raw(String(DISPLAY_NAME_MAX_LENGTH))}`,
    ),
  ],
);

export const suggestionState = pgTable(
  "suggestion_state",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastTemplateId: text("last_template_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId] })],
);
