import { type ChangeEvent, useMemo, useState } from "react";

import { parseTagsCsv } from "../../features/learning/classification";
import { AppShell } from "../../shared/ui/layout/AppShell";
import { LearningSubnav } from "./LearningSubnav";
import { LearningModuleService, type LearningValidationIssue } from "../../services/learning/learningModuleService";

function summarizeOptionalWarnings(warnings: LearningValidationIssue[]): { byField: Record<string, number>; others: LearningValidationIssue[] } {
  const byField: Record<string, number> = {};
  const others: LearningValidationIssue[] = [];

  for (const warning of warnings) {
    if (warning.code !== "learning_optional_missing") {
      others.push(warning);
      continue;
    }

    const fieldMatch = warning.message.match(/'([^']+)'/);
    const countMatch = warning.message.match(/^(\d+)\s+item\(s\)/);
    const field = fieldMatch?.[1];
    const count = countMatch ? Number(countMatch[1]) : 0;

    if (!field) {
      others.push(warning);
      continue;
    }

    byField[field] = count;
  }

  return { byField, others };
}

const sectionStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
  padding: "0.75rem",
  background: "#fff"
} as const;

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "0.75rem",
  flexWrap: "wrap",
  marginBottom: "0.75rem"
} as const;

const sectionTitleStyle = {
  margin: 0,
  fontSize: "1rem"
} as const;

const compactHintStyle = {
  margin: "0.2rem 0 0",
  color: "#4b5563",
  fontSize: "0.92rem",
  lineHeight: 1.45
} as const;

export function LearningImportPage() {
  const learningService = useMemo(() => new LearningModuleService(), []);
  const domainOptions = learningService.getSuggestedDomains();

  const [selectedFile, setSelectedFile] = useState<File>();
  const [importRawJson, setImportRawJson] = useState("");
  const [defaultDomain, setDefaultDomain] = useState("");
  const [defaultTagsCsv, setDefaultTagsCsv] = useState("");
  const [validationErrors, setValidationErrors] = useState<LearningValidationIssue[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<LearningValidationIssue[]>([]);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  function clearFeedback(): void {
    setMessage(undefined);
    setError(undefined);
  }

  function clearValidationState(): void {
    setValidationErrors([]);
    setValidationWarnings([]);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    clearFeedback();
    clearValidationState();

    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(undefined);
      setImportRawJson("");
      return;
    }

    setSelectedFile(file);
    setImportRawJson(await file.text());
  }

  async function handleValidateImport(): Promise<void> {
    clearFeedback();
    clearValidationState();

    if (!importRawJson.trim()) {
      setError("Select a JSON file or paste Learning Pack JSON first.");
      return;
    }

    const validation = learningService.validatePack(importRawJson);
    if (validation.state === "invalid") {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationWarnings(validation.warnings);
    setMessage("Learning Pack v1 validation passed.");
  }

  async function handleImport(): Promise<void> {
    clearFeedback();
    clearValidationState();

    if (!importRawJson.trim()) {
      setError("Select a JSON file or paste Learning Pack JSON first.");
      return;
    }

    try {
      const result = await learningService.importPack(importRawJson, {
        defaultDomain,
        defaultTags: parseTagsCsv(defaultTagsCsv)
      });
      setMessage(`Imported pack ${result.packId}. Items=${result.imported}, inserted=${result.inserted}, updated=${result.updated}.`);
      setValidationWarnings(result.warnings);
      setSelectedFile(undefined);
      setImportRawJson("");
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Learning import failed.");
    }
  }

  const warningSummary = summarizeOptionalWarnings(validationWarnings);

  return (
    <AppShell title="Learning Import" subtitle="Import Learning Pack v1 JSON." pageDescription={null}>
      <LearningSubnav />

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h3 style={sectionTitleStyle}>Import JSON</h3>
            <p style={compactHintStyle}>Load a file or paste Learning Pack v1 JSON, then validate or import.</p>
          </div>
          <a href="/pack-samples/learning-pack-v1.sample.json" target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", fontWeight: 600 }}>
            Open sample pack
          </a>
        </div>

        <div style={{ display: "grid", gap: "0.65rem" }}>
          <label style={{ display: "grid", gap: "0.3rem" }}>
            <span style={{ fontWeight: 600, color: "#374151" }}>Upload file</span>
            <input type="file" accept="application/json,.json" onChange={(event) => void handleFileChange(event)} />
          </label>
          {selectedFile ? <p style={{ margin: 0, color: "#4b5563", fontSize: "0.92rem" }}>Selected: {selectedFile.name}</p> : null}
          <label style={{ display: "grid", gap: "0.3rem" }}>
            <span style={{ fontWeight: 600, color: "#374151" }}>Paste JSON</span>
            <textarea
              value={importRawJson}
              onChange={(event) => setImportRawJson(event.target.value)}
              rows={8}
              placeholder="Paste Learning Pack v1 JSON here"
              style={{ width: "100%" }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
          <button type="button" onClick={() => void handleValidateImport()} disabled={!importRawJson.trim()}>Validate</button>
          <button type="button" onClick={() => void handleImport()} disabled={!importRawJson.trim()}>Import</button>
        </div>

        <details style={{ marginTop: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.65rem", background: "#f9fafb" }}>
          <summary style={{ cursor: "pointer", padding: "0.7rem", fontWeight: 600, color: "#374151" }}>Advanced defaults</summary>
          <div style={{ padding: "0 0.7rem 0.7rem", display: "grid", gap: "0.6rem" }}>
            <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <label style={{ display: "grid", gap: "0.25rem" }}>
                Default domain
                <select value={defaultDomain} onChange={(event) => setDefaultDomain(event.target.value)}>
                  <option value="">none</option>
                  {domainOptions.map((domain) => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: "0.25rem" }}>
                Default tags
                <input
                  value={defaultTagsCsv}
                  onChange={(event) => setDefaultTagsCsv(event.target.value)}
                  placeholder="comma, separated, tags"
                />
              </label>
            </div>
            <p style={{ margin: 0, color: "#4b5563", fontSize: "0.9rem", lineHeight: 1.45 }}>
              Defaults stay optional. Domain only fills blanks, and tags merge with existing item tags.
            </p>
          </div>
        </details>

        {validationErrors.length > 0 ? (
          <div style={{ marginTop: "0.65rem", border: "1px solid #fecaca", borderRadius: "0.5rem", background: "#fef2f2", padding: "0.65rem" }}>
            <strong style={{ color: "#991b1b" }}>Blocking errors</strong>
            <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.2rem" }}>
              {validationErrors.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{issue.code}: {issue.message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {validationWarnings.length > 0 ? (
          <div style={{ marginTop: "0.65rem", border: "1px solid #fde68a", borderRadius: "0.5rem", background: "#fffbeb", padding: "0.65rem" }}>
            <strong style={{ color: "#92400e" }}>Optional fields missing</strong>
            <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.2rem" }}>
              {Object.entries(warningSummary.byField).map(([field, count]) => (
                <li key={field}>{field}: {count} item(s)</li>
              ))}
            </ul>
            {warningSummary.others.length > 0 ? (
              <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.2rem" }}>
                {warningSummary.others.map((warning, index) => (
                  <li key={`${warning.code}-${index}`}>{warning.code}: {warning.message}</li>
                ))}
              </ul>
            ) : null}
            <p style={{ margin: "0.35rem 0 0", color: "#4b5563" }}>This does not affect import.</p>
          </div>
        ) : null}
      </section>

      {message ? <p style={{ color: "#166534", margin: "0.75rem 0 0" }}>{message}</p> : null}
      {error ? <p style={{ color: "#b91c1c", margin: "0.75rem 0 0" }}>{error}</p> : null}
    </AppShell>
  );
}
