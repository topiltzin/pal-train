CREATE TABLE "exercise_demo_links" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "exercise_demo_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"exercise_id" text NOT NULL,
	"video_id" varchar(11) NOT NULL,
	"source_title" text NOT NULL,
	"channel" text DEFAULT 'officialdemic' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercise_demo_links_video_id_format" CHECK ("exercise_demo_links"."video_id" ~ '^[A-Za-z0-9_-]{11}$'),
	CONSTRAINT "exercise_demo_links_source_title_length" CHECK (char_length("exercise_demo_links"."source_title") between 1 and 200)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "exercise_demo_links_one_active" ON "exercise_demo_links" USING btree ("exercise_id") WHERE "exercise_demo_links"."active" = true;