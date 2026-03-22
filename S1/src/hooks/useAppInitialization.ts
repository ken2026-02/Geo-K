import { useEffect, useState } from "react";

import { initializeDatabase } from "../data/db/initializeDatabase";
import type { DatabaseRuntime } from "../data/db/DatabaseContext";

let globalReady = false;
let globalError: string | undefined = undefined;
let globalDatabaseRuntime: DatabaseRuntime | null = null;
let initializationPromise: Promise<void> | null = null;
const INITIALIZATION_TIMEOUT_MS = 15000;

function withInitializationTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Initialization timed out after ${timeoutMs}ms. Check local database or WASM loading.`));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

export function useAppInitialization() {
  const [ready, setReady] = useState(globalReady);
  const [error, setError] = useState<string | undefined>(globalError);
  const [databaseRuntime, setDatabaseRuntime] = useState<DatabaseRuntime | null>(globalDatabaseRuntime);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function runInitialization() {
      try {
        const result = await withInitializationTimeout(initializeDatabase(), INITIALIZATION_TIMEOUT_MS);
        globalDatabaseRuntime = {
          db: result.db,
          schemaVersion: result.schemaVersion,
          persistenceMode: result.persistenceMode,
          startupWarnings: result.startupWarnings
        };
        globalReady = true;
        globalError = undefined;

        if (!isActive) {
          return;
        }

        setError(undefined);
        setDatabaseRuntime(globalDatabaseRuntime);
        setReady(true);
      } catch (initializationError) {
        globalReady = false;
        globalDatabaseRuntime = null;
        globalError = initializationError instanceof Error ? initializationError.message : "Unknown initialization error.";
        if (isActive) {
          setDatabaseRuntime(null);
          setReady(false);
          setError(globalError);
        }
      } finally {
        initializationPromise = null;
      }
    }

    if (globalReady && globalDatabaseRuntime) {
      setDatabaseRuntime(globalDatabaseRuntime);
      setReady(true);
      setError(undefined);
      return () => {
        isActive = false;
      };
    }

    if (!initializationPromise) {
      initializationPromise = runInitialization();
    } else {
      void initializationPromise.then(() => {
        if (!isActive) {
          return;
        }

        if (globalReady) {
          setDatabaseRuntime(globalDatabaseRuntime);
          setReady(true);
        } else if (globalError) {
          setError(globalError);
        }
      });
    }

    return () => {
      isActive = false;
    };
  }, [retryNonce]);

  function retryInitialization(): void {
    globalReady = false;
    globalError = undefined;
    globalDatabaseRuntime = null;
    initializationPromise = null;
    setReady(false);
    setError(undefined);
    setDatabaseRuntime(null);
    setRetryNonce((current) => current + 1);
  }

  return { ready, error, databaseRuntime, retryInitialization };
}

