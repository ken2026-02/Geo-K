import { type ChangeEvent, useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { useDatabaseRuntime } from "../../data/db/DatabaseContext";
import type { BackupSnapshotRecord } from "../../data/repositories/interfaces";
import { FeedbackBanner } from "../../shared/ui/feedback/FeedbackBanner";
import { InlineInfo } from "../../shared/ui/feedback/InlineInfo";
import { AppShell } from "../../shared/ui/layout/AppShell";
import {
  actionRowStyle,
  heroSectionStyle,
  mutedSectionStyle,
  pageSectionStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  subtleButtonStyle
} from "../../shared/ui/layout/pageChrome";
import {
  BackupOrchestrationService,
  type BackupManifest,
  type RestoreValidationPreview
} from "../../services/backup/backupOrchestrationService";
import type { DiagnosticsSnapshot } from "../../services/maintenance/systemDiagnosticsService";
import { SystemDiagnosticsService } from "../../services/maintenance/systemDiagnosticsService";
import {
  BundledSystemKnowledgeService,
  type BundledSystemKnowledgeExecutionResult,
  type BundledSystemKnowledgeValidationResult
} from "../../services/systemKnowledge/bundledSystemKnowledgeService";

function renderCounts(counts: Record<string, number>) {
  return (
    <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
      {Object.entries(counts).map(([key, value]) => (
        <li key={key}>{key}: {value}</li>
      ))}
    </ul>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function formatCategoryLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
function inferPackVersion(packId?: string): string {
  if (!packId) {
    return "unknown";
  }

  const match = packId.match(/(v\d+(?:\.\d+)*)$/i);
  return match ? match[1] : "derived-from-id";
}

type SystemApplyStatus = "idle" | "validation_failed" | "validation_passed" | "applying" | "apply_failed" | "applied";

function getSystemApplyStatusLabel(status: SystemApplyStatus): string {
  switch (status) {
    case "validation_failed":
      return "Blocked by validation";
    case "validation_passed":
      return "Ready to apply";
    case "applying":
      return "Applying trusted pack";
    case "apply_failed":
      return "Injection failed";
    case "applied":
      return "Injection succeeded";
    default:
      return "Not run";
  }
}

const libraryVerificationTerms = ["fault gouge", "clay infill", "quartz vein", "detached block", "foliation plane", "ravelling"] as const;

export function SettingsPage() {
  const { db, schemaVersion } = useDatabaseRuntime();
  const [snapshots, setSnapshots] = useState<BackupSnapshotRecord[]>([]);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [latestManifest, setLatestManifest] = useState<BackupManifest>();
  const [restoreFile, setRestoreFile] = useState<File>();
  const [restorePreview, setRestorePreview] = useState<RestoreValidationPreview>();
  const [diagnostics, setDiagnostics] = useState<DiagnosticsSnapshot>();
  const [systemValidation, setSystemValidation] = useState<BundledSystemKnowledgeValidationResult>();
  const [systemInjectionResult, setSystemInjectionResult] = useState<BundledSystemKnowledgeExecutionResult>();
  const [systemApplyStatus, setSystemApplyStatus] = useState<SystemApplyStatus>("idle");
  const [systemApplyError, setSystemApplyError] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showContractHelp, setShowContractHelp] = useState(false);
  const backupService = new BackupOrchestrationService();
  const diagnosticsService = new SystemDiagnosticsService();
  const systemKnowledgeService = new BundledSystemKnowledgeService();
  const trustedSystemPack = systemKnowledgeService.listTrustedPacks()[0];

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swActive, setSwActive] = useState(!!(navigator.serviceWorker && navigator.serviceWorker.controller));

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleSwChange = () => setSwActive(!!(navigator.serviceWorker && navigator.serviceWorker.controller));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", handleSwChange);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("controllerchange", handleSwChange);
      }
    };
  }, []);

  async function refreshSnapshots(): Promise<void> {
    setSnapshots(await backupService.listSnapshots(db));
  }

  async function refreshDiagnostics(includeIntegrity = false): Promise<void> {
    setDiagnostics(await diagnosticsService.loadDiagnostics(db, includeIntegrity));
  }

  useEffect(() => {
    void refreshSnapshots();
    void refreshDiagnostics(false);
  }, [db]);

  function clearFeedback(): void {
    setMessage(undefined);
    setError(undefined);
  }

  function clearSystemFeedback(): void {
    setSystemInjectionResult(undefined);
    setSystemApplyError(undefined);
    setSystemApplyStatus("idle");
  }

  async function handleCreateBackup(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();

    try {
      const result = await backupService.exportFullBackup(db);
      const downloadUrl = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = result.fileName;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);

      setLatestManifest(result.manifest);
      setMessage(`Full backup exported: ${result.fileName}`);
      await refreshSnapshots();
      await refreshDiagnostics(false);
    } catch (backupError) {
      setError(backupError instanceof Error ? backupError.message : "Backup export failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRestoreFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();

    const file = event.target.files?.[0];
    setRestoreFile(file);
    setRestorePreview(undefined);

    if (!file) {
      setIsProcessing(false);
      return;
    }

    try {
      const preview = await backupService.previewRestore(file);
      setRestorePreview(preview);
      if (preview.state === "invalid") {
        setError("Restore preview failed. Review the validation errors below.");
      }
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Restore preview failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRestore(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();

    if (!restoreFile) {
      setError("Select a backup ZIP file first.");
      setIsProcessing(false);
      return;
    }

    if (!restorePreview || restorePreview.state === "invalid") {
      setError("Restore preview must be valid before replace restore can run.");
      setIsProcessing(false);
      return;
    }

    try {
      const result = await backupService.restoreFullReplace(db, restoreFile);
      setMessage(`Restore completed from ${restoreFile.name}. Pre-restore snapshot: ${result.snapshotRecord.snapshotName}. Reloading app...`);
      setTimeout(() => window.location.reload(), 1200);
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Restore failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRunIntegrity(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();

    try {
      await refreshDiagnostics(true);
      setMessage("Integrity checks completed.");
    } catch (integrityError) {
      setError(integrityError instanceof Error ? integrityError.message : "Integrity check failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleValidateTrustedSystemKnowledge(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    clearSystemFeedback();
    setSystemValidation(undefined);

    try {
      if (!trustedSystemPack) {
        setSystemApplyError("No trusted bundled system knowledge pack is configured.");
        setSystemApplyStatus("validation_failed");
        return;
      }

      const validation = systemKnowledgeService.validateTrustedPack(trustedSystemPack.id);
      setSystemValidation(validation);

      if (validation.validationReport.state === "invalid") {
        setSystemApplyStatus("validation_failed");
        return;
      }

      setSystemApplyStatus("validation_passed");
    } catch (validationError) {
      setSystemApplyStatus("validation_failed");
      setSystemApplyError(validationError instanceof Error ? validationError.message : "System knowledge validation failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleApplyTrustedSystemKnowledge(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    setSystemInjectionResult(undefined);
    setSystemApplyError(undefined);

    try {
      if (!trustedSystemPack) {
        setSystemApplyError("No trusted bundled system knowledge pack is configured.");
        setSystemApplyStatus("apply_failed");
        return;
      }

      const validation = systemKnowledgeService.validateTrustedPack(trustedSystemPack.id);
      setSystemValidation(validation);

      if (validation.validationReport.state === "invalid") {
        setSystemApplyStatus("validation_failed");
        setSystemApplyError("Built-in pack validation failed. Injection was not run.");
        return;
      }

      setSystemApplyStatus("applying");

      const result = await systemKnowledgeService.injectTrustedPack(db, trustedSystemPack.id);
      setSystemInjectionResult(result);
      setSystemApplyStatus("applied");
      setMessage(`System knowledge injected: ${result.packName}. Snapshot created: ${result.snapshotName}.`);
      await refreshSnapshots();
      await refreshDiagnostics(false);
    } catch (injectionError) {
      setSystemApplyStatus("apply_failed");
      setSystemApplyError(injectionError instanceof Error ? injectionError.message : "System knowledge injection failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  const systemInjectedCounts = systemInjectionResult
    ? {
        source_documents: systemInjectionResult.injection.injected.sourceDocuments,
        words: systemInjectionResult.injection.injected.words,
        phrases: systemInjectionResult.injection.injected.phrases,
        sentences: systemInjectionResult.injection.injected.sentences,
        geo_materials: systemInjectionResult.injection.injected.geoMaterials,
        geo_features: systemInjectionResult.injection.injected.geoFeatures,
        strategies: systemInjectionResult.injection.injected.strategies,
        requirements: systemInjectionResult.injection.injected.requirements,
        methods: systemInjectionResult.injection.injected.methods,
        relations: systemInjectionResult.injection.injected.itemRelations,
        item_sources: systemInjectionResult.injection.injected.itemSources,
        images: systemInjectionResult.injection.injected.images
      }
    : undefined;

  const validationOutcome = systemValidation
    ? systemValidation.validationReport.state === "valid"
      ? "success"
      : "failure"
    : undefined;

  const injectionOutcome = systemApplyStatus === "applied"
    ? "success"
    : systemApplyStatus === "apply_failed"
      ? "failure"
      : undefined;

  return (
    <AppShell
      title="Settings"
      subtitle="Diagnostics, backups, restore tools, and internal admin actions."
      pageDescription={null}
    >
      <section style={heroSectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0 }}>Runtime Status</h3>
              <InlineInfo title="Settings runtime">
                Use this page for diagnostics, backups, restore validation, and bundled system knowledge maintenance.
              </InlineInfo>
            </div>
            <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.92rem" }}>
              {isOnline ? "Online" : "Offline"} | {swActive ? "Offline ready" : "Service worker starting"}
            </p>
          </div>
          <Link to="/audit" style={primaryButtonStyle}>
            Open Audit
          </Link>
        </div>
      </section>

      {message ? <FeedbackBanner tone="success" message={message} /> : null}
      {error ? <FeedbackBanner tone="error" message={error} /> : null}

      <details style={{ ...mutedSectionStyle, border: "1px solid #bfdbfe", background: "#eff6ff" }} open={showContractHelp} onToggle={(event) => setShowContractHelp((event.currentTarget as HTMLDetailsElement).open)}>
        <summary style={{ cursor: "pointer", fontWeight: 700, color: "#1e3a8a" }}>Contract help</summary>
        <p style={{ margin: "0.6rem 0 0", color: "#1f2937", lineHeight: 1.45 }}>
          Learning Pack v1 is the fast-ingest path. System Pack v1 is the strict structured path used by internal tools.
        </p>
        <p style={{ margin: "0.45rem 0 0", color: "#475569", fontSize: "0.92rem", lineHeight: 1.45 }}>
          Samples: <a href="/pack-samples/learning-pack-v1.sample.json" target="_blank" rel="noreferrer">Learning Pack v1</a> | <a href="/pack-samples/system-pack-v1.sample.json" target="_blank" rel="noreferrer">System Pack v1</a>
        </p>
      </details>
      <section style={pageSectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px" }}>
            <h3 style={{ marginTop: 0, marginBottom: "0.3rem" }}>Diagnostics</h3>
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.5 }}>
              Inspect schema state, storage usage, integrity signals, and recent runtime metrics.
            </p>
          </div>
          <button onClick={() => void handleRunIntegrity()} style={subtleButtonStyle} disabled={isProcessing}>Run Integrity Checks</button>
        </div>
        <p style={{ marginTop: 0 }}><strong>Schema version:</strong> {schemaVersion}</p>
        <p style={{ marginTop: 0 }}><strong>Migration count:</strong> {diagnostics?.migrationCount ?? 0}</p>
        {diagnostics?.latestMigration ? (
          <p style={{ marginTop: 0 }}><strong>Latest migration:</strong> {`${diagnostics.latestMigration.migrationName} -> ${diagnostics.latestMigration.toVersion} at ${diagnostics.latestMigration.appliedAt}`}</p>
        ) : null}
        {diagnostics ? (
          <div style={{ marginTop: "0.75rem" }}>
            <p style={{ margin: 0 }}><strong>Database size:</strong> {formatBytes(diagnostics.storageUsage.databaseBytes)}</p>
            <p style={{ margin: "0.25rem 0 0" }}><strong>Image resources:</strong> {diagnostics.storageUsage.imageResourceCount} ({formatBytes(diagnostics.storageUsage.imageResourceBytes)})</p>
            <p style={{ margin: "0.25rem 0 0" }}><strong>Backup blobs:</strong> {diagnostics.storageUsage.backupResourceCount} ({formatBytes(diagnostics.storageUsage.backupResourceBytes)})</p>
            <p style={{ margin: "0.25rem 0 0" }}><strong>Total local keys:</strong> {diagnostics.storageUsage.totalKeys}</p>
          </div>
        ) : null}
        {diagnostics ? (
          <div style={{ marginTop: "0.75rem", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#fff" }}>
            <strong>Hardening State Summary</strong>
            <p style={{ margin: "0.35rem 0 0" }}><strong>Built-in system pack:</strong> {trustedSystemPack?.packName ?? "N/A"}</p>
            <p style={{ margin: "0.25rem 0 0" }}><strong>Pack id:</strong> {trustedSystemPack?.id ?? "N/A"}</p>
            <p style={{ margin: "0.25rem 0 0" }}><strong>Pack version:</strong> {inferPackVersion(trustedSystemPack?.id)}</p>
            <div style={{ marginTop: "0.6rem" }}>
              <strong>Flow Availability</strong>
              <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.2rem" }}>
                <li>System built-in validate/apply: {diagnostics.dataState.flowAvailability.systemBuiltInValidateApply}</li>
                <li>User import -&gt; pending -&gt; review -&gt; commit: {diagnostics.dataState.flowAvailability.userImportPendingReviewCommit}</li>
                <li>Governance diagnostics: {diagnostics.dataState.flowAvailability.governanceIntegrityDiagnostics}</li>
                <li>Geo library/detail read-side: {diagnostics.dataState.flowAvailability.geoLibraryDetailRead}</li>
              </ul>
            </div>
            <div style={{ marginTop: "0.55rem" }}>
              <strong>Approved Counts (current)</strong>
              {renderCounts({
                words: diagnostics.dataState.approvedCounts.words,
                phrases: diagnostics.dataState.approvedCounts.phrases,
                sentences: diagnostics.dataState.approvedCounts.sentences,
                geo_materials: diagnostics.dataState.approvedCounts.geoMaterials,
                geo_features: diagnostics.dataState.approvedCounts.geoFeatures,
                strategies: diagnostics.dataState.approvedCounts.strategies,
                requirements: diagnostics.dataState.approvedCounts.requirements,
                methods: diagnostics.dataState.approvedCounts.methods,
                relations: diagnostics.dataState.approvedCounts.relations,
                images: diagnostics.dataState.approvedCounts.images,
                reports: diagnostics.dataState.approvedCounts.reports,
                item_sources: diagnostics.dataState.approvedCounts.sources
              })}
            </div>
            <div style={{ marginTop: "0.55rem" }}>
              <strong>Pending Counts (current)</strong>
              {renderCounts({
                pending_words: diagnostics.dataState.pendingCounts.words,
                pending_phrases: diagnostics.dataState.pendingCounts.phrases,
                pending_sentences: diagnostics.dataState.pendingCounts.sentences,
                pending_geo_materials: diagnostics.dataState.pendingCounts.geoMaterials,
                pending_geo_features: diagnostics.dataState.pendingCounts.geoFeatures,
                pending_strategies: diagnostics.dataState.pendingCounts.strategies,
                pending_images: diagnostics.dataState.pendingCounts.images,
                pending_item_image_links: diagnostics.dataState.pendingCounts.itemImageLinks,
                inbox_total: diagnostics.dataState.pendingCounts.inboxTotal,
                inbox_unreviewed: diagnostics.dataState.pendingCounts.inboxUnreviewed,
                inbox_approved: diagnostics.dataState.pendingCounts.inboxApproved,
                inbox_rejected: diagnostics.dataState.pendingCounts.inboxRejected,
                inbox_deferred: diagnostics.dataState.pendingCounts.inboxDeferred
              })}
            </div>
            <div style={{ marginTop: "0.55rem" }}>
              <strong>Approved Provenance Snapshot</strong>
              {renderCounts({
                system_generated: diagnostics.dataState.approvedProvenance.systemGenerated,
                imported_ai: diagnostics.dataState.approvedProvenance.importedAi,
                manual_user: diagnostics.dataState.approvedProvenance.manualUser,
                merged: diagnostics.dataState.approvedProvenance.merged,
                user_owned_total: diagnostics.dataState.approvedProvenance.userOwned,
                other: diagnostics.dataState.approvedProvenance.other,
                total: diagnostics.dataState.approvedProvenance.total
              })}
            </div>
            {diagnostics.integrity ? <p style={{ margin: "0.55rem 0 0", color: "#374151" }}><strong>Governance status:</strong> checked at {diagnostics.integrity.checkedAt} | issues={diagnostics.integrity.summary.totalIssues}</p> : <p style={{ margin: "0.55rem 0 0", color: "#6b7280" }}>Governance status: run integrity checks to refresh.</p>}
          </div>
        ) : null}
        {diagnostics?.integrity ? (
          <div style={{ marginTop: "0.75rem", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#fff" }}>
            <p style={{ margin: 0 }}><strong>Checked:</strong> {diagnostics.integrity.checkedAt}</p>
            <p style={{ margin: "0.25rem 0 0" }}><strong>Total issues:</strong> {diagnostics.integrity.summary.totalIssues}</p>
            <p style={{ margin: "0.25rem 0 0" }}><strong>Errors:</strong> {diagnostics.integrity.summary.errorCount} | <strong>Warnings:</strong> {diagnostics.integrity.summary.warningCount}</p>
            <div style={{ marginTop: "0.5rem" }}>
              <strong>Integrity Summary Counts</strong>
              {renderCounts(diagnostics.integrity.summary.byCategory)}
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <strong>Duplicate Normalized Names</strong>
              <p style={{ margin: "0.25rem 0 0" }}>Detected duplicates: {diagnostics.integrity.duplicateNormalizedNames.length}</p>
              {diagnostics.integrity.duplicateNormalizedNames.length > 0 ? (
                <ul>
                  {diagnostics.integrity.duplicateNormalizedNames.slice(0, 12).map((entry) => (
                    <li key={`${entry.itemType}:${entry.normalizedName}`}>{entry.itemType} | {entry.normalizedName} | count={entry.count} | provenance={entry.provenanceTypes.join(", ") || "unknown"}</li>
                  ))}
                </ul>
              ) : <p style={{ margin: "0.25rem 0 0", color: "#166534" }}>No duplicate normalized names detected.</p>}
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <strong>System/User Collision Summary</strong>
              <p style={{ margin: "0.25rem 0 0" }}>Potential normalized-name collisions: {diagnostics.integrity.systemUserCollisions.length}</p>
              {diagnostics.integrity.systemUserCollisions.length > 0 ? (
                <ul>
                  {diagnostics.integrity.systemUserCollisions.slice(0, 12).map((entry) => (
                    <li key={`${entry.itemType}:${entry.normalizedName}`}>{entry.itemType} | {entry.normalizedName} | system={entry.systemCount} | user={entry.userCount}</li>
                  ))}
                </ul>
              ) : <p style={{ margin: "0.25rem 0 0", color: "#166534" }}>No system/user collisions detected.</p>}
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <strong>Approved Provenance Counts</strong>
              <p style={{ margin: "0.25rem 0 0" }}>system_generated: {diagnostics.integrity.approvedProvenance.systemGenerated}</p>
              <p style={{ margin: "0.25rem 0 0" }}>imported_ai: {diagnostics.integrity.approvedProvenance.importedAi}</p>
              <p style={{ margin: "0.25rem 0 0" }}>manual_user: {diagnostics.integrity.approvedProvenance.manualUser}</p>
              <p style={{ margin: "0.25rem 0 0" }}>merged: {diagnostics.integrity.approvedProvenance.merged}</p>
              <p style={{ margin: "0.25rem 0 0" }}>user-owned total: {diagnostics.integrity.approvedProvenance.userOwned}</p>
            </div>
            {diagnostics.integrity.issues.length > 0 ? (
              <div style={{ marginTop: "0.75rem" }}>
                <strong>Detailed Issues</strong>
                <ul>
                  {diagnostics.integrity.issues.slice(0, 30).map((issue, index) => (
                    <li key={`${issue.category}-${issue.entityId ?? index}`}>{issue.severity} | {formatCategoryLabel(issue.category)} | {issue.message}</li>
                  ))}
                </ul>
              </div>
            ) : <p style={{ margin: "0.75rem 0 0", color: "#166534" }}>No integrity issues detected.</p>}
          </div>
        ) : null}
        {diagnostics?.recentMetrics && diagnostics.recentMetrics.length > 0 ? (
          <div style={{ marginTop: "0.75rem", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#fff" }}>
            <strong>Recent Performance Metrics</strong>
            <ul>
              {diagnostics.recentMetrics.slice(0, 8).map((metric) => (
                <li key={metric.id}>{metric.metricType} | {metric.durationMs ?? 0} ms | {metric.finishedAt ?? metric.startedAt}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section style={pageSectionStyle}>
        <h3 style={{ marginTop: 0, marginBottom: "0.3rem" }}>Internal System Knowledge</h3>
        <p style={{ marginTop: 0, color: "#64748b", lineHeight: 1.5 }}>
          Loads a trusted bundled system pack directly into approved data. This path is internal-only, skips pending review, and always creates a pre-injection snapshot first. In the frozen contract model, this remains the structured System Pack path (strict fields, strict typing, no extra fields).
        </p>
        {trustedSystemPack ? (
          <div style={{ marginBottom: "0.75rem", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#fff" }}>
            <p style={{ margin: 0 }}><strong>Trusted pack:</strong> {trustedSystemPack.packName}</p>
            <p style={{ margin: "0.25rem 0 0" }}><strong>Pack id:</strong> {trustedSystemPack.id}</p>
            <p style={{ margin: "0.25rem 0 0" }}>{trustedSystemPack.description}</p>
          </div>
        ) : null}
        <div style={actionRowStyle}>
          <button onClick={() => void handleValidateTrustedSystemKnowledge()} disabled={!trustedSystemPack || isProcessing} style={secondaryButtonStyle}>
            Validate Built-in Pack
          </button>
          <button onClick={() => void handleApplyTrustedSystemKnowledge()} disabled={!trustedSystemPack || isProcessing} style={primaryButtonStyle}>
            Apply Built-in Pack
          </button>
        </div>
        {systemValidation ? (
          <div style={{ marginTop: "0.75rem", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", background: "#fff" }}>
            <p style={{ margin: 0 }}><strong>Validation outcome:</strong> {validationOutcome}</p>
            <p style={{ margin: "0.25rem 0 0" }}><strong>Validation state:</strong> {systemValidation.validationReport.state}</p>
            <p style={{ margin: "0.25rem 0 0" }}><strong>Supported schema:</strong> {systemValidation.validationReport.supportedSchemaVersion}</p>
            {systemValidation.validationReport.errors.length > 0 ? (
              <div style={{ marginTop: "0.5rem", color: "#b91c1c" }}>
                <strong>Errors</strong>
                <ul>
                  {systemValidation.validationReport.errors.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {systemValidation.validationReport.warnings.length > 0 ? (
              <div style={{ marginTop: "0.5rem", color: "#92400e" }}>
                <strong>Warnings</strong>
                <ul>
                  {systemValidation.validationReport.warnings.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
        <div style={{ marginTop: "0.75rem", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", background: "#fff" }}>
          <p style={{ margin: 0 }}><strong>Apply status:</strong> {getSystemApplyStatusLabel(systemApplyStatus)}</p>
          {injectionOutcome ? <p style={{ margin: "0.25rem 0 0" }}><strong>Injection outcome:</strong> {injectionOutcome}</p> : null}
          {systemApplyError ? <p style={{ margin: "0.35rem 0 0", color: "#b91c1c" }}><strong>Injection error:</strong> {systemApplyError}</p> : null}
          {systemInjectionResult && systemInjectedCounts ? (
            <div style={{ marginTop: "0.5rem" }}>
              <p style={{ margin: "0.25rem 0 0" }}><strong>Snapshot created:</strong> {systemInjectionResult.snapshotName}</p>
              <p style={{ margin: "0.25rem 0 0" }}><strong>Report/source id:</strong> {systemInjectionResult.injection.reportId}</p>
              {renderCounts(systemInjectedCounts)}
            </div>
          ) : null}
          {systemApplyStatus === "applied" ? (
            <div style={{ marginTop: "0.75rem", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#f9fafb" }}>
              <p style={{ margin: 0 }}><strong>Library verification search terms</strong></p>
              <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.25rem" }}>
                {libraryVerificationTerms.map((term) => (
                  <li key={term}>{term}</li>
                ))}
              </ul>
              <p style={{ margin: "0.5rem 0 0", color: "#374151" }}>
                Verify in Library Search first. Strategies are not standalone Library items yet, so verify them through Related Knowledge on feature detail pages such as detached block, foliation plane, ravelling, and blast damaged zone.
              </p>
            </div>
          ) : null}
          {systemApplyStatus === "idle" ? <p style={{ margin: "0.35rem 0 0", color: "#4b5563" }}>No system injection has been run yet in this session.</p> : null}
        </div>
      </section>

      <section style={pageSectionStyle}>
        <h3 style={{ marginTop: 0, marginBottom: "0.3rem" }}>Full Backup Export</h3>
        <p style={{ marginTop: 0, color: "#64748b", lineHeight: 1.5 }}>Create a local ZIP package with manifest, SQLite content, and stored image resources.</p>
        <button onClick={() => void handleCreateBackup()} disabled={isProcessing} style={primaryButtonStyle}>Create Full Backup ZIP</button>
        {latestManifest ? (
          <div style={{ marginTop: "0.75rem" }}>
            <strong>Latest Backup Manifest</strong>
            <p style={{ margin: "0.35rem 0 0" }}>schema_version: {latestManifest.schema_version}</p>
            <p style={{ margin: "0.25rem 0 0" }}>backup_type: {latestManifest.backup_type}</p>
            <p style={{ margin: "0.25rem 0 0" }}>created_at: {latestManifest.created_at}</p>
            {renderCounts(latestManifest.item_counts)}
          </div>
        ) : null}
      </section>

      <section style={pageSectionStyle}>
        <h3 style={{ marginTop: 0, marginBottom: "0.3rem" }}>Restore Preview</h3>
        <p style={{ marginTop: 0, color: "#64748b", lineHeight: 1.5 }}>Select a backup ZIP and validate it before any replace restore runs.</p>
        <input type="file" accept="application/zip,.zip" onChange={(event) => void handleRestoreFileChange(event)} disabled={isProcessing} style={{ padding: "0.5rem 0" }} />

        {restorePreview ? (
          <div style={{ marginTop: "0.75rem", padding: "0.75rem", border: "1px solid #d1d5db", borderRadius: "0.5rem", background: "#fff" }}>
            <p style={{ margin: 0 }}><strong>state:</strong> {restorePreview.state}</p>
            <p style={{ margin: "0.25rem 0 0" }}><strong>file:</strong> {restorePreview.fileName}</p>
            {restorePreview.manifest ? <p style={{ margin: "0.25rem 0 0" }}><strong>schema:</strong> {restorePreview.manifest.schema_version}</p> : null}
            {restorePreview.imageCounts ? <p style={{ margin: "0.25rem 0 0" }}><strong>image resources:</strong> {restorePreview.imageCounts.image_resources}</p> : null}
            {renderCounts(restorePreview.itemCounts)}
            {restorePreview.errors.length > 0 ? (
              <div style={{ marginTop: "0.75rem", color: "#b91c1c" }}>
                <strong>Errors</strong>
                <ul>
                  {restorePreview.errors.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {restorePreview.warnings.length > 0 ? (
              <div style={{ marginTop: "0.75rem", color: "#92400e" }}>
                <strong>Warnings</strong>
                <ul>
                  {restorePreview.warnings.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <button onClick={() => void handleRestore()} disabled={restorePreview.state === "invalid" || isProcessing} style={{ ...primaryButtonStyle, marginTop: "0.75rem" }}>
              Create Pre-Restore Snapshot and Replace Local Data
            </button>
          </div>
        ) : null}
      </section>

      <section style={pageSectionStyle}>
        <h3 style={{ marginTop: 0 }}>Snapshots</h3>
        {snapshots.length === 0 ? <p>No local snapshots recorded yet.</p> : null}
        <ul>
          {snapshots.map((snapshot) => (
            <li key={snapshot.id} style={{ marginBottom: "0.5rem" }}>
              <div>{snapshot.snapshotName}</div>
              <div style={{ color: "#4b5563", fontSize: "0.95rem" }}>
                {snapshot.snapshotType} | schema: {snapshot.schemaVersion} | created: {snapshot.createdAt}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}








