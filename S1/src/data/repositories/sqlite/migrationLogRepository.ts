import type { Database } from "sql.js";

import type { MigrationLogRecord, MigrationLogRepository } from "../interfaces";
import { escapeSqlString, readFirstRow, readRows } from "./sqliteHelpers";

export class SqliteMigrationLogRepository implements MigrationLogRepository {
  constructor(private readonly db: Database) {}

  async getById(id: string): Promise<MigrationLogRecord | undefined> {
    const row = readFirstRow(this.db, `SELECT id, migration_name, from_version, to_version, applied_at, success, notes FROM migration_log WHERE id = '${escapeSqlString(id)}'`);
    return row ? this.map(row) : undefined;
  }

  async listAll(): Promise<MigrationLogRecord[]> {
    return readRows(this.db, "SELECT id, migration_name, from_version, to_version, applied_at, success, notes FROM migration_log ORDER BY applied_at ASC").map((row) => this.map(row));
  }

  async insert(record: MigrationLogRecord): Promise<void> {
    this.db.run(`
      INSERT INTO migration_log (id, migration_name, from_version, to_version, applied_at, success, notes)
      VALUES ('${escapeSqlString(record.id)}', '${escapeSqlString(record.migrationName)}', ${record.fromVersion ? `'${escapeSqlString(record.fromVersion)}'` : "NULL"}, '${escapeSqlString(record.toVersion)}', '${escapeSqlString(record.appliedAt)}', ${record.success ? 1 : 0}, ${record.notes ? `'${escapeSqlString(record.notes)}'` : "NULL"})
    `);
  }

  async update(record: MigrationLogRecord): Promise<void> {
    this.db.run(`
      UPDATE migration_log
      SET migration_name = '${escapeSqlString(record.migrationName)}',
          from_version = ${record.fromVersion ? `'${escapeSqlString(record.fromVersion)}'` : "NULL"},
          to_version = '${escapeSqlString(record.toVersion)}',
          applied_at = '${escapeSqlString(record.appliedAt)}',
          success = ${record.success ? 1 : 0},
          notes = ${record.notes ? `'${escapeSqlString(record.notes)}'` : "NULL"}
      WHERE id = '${escapeSqlString(record.id)}'
    `);
  }

  async delete(id: string): Promise<void> {
    this.db.run(`DELETE FROM migration_log WHERE id = '${escapeSqlString(id)}'`);
  }

  private map(row: Record<string, unknown>): MigrationLogRecord {
    return {
      id: String(row.id),
      migrationName: String(row.migration_name),
      fromVersion: row.from_version == null ? undefined : String(row.from_version),
      toVersion: String(row.to_version),
      appliedAt: String(row.applied_at),
      success: Number(row.success) === 1,
      notes: row.notes == null ? undefined : String(row.notes)
    };
  }
}
