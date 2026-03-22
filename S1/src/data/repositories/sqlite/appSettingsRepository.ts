import type { Database } from "sql.js";

import type { AppSettingRecord, AppSettingsRepository } from "../interfaces";
import { escapeSqlString, readFirstRow } from "./sqliteHelpers";

export class SqliteAppSettingsRepository implements AppSettingsRepository {
  constructor(private readonly db: Database) {}

  async getById(id: string): Promise<AppSettingRecord | undefined> {
    const row = readFirstRow(this.db, `SELECT id, setting_key, setting_value, updated_at FROM app_settings WHERE id = '${escapeSqlString(id)}'`);
    return row ? this.map(row) : undefined;
  }

  async getByKey(settingKey: string): Promise<AppSettingRecord | undefined> {
    const row = readFirstRow(this.db, `SELECT id, setting_key, setting_value, updated_at FROM app_settings WHERE setting_key = '${escapeSqlString(settingKey)}'`);
    return row ? this.map(row) : undefined;
  }

  async insert(record: AppSettingRecord): Promise<void> {
    this.db.run(`
      INSERT INTO app_settings (id, setting_key, setting_value, updated_at)
      VALUES ('${escapeSqlString(record.id)}', '${escapeSqlString(record.settingKey)}', ${record.settingValue ? `'${escapeSqlString(record.settingValue)}'` : "NULL"}, '${escapeSqlString(record.updatedAt)}')
      ON CONFLICT(setting_key) DO UPDATE SET
        setting_value = excluded.setting_value,
        updated_at = excluded.updated_at
    `);
  }

  async update(record: AppSettingRecord): Promise<void> {
    this.db.run(`
      UPDATE app_settings
      SET setting_key = '${escapeSqlString(record.settingKey)}',
          setting_value = ${record.settingValue ? `'${escapeSqlString(record.settingValue)}'` : "NULL"},
          updated_at = '${escapeSqlString(record.updatedAt)}'
      WHERE id = '${escapeSqlString(record.id)}'
    `);
  }

  async upsert(record: AppSettingRecord): Promise<void> {
    await this.insert(record);
  }

  async delete(id: string): Promise<void> {
    this.db.run(`DELETE FROM app_settings WHERE id = '${escapeSqlString(id)}'`);
  }

  private map(row: Record<string, unknown>): AppSettingRecord {
    return {
      id: String(row.id),
      settingKey: String(row.setting_key),
      settingValue: row.setting_value == null ? undefined : String(row.setting_value),
      updatedAt: String(row.updated_at)
    };
  }
}
