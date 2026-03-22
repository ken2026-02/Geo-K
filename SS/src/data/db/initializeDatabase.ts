import type { Database } from "sql.js";

import { schemaSql } from "./schemaSql";
import { SCHEMA_VERSION } from "./schemaVersion";
import { createDatabase, loadPersistedDatabase, persistDatabase } from "./database";
import { migrations } from "./migrations";
import { SqliteAppSettingsRepository } from "../repositories/sqlite/appSettingsRepository";
import { SqliteMigrationLogRepository } from "../repositories/sqlite/migrationLogRepository";
import { SqliteRuleSetRepository } from "../repositories/sqlite/ruleSetRepository";
import type { AppSettingRecord, MigrationLogRecord, RuleSetRecord } from "../repositories/interfaces";

export interface DatabaseBootstrapResult {
  db: Database;
  schemaVersion: string;
  initialized: boolean;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}-${nowIso()}`;
}

function settingId(settingKey: string): string {
  // Bootstrap seed records must keep deterministic ids so repeated app startup
  // updates the same row instead of creating a new seed record.
  return `setting-${settingKey.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function rulesetId(name: "base-knowledge-pack-schema" | "base-classification-rules"): string {
  // Bootstrap rulesets follow the same rule: fixed ids plus UPSERT writes.
  // Do not switch seed ids to timestamp/random values.
  return `ruleset-${name}`;
}

function createSettingRecord(settingKey: string, settingValue: string, updatedAt: string): AppSettingRecord {
  return {
    id: settingId(settingKey),
    settingKey,
    settingValue,
    updatedAt
  };
}

async function seedBaseSettings(db: Database): Promise<void> {
  const settingsRepository = new SqliteAppSettingsRepository(db);
  const timestamp = nowIso();

  const settings: AppSettingRecord[] = [
    // Bootstrap seed data must be idempotent across reloads and re-initialization.
    createSettingRecord("schema_version", SCHEMA_VERSION, timestamp),
    createSettingRecord("app_initialized_at", timestamp, timestamp)
  ];

  for (const setting of settings) {
    await settingsRepository.upsert(setting);
  }
}

async function seedBaseRulesets(db: Database): Promise<void> {
  const rulesetRepository = new SqliteRuleSetRepository(db);
  const timestamp = nowIso();
  const baseRules: RuleSetRecord[] = [
    {
      id: rulesetId("base-knowledge-pack-schema"),
      ruleName: "Base Knowledge Pack Schema",
      ruleType: "json_schema_rule",
      version: "1.0.0",
      ruleContent: "Phase 1 base schema contract for knowledge_pack.json",
      schemaVersion: SCHEMA_VERSION,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: rulesetId("base-classification-rules"),
      ruleName: "Base Classification Rules",
      ruleType: "classification_rule",
      version: "1.0.0",
      ruleContent: "Phase 1 fixed enum classification baseline",
      schemaVersion: SCHEMA_VERSION,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ];

  for (const rule of baseRules) {
    await rulesetRepository.insert(rule);
  }
}

async function logMigration(db: Database, migrationName: string, fromVersion: string | undefined, toVersion: string, notes: string): Promise<void> {
  const migrationRepository = new SqliteMigrationLogRepository(db);
  const record: MigrationLogRecord = {
    id: createId("migration"),
    migrationName,
    fromVersion,
    toVersion,
    appliedAt: nowIso(),
    success: true,
    notes
  };

  await migrationRepository.insert(record);
}

async function getCurrentSchemaVersion(db: Database): Promise<string | undefined> {
  const settingsRepository = new SqliteAppSettingsRepository(db);
  const setting = await settingsRepository.getByKey("schema_version");
  return setting?.settingValue;
}

async function updateSchemaVersion(db: Database, version: string): Promise<void> {
  const settingsRepository = new SqliteAppSettingsRepository(db);
  await settingsRepository.upsert(createSettingRecord("schema_version", version, nowIso()));
}

async function runPendingMigrations(db: Database, currentVersion: string): Promise<void> {
  let workingVersion = currentVersion;

  for (const migration of migrations) {
    if (workingVersion !== migration.fromVersion) {
      continue;
    }

    db.exec("BEGIN TRANSACTION;");
    try {
      db.exec(migration.sql);
      await logMigration(db, migration.id, migration.fromVersion, migration.toVersion, `Applied ${migration.id}`);
      await updateSchemaVersion(db, migration.toVersion);
      db.exec("COMMIT;");
      workingVersion = migration.toVersion;
    } catch (error) {
      db.exec("ROLLBACK;");
      throw error;
    }
  }
}

export async function initializeDatabase(): Promise<DatabaseBootstrapResult> {
  const persistedBinary = await loadPersistedDatabase();
  const db = await createDatabase(persistedBinary);

  db.exec(schemaSql);

  const currentSchemaVersion = await getCurrentSchemaVersion(db);
  const initialized = currentSchemaVersion === undefined;

  if (initialized) {
    db.exec("BEGIN TRANSACTION;");
    try {
      await seedBaseSettings(db);
      await seedBaseRulesets(db);
      await logMigration(db, "001_initial", undefined, SCHEMA_VERSION, "Initial schema bootstrap.");
      db.exec("COMMIT;");
    } catch (error) {
      db.exec("ROLLBACK;");
      throw error;
    }
  } else if (currentSchemaVersion !== SCHEMA_VERSION) {
    await runPendingMigrations(db, currentSchemaVersion);
  }

  await persistDatabase(db);

  return {
    db,
    schemaVersion: SCHEMA_VERSION,
    initialized
  };
}
