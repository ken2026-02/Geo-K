import { useEffect, useState } from "react";

import { initializeDatabase } from "../data/db/initializeDatabase";
import type { DatabaseRuntime } from "../data/db/DatabaseContext";

export function useAppInitialization() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const [databaseRuntime, setDatabaseRuntime] = useState<DatabaseRuntime | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function runInitialization() {
      try {
        const result = await initializeDatabase();
        if (cancelled) {
          return;
        }

        setDatabaseRuntime({ db: result.db, schemaVersion: result.schemaVersion });
        setReady(true);
      } catch (initializationError) {
        if (cancelled) {
          return;
        }

        setError(initializationError instanceof Error ? initializationError.message : "Unknown initialization error.");
      }
    }

    void runInitialization();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, error, databaseRuntime };
}
