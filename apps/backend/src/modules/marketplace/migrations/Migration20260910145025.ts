import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260910145025 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "ember_account_session" drop constraint if exists "ember_account_session_token_hash_unique";`);
    this.addSql(`create table if not exists "ember_account_session" ("id" text not null, "token_hash" text not null, "customer_id" text not null, "expires_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ember_account_session_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ember_account_session_token_hash_unique" ON "ember_account_session" ("token_hash") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ember_account_session_deleted_at" ON "ember_account_session" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_EMBER_SESSION_CUSTOMER" ON "ember_account_session" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_EMBER_SESSION_EXPIRY" ON "ember_account_session" ("expires_at") WHERE deleted_at IS NULL;`);

    this.addSql(`drop index if exists "IDX_ember_participant_customer_id_unique";`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_EMBER_CUSTOMER_ROLE" ON "ember_participant" ("customer_id", "role") WHERE customer_id IS NOT NULL AND deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    // Do not remove sessions or role indexes if the old one-role constraint
    // cannot be restored. Account data must be migrated explicitly first.
    this.addSql(`DO $$ BEGIN IF EXISTS (SELECT customer_id FROM ember_participant WHERE customer_id IS NOT NULL AND deleted_at IS NULL GROUP BY customer_id HAVING count(*) > 1) THEN RAISE EXCEPTION 'Cannot roll back accounts while dual-role customers exist'; END IF; END $$;`);
    this.addSql(`drop table if exists "ember_account_session" cascade;`);

    this.addSql(`drop index if exists "IDX_EMBER_CUSTOMER_ROLE";`);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ember_participant_customer_id_unique" ON "ember_participant" ("customer_id") WHERE deleted_at IS NULL;`);
  }

}
