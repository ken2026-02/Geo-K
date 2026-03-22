import type { Database } from "sql.js";

import type { BackupSnapshotRecord, BackupSnapshotRepository } from "../interfaces";
import { escapeSqlString, readFirstRow, readRows } from "./sqliteHelpers";

export class SqliteBackupSnapshotRepository implements BackupSnapshotRepository {
  constructor(private readonly db: Database) {}

  async getById(id: string): Promise<BackupSnapshotRecord | undefined> {
    const row = readFirstRow(this.db, `SELECT * FROM backup_snapshots WHERE id = '${escapeSqlString(id)}'`);
    return row ? this.map(row) : undefined;
  }

  async listAll(): Promise<BackupSnapshotRecord[]> {
    return readRows(this.db, "SELECT * FROM backup_snapshots ORDER BY created_at DESC").map((row) => this.map(row));
  }

  async insert(record: BackupSnapshotRecord): Promise<void> {
    this.db.run(`
      INSERT INTO backup_snapshots (id, snapshot_name, snapshot_type, created_at, schema_version, includes_images, includes_pending, includes_user_data, backup_path, notes)
      VALUES (
        '${escapeSqlString(record.id)}',
        '${escapeSqlString(record.snapshotName)}',
        '${escapeSqlString(record.snapshotType)}',
        '${escapeSqlString(record.createdAt)}',
        '${escapeSqlString(record.schemaVersion)}',
        ${record.includesImages ? 1 : 0},
        ${record.includesPending ? 1 : 0},
        ${record.includesUserData ? 1 : 0},
        ${record.backupPath ? `'${escapeSqlString(record.backupPath)}'` : "NULL"},
        ${record.notes ? `'${escapeSqlString(record.notes)}'` : "NULL"}
      )
    `);
  }

  async update(record: BackupSnapshotRecord): Promise<void> {
    this.db.run(`
      UPDATE backup_snapshots
      SET snapshot_name = '${escapeSqlString(record.snapshotName)}',
          snapshot_type = '${escapeSqlString(record.snapshotType)}',
          created_at = '${escapeSqlString(record.createdAt)}',
          schema_version = '${escapeSqlString(record.schemaVersion)}',
          includes_images = ${record.includesImages ? 1 : 0},
          includes_pending = ${record.includesPending ? 1 : 0},
          includes_user_data = ${record.includesUserData ? 1 : 0},
          backup_path = ${record.backupPath ? `'${escapeSqlString(record.backupPath)}'` : "NULL"},
          notes = ${record.notes ? `'${escapeSqlString(record.notes)}'` : "NULL"}
      WHERE id = '${escapeSqlString(record.id)}'
    `);
  }

  async delete(id: string): Promise<void> {
    this.db.run(`DELETE FROM backup_snapshots WHERE id = '${escapeSqlString(id)}'`);
  }

  private map(row: Record<string, unknown>): BackupSnapshotRecord {
    return {
      id: String(row.id),
      snapshotName: String(row.snapshot_name),
      snapshotType: String(row.snapshot_type),
      createdAt: String(row.created_at),
      schemaVersion: String(row.schema_version),
      includesImages: Number(row.includes_images) === 1,
      includesPending: Number(row.includes_pending) === 1,
      includesUserData: Number(row.includes_user_data) === 1,
      backupPath: row.backup_path == null ? undefined : String(row.backup_path),
      notes: row.notes == null ? undefined : String(row.notes)
    };
  }
}
