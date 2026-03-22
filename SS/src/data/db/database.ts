import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";

import { getBinary, setBinary } from "../idb/storage";
import { DATABASE_IDB_KEY } from "./schemaVersion";

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

function resolveWasmUrl(fileName: string): string {
  const url = new URL(`../../../node_modules/sql.js/dist/${fileName}`, import.meta.url);
  if (typeof window === "undefined") {
    return decodeURIComponent(url.pathname.replace(/^\/([A-Za-z]:)/, "$1"));
  }

  return url.toString();
}

async function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: (fileName) => resolveWasmUrl(fileName)
    });
  }

  return sqlJsPromise;
}

export async function createDatabase(binary?: Uint8Array): Promise<Database> {
  const SQL = await getSqlJs();
  return new SQL.Database(binary);
}

export function exportDatabase(db: Database): Uint8Array {
  return db.export();
}

export async function persistDatabase(db: Database): Promise<void> {
  await setBinary(DATABASE_IDB_KEY, exportDatabase(db));
}

export async function loadPersistedDatabase(): Promise<Uint8Array | undefined> {
  return getBinary(DATABASE_IDB_KEY);
}
