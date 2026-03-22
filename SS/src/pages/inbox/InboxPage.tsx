import { type ChangeEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { AppShell } from "../../shared/ui/layout/AppShell";
import { useDatabaseRuntime } from "../../data/db/DatabaseContext";
import type { ImportBatchRecord } from "../../data/repositories/interfaces";
import type { ImportErrorDetail, ImportWarningDetail } from "../../features/import/pipelineTypes";
import { ImportExecutionError, JsonKnowledgePackImportService } from "../../services/import/jsonKnowledgePackImportService";
import { KnowledgePackFileReaderService } from "../../services/import/knowledgePackFileReaderService";
import { InboxService } from "../../services/review/inboxService";
import { RuleReferenceService } from "../../services/rules/ruleReferenceService";

type ValidationState = "idle" | "valid" | "invalid";

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
    clearFeedback();

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
  }

  async function handleImport() {
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

      setError(importError instanceof Error ? importError.message : "Import failed.");
    }
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
      subtitle="User import flow: validate JSON -> stage pending -> review -> commit approved."
    >
      <section style={{ marginBottom: "1rem", border: "1px solid #dbeafe", borderRadius: "0.75rem", padding: "0.75rem", background: "#eff6ff" }}>
        <h3 style={{ marginTop: 0 }}>Direction And Contract Alignment (Frozen)</h3>
        <p style={{ margin: "0.25rem 0", color: "#1f2937" }}>
          Learning Pack v1 is the primary fast-ingest contract, and System Pack v1 is the strict structured contract. They are intentionally separate.
        </p>
        <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.2rem" }}>
          <li>This Inbox importer currently accepts the existing user JSON/ZIP knowledge-pack contract for pending review workflow.</li>
          <li>Learning Pack v1 does not directly become System Pack v1; it should be transformed via AI/manual review before structured injection.</li>
          <li>System Pack handling remains internal/admin path in Settings.</li>
        </ul>
        <p style={{ margin: "0.45rem 0 0", color: "#374151" }}>
          Frozen samples: <a href="/pack-samples/learning-pack-v1.sample.json" target="_blank" rel="noreferrer">Learning Pack v1 sample</a> | <a href="/pack-samples/system-pack-v1.sample.json" target="_blank" rel="noreferrer">System Pack v1 sample</a>
        </p>
        <p style={{ margin: "0.25rem 0 0", color: "#4b5563", fontSize: "0.9rem" }}>
          Developer spec: docs/contracts/pack-contract-freeze.md
        </p>
      </section>

      <section style={{ marginBottom: "1rem" }}>
        <h3>Import JSON or ZIP</h3>
        <input type="file" accept="application/json,.json,application/zip,.zip" onChange={handleFileChange} />
        <div style={{ marginTop: "0.5rem" }}>
          <input value={sourceFileName} onChange={(event) => setSourceFileName(event.target.value)} style={{ width: "100%", marginBottom: "0.5rem" }} />
          {!selectedFile || selectedFile.name.toLowerCase().endsWith(".json") ? (
            <textarea value={rawJson} onChange={(event) => setRawJson(event.target.value)} rows={12} style={{ width: "100%" }} />
          ) : (
            <p style={{ color: "#4b5563" }}>ZIP selected: knowledge_pack.json and images/ will be read during import.</p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => void handleValidateOnly()} disabled={!rawJson.trim()}>
            Validate JSON Pack
          </button>
          <button onClick={() => void handleImport()} disabled={!selectedFile && !rawJson.trim()}>
            Validate and Stage to Pending
          </button>
        </div>
        <p style={{ marginTop: "0.5rem" }}><strong>Validation state:</strong> {validationState}</p>
        {validationSummary ? <p style={{ margin: "0.25rem 0 0", color: validationState === "invalid" ? "#b91c1c" : "#166534" }}>{validationSummary}</p> : null}
        {message ? <p>{message}</p> : null}
        {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
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

      <section style={{ marginBottom: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", background: "#f8fafc" }}>
        <h3 style={{ marginTop: 0 }}>User Batch Verification Terms</h3>
        <p style={{ margin: "0.25rem 0" }}>
          Expected in Library after approve + commit: {USER_BATCH_EXPECTED_LIBRARY_TERMS.join(", ")}.
        </p>
        <p style={{ margin: "0.25rem 0" }}>
          If rejected or deferred, these should stay out of Library: {USER_BATCH_EXPECTED_PENDING_TERMS.join(", ")}.
        </p>
      </section>

      <section>
        <h3>Import Batches</h3>
        {batches.length === 0 ? <p>No batches staged yet.</p> : null}
        <ul>
          {batches.map((batch) => (
            <li key={batch.id} style={{ marginBottom: "0.75rem" }}>
              <div>
                <Link to={`/inbox/${batch.id}`}>{batch.batchName}</Link>
                {` | status: ${batch.importStatus} | pending: ${batch.pendingItems} | file: ${batch.sourceFileName ?? "unknown"}`}
              </div>
              <div style={{ color: "#4b5563", fontSize: "0.95rem" }}>
                {`report: ${batch.sourceReportTitle ?? "unknown"} | report_id: ${batch.sourceReportId ?? "unknown"} | project: ${batch.sourceReportProject ?? "unknown"}`}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
