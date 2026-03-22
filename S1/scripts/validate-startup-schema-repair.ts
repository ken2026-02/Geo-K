import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import fs from "node:fs/promises";

import { createDatabase, exportDatabase, loadPersistedDatabase } from "../src/data/db/database";
import { DATABASE_IDB_KEY } from "../src/data/db/schemaVersion";
import { repairKnownSchemaDrift } from "../src/data/db/schemaRepair";
import { deleteValue, setBinary } from "../src/data/idb/storage";

function columnExists(db: Awaited<ReturnType<typeof createDatabase>>, tableName: string, columnName: string): boolean {
  const result = db.exec(`PRAGMA table_info(${tableName})`);
  const values = result[0]?.values ?? [];
  return values.some((row) => String(row[1] ?? "") === columnName);
}

async function seedDriftedDatabase(): Promise<void> {
  const db = await createDatabase();
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY,
      setting_key TEXT NOT NULL,
      setting_value TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS migration_log (
      id TEXT PRIMARY KEY,
      migration_name TEXT NOT NULL,
      from_version TEXT,
      to_version TEXT NOT NULL,
      applied_at TEXT NOT NULL,
      success INTEGER NOT NULL DEFAULT 1,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS rulesets (
      id TEXT PRIMARY KEY,
      rule_name TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      version TEXT NOT NULL,
      rule_content TEXT NOT NULL,
      schema_version TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      source_report_id TEXT,
      title TEXT NOT NULL,
      project TEXT,
      discipline TEXT,
      report_date TEXT,
      source_type TEXT,
      author TEXT,
      organization TEXT,
      tags_json TEXT,
      summary TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    INSERT INTO app_settings (id, setting_key, setting_value, updated_at)
    VALUES ('setting-schema-version', 'schema_version', '1.4.0', '2026-03-21T00:00:00.000Z');
  `);

  await setBinary(DATABASE_IDB_KEY, exportDatabase(db));
}

async function main(): Promise<void> {
  await deleteValue(DATABASE_IDB_KEY);
  await seedDriftedDatabase();
  const persisted = await loadPersistedDatabase();
  const driftedDb = await createDatabase(persisted);

  driftedDb.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS migration_log (
      id TEXT PRIMARY KEY,
      migration_name TEXT NOT NULL,
      from_version TEXT,
      to_version TEXT NOT NULL,
      applied_at TEXT NOT NULL,
      success INTEGER NOT NULL DEFAULT 1,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS rulesets (
      id TEXT PRIMARY KEY,
      rule_name TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      version TEXT NOT NULL,
      rule_content TEXT NOT NULL,
      schema_version TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const repairedEntries = repairKnownSchemaDrift(driftedDb);
  const schemaSql = await fs.readFile(new URL("../src/data/migrations/001_initial.sql", import.meta.url), "utf8");
  driftedDb.exec(schemaSql);

  assert.equal(columnExists(driftedDb, "reports", "document_type"), true, "reports.document_type should be repaired");
  assert.equal(columnExists(driftedDb, "reports", "authority_level"), true, "reports.authority_level should be repaired");
  assert.equal(columnExists(driftedDb, "requirements", "canonical_name"), true, "requirements table should be created on repair");
  assert.equal(columnExists(driftedDb, "methods", "canonical_name"), true, "methods table should be created on repair");
  assert.equal(
    repairedEntries.some((entry) => entry === "reports.document_type"),
    true,
    "startup should repair the missing reports.document_type column before full schema replay"
  );

  console.log("Startup schema repair initialization validation passed.");
}

await main();
