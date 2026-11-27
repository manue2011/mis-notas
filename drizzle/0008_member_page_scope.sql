CREATE TABLE "member_page_scope" (
	"member_id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"page_ids" uuid[] NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invite_link" ADD COLUMN "page_ids" uuid[];--> statement-breakpoint
ALTER TABLE "member_page_scope" ADD CONSTRAINT "member_page_scope_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_page_scope" ADD CONSTRAINT "member_page_scope_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;