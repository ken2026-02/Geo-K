import { createContext, useContext } from "react";
import type { Database } from "sql.js";

export type DatabasePersistenceMode = "persistent" | "memory_fallback";

export interface DatabaseRuntime {
  db: Database;
  schemaVersion: string;
  persistenceMode: DatabasePersistenceMode;
  startupWarnings: string[];
}

export const DatabaseContext = createContext<DatabaseRuntime | null>(null);

export function useDatabaseRuntime(): DatabaseRuntime {
  const value = useContext(DatabaseContext);
  if (!value) {
    throw new Error("Database runtime is not available. AppProviders must initialize the database first.");
  }

  return value;
}
