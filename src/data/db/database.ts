import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";

import { getBinary, setBinary } from "../idb/storage";
import { DATABASE_IDB_KEY } from "./schemaVersion";

let sqlJsPromise: Promise<SqlJsStatic> | null = null;
let browserSqlWasmUrlPromise: Promise<string | undefined> | null = null;
const SQL_JS_SOURCE_TIMEOUT_MS = 4000;

function isBrowserRuntime(): boolean {
  return typeof window !== "undefined";
}

function getNodeSqlWasmUrl(): string {
  const fileUrl = new URL("../../../node_modules/sql.js/dist/sql-wasm.wasm", import.meta.url);
  const decodedPath = decodeURIComponent(fileUrl.pathname);
  return /^\/[A-Za-z]:\//.test(decodedPath) ? decodedPath.slice(1) : decodedPath;
}

async function getBrowserSqlWasmUrl(): Promise<string | undefined> {
  if (!isBrowserRuntime()) {
    return undefined;
  }

  if (!browserSqlWasmUrlPromise) {
    browserSqlWasmUrlPromise = (async () => {
      try {
        // @ts-ignore - Vite resolves the asset URL at build time.
        const assetModule = await import("sql.js/dist/sql-wasm.wasm?url");
        return assetModule.default as string;
      } catch (error) {
        console.warn("Unable to resolve bundled sql.js WASM asset URL.", error);
        return undefined;
      }
    })();
  }

  return browserSqlWasmUrlPromise;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        globalThis.clearTimeout(timer);
        reject(error);
      });
  });
}

async function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    const tryInit = async (): Promise<SqlJsStatic> => {
      const browserAssetUrl = await getBrowserSqlWasmUrl();
      const allSources = isBrowserRuntime()
        ? [
          browserAssetUrl ? { name: "Vite Asset", url: browserAssetUrl, isFullUrl: true } : null,
          { name: "Local Public", url: "/sql-wasm.wasm", isFullUrl: true },
          { name: "jsDelivr", url: "https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/", isFullUrl: false },
          { name: "unpkg", url: "https://unpkg.com/sql.js@1.13.0/dist/", isFullUrl: false },
          { name: "cdnjs", url: "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/", isFullUrl: false }
        ].filter((source): source is { name: string; url: string; isFullUrl: boolean } => source !== null)
        : [
          { name: "Node Local Public", url: getNodeSqlWasmUrl(), isFullUrl: true }
        ];

      // Prioritize local sources when offline
      const sources = !isBrowserRuntime() || navigator.onLine
        ? allSources
        : allSources.filter((source) => source.name === "Local Public");

      for (const source of sources) {
        try {
          console.log(`Attempting to load sql.js WASM from ${source.name}: ${source.url}`);
          
          const config = source.isFullUrl 
            ? { locateFile: () => source.url }
            : { locateFile: (file: string) => `${source.url}${file}` };

          const result = await withTimeout(
            initSqlJs(config),
            SQL_JS_SOURCE_TIMEOUT_MS,
            `Loading sql.js from ${source.name}`
          );
          console.log(`Successfully loaded sql.js WASM from ${source.name}`);
          return result;
        } catch (err) {
          console.warn(`Failed to load sql.js from ${source.name}:`, err);
        }
      }
      
      throw new Error('Failed to load sql.js WASM from all available sources');
    };

    sqlJsPromise = tryInit();
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
