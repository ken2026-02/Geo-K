import { type ChangeEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { AppShell } from "../../shared/ui/layout/AppShell";
import { ConfirmDialog } from "../../shared/ui/feedback/ConfirmDialog";
import { FeedbackBanner } from "../../shared/ui/feedback/FeedbackBanner";
import { InlineInfo } from "../../shared/ui/feedback/InlineInfo";
import { useDatabaseRuntime } from "../../data/db/DatabaseContext";
import type { ImportBatchRecord } from "../../data/repositories/interfaces";
import type { ImportErrorDetail, ImportWarningDetail } from "../../features/import/pipelineTypes";
import { ImportExecutionError, JsonKnowledgePackImportService } from "../../services/import/jsonKnowledgePackImportService";
import { KnowledgePackFileReaderService } from "../../services/import/knowledgePackFileReaderService";
import { InboxService } from "../../services/review/inboxService";
import { RuleReferenceService } from "../../services/rules/ruleReferenceService";

type ValidationState = "idle" | "valid" | "invalid";
type ConfirmAction = { kind: "delete_batch"; batchId: string } | { kind: "clear_all" } | null;

const USER_BATCH_EXPECTED_LIBRARY_TERMS = [
  "slick clay seam",
  "decomposed andesite",
  "active ravelling pocket",
  "wet open joint"
] as const;

const USER_BATCH_EXPECTED_PENDING_TERMS = [
  "oxidized fracture infill",
  "residual volcanic soil",
  "blast damaged brow",
  "foliation daylighting plane",
  "short-interval re-inspection",
  "detailed face mapping"
] as const;

export function InboxPage() {
  const { db } = useDatabaseRuntime();
  const [rawJson, setRawJson] = useState("");
  const [sourceFileName, setSourceFileName] = useState("knowledge_pack.json");
  const [selectedFile, setSelectedFile] = useState<File>();
  const [batches, setBatches] = useState<ImportBatchRecord[]>([]);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [validationErrors, setValidationErrors] = useState<ImportErrorDetail[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<ImportWarningDetail[]>([]);
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [validationSummary, setValidationSummary] = useState<string>();
  const [failurePhase, setFailurePhase] = useState<string>();
  const [attemptedBatchId, setAttemptedBatchId] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showImportGuide, setShowImportGuide] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const ruleReferenceService = new RuleReferenceService();

  async function refreshBatches() {
    setBatches(await new InboxService().listBatches(db));
  }

  useEffect(() => {
    void refreshBatches();
  }, [db]);

  function clearFeedback(): void {
    setError(undefined);
    setMessage(undefined);
    setValidationErrors([]);
    setValidationWarnings([]);
    setValidationSummary(undefined);
    setFailurePhase(undefined);
    setAttemptedBatchId(undefined);
  }

  async function handleValidateOnly(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();

    try {
      if (!rawJson.trim()) {
        setValidationState("invalid");
        setValidationSummary("No JSON content to validate.");
        return;
      }

      const report = await new JsonKnowledgePackImportService().validate(rawJson);
      setValidationWarnings(report.warnings);

      if (report.state === "invalid") {
        setValidationState("invalid");
        setValidationSummary("Validation failed. Fix errors before staging to pending.");
        setValidationErrors(report.errors);
        return;
      }

      setValidationState("valid");
      setValidationSummary("Validation succeeded. Pack is ready to stage into pending.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Validation failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleImport() {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();

    try {
      const service = new JsonKnowledgePackImportService();
      let result;

      if (selectedFile) {
        const payload = await new KnowledgePackFileReaderService().read(selectedFile);
        result = await service.importIntoPending(db, payload.sourceFileName, payload.rawJson, payload.imageFiles);
      } else {
        result = await service.importIntoPending(db, sourceFileName, rawJson);
      }

      setValidationState("valid");
      setValidationSummary("Validation succeeded and pending staging completed.");
      setMessage(`Imported batch ${result.batch.batchName}. Images processed=${result.imageSummary.processed}, failed=${result.imageSummary.failed}, missing=${result.imageSummary.missing}.`);
      setValidationWarnings(result.validationReport.warnings);
      await refreshBatches();
      setRawJson("");
      setSelectedFile(undefined);
    } catch (importError) {
      console.error("Import failed:", importError);
      if (importError instanceof ImportExecutionError) {
        setValidationState(importError.failure.phase === "validation" ? "invalid" : "idle");
        setValidationSummary(importError.failure.phase === "validation" ? "Validation failed." : "Staging failed after validation.");
        setError(importError.failure.message);
        setValidationErrors(importError.failure.errors);
        setValidationWarnings(importError.failure.validationReport.warnings);
        setFailurePhase(importError.failure.phase);
        setAttemptedBatchId(importError.failure.attemptedBatch?.id);
        return;
      }

      const errorMessage = importError instanceof Error ? importError.message : "Import failed.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeleteBatch(id: string) {
    setIsProcessing(true);
    try {
      await new InboxService().deleteBatch(db, id);
      await refreshBatches();
      setMessage("Batch deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete batch.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleClearAllBatches() {
    setIsProcessing(true);
    try {
      await new InboxService().clearAllBatches(db);
      await refreshBatches();
      setMessage("All import records cleared.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear records.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConfirmAction(): Promise<void> {
    if (!confirmAction || isProcessing) {
      return;
    }

    const action = confirmAction;
    setConfirmAction(null);

    if (action.kind === "delete_batch") {
      await handleDeleteBatch(action.batchId);
      return;
    }

    await handleClearAllBatches();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(undefined);
      return;
    }

    setSelectedFile(file);
    setSourceFileName(file.name);

    if (file.name.toLowerCase().endsWith(".json")) {
      setRawJson(await file.text());
    } else {
      setRawJson("");
    }
  }

  return (
    <AppShell
      title="Inbox"
      subtitle="Validate and stage imports for review."
      pageDescription={null}
    >
      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction?.kind === "clear_all" ? "Clear all import records?" : "Delete import batch?"}
        body={
          confirmAction?.kind === "clear_all"
            ? "This removes every import batch and all pending review items. This action cannot be undone."
            : "This removes the selected import batch and all of its pending review items."
        }
        confirmLabel={confirmAction?.kind === "clear_all" ? "Clear all" : "Delete batch"}
        tone="danger"
        busy={isProcessing}
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => setConfirmAction(null)}
      />

      <section style={{ marginBottom: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.8rem", padding: "0.85rem", background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>Import JSON or ZIP</h3>
              <InlineInfo title="Inbox import">
                Choose a pack, validate it, then stage it to pending review. Use format help only when you need contract details or examples.
              </InlineInfo>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowImportGuide((value) => !value)}
            className="ekv-button-compact"
          >
            {showImportGuide ? "Hide format help" : "Show format help"}
          </button>
        </div>
        <input type="file" accept="application/json,.json,application/zip,.zip" onChange={handleFileChange} />
        <div style={{ marginTop: "0.5rem" }}>
          <input value={sourceFileName} onChange={(event) => setSourceFileName(event.target.value)} style={{ width: "100%", marginBottom: "0.5rem" }} />
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap", position: "sticky", top: "0.5rem", zIndex: 5, padding: "0.25rem 0", background: "rgba(255,255,255,0.96)" }}>
            <button onClick={() => void handleValidateOnly()} disabled={!rawJson.trim() || isProcessing} className="ekv-button-secondary">
              Validate JSON Pack
            </button>
            <button onClick={() => void handleImport()} disabled={(!selectedFile && !rawJson.trim()) || isProcessing} className="ekv-button-primary">
              Validate and Stage to Pending
            </button>
          </div>
          {!selectedFile || selectedFile.name.toLowerCase().endsWith(".json") ? (
            <textarea value={rawJson} onChange={(event) => setRawJson(event.target.value)} rows={10} style={{ width: "100%", minHeight: "220px", maxHeight: "52vh" }} />
          ) : (
            <p style={{ color: "#4b5563" }}>ZIP selected: knowledge_pack.json and images/ will be read during import.</p>
          )}
        </div>
        <p style={{ marginTop: "0.5rem" }}><strong>Validation state:</strong> {validationState}</p>
        {validationSummary ? <p style={{ margin: "0.25rem 0 0", color: validationState === "invalid" ? "#b91c1c" : "#166534" }}>{validationSummary}</p> : null}
        {message ? <div style={{ marginTop: "0.75rem" }}><FeedbackBanner tone="success" message={message} /></div> : null}
        {error ? <div style={{ marginTop: "0.75rem" }}><FeedbackBanner tone="error" message={error} /></div> : null}
        {failurePhase ? <p style={{ color: "#92400e" }}>Failure phase: {failurePhase}</p> : null}
        {attemptedBatchId ? <p style={{ color: "#374151" }}>Attempted batch id: {attemptedBatchId}</p> : null}
        {validationErrors.length > 0 ? (
          <div style={{ marginTop: "0.75rem", border: "1px solid #fecaca", padding: "0.75rem", borderRadius: "0.5rem", background: "#fef2f2" }}>
            <strong>Validation / import errors</strong>
            <ul>
              {validationErrors.map((detail, index) => {
                const context = ruleReferenceService.getValidationContext(detail.code);
                return (
                  <li key={`${detail.code}-${index}`}>
                    <div>{detail.code}: {detail.message}</div>
                    {context ? <div style={{ color: "#7f1d1d", fontSize: "0.9rem" }}>Rule context: {context.ruleCategory} | {context.relevance}</div> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        {validationWarnings.length > 0 ? (
          <div style={{ marginTop: "0.75rem", border: "1px solid #fde68a", padding: "0.75rem", borderRadius: "0.5rem", background: "#fffbeb" }}>
            <strong>Warnings</strong>
            <ul>
              {validationWarnings.map((detail, index) => {
                const context = ruleReferenceService.getValidationContext(detail.code);
                return (
                  <li key={`${detail.code}-${index}`}>
                    <div>{detail.code}: {detail.message}</div>
                    {context ? <div style={{ color: "#92400e", fontSize: "0.9rem" }}>Rule context: {context.ruleCategory} | {context.relevance}</div> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>

      {showImportGuide ? (
        <section style={{ marginBottom: "1rem", border: "1px solid #dbeafe", borderRadius: "0.75rem", padding: "0.75rem", background: "#eff6ff" }}>
          <h3 style={{ marginTop: 0, marginBottom: "0.45rem" }}>Import format help</h3>
          <p style={{ margin: "0 0 0.35rem", color: "#1f2937", lineHeight: 1.45 }}>
            Inbox accepts the current user JSON or ZIP knowledge-pack contract for pending review.
          </p>
          <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.2rem", color: "#334155" }}>
            <li>Learning Pack v1 is the fast-ingest path.</li>
            <li>System Pack v1 stays an internal Settings workflow.</li>
            <li>Structured system injection still needs AI or manual review between contracts.</li>
          </ul>
          <p style={{ margin: "0.55rem 0 0", color: "#475569", fontSize: "0.92rem", lineHeight: 1.45 }}>
            Samples: <a href="/pack-samples/learning-pack-v1.sample.json" target="_blank" rel="noreferrer">Learning Pack v1</a> | <a href="/pack-samples/system-pack-v1.sample.json" target="_blank" rel="noreferrer">System Pack v1</a>
          </p>
          <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.88rem" }}>
            Developer spec: docs/contracts/pack-contract-freeze.md
          </p>
        </section>
      ) : null}

      <section style={{ marginBottom: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", background: "#f8fafc" }}>
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 700, color: "#0f172a" }}>User Batch Verification Terms</summary>
          <p style={{ margin: "0.55rem 0 0.25rem" }}>
            Expected in Library after approve + commit: {USER_BATCH_EXPECTED_LIBRARY_TERMS.join(", ")}.
          </p>
          <p style={{ margin: "0.25rem 0 0" }}>
            If rejected or deferred, these should stay out of Library: {USER_BATCH_EXPECTED_PENDING_TERMS.join(", ")}.
          </p>
        </details>
      </section>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", gap: "0.75rem", flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Import Batches</h3>
          {batches.length > 0 && (
            <button 
              onClick={() => setConfirmAction({ kind: "clear_all" })} 
              disabled={isProcessing}
              style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "0.4rem", cursor: "pointer" }}
            >
              Clear All Records
            </button>
          )}
        </div>
        
        {batches.length === 0 ? <p>No batches staged yet.</p> : null}
        
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {(isExpanded ? batches : batches.slice(0, 3)).map((batch) => (
            <div key={batch.id} style={{ 
              padding: "0.75rem", 
              border: "1px solid #e5e7eb", 
              borderRadius: "0.75rem",
              background: batch.importStatus === "completed" ? "#f0fdf4" : "#fff"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                  <Link to={`/inbox/${batch.id}`} style={{ fontWeight: "bold", fontSize: "1.1rem", textDecoration: "none", color: "#2563eb" }}>{batch.batchName}</Link>
                  <div style={{ marginTop: "0.25rem", color: "#4b5563", fontSize: "0.9rem" }}>
                    File: {batch.sourceFileName ?? "unknown"} | Report ID: {batch.sourceReportId ?? "N/A"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ 
                    padding: "0.25rem 0.5rem", 
                    borderRadius: "0.25rem", 
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    background: batch.importStatus === "completed" ? "#dcfce7" : "#fef9c3",
                    color: batch.importStatus === "completed" ? "#166534" : "#854d0e"
                  }}>
                    {batch.importStatus === "completed" ? "COMPLETED" : "REVIEW IN PROGRESS"}
                  </span>
                  <button 
                    onClick={() => setConfirmAction({ kind: "delete_batch", batchId: batch.id })} 
                    disabled={isProcessing}
                    style={{ padding: "0.2rem 0.4rem", fontSize: "0.75rem", background: "#fff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "0.3rem", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.9rem", color: "#374151" }}>
                <span>Pending: <strong>{batch.pendingItems}</strong></span>
                <span>Approved: <strong>{batch.approvedItems}</strong></span>
                <span>Rejected: <strong>{batch.rejectedItems}</strong></span>
              </div>
              <div style={{ marginTop: "0.25rem", color: "#6b7280", fontSize: "0.85rem" }}>
                {`Report: ${batch.sourceReportTitle ?? "unknown"} | Project: ${batch.sourceReportProject ?? "unknown"}`}
              </div>
            </div>
          ))}
        </div>

        {batches.length > 3 && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            style={{ marginTop: "1rem", width: "100%", padding: "0.5rem", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "0.5rem", cursor: "pointer", fontWeight: 600 }}
          >
            {isExpanded ? "Fold (Show Recent 3)" : `Show All (${batches.length})`}
          </button>
        )}
      </section>
    </AppShell>
  );
}
