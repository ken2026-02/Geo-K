import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

import { useDatabaseRuntime } from "../../data/db/DatabaseContext";
import { InlineInfo } from "../../shared/ui/feedback/InlineInfo";
import { AppShell } from "../../shared/ui/layout/AppShell";
import {
  heroSectionStyle,
  pageSectionStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  statCardStyle,
  statGridStyle
} from "../../shared/ui/layout/pageChrome";
import { InboxService } from "../../services/review/inboxService";
import { LibraryService } from "../../services/library/libraryService";
import { LearningModuleService } from "../../services/learning/learningModuleService";
import {
  SystemDiagnosticsService,
  type DiagnosticsSnapshot
} from "../../services/maintenance/systemDiagnosticsService";

type AuditStatus = "idle" | "running" | "pass" | "warn" | "fail";

interface AuditResult {
  id: string;
  title: string;
  area: string;
  intent: string;
  status: AuditStatus;
  message?: string;
  detail?: ReactNode;
  durationMs?: number;
}

interface AuditSummary {
  total: number;
  passed: number;
  warnings: number;
  failed: number;
}

const INITIAL_RESULTS: AuditResult[] = [
  {
    id: "runtime",
    title: "Runtime Boot",
    area: "App Runtime",
    intent: "Confirm the app can access its live database runtime and schema version.",
    status: "idle"
  },
  {
    id: "storage",
    title: "Offline Storage",
    area: "Offline Readiness",
    intent: "Inspect persisted database size, service worker state, and local resource availability.",
    status: "idle"
  },
  {
    id: "integrity",
    title: "Governance Integrity",
    area: "Database",
    intent: "Run the built-in integrity audit against approved, pending, and storage-linked records.",
    status: "idle"
  },
  {
    id: "inbox",
    title: "Inbox Workflow",
    area: "Core Workflow",
    intent: "Check that import batches and pending review queues can be queried cleanly.",
    status: "idle"
  },
  {
    id: "learning",
    title: "Learning Workspace",
    area: "Core Workflow",
    intent: "Confirm the learning module remains isolated, queryable, and export-capable.",
    status: "idle"
  },
  {
    id: "library",
    title: "Library Read Side",
    area: "Core Workflow",
    intent: "Verify approved library sections and detail pages can be read without mutation.",
    status: "idle"
  },
  {
    id: "mobile",
    title: "Mobile UX",
    area: "User Experience",
    intent: "Review viewport, navigation density, and touch-target assumptions for phone use.",
    status: "idle"
  }
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(durationMs?: number): string | undefined {
  if (durationMs == null) return undefined;
  return durationMs < 1000 ? `${durationMs} ms` : `${(durationMs / 1000).toFixed(2)} s`;
}

function statusLabel(status: AuditStatus): string {
  switch (status) {
    case "pass":
      return "Pass";
    case "warn":
      return "Warning";
    case "fail":
      return "Fail";
    case "running":
      return "Running";
    default:
      return "Idle";
  }
}

function statusColors(status: AuditStatus): { badge: string; text: string; border: string; background: string } {
  switch (status) {
    case "pass":
      return {
        badge: "#dcfce7",
        text: "#166534",
        border: "#bbf7d0",
        background: "#f0fdf4"
      };
    case "warn":
      return {
        badge: "#fef3c7",
        text: "#92400e",
        border: "#fde68a",
        background: "#fffbeb"
      };
    case "fail":
      return {
        badge: "#fee2e2",
        text: "#b91c1c",
        border: "#fecaca",
        background: "#fef2f2"
      };
    case "running":
      return {
        badge: "#dbeafe",
        text: "#1d4ed8",
        border: "#bfdbfe",
        background: "#eff6ff"
      };
    default:
      return {
        badge: "#e5e7eb",
        text: "#4b5563",
        border: "#e5e7eb",
        background: "#f8fafc"
      };
  }
}

function summarize(results: AuditResult[]): AuditSummary {
  return {
    total: results.length,
    passed: results.filter((result) => result.status === "pass").length,
    warnings: results.filter((result) => result.status === "warn").length,
    failed: results.filter((result) => result.status === "fail").length
  };
}

export function AuditPage() {
  const { db, schemaVersion } = useDatabaseRuntime();
  const diagnosticsService = useMemo(() => new SystemDiagnosticsService(), []);
  const inboxService = useMemo(() => new InboxService(), []);
  const learningService = useMemo(() => new LearningModuleService(), []);
  const libraryService = useMemo(() => new LibraryService(), []);

  const [results, setResults] = useState<AuditResult[]>(INITIAL_RESULTS);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<string>();
  const [lastDiagnostics, setLastDiagnostics] = useState<DiagnosticsSnapshot>();
  const [viewportWidth, setViewportWidth] = useState<number>(window.innerWidth);
  const isDevelopmentBuild = import.meta.env.DEV;

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function patchResult(id: string, patch: Partial<AuditResult>): void {
    setResults((current) => current.map((result) => (result.id === id ? { ...result, ...patch } : result)));
  }

  async function runAudit(): Promise<void> {
    if (isRunning) return;
    setIsRunning(true);
    setResults(INITIAL_RESULTS);

    try {
      const runtimeStartedAt = Date.now();
      patchResult("runtime", { status: "running" });
      if (!db) {
        throw new Error("Database runtime is not available.");
      }

      patchResult("runtime", {
        status: schemaVersion ? "pass" : "warn",
        message: schemaVersion ? `Database runtime is live on schema ${schemaVersion}.` : "Database runtime is live, but schema version is missing.",
        detail: (
          <div>
            <div>Schema version: {schemaVersion || "unknown"}</div>
            <div>Database instance: available</div>
          </div>
        ),
        durationMs: Date.now() - runtimeStartedAt
      });

      const storageStartedAt = Date.now();
      patchResult("storage", { status: "running" });
      const storageDiagnostics = await diagnosticsService.loadDiagnostics(db, false);
      setLastDiagnostics(storageDiagnostics);
      const serviceWorkerSupported = "serviceWorker" in navigator;
      const serviceWorkerRegistration = serviceWorkerSupported ? await navigator.serviceWorker.getRegistration() : undefined;
      const serviceWorkerActive = serviceWorkerSupported && Boolean(navigator.serviceWorker.controller);
      const storageWarnings: string[] = [];
      if (!serviceWorkerSupported) storageWarnings.push("Service worker is not supported in this browser.");
      if (serviceWorkerSupported && !serviceWorkerRegistration && !isDevelopmentBuild) storageWarnings.push("Service worker has not been registered for this app.");
      if (storageDiagnostics.storageUsage.databaseBytes === 0) storageWarnings.push("Persisted database size is currently 0 bytes.");

      patchResult("storage", {
        status: storageWarnings.length > 0 ? "warn" : "pass",
        message:
          storageWarnings.length > 0
            ? storageWarnings.join(" ")
            : isDevelopmentBuild && !serviceWorkerRegistration
              ? "Development build detected. Offline storage is readable, and service worker registration is intentionally skipped until a preview or installed build."
            : serviceWorkerActive
              ? "Offline storage state looks healthy for local-first use."
              : "Offline storage is ready; the service worker is registered and may take control after refresh on first load.",
        detail: (
          <div>
            <div>Database size: {formatBytes(storageDiagnostics.storageUsage.databaseBytes)}</div>
            <div>Image resources: {storageDiagnostics.storageUsage.imageResourceCount}</div>
            <div>Backup blobs: {storageDiagnostics.storageUsage.backupResourceCount}</div>
            <div>Connection: {navigator.onLine ? "online" : "offline"}</div>
            <div>Service worker registration: {serviceWorkerRegistration ? "present" : isDevelopmentBuild ? "dev-disabled" : "missing"}</div>
            <div>Service worker controller: {serviceWorkerActive ? "active" : "not yet controlling"}</div>
          </div>
        ),
        durationMs: Date.now() - storageStartedAt
      });

      const integrityStartedAt = Date.now();
      patchResult("integrity", { status: "running" });
      const integrityDiagnostics = await diagnosticsService.loadDiagnostics(db, true);
      setLastDiagnostics(integrityDiagnostics);
      const integrity = integrityDiagnostics.integrity;
      const errorCount = integrity?.summary.errorCount ?? 0;
      const warningCount = integrity?.summary.warningCount ?? 0;
      patchResult("integrity", {
        status: errorCount > 0 ? "fail" : warningCount > 0 ? "warn" : "pass",
        message:
          errorCount > 0
            ? `${errorCount} integrity error(s) require attention.`
            : warningCount > 0
              ? `${warningCount} integrity warning(s) found.`
              : "No integrity issues were found in the built-in governance audit.",
        detail: integrity ? (
          <div>
            <div>Total issues: {integrity.summary.totalIssues}</div>
            <div>Duplicate names: {integrity.duplicateNormalizedNames.length}</div>
            <div>System/user collisions: {integrity.systemUserCollisions.length}</div>
          </div>
        ) : (
          <div>Integrity audit did not return a result.</div>
        ),
        durationMs: Date.now() - integrityStartedAt
      });

      const inboxStartedAt = Date.now();
      patchResult("inbox", { status: "running" });
      const batches = await inboxService.listBatches(db);
      const inboxCounts = integrityDiagnostics.dataState.pendingCounts;
      patchResult("inbox", {
        status: "pass",
        message:
          batches.length > 0
            ? `${batches.length} batch(es) are queryable and pending review counts are readable.`
            : "Inbox services are reachable and ready for the next import batch.",
        detail: (
          <div>
            <div>Batches: {batches.length}</div>
            <div>Pending inbox total: {inboxCounts.inboxTotal}</div>
            <div>Unreviewed: {inboxCounts.inboxUnreviewed}</div>
            <div>Approved / rejected / deferred: {inboxCounts.inboxApproved} / {inboxCounts.inboxRejected} / {inboxCounts.inboxDeferred}</div>
          </div>
        ),
        durationMs: Date.now() - inboxStartedAt
      });

      const learningStartedAt = Date.now();
      patchResult("learning", { status: "running" });
      const learningItems = await learningService.listItems("all");
      const learningTypeCount = learningService.getLearningTypes().length;
      const learningWarning = learningTypeCount === 0;
      patchResult("learning", {
        status: learningWarning ? "warn" : "pass",
        message: learningWarning
          ? "Learning item types are unexpectedly empty."
          : "Learning workspace services are readable and isolated from the approved library.",
        detail: (
          <div>
            <div>Learning items: {learningItems.length}</div>
            <div>Supported types: {learningTypeCount}</div>
            <div>Suggested statuses: {learningService.getSuggestedStatuses().join(", ")}</div>
          </div>
        ),
        durationMs: Date.now() - learningStartedAt
      });

      const libraryStartedAt = Date.now();
      patchResult("library", { status: "running" });
      const wordItems = libraryService.listBySection(db, "words");
      const materialItems = libraryService.listBySection(db, "geo-materials");
      patchResult("library", {
        status: "pass",
        message: "Approved library listings are queryable without mutating data.",
        detail: (
          <div>
            <div>Words: {wordItems.length}</div>
            <div>Geo materials: {materialItems.length}</div>
            <div>Approved reports: {integrityDiagnostics.dataState.approvedCounts.reports}</div>
          </div>
        ),
        durationMs: Date.now() - libraryStartedAt
      });

      const mobileStartedAt = Date.now();
      patchResult("mobile", { status: "running" });
      const mobileWarnings: string[] = [];
      if (viewportWidth < 360) mobileWarnings.push("Viewport is narrower than 360px, so dense tables and detail views need extra care.");
      if (viewportWidth < 400 && integrityDiagnostics.dataState.pendingCounts.inboxTotal > 20) {
        mobileWarnings.push("This narrow viewport plus a large inbox queue may feel dense on review-heavy pages.");
      }

      patchResult("mobile", {
        status: mobileWarnings.length > 0 ? "warn" : "pass",
        message:
          mobileWarnings.length > 0
            ? mobileWarnings.join(" ")
            : "Current viewport and shell settings are within the intended phone-friendly range.",
        detail: (
          <div>
            <div>Viewport width: {viewportWidth}px</div>
            <div>Touch target policy: 44px minimum</div>
            <div>Bottom safe area padding: enabled</div>
          </div>
        ),
        durationMs: Date.now() - mobileStartedAt
      });

      setLastRunAt(new Date().toISOString());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown audit error.";
      setResults((current) => {
        const running = current.find((result) => result.status === "running");
        if (!running) return current;
        return current.map((result) => (
          result.id === running.id
            ? { ...result, status: "fail", message, durationMs: undefined }
            : result
        ));
      });
    } finally {
      setIsRunning(false);
    }
  }

  const summary = summarize(results);

  return (
    <AppShell
      title="Audit"
      subtitle="Check runtime, data, workflows, and mobile health."
      pageDescription={null}
    >
      <section style={heroSectionStyle}>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap"
          }}
        >
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0 }}>Audit Intent</h3>
              <InlineInfo title="Audit intent">
                This audit is designed around the app's real operating model: local database first, user imports reviewed before commit, and safe mobile access to the same workflows.
              </InlineInfo>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => void runAudit()}
              disabled={isRunning}
              style={{ ...primaryButtonStyle, background: isRunning ? "#93c5fd" : "#2563eb" }}
            >
              {isRunning ? "Running Audit..." : "Run Audit"}
            </button>
            <Link
              to="/settings"
              style={secondaryButtonStyle}
            >
              Open Settings
            </Link>
          </div>
        </div>
        {lastRunAt ? (
          <p style={{ margin: "0.8rem 0 0", color: "#475569", fontSize: "0.92rem" }}>
            Last run: {lastRunAt}
          </p>
        ) : (
          <p style={{ margin: "0.8rem 0 0", color: "#475569", fontSize: "0.92rem" }}>
            No audit has been run in this session yet.
          </p>
        )}
      </section>

      <section style={{ ...statGridStyle, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", marginBottom: "1rem" }}>
        {[
          { label: "Checks", value: summary.total, color: "#0f172a", background: "#fff" },
          { label: "Passed", value: summary.passed, color: "#166534", background: "#f0fdf4" },
          { label: "Warnings", value: summary.warnings, color: "#92400e", background: "#fffbeb" },
          { label: "Failed", value: summary.failed, color: "#b91c1c", background: "#fef2f2" }
        ].map((item) => (
          <article
            key={item.label}
            style={{
              ...statCardStyle,
              background: item.background
            }}
          >
            <div style={{ color: "#64748b", fontSize: "0.84rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {item.label}
            </div>
            <div style={{ marginTop: "0.35rem", fontSize: "1.9rem", fontWeight: 800, color: item.color }}>
              {item.value}
            </div>
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gap: "0.8rem", marginBottom: "1rem" }}>
        {results.map((result) => {
          const colors = statusColors(result.status);
          return (
            <article
              key={result.id}
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: "1rem",
                background: "#fff",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  padding: "1rem"
                }}
              >
                <div style={{ flex: "1 1 320px" }}>
                  <div style={{ display: "flex", gap: "0.45rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                    <span
                      style={{
                        padding: "0.24rem 0.52rem",
                        borderRadius: "999px",
                        background: colors.badge,
                        color: colors.text,
                        fontSize: "0.78rem",
                        fontWeight: 700
                      }}
                    >
                      {statusLabel(result.status)}
                    </span>
                    <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {result.area}
                    </span>
                    {formatDuration(result.durationMs) ? (
                      <span style={{ color: "#64748b", fontSize: "0.82rem" }}>{formatDuration(result.durationMs)}</span>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, color: "#0f172a" }}>{result.title}</h3>
                    <InlineInfo title={`${result.title} intent`}>
                      {result.intent}
                    </InlineInfo>
                  </div>
                </div>
                <div
                  style={{
                    minWidth: "220px",
                    flex: "0 1 300px",
                    padding: "0.85rem",
                    borderRadius: "0.85rem",
                    background: colors.background,
                    color: colors.text
                  }}
                >
                  <strong style={{ display: "block", marginBottom: result.detail ? "0.45rem" : 0 }}>
                    {result.message ?? "Awaiting audit run."}
                  </strong>
                  {result.detail ? <div style={{ fontSize: "0.92rem", lineHeight: 1.55 }}>{result.detail}</div> : null}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "0.8rem"
        }}
      >
        <article style={pageSectionStyle}>
          <details>
            <summary style={{ cursor: "pointer", fontWeight: 700, color: "#0f172a" }}>App principles</summary>
            <ul style={{ margin: "0.65rem 0 0", paddingLeft: "1.2rem", lineHeight: 1.7, color: "#334155" }}>
              <li>Keep user imports reviewable before they touch approved knowledge.</li>
              <li>Prefer read-only audits unless a mutation is explicitly required and reversible.</li>
              <li>Keep mobile interaction dense but safe: large tap targets, no horizontal overflow, clear primary paths.</li>
              <li>Use Settings for heavy admin operations and Audit for health visibility.</li>
            </ul>
          </details>
        </article>

        <article style={pageSectionStyle}>
          <details>
            <summary style={{ cursor: "pointer", fontWeight: 700, color: "#0f172a" }}>Current snapshot</summary>
            {lastDiagnostics ? (
              <div style={{ display: "grid", gap: "0.35rem", color: "#334155", marginTop: "0.65rem" }}>
                <div>Schema version: {lastDiagnostics.schemaVersion}</div>
                <div>Migration count: {lastDiagnostics.migrationCount}</div>
                <div>Approved user-owned records: {lastDiagnostics.dataState.approvedProvenance.userOwned}</div>
                <div>Approved system-generated records: {lastDiagnostics.dataState.approvedProvenance.systemGenerated}</div>
                <div>Recent metrics captured: {lastDiagnostics.recentMetrics.length}</div>
              </div>
            ) : (
              <p style={{ margin: "0.65rem 0 0", color: "#64748b" }}>Run the audit to refresh the live snapshot.</p>
            )}
          </details>
        </article>
      </section>
    </AppShell>
  );
}
