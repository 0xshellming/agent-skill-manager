import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`skills_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`skills\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`skills_tags_order_idx\` ON \`skills_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`skills_tags_parent_id_idx\` ON \`skills_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`skills_compatibility\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`skills\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`skills_compatibility_order_idx\` ON \`skills_compatibility\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`skills_compatibility_parent_idx\` ON \`skills_compatibility\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`skills_use_cases\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`use_case\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`skills\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`skills_use_cases_order_idx\` ON \`skills_use_cases\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`skills_use_cases_parent_id_idx\` ON \`skills_use_cases\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`skills_use_cases_locale_idx\` ON \`skills_use_cases\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`skills_prerequisites\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`prerequisite\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`skills\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`skills_prerequisites_order_idx\` ON \`skills_prerequisites\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`skills_prerequisites_parent_id_idx\` ON \`skills_prerequisites\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`skills\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`slug\` text,
  	\`author\` text,
  	\`github_url\` text,
  	\`source_repo\` text,
  	\`stars\` numeric DEFAULT 0,
  	\`category\` text,
  	\`install_command\` text,
  	\`raw_skill_md\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`skills_slug_idx\` ON \`skills\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`skills_author_idx\` ON \`skills\` (\`author\`);`)
  await db.run(sql`CREATE INDEX \`skills_stars_idx\` ON \`skills\` (\`stars\`);`)
  await db.run(sql`CREATE INDEX \`skills_category_idx\` ON \`skills\` (\`category\`);`)
  await db.run(sql`CREATE INDEX \`skills_updated_at_idx\` ON \`skills\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`skills_created_at_idx\` ON \`skills\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`skills__status_idx\` ON \`skills\` (\`_status\`);`)
  await db.run(sql`CREATE TABLE \`skills_locales\` (
  	\`name\` text,
  	\`description\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`skills\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`skills_locales_locale_parent_id_unique\` ON \`skills_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_skills_v_version_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_skills_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_skills_v_version_tags_order_idx\` ON \`_skills_v_version_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_version_tags_parent_id_idx\` ON \`_skills_v_version_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_skills_v_version_compatibility\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_skills_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_skills_v_version_compatibility_order_idx\` ON \`_skills_v_version_compatibility\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_version_compatibility_parent_idx\` ON \`_skills_v_version_compatibility\` (\`parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_skills_v_version_use_cases\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`use_case\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_skills_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_skills_v_version_use_cases_order_idx\` ON \`_skills_v_version_use_cases\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_version_use_cases_parent_id_idx\` ON \`_skills_v_version_use_cases\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_version_use_cases_locale_idx\` ON \`_skills_v_version_use_cases\` (\`_locale\`);`)
  await db.run(sql`CREATE TABLE \`_skills_v_version_prerequisites\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`prerequisite\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_skills_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`_skills_v_version_prerequisites_order_idx\` ON \`_skills_v_version_prerequisites\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_version_prerequisites_parent_id_idx\` ON \`_skills_v_version_prerequisites\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`_skills_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_slug\` text,
  	\`version_author\` text,
  	\`version_github_url\` text,
  	\`version_source_repo\` text,
  	\`version_stars\` numeric DEFAULT 0,
  	\`version_category\` text,
  	\`version_install_command\` text,
  	\`version_raw_skill_md\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`snapshot\` integer,
  	\`published_locale\` text,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`skills\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_skills_v_parent_idx\` ON \`_skills_v\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_version_version_slug_idx\` ON \`_skills_v\` (\`version_slug\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_version_version_author_idx\` ON \`_skills_v\` (\`version_author\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_version_version_stars_idx\` ON \`_skills_v\` (\`version_stars\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_version_version_category_idx\` ON \`_skills_v\` (\`version_category\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_version_version_updated_at_idx\` ON \`_skills_v\` (\`version_updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_version_version_created_at_idx\` ON \`_skills_v\` (\`version_created_at\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_version_version__status_idx\` ON \`_skills_v\` (\`version__status\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_created_at_idx\` ON \`_skills_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_updated_at_idx\` ON \`_skills_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_snapshot_idx\` ON \`_skills_v\` (\`snapshot\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_published_locale_idx\` ON \`_skills_v\` (\`published_locale\`);`)
  await db.run(sql`CREATE INDEX \`_skills_v_latest_idx\` ON \`_skills_v\` (\`latest\`);`)
  await db.run(sql`CREATE TABLE \`_skills_v_locales\` (
  	\`version_name\` text,
  	\`version_description\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_skills_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`_skills_v_locales_locale_parent_id_unique\` ON \`_skills_v_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`categories\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`slug\` text NOT NULL,
  	\`icon\` text,
  	\`order\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`categories_slug_idx\` ON \`categories\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`categories_updated_at_idx\` ON \`categories\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`categories_created_at_idx\` ON \`categories\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`categories_locales\` (
  	\`name\` text NOT NULL,
  	\`description\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_locale\` text NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`categories_locales_locale_parent_id_unique\` ON \`categories_locales\` (\`_locale\`,\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`skills_id\` integer REFERENCES skills(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`categories_id\` integer REFERENCES categories(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_skills_id_idx\` ON \`payload_locked_documents_rels\` (\`skills_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`skills_tags\`;`)
  await db.run(sql`DROP TABLE \`skills_compatibility\`;`)
  await db.run(sql`DROP TABLE \`skills_use_cases\`;`)
  await db.run(sql`DROP TABLE \`skills_prerequisites\`;`)
  await db.run(sql`DROP TABLE \`skills\`;`)
  await db.run(sql`DROP TABLE \`skills_locales\`;`)
  await db.run(sql`DROP TABLE \`_skills_v_version_tags\`;`)
  await db.run(sql`DROP TABLE \`_skills_v_version_compatibility\`;`)
  await db.run(sql`DROP TABLE \`_skills_v_version_use_cases\`;`)
  await db.run(sql`DROP TABLE \`_skills_v_version_prerequisites\`;`)
  await db.run(sql`DROP TABLE \`_skills_v\`;`)
  await db.run(sql`DROP TABLE \`_skills_v_locales\`;`)
  await db.run(sql`DROP TABLE \`categories\`;`)
  await db.run(sql`DROP TABLE \`categories_locales\`;`)
  await db.run(sql`DROP TABLE \`payload_kv\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
}
