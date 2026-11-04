import {
  type AnyPgColumn,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { organization, user } from "./auth";

/** Raw bytes (Postgres bytea), for the Yjs document state. */
const bytea = customType<{ data: Uint8Array; driverData: Buffer }>({
  dataType: () => "bytea",
  toDriver: (value) => Buffer.from(value),
  fromDriver: (value) => new Uint8Array(value),
});

export const accentColor = pgEnum("accent_color", [
  "ink_blue",
  "tile",
  "moss",
  "mustard",
  "plum",
  "graphite",
  "raspberry",
  "forest",
  "petrol",
  "garnet",
  "pumpkin",
  "indigo",
]);

export const workspaceFont = pgEnum("workspace_font", ["serif", "sans", "mono"]);

export const memberRole = pgEnum("member_role", ["admin", "editor", "lector"]);

export const workspaceSettings = pgTable("workspace_settings", {
  organizationId: text("organization_id")
    .primaryKey()
    .references(() => organization.id, { onDelete: "cascade" }),
  accentColor: accentColor("accent_color").notNull().default("ink_blue"),
  font: workspaceFont("font").notNull().default("serif"),
  icon: text("icon"),
  allowedEmailDomain: text("allowed_email_domain"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inviteLink = pgTable(
  "invite_link",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    role: memberRole("role").notNull().default("editor"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    maxUses: integer("max_uses"),
    uses: integer("uses").notNull().default(0),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("invite_link_token_hash_idx").on(t.tokenHash),
    index("invite_link_org_idx").on(t.organizationId),
  ],
);

// App-wide, single-use links that let someone create an account. Only the
// superadmin creates them; sign-up is closed otherwise.
export const signupInvite = pgTable(
  "signup_invite",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    note: text("note"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    usedBy: text("used_by").references(() => user.id, { onDelete: "set null" }),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("signup_invite_token_hash_idx").on(t.tokenHash)],
);

export const page = pgTable(
  "page",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => page.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull().default(""),
    icon: text("icon"),
    coverUrl: text("cover_url"),
    content: jsonb("content").$type<unknown[]>().notNull().default(sql`'[]'::jsonb`),
    // Plain text of `content`, kept in step with it, for search.
    searchText: text("search_text").notNull().default(""),
    // The live collaborative document (Yjs update). Null until the page is
    // first opened with real-time editing; then `content` is derived from it.
    yjsState: bytea("yjs_state"),
    position: doublePrecision("position").notNull().default(0),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("page_tree_idx")
      .on(t.organizationId, t.parentId, t.position)
      .where(sql`${t.deletedAt} is null`),
    // Accent- and case-insensitive substring search (see src/lib/pages/search.ts).
    // f_unaccent is an immutable wrapper around unaccent, created in migration 0003.
    index("page_search_idx").using(
      "gin",
      sql`f_unaccent(lower(${t.title} || ' ' || ${t.searchText})) gin_trgm_ops`,
    ),
  ],
);

export const asset = pgTable(
  "asset",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    pageId: uuid("page_id")
      .notNull()
      .references(() => page.id, { onDelete: "cascade" }),
    cloudinaryPublicId: text("cloudinary_public_id").notNull().unique(),
    url: text("url").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    bytes: integer("bytes").notNull(),
    uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // When no page showed it any more (see src/lib/assets/sweep.ts); null while in use.
    orphanedAt: timestamp("orphaned_at", { withTimezone: true }),
  },
  (t) => [index("asset_page_idx").on(t.pageId)],
);
