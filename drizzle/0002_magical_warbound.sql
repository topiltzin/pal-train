CREATE TABLE "mcp_audit_entries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mcp_audit_entries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event" text NOT NULL,
	"user_id" text,
	"client_id" varchar(255),
	"reason_code" varchar(64),
	CONSTRAINT "mcp_audit_entries_event" CHECK ("mcp_audit_entries"."event" in ('consent_granted', 'consent_denied', 'token_accepted', 'token_refused', 'connection_refused', 'disconnected', 'rate_limited'))
);
--> statement-breakpoint
CREATE TABLE "mcp_connections" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "mcp_connections_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" text NOT NULL,
	"client_id" varchar(255) NOT NULL,
	"client_name" varchar(100) NOT NULL,
	"granted_scopes" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	CONSTRAINT "mcp_connections_user_client" UNIQUE("user_id","client_id"),
	CONSTRAINT "mcp_connections_status" CHECK ("mcp_connections"."status" in ('active', 'removed'))
);
--> statement-breakpoint
CREATE TABLE "mcp_rate_windows" (
	"user_id" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "mcp_rate_windows_user_id_window_start_pk" PRIMARY KEY("user_id","window_start")
);
--> statement-breakpoint
ALTER TABLE "mcp_connections" ADD CONSTRAINT "mcp_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_rate_windows" ADD CONSTRAINT "mcp_rate_windows_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;