import type { Database } from "sql.js";

import type {
  PersonalNoteRecord,
  PersonalNoteRepository,
  PersonalNoteStatus,
  PersonalNoteTargetItemType,
  PersonalNoteType
} from "../interfaces";
import { escapeSqlString, readFirstRow, readRows } from "./sqliteHelpers";

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}-${nowIso()}-${Math.random().toString(16).slice(2, 8)}`;
}

function asNoteType(value: unknown): PersonalNoteType {
  const noteType = String(value ?? "");
  if (noteType === "observation" || noteType === "risk" || noteType === "action" || noteType === "reminder" || noteType === "lesson") {
    return noteType;
  }

  return "observation";
}

function asStatus(value: unknown): PersonalNoteStatus {
  const status = String(value ?? "");
  return status === "archived" ? "archived" : "active";
}

function asTargetItemType(value: unknown): PersonalNoteTargetItemType {
  const itemType = String(value ?? "");
  return itemType === "geo_feature" ? "geo_feature" : "geo_material";
}

export class SqlitePersonalNoteRepository implements PersonalNoteRepository {
  constructor(private readonly db: Database) {}

  async getById(id: string): Promise<PersonalNoteRecord | undefined> {
    const row = readFirstRow(
      this.db,
      `SELECT id, note_type, body, status, target_item_type, target_item_id, created_at, updated_at FROM personal_notes WHERE id = '${escapeSqlString(id)}'`
    );

    return row ? this.map(row) : undefined;
  }

  async listByTarget(targetItemType: PersonalNoteTargetItemType, targetItemId: string): Promise<PersonalNoteRecord[]> {
    return readRows(
      this.db,
      `
      SELECT id, note_type, body, status, target_item_type, target_item_id, created_at, updated_at
      FROM personal_notes
      WHERE target_item_type = '${escapeSqlString(targetItemType)}'
        AND target_item_id = '${escapeSqlString(targetItemId)}'
      ORDER BY updated_at DESC
      `
    ).map((row) => this.map(row));
  }

  async insert(record: PersonalNoteRecord): Promise<void> {
    this.db.run(`
      INSERT INTO personal_notes (id, note_type, body, status, target_item_type, target_item_id, created_at, updated_at)
      VALUES (
        '${escapeSqlString(record.id || createId("personal-note"))}',
        '${escapeSqlString(record.noteType)}',
        '${escapeSqlString(record.body)}',
        '${escapeSqlString(record.status)}',
        '${escapeSqlString(record.targetItemType)}',
        '${escapeSqlString(record.targetItemId)}',
        '${escapeSqlString(record.createdAt)}',
        '${escapeSqlString(record.updatedAt)}'
      )
    `);
  }

  async update(record: PersonalNoteRecord): Promise<void> {
    this.db.run(`
      UPDATE personal_notes
      SET note_type = '${escapeSqlString(record.noteType)}',
          body = '${escapeSqlString(record.body)}',
          status = '${escapeSqlString(record.status)}',
          updated_at = '${escapeSqlString(record.updatedAt)}'
      WHERE id = '${escapeSqlString(record.id)}'
    `);
  }

  async archive(id: string): Promise<void> {
    this.db.run(`
      UPDATE personal_notes
      SET status = 'archived',
          updated_at = '${nowIso()}'
      WHERE id = '${escapeSqlString(id)}'
    `);
  }

  async delete(id: string): Promise<void> {
    this.db.run(`DELETE FROM personal_notes WHERE id = '${escapeSqlString(id)}'`);
  }

  private map(row: Record<string, unknown>): PersonalNoteRecord {
    return {
      id: String(row.id),
      noteType: asNoteType(row.note_type),
      body: String(row.body ?? ""),
      status: asStatus(row.status),
      targetItemType: asTargetItemType(row.target_item_type),
      targetItemId: String(row.target_item_id ?? ""),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at)
    };
  }
}