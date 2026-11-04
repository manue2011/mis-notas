CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
-- unaccent() is only STABLE, so it can't be used in an index directly.
CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;--> statement-breakpoint
ALTER TABLE "page" ADD COLUMN "search_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
-- Backfill: every inline text node of the existing content (the app keeps it
-- up to date from now on, see src/lib/pages/content.ts).
UPDATE "page" SET "search_text" = coalesce(
  (SELECT string_agg(t #>> '{}', ' ')
     FROM jsonb_path_query("content", 'strict $.** ? (@.type == "text").text') AS t),
  ''
);--> statement-breakpoint
CREATE INDEX "page_search_idx" ON "page" USING gin (f_unaccent(lower("title" || ' ' || "search_text")) gin_trgm_ops);
