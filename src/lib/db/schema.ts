import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const DISPLAY_NAME_MIN_LENGTH = 1;
const DISPLAY_NAME_MAX_LENGTH = 40;
const VIDEO_ID_LENGTH = 11;
const SOURCE_TITLE_MIN_LENGTH = 1;
const SOURCE_TITLE_MAX_LENGTH = 200;
const DEFAULT_DEMO_CHANNEL = "officialdemic";

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

/**
 * A reviewed YouTube Short that demonstrates one exercise. Exercises live in content files, so
 * exercise_id is not a foreign key. At most one row per exercise may be active (FR-006).
 */
export const exerciseDemoLinks = pgTable(
  "exercise_demo_links",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    exerciseId: text("exercise_id").notNull(),
    videoId: varchar("video_id", { length: VIDEO_ID_LENGTH }).notNull(),
    sourceTitle: text("source_title").notNull(),
    channel: text("channel").notNull().default(DEFAULT_DEMO_CHANNEL),
    active: boolean("active").notNull().default(true),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("exercise_demo_links_video_id_format", sql`${table.videoId} ~ '^[A-Za-z0-9_-]{11}$'`),
    check(
      "exercise_demo_links_source_title_length",
      sql`char_length(${table.sourceTitle}) between ${sql.raw(String(SOURCE_TITLE_MIN_LENGTH))} and ${sql.raw(String(SOURCE_TITLE_MAX_LENGTH))}`,
    ),
    uniqueIndex("exercise_demo_links_one_active")
      .on(table.exerciseId)
      .where(sql`${table.active} = true`),
  ],
);
