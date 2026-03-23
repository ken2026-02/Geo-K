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

      <section className="ekv-card mb-4 p-3 sm:p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-lg font-semibold text-slate-900">Import JSON or ZIP</h3>
              <InlineInfo title="Inbox import">
                Choose a pack, validate it, then stage it to pending review. Use format help only when you need contract details or examples.
              </InlineInfo>
          </div>
          <button
            type="button"
            onClick={() => setShowImportGuide((value) => !value)}
            className="ekv-button-compact"
          >
            {showImportGuide ? "Hide format help" : "Show format help"}
          </button>
        </div>
        <input type="file" accept="application/json,.json,application/zip,.zip" onChange={handleFileChange} className="ekv-input file:mr-3 file:rounded-xl file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100" />
        <div className="mt-2">
          <input value={sourceFileName} onChange={(event) => setSourceFileName(event.target.value)} className="ekv-input mb-2" />
          <div className="sticky top-2 z-10 mb-2 flex flex-wrap gap-2 bg-white/95 py-1 backdrop-blur">
            <button onClick={() => void handleValidateOnly()} disabled={!rawJson.trim() || isProcessing} className="ekv-button-secondary">
              Validate
            </button>
            <button onClick={() => void handleImport()} disabled={(!selectedFile && !rawJson.trim()) || isProcessing} className="ekv-button-primary">
              Stage to Pending
            </button>
          </div>
          {!selectedFile || selectedFile.name.toLowerCase().endsWith(".json") ? (
            <textarea value={rawJson} onChange={(event) => setRawJson(event.target.value)} rows={10} className="ekv-textarea min-h-[220px] max-h-[52vh]" />
          ) : (
            <p className="text-sm text-slate-600">ZIP selected: knowledge_pack.json and images/ will be read during import.</p>
          )}
        </div>
        <p className="mt-2 text-sm"><strong>Validation state:</strong> {validationState}</p>
        {validationSummary ? <p className={`mt-1 text-sm ${validationState === "invalid" ? "text-red-700" : "text-emerald-700"}`}>{validationSummary}</p> : null}
        {message ? <div className="mt-3"><FeedbackBanner tone="success" message={message} /></div> : null}
        {error ? <div className="mt-3"><FeedbackBanner tone="error" message={error} /></div> : null}
        {failurePhase ? <p className="text-sm text-amber-700">Failure phase: {failurePhase}</p> : null}
        {attemptedBatchId ? <p className="text-sm text-slate-600">Attempted batch id: {attemptedBatchId}</p> : null}
        {validationErrors.length > 0 ? (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
            <strong className="text-red-900">Validation / import errors</strong>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-red-900">
              {validationErrors.map((detail, index) => {
                const context = ruleReferenceService.getValidationContext(detail.code);
                return (
                  <li key={`${detail.code}-${index}`}>
                    <div>{detail.code}: {detail.message}</div>
                    {context ? <div className="text-sm text-red-800">Rule context: {context.ruleCategory} | {context.relevance}</div> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        {validationWarnings.length > 0 ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <strong className="text-amber-900">Warnings</strong>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-amber-900">
              {validationWarnings.map((detail, index) => {
                const context = ruleReferenceService.getValidationContext(detail.code);
                return (
                  <li key={`${detail.code}-${index}`}>
                    <div>{detail.code}: {detail.message}</div>
                    {context ? <div className="text-sm text-amber-800">Rule context: {context.ruleCategory} | {context.relevance}</div> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>

      {showImportGuide ? (
        <section className="ekv-card mb-4 border-sky-200 bg-sky-50 p-3 sm:p-4">
          <h3 className="mb-2 text-base font-semibold text-slate-900">Import format help</h3>
          <p className="text-sm leading-6 text-slate-800">
            Inbox accepts the current user JSON or ZIP knowledge-pack contract for pending review.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Learning Pack v1 is the fast-ingest path.</li>
            <li>System Pack v1 stays an internal Settings workflow.</li>
            <li>Structured system injection still needs AI or manual review between contracts.</li>
          </ul>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Samples: <a href="/pack-samples/learning-pack-v1.sample.json" target="_blank" rel="noreferrer">Learning Pack v1</a> | <a href="/pack-samples/system-pack-v1.sample.json" target="_blank" rel="noreferrer">System Pack v1</a>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Developer spec: docs/contracts/pack-contract-freeze.md
          </p>
        </section>
      ) : null}

      <section className="ekv-card mb-4 bg-slate-50 p-3">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">User Batch Verification Terms</summary>
          <p className="mt-2 text-sm text-slate-700">
            Expected in Library after approve + commit: {USER_BATCH_EXPECTED_LIBRARY_TERMS.join(", ")}.
          </p>
          <p className="mt-1 text-sm text-slate-700">
            If rejected or deferred, these should stay out of Library: {USER_BATCH_EXPECTED_PENDING_TERMS.join(", ")}.
          </p>
        </details>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="m-0 text-lg font-semibold text-slate-900">Import Batches</h3>
          {batches.length > 0 && (
            <button 
              onClick={() => setConfirmAction({ kind: "clear_all" })} 
              disabled={isProcessing}
              className="ekv-button-danger min-h-9 px-3 py-2 text-xs"
            >
              Clear all
            </button>
          )}
        </div>
        
        {batches.length === 0 ? <p>No batches staged yet.</p> : null}
        
        <div className="grid gap-3">
          {(isExpanded ? batches : batches.slice(0, 3)).map((batch) => (
            <div key={batch.id} className={`rounded-2xl border p-3 ${batch.importStatus === "completed" ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 basis-[260px]">
                  <Link to={`/inbox/${batch.id}`} className="text-lg font-semibold text-indigo-700 hover:text-indigo-800">{batch.batchName}</Link>
                  <div className="mt-1 text-sm text-slate-600">
                    File: {batch.sourceFileName ?? "unknown"} | Report ID: {batch.sourceReportId ?? "N/A"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`ekv-chip ${batch.importStatus === "completed" ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"}`}>
                    {batch.importStatus === "completed" ? "COMPLETED" : "REVIEW IN PROGRESS"}
                  </span>
                  <button 
                    onClick={() => setConfirmAction({ kind: "delete_batch", batchId: batch.id })} 
                    disabled={isProcessing}
                    className="ekv-button-danger min-h-8 px-2.5 py-1.5 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-700">
                <span>Pending: <strong>{batch.pendingItems}</strong></span>
                <span>Approved: <strong>{batch.approvedItems}</strong></span>
                <span>Rejected: <strong>{batch.rejectedItems}</strong></span>
              </div>
              <div className="mt-1 text-xs text-slate-500 sm:text-sm">
                {`Report: ${batch.sourceReportTitle ?? "unknown"} | Project: ${batch.sourceReportProject ?? "unknown"}`}
              </div>
            </div>
          ))}
        </div>

        {batches.length > 3 && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="ekv-button-secondary mt-4 w-full"
          >
            {isExpanded ? "Fold (Show Recent 3)" : `Show All (${batches.length})`}
          </button>
        )}
      </section>
    </AppShell>
  );
}
