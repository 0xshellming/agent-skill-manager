import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`skills\` ADD \`crawl_status\` text DEFAULT 'pending';`)
  await db.run(sql`ALTER TABLE \`skills\` ADD \`skill_path\` text;`)
  await db.run(sql`ALTER TABLE \`skills\` ADD \`branch\` text DEFAULT 'main';`)
  await db.run(sql`CREATE INDEX \`skills_crawl_status_idx\` ON \`skills\` (\`crawl_status\`);`)
  await db.run(sql`ALTER TABLE \`_skills_v\` ADD \`version_crawl_status\` text DEFAULT 'pending';`)
  await db.run(sql`ALTER TABLE \`_skills_v\` ADD \`version_skill_path\` text;`)
  await db.run(sql`ALTER TABLE \`_skills_v\` ADD \`version_branch\` text DEFAULT 'main';`)
  await db.run(sql`CREATE INDEX \`_skills_v_version_version_crawl_status_idx\` ON \`_skills_v\` (\`version_crawl_status\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`skills_crawl_status_idx\`;`)
  await db.run(sql`ALTER TABLE \`skills\` DROP COLUMN \`crawl_status\`;`)
  await db.run(sql`ALTER TABLE \`skills\` DROP COLUMN \`skill_path\`;`)
  await db.run(sql`ALTER TABLE \`skills\` DROP COLUMN \`branch\`;`)
  await db.run(sql`DROP INDEX \`_skills_v_version_version_crawl_status_idx\`;`)
  await db.run(sql`ALTER TABLE \`_skills_v\` DROP COLUMN \`version_crawl_status\`;`)
  await db.run(sql`ALTER TABLE \`_skills_v\` DROP COLUMN \`version_skill_path\`;`)
  await db.run(sql`ALTER TABLE \`_skills_v\` DROP COLUMN \`version_branch\`;`)
}
