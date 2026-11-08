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

const MCP_CLIENT_ID_MAX_LENGTH = 255;
const MCP_CLIENT_NAME_MAX_LENGTH = 100;
const MCP_REASON_CODE_MAX_LENGTH = 64;

/**
 * One approved link between a Paltrain user and an OpenAI connector client (spec FR-008, FR-009).
 * Data model: `status` is `active` or `removed`; one row per (user, client).
 */
export const mcpConnections = pgTable(
  "mcp_connections",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: varchar("client_id", { length: MCP_CLIENT_ID_MAX_LENGTH }).notNull(),
    clientName: varchar("client_name", { length: MCP_CLIENT_NAME_MAX_LENGTH }).notNull(),
    grantedScopes: text("granted_scopes").notNull(),
    status: text("status").notNull().default("active"),
    approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    removedAt: timestamp("removed_at", { withTimezone: true }),
  },
  (table) => [
    unique("mcp_connections_user_client").on(table.userId, table.clientId),
    check("mcp_connections_status", sql`${table.status} in ('active', 'removed')`),
  ],
);

/**
 * Append-only record of security-relevant connector events (spec FR-015). Holds no tokens, codes,
 * emails, names, or mood values (data model rule). No foreign key, so entries survive account deletion.
 */
export const mcpAuditEntries = pgTable(
  "mcp_audit_entries",
  {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    event: text("event").notNull(),
    userId: text("user_id"),
    clientId: varchar("client_id", { length: MCP_CLIENT_ID_MAX_LENGTH }),
    reasonCode: varchar("reason_code", { length: MCP_REASON_CODE_MAX_LENGTH }),
  },
  (table) => [
    check(
      "mcp_audit_entries_event",
      sql`${table.event} in ('consent_granted', 'consent_denied', 'token_accepted', 'token_refused', 'connection_refused', 'disconnected', 'rate_limited')`,
    ),
  ],
);

/** Requests counted per user per one-minute window (spec FR-013). */
export const mcpRateWindows = pgTable(
  "mcp_rate_windows",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    requestCount: integer("request_count").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.userId, table.windowStart] })],
);
