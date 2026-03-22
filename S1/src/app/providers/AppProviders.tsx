import type { PropsWithChildren } from "react";

import { useAppInitialization } from "../../hooks/useAppInitialization";
import { DatabaseContext } from "../../data/db/DatabaseContext";

export function AppProviders({ children }: PropsWithChildren) {
  const { ready, error, databaseRuntime, retryInitialization } = useAppInitialization();

  if (error) {
    return (
      <div className="ekv-splash-shell">
        <div className="ekv-splash-center">
          <div className="ekv-startup-error-card">
            <div className="ekv-startup-badge">
              Startup Error
            </div>
            <h1 className="mt-4 text-[1.45rem] font-extrabold tracking-tight text-slate-950">Initialization failed</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Retry will attempt to reload the local database engine and storage without needing a full page refresh.
            </p>
            <button type="button" onClick={retryInitialization} className="ekv-button-secondary mt-5">
              Retry initialization
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ready || !databaseRuntime) {
    return (
      <div className="ekv-splash-shell">
        <div className="ekv-splash-center">
          <div className="ekv-splash-card">
            <div className="ekv-splash-mark">KV</div>
            <div className="ekv-splash-kicker">Engineering Knowledge Vault</div>
            <div className="ekv-splash-title">Loading your workspace</div>
            <p className="ekv-splash-copy">
              Initializing the local database engine, checking schema state, and reconnecting your offline library.
            </p>
            <div className="ekv-splash-progress" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={databaseRuntime}>
      {databaseRuntime.startupWarnings.length > 0 ? (
        <div className="ekv-startup-warning">
          <div className="mx-auto grid max-w-6xl gap-1.5">
            <strong className="text-[0.95rem]">
              {databaseRuntime.persistenceMode === "memory_fallback" ? "Recovery mode active" : "Startup warning"}
            </strong>
            {databaseRuntime.startupWarnings.map((warning) => (
              <div key={warning} className="text-[0.92rem] leading-6">{warning}</div>
            ))}
          </div>
        </div>
      ) : null}
      {children}
    </DatabaseContext.Provider>
  );
}
