import type { Database } from "sql.js";

export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

export function readFirstRow(db: Database, sql: string): Record<string, unknown> | undefined {
  const result = db.exec(sql);
  if (result.length === 0 || result[0].values.length === 0) {
    return undefined;
  }

  const [table] = result;
  const row = table.values[0] as unknown[];
  const record: Record<string, unknown> = {};
  table.columns.forEach((column: string, index: number) => {
    record[column] = row[index];
  });

  return record;
}

export function readRows(db: Database, sql: string): Record<string, unknown>[] {
  const result = db.exec(sql);
  if (result.length === 0) {
    return [];
  }

  const [table] = result;
  return table.values.map((row: unknown[]) => {
    const record: Record<string, unknown> = {};
    table.columns.forEach((column: string, index: number) => {
      record[column] = row[index];
    });
    return record;
  });
}
