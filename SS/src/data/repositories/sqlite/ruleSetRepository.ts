import type { Database } from "sql.js";

import type { RuleSetRecord, RuleSetRepository } from "../interfaces";
import { escapeSqlString, readFirstRow, readRows } from "./sqliteHelpers";

export class SqliteRuleSetRepository implements RuleSetRepository {
  constructor(private readonly db: Database) {}

  async getById(id: string): Promise<RuleSetRecord | undefined> {
    const row = readFirstRow(this.db, `SELECT id, rule_name, rule_type, version, rule_content, schema_version, is_active, created_at, updated_at FROM rulesets WHERE id = '${escapeSqlString(id)}'`);
    return row ? this.map(row) : undefined;
  }

  async listActive(): Promise<RuleSetRecord[]> {
    return readRows(this.db, "SELECT id, rule_name, rule_type, version, rule_content, schema_version, is_active, created_at, updated_at FROM rulesets WHERE is_active = 1 ORDER BY rule_name ASC").map((row) => this.map(row));
  }

  async insert(record: RuleSetRecord): Promise<void> {
    this.db.run(`
      INSERT INTO rulesets (id, rule_name, rule_type, version, rule_content, schema_version, is_active, created_at, updated_at)
      VALUES ('${escapeSqlString(record.id)}', '${escapeSqlString(record.ruleName)}', '${escapeSqlString(record.ruleType)}', '${escapeSqlString(record.version)}', '${escapeSqlString(record.ruleContent)}', ${record.schemaVersion ? `'${escapeSqlString(record.schemaVersion)}'` : "NULL"}, ${record.isActive ? 1 : 0}, '${escapeSqlString(record.createdAt)}', '${escapeSqlString(record.updatedAt)}')
      -- Seed/bootstrap writes must remain idempotent: keep deterministic ids and
      -- update the existing row on repeated initialization.
      ON CONFLICT(id) DO UPDATE SET
        rule_name = excluded.rule_name,
        rule_type = excluded.rule_type,
        version = excluded.version,
        rule_content = excluded.rule_content,
        schema_version = excluded.schema_version,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `);
  }

  async update(record: RuleSetRecord): Promise<void> {
    this.db.run(`
      UPDATE rulesets
      SET rule_name = '${escapeSqlString(record.ruleName)}',
          rule_type = '${escapeSqlString(record.ruleType)}',
          version = '${escapeSqlString(record.version)}',
          rule_content = '${escapeSqlString(record.ruleContent)}',
          schema_version = ${record.schemaVersion ? `'${escapeSqlString(record.schemaVersion)}'` : "NULL"},
          is_active = ${record.isActive ? 1 : 0},
          updated_at = '${escapeSqlString(record.updatedAt)}'
      WHERE id = '${escapeSqlString(record.id)}'
    `);
  }

  async delete(id: string): Promise<void> {
    this.db.run(`DELETE FROM rulesets WHERE id = '${escapeSqlString(id)}'`);
  }

  private map(row: Record<string, unknown>): RuleSetRecord {
    return {
      id: String(row.id),
      ruleName: String(row.rule_name),
      ruleType: String(row.rule_type),
      version: String(row.version),
      ruleContent: String(row.rule_content),
      schemaVersion: row.schema_version == null ? undefined : String(row.schema_version),
      isActive: Number(row.is_active) === 1,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at)
    };
  }
}

