import type { Database } from "sql.js";

import { schemaSql } from "./schemaSql";
import { SCHEMA_VERSION } from "./schemaVersion";
import { createDatabase, loadPersistedDatabase, persistDatabase } from "./database";
import { migrations } from "./migrations";
import { repairKnownSchemaDrift as repairSchemaDrift } from "./schemaRepair";
import type { DatabasePersistenceMode } from "./DatabaseContext";
import { SqliteAppSettingsRepository } from "../repositories/sqlite/appSettingsRepository";
import { SqliteMigrationLogRepository } from "../repositories/sqlite/migrationLogRepository";
import { SqliteRuleSetRepository } from "../repositories/sqlite/ruleSetRepository";
import type { AppSettingRecord, MigrationLogRecord, RuleSetRecord } from "../repositories/interfaces";

export interface DatabaseBootstrapResult {
  db: Database;
  schemaVersion: string;
  initialized: boolean;
  persistenceMode: DatabasePersistenceMode;
  startupWarnings: string[];
}

const STORAGE_IO_TIMEOUT_MS = 3000;
const BOOTSTRAP_SCHEMA_SQL = `
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
`;

function nowIso(): string {
  return new Date().toISOString();
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
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

async function applySchemaDriftRepair(db: Database, startupWarnings: string[]): Promise<void> {
  const repairedEntries = repairSchemaDrift(db);

  if (repairedEntries.length === 0) {
    return;
  }

  startupWarnings.push("Local database schema drift was detected and repaired during startup.");
  await updateSchemaVersion(db, SCHEMA_VERSION);
  await logMigration(
    db,
    "repair_known_schema_drift",
    SCHEMA_VERSION,
    SCHEMA_VERSION,
    `Repaired schema drift: ${repairedEntries.join(", ")}`
  );
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
  const startupWarnings: string[] = [];
  let persistenceMode: DatabasePersistenceMode = "persistent";
  let persistedBinary: Uint8Array | undefined;
  try {
    persistedBinary = await withTimeout(loadPersistedDatabase(), STORAGE_IO_TIMEOUT_MS, "Loading persisted database");
  } catch (error) {
    console.warn("Falling back to a fresh in-memory database because persisted storage could not be loaded.", error);
    persistenceMode = "memory_fallback";
    startupWarnings.push("Local database storage could not be loaded. The app started in recovery mode and previously saved local data may be temporarily unavailable.");
  }
  const db = await createDatabase(persistedBinary);

  if (persistedBinary) {
    // Existing local databases may lag behind the current schema. Bootstrap
    // only the metadata tables first so drift repair and migrations can run
    // before any full-schema index creation touches missing columns.
    db.exec(BOOTSTRAP_SCHEMA_SQL);
  } else {
    db.exec(schemaSql);
  }

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

  db.exec("BEGIN TRANSACTION;");
  try {
    await applySchemaDriftRepair(db, startupWarnings);
    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }

  if (persistedBinary) {
    db.exec(schemaSql);
  }

  try {
    await withTimeout(persistDatabase(db), STORAGE_IO_TIMEOUT_MS, "Persisting database");
  } catch (error) {
    console.warn("Database initialized, but persistence did not complete.", error);
    persistenceMode = "memory_fallback";
    startupWarnings.push("Local persistence is currently unavailable. Changes made in this session may not survive a reload until storage recovers.");
  }

  return {
    db,
    schemaVersion: SCHEMA_VERSION,
    initialized,
    persistenceMode,
    startupWarnings
  };
}
