import type { PropsWithChildren } from "react";

import { useAppInitialization } from "../../hooks/useAppInitialization";
import { DatabaseContext } from "../../data/db/DatabaseContext";

export function AppProviders({ children }: PropsWithChildren) {
  const { ready, error, databaseRuntime } = useAppInitialization();

  if (error) {
    return <div style={{ padding: "1rem" }}>Initialization failed: {error}</div>;
  }

  if (!ready || !databaseRuntime) {
    return <div style={{ padding: "1rem" }}>Initializing Engineering Knowledge Vault...</div>;
  }

  return <DatabaseContext.Provider value={databaseRuntime}>{children}</DatabaseContext.Provider>;
}
