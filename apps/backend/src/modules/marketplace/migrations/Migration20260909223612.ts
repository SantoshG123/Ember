import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260909223612 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "ember_participant" drop constraint if exists "ember_participant_customer_id_unique";`);
    this.addSql(`alter table if exists "ember_opportunity" drop constraint if exists "ember_opportunity_slug_unique";`);
    this.addSql(`create table if not exists "ember_opportunity" ("id" text not null, "slug" text not null, "details" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ember_opportunity_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ember_opportunity_slug_unique" ON "ember_opportunity" ("slug") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_opportunity_deleted_at" ON "ember_opportunity" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ember_participant" ("id" text not null, "customer_id" text null, "role" text check ("role" in ('buyer', 'seller')) not null, "name" text not null, "initials" text not null, "profile" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ember_participant_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ember_participant_customer_id_unique" ON "ember_participant" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_participant_deleted_at" ON "ember_participant" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ember_offer_draft" ("id" text not null, "seller_id" text not null, "opportunity_id" text not null, "price_per_meal" numeric not null, "weekly_capacity" integer not null, "delivery_days" text not null, "note" text not null, "raw_price_per_meal" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ember_offer_draft_pkey" primary key ("id"), constraint ember_offer_price_check check (price_per_meal >= 8 AND price_per_meal <= 1000000 AND price_per_meal = trunc(price_per_meal, 2)), constraint ember_offer_capacity_check check (weekly_capacity >= 20 AND weekly_capacity <= 100000));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_offer_draft_seller_id" ON "ember_offer_draft" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_offer_draft_opportunity_id" ON "ember_offer_draft" ("opportunity_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_offer_draft_deleted_at" ON "ember_offer_draft" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ember_bookmark" ("id" text not null, "participant_id" text not null, "opportunity_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ember_bookmark_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_bookmark_participant_id" ON "ember_bookmark" ("participant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_bookmark_opportunity_id" ON "ember_bookmark" ("opportunity_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_bookmark_deleted_at" ON "ember_bookmark" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_EMBER_BOOKMARK_OWNER" ON "ember_bookmark" ("participant_id", "opportunity_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ember_request" ("id" text not null, "buyer_id" text not null, "category" text not null, "title" text not null, "description" text not null, "budget_min" numeric not null, "budget_max" numeric not null, "frequency" text check ("frequency" in ('one-time', 'weekly', 'monthly', 'flexible')) not null, "timing" text not null, "zip" text not null, "location_area" text not null, "status" text check ("status" in ('open', 'matched', 'fulfilled', 'cancelled')) not null default 'open', "reference_name" text null, "raw_budget_min" jsonb not null, "raw_budget_max" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ember_request_pkey" primary key ("id"), constraint ember_request_budget_check check (budget_min > 0 AND budget_max >= budget_min AND budget_max <= 1000000 AND budget_min = trunc(budget_min, 2) AND budget_max = trunc(budget_max, 2)));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_request_buyer_id" ON "ember_request" ("buyer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_request_deleted_at" ON "ember_request" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_EMBER_REQUEST_DISCOVERY" ON "ember_request" ("status", "created_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ember_conversation" ("id" text not null, "request_id" text not null, "buyer_id" text not null, "seller_id" text not null, "proposal" jsonb not null, "status" text check ("status" in ('active', 'archived')) not null default 'active', "buyer_read_at" timestamptz null, "seller_read_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ember_conversation_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_conversation_request_id" ON "ember_conversation" ("request_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_conversation_buyer_id" ON "ember_conversation" ("buyer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_conversation_seller_id" ON "ember_conversation" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_conversation_deleted_at" ON "ember_conversation" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_EMBER_CONVERSATION_PARTIES" ON "ember_conversation" ("request_id", "buyer_id", "seller_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ember_message" ("id" text not null, "conversation_id" text not null, "author_id" text not null, "body" text not null, "attachment" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ember_message_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_message_conversation_id" ON "ember_message" ("conversation_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_message_author_id" ON "ember_message" ("author_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_message_deleted_at" ON "ember_message" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "ember_bid" ("id" text not null, "request_id" text not null, "seller_id" text not null, "price_per_delivery" numeric not null, "delivery_count" integer not null, "cadence" text not null, "earliest_start" text not null, "proposal" text not null, "details" jsonb null, "status" text check ("status" in ('active', 'accepted', 'declined')) not null default 'active', "accepted_at" timestamptz null, "raw_price_per_delivery" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ember_bid_pkey" primary key ("id"), constraint ember_bid_price_check check (price_per_delivery > 0 AND price_per_delivery <= 1000000 AND price_per_delivery = trunc(price_per_delivery, 2)), constraint ember_bid_count_check check (delivery_count >= 1 AND delivery_count <= 1000));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_bid_request_id" ON "ember_bid" ("request_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_bid_seller_id" ON "ember_bid" ("seller_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_bid_deleted_at" ON "ember_bid" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_EMBER_ONE_ACCEPTED_BID" ON "ember_bid" ("request_id") WHERE status = 'accepted' AND deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_EMBER_ONE_ACTIVE_BID" ON "ember_bid" ("request_id", "seller_id") WHERE status = 'active' AND deleted_at IS NULL;`);

    this.addSql(`alter table if exists "ember_offer_draft" add constraint "ember_offer_draft_seller_id_foreign" foreign key ("seller_id") references "ember_participant" ("id") on update cascade;`);
    this.addSql(`alter table if exists "ember_offer_draft" add constraint "ember_offer_draft_opportunity_id_foreign" foreign key ("opportunity_id") references "ember_opportunity" ("id") on update cascade;`);

    this.addSql(`alter table if exists "ember_bookmark" add constraint "ember_bookmark_participant_id_foreign" foreign key ("participant_id") references "ember_participant" ("id") on update cascade;`);
    this.addSql(`alter table if exists "ember_bookmark" add constraint "ember_bookmark_opportunity_id_foreign" foreign key ("opportunity_id") references "ember_opportunity" ("id") on update cascade;`);

    this.addSql(`alter table if exists "ember_request" add constraint "ember_request_buyer_id_foreign" foreign key ("buyer_id") references "ember_participant" ("id") on update cascade;`);

    this.addSql(`alter table if exists "ember_conversation" add constraint "ember_conversation_request_id_foreign" foreign key ("request_id") references "ember_request" ("id") on update cascade;`);
    this.addSql(`alter table if exists "ember_conversation" add constraint "ember_conversation_buyer_id_foreign" foreign key ("buyer_id") references "ember_participant" ("id") on update cascade;`);
    this.addSql(`alter table if exists "ember_conversation" add constraint "ember_conversation_seller_id_foreign" foreign key ("seller_id") references "ember_participant" ("id") on update cascade;`);

    this.addSql(`alter table if exists "ember_message" add constraint "ember_message_conversation_id_foreign" foreign key ("conversation_id") references "ember_conversation" ("id") on update cascade;`);
    this.addSql(`alter table if exists "ember_message" add constraint "ember_message_author_id_foreign" foreign key ("author_id") references "ember_participant" ("id") on update cascade;`);

    this.addSql(`alter table if exists "ember_bid" add constraint "ember_bid_request_id_foreign" foreign key ("request_id") references "ember_request" ("id") on update cascade;`);
    this.addSql(`alter table if exists "ember_bid" add constraint "ember_bid_seller_id_foreign" foreign key ("seller_id") references "ember_participant" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "ember_offer_draft" drop constraint if exists "ember_offer_draft_opportunity_id_foreign";`);

    this.addSql(`alter table if exists "ember_bookmark" drop constraint if exists "ember_bookmark_opportunity_id_foreign";`);

    this.addSql(`alter table if exists "ember_offer_draft" drop constraint if exists "ember_offer_draft_seller_id_foreign";`);

    this.addSql(`alter table if exists "ember_bookmark" drop constraint if exists "ember_bookmark_participant_id_foreign";`);

    this.addSql(`alter table if exists "ember_request" drop constraint if exists "ember_request_buyer_id_foreign";`);

    this.addSql(`alter table if exists "ember_conversation" drop constraint if exists "ember_conversation_buyer_id_foreign";`);

    this.addSql(`alter table if exists "ember_conversation" drop constraint if exists "ember_conversation_seller_id_foreign";`);

    this.addSql(`alter table if exists "ember_message" drop constraint if exists "ember_message_author_id_foreign";`);

    this.addSql(`alter table if exists "ember_bid" drop constraint if exists "ember_bid_seller_id_foreign";`);

    this.addSql(`alter table if exists "ember_conversation" drop constraint if exists "ember_conversation_request_id_foreign";`);

    this.addSql(`alter table if exists "ember_bid" drop constraint if exists "ember_bid_request_id_foreign";`);

    this.addSql(`alter table if exists "ember_message" drop constraint if exists "ember_message_conversation_id_foreign";`);

    this.addSql(`drop table if exists "ember_opportunity" cascade;`);

    this.addSql(`drop table if exists "ember_participant" cascade;`);

    this.addSql(`drop table if exists "ember_offer_draft" cascade;`);

    this.addSql(`drop table if exists "ember_bookmark" cascade;`);

    this.addSql(`drop table if exists "ember_request" cascade;`);

    this.addSql(`drop table if exists "ember_conversation" cascade;`);

    this.addSql(`drop table if exists "ember_message" cascade;`);

    this.addSql(`drop table if exists "ember_bid" cascade;`);
  }

}
