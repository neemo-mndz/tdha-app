CREATE TABLE "agenda_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "title" text NOT NULL,
  "notes" text DEFAULT '' NOT NULL,
  "tags" text[] DEFAULT ARRAY['pessoal']::text[] NOT NULL,
  "period" text DEFAULT 'anytime' NOT NULL,
  "start_time" text,
  "end_time" text,
  "completed" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "agenda_entries_title_check" CHECK (length(trim("title")) between 1 and 160),
  CONSTRAINT "agenda_entries_notes_check" CHECK (length("notes") <= 2000),
  CONSTRAINT "agenda_entries_tags_check" CHECK ("tags" <@ ARRAY['trabalho','casal','pessoal']::text[] AND cardinality("tags") between 1 and 3 AND array_position("tags", NULL) IS NULL),
  CONSTRAINT "agenda_entries_period_check" CHECK ("period" in ('anytime','morning','afternoon','evening')),
  CONSTRAINT "agenda_entries_time_check" CHECK (("start_time" IS NULL OR "start_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') AND ("end_time" IS NULL OR ("start_time" IS NOT NULL AND "end_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "end_time" > "start_time")))
);
--> statement-breakpoint
CREATE INDEX "agenda_entries_user_date_idx" ON "agenda_entries" ("user_id", "date");
