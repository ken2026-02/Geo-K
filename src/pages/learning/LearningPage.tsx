import { type ChangeEvent, useEffect, useMemo, useState } from "react";

import type { LearningItemRecord, LearningItemType } from "../../data/repositories/interfaces";
import { AppShell } from "../../shared/ui/layout/AppShell";
import { LearningModuleService, type LearningValidationIssue } from "../../services/learning/learningModuleService";

type LearningFilter = "all" | LearningItemType;
type LearningViewMode = "manage" | "study";

interface DraftState {
  type: LearningItemType;
  content: string;
  meaning: string;
  example: string;
  note: string;
  tagsCsv: string;
  sourceReport: string;
}

function tagsToCsv(tags?: string[]): string {
  return tags?.join(", ") ?? "";
}

function parseTagsCsv(tagsCsv: string): string[] | undefined {
  const tags = tagsCsv.split(",").map((tag) => tag.trim()).filter((tag) => tag.length > 0);
  return tags.length > 0 ? tags : undefined;
}

function truncateText(value: string, max = 120): string {
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
}

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

export function LearningPage() {
  const learningService = useMemo(() => new LearningModuleService(), []);
  const learningTypes = learningService.getLearningTypes();

  const [viewMode, setViewMode] = useState<LearningViewMode>("manage");
  const [items, setItems] = useState<LearningItemRecord[]>([]);
  const [filter, setFilter] = useState<LearningFilter>("all");
  const [selectedFile, setSelectedFile] = useState<File>();
  const [importRawJson, setImportRawJson] = useState("");
  const [validationErrors, setValidationErrors] = useState<LearningValidationIssue[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<LearningValidationIssue[]>([]);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [expandedItemId, setExpandedItemId] = useState<string>();
  const [bulkType, setBulkType] = useState<LearningItemType>("word");
  const [bulkSourceReport, setBulkSourceReport] = useState("");
  const [bulkLines, setBulkLines] = useState("");
  const [studyIndex, setStudyIndex] = useState(0);
  const [studyRevealDetails, setStudyRevealDetails] = useState(false);

  async function refreshItems(nextFilter: LearningFilter = filter): Promise<void> {
    setItems(await learningService.listItems(nextFilter));
  }

  useEffect(() => {
    void refreshItems("all");
  }, []);

  useEffect(() => {
    void refreshItems(filter);
  }, [filter]);

  useEffect(() => {
    setStudyIndex(0);
    setStudyRevealDetails(false);
  }, [filter, items.length]);

  function clearFeedback(): void {
    setMessage(undefined);
    setError(undefined);
  }

  function clearValidationState(): void {
    setValidationErrors([]);
    setValidationWarnings([]);
  }

  function toDraft(item: LearningItemRecord): DraftState {
    return {
      type: item.type,
      content: item.content,
      meaning: item.meaning ?? "",
      example: item.example ?? "",
      note: item.note ?? "",
      tagsCsv: tagsToCsv(item.tags),
      sourceReport: item.sourceReport ?? ""
    };
  }

  function ensureDraft(item: LearningItemRecord): DraftState {
    return drafts[item.id] ?? toDraft(item);
  }

  function setDraft(itemId: string, next: DraftState): void {
    setDrafts((current) => ({ ...current, [itemId]: next }));
  }

  function toggleExpand(item: LearningItemRecord): void {
    if (expandedItemId === item.id) {
      setExpandedItemId(undefined);
      return;
    }

    setDraft(item.id, ensureDraft(item));
    setExpandedItemId(item.id);
  }

  const [isProcessing, setIsProcessing] = useState(false);

  async function handleValidateImport(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    clearValidationState();

    if (!importRawJson.trim()) {
      setError("Select a JSON file or paste Learning Pack JSON first.");
      setIsProcessing(false);
      return;
    }

    try {
      const validation = learningService.validatePack(importRawJson);
      if (validation.state === "invalid") {
        setValidationErrors(validation.errors);
        return;
      }

      setValidationWarnings(validation.warnings);
      setMessage("Learning Pack v1 validation passed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Validation failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleImport(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    clearValidationState();

    if (!importRawJson.trim()) {
      setError("Select a JSON file or paste Learning Pack JSON first.");
      setIsProcessing(false);
      return;
    }

    try {
      const result = await learningService.importPack(importRawJson);
      setMessage(`Imported pack ${result.packId}. Items=${result.imported}, inserted=${result.inserted}, updated=${result.updated}.`);
      setValidationWarnings(result.warnings);
      setSelectedFile(undefined);
      setImportRawJson("");
      await refreshItems(filter);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Learning import failed.");
    } finally {
      setIsProcessing(false);
    }
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

  async function handleSaveItem(item: LearningItemRecord): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    const draft = ensureDraft(item);

    try {
      await learningService.updateItem({
        id: item.id,
        type: draft.type,
        content: draft.content,
        meaning: draft.meaning,
        example: draft.example,
        note: draft.note,
        tags: parseTagsCsv(draft.tagsCsv),
        sourceReport: draft.sourceReport
      });
      setMessage(`Saved learning item: ${item.id}`);
      await refreshItems(filter);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeleteItem(itemId: string): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      await learningService.deleteItem(itemId);
      if (expandedItemId === itemId) {
        setExpandedItemId(undefined);
      }
      setMessage(`Deleted learning item: ${itemId}`);
      await refreshItems(filter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleBulkAdd(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      const added = await learningService.addFromMultiline(bulkType, bulkLines, bulkSourceReport);
      if (added === 0) {
        setError("No non-empty lines found.");
        return;
      }

      setBulkLines("");
      setMessage(`Added ${added} learning item(s) from multiline input.`);
      await refreshItems(filter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bulk add failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleExport(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      const exported = await learningService.exportPack();
      const blob = new Blob([exported.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = exported.fileName;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      setMessage(`Exported ${exported.itemCount} item(s) as ${exported.fileName}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  const warningSummary = summarizeOptionalWarnings(validationWarnings);
  const studyItem = items[studyIndex];

  return (
    <AppShell
      title="Learning Module"
      subtitle="Offline-first Learning Pack v1 workspace for rapid report knowledge accumulation."
    >
      <section style={{ marginBottom: "1rem", border: "1px solid #dbeafe", borderRadius: "0.75rem", padding: "0.75rem", background: "#eff6ff" }}>
        <h3 style={{ marginTop: 0 }}>Learning Engine (Primary Path)</h3>
        <p style={{ margin: "0.25rem 0", color: "#1f2937" }}>
          Use this module for fast learning-item capture/import/export. Learning items stay local and isolated from engineering approved/system knowledge tables.
        </p>
        <p style={{ margin: "0.25rem 0", color: "#4b5563" }}>
          Frozen contract sample: <a href="/pack-samples/learning-pack-v1.sample.json" target="_blank" rel="noreferrer">Learning Pack v1 sample</a>
        </p>
      </section>

      <section style={{ marginBottom: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", background: "#fff" }}>
        <h3 style={{ marginTop: 0 }}>Batch Import (Learning Pack v1 JSON)</h3>
        <input type="file" accept="application/json,.json" onChange={(event) => void handleFileChange(event)} />
        {selectedFile ? <p style={{ margin: "0.4rem 0 0", color: "#4b5563" }}>Selected: {selectedFile.name}</p> : null}
        <textarea
          value={importRawJson}
          onChange={(event) => setImportRawJson(event.target.value)}
          rows={8}
          placeholder="Paste Learning Pack v1 JSON here"
          style={{ width: "100%", marginTop: "0.5rem" }}
        />
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" onClick={() => void handleValidateImport()} disabled={!importRawJson.trim() || isProcessing}>Validate Learning Pack</button>
          <button type="button" onClick={() => void handleImport()} disabled={!importRawJson.trim() || isProcessing}>Import Learning Pack</button>
        </div>

        {validationErrors.length > 0 ? (
          <div style={{ marginTop: "0.6rem", border: "1px solid #fecaca", borderRadius: "0.5rem", background: "#fef2f2", padding: "0.65rem" }}>
            <strong style={{ color: "#991b1b" }}>Blocking errors</strong>
            <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.2rem" }}>
              {validationErrors.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{issue.code}: {issue.message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {validationWarnings.length > 0 ? (
          <div style={{ marginTop: "0.6rem", border: "1px solid #fde68a", borderRadius: "0.5rem", background: "#fffbeb", padding: "0.65rem" }}>
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

      <section style={{ marginBottom: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", background: "#fff" }}>
        <h3 style={{ marginTop: 0 }}>Quick Multi-line Add (Optional)</h3>
        <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          <label style={{ display: "grid", gap: "0.3rem" }}>
            Type
            <select value={bulkType} onChange={(event) => setBulkType(event.target.value as LearningItemType)}>
              {learningTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: "0.3rem" }}>
            Source report (optional)
            <input value={bulkSourceReport} onChange={(event) => setBulkSourceReport(event.target.value)} />
          </label>
        </div>
        <textarea
          value={bulkLines}
          onChange={(event) => setBulkLines(event.target.value)}
          rows={4}
          placeholder="One learning item per line"
          style={{ width: "100%", marginTop: "0.5rem" }}
        />
        <button type="button" onClick={() => void handleBulkAdd()} style={{ marginTop: "0.5rem" }} disabled={isProcessing}>Add Lines As Learning Items</button>
      </section>

      <section style={{ marginBottom: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", background: "#fff" }}>
        <h3 style={{ marginTop: 0 }}>Learning Workspace</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
          <button type="button" onClick={() => setViewMode("manage")} disabled={viewMode === "manage"}>Manage</button>
          <button type="button" onClick={() => setViewMode("study")} disabled={viewMode === "study"}>Study</button>

          <label>
            Filter type
            <select value={filter} onChange={(event) => setFilter(event.target.value as LearningFilter)} style={{ marginLeft: "0.4rem" }}>
              <option value="all">all</option>
              {learningTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>

          <button type="button" onClick={() => void handleExport()} disabled={isProcessing}>Export Learning Pack v1 JSON</button>
          <span style={{ color: "#6b7280", alignSelf: "center" }}>Items: {items.length}</span>
        </div>

        {items.length === 0 ? <p style={{ color: "#6b7280" }}>No learning items yet. Import a pack or add lines above.</p> : null}

        {viewMode === "manage" ? (
          <div style={{ display: "grid", gap: "0.45rem" }}>
            {items.map((item) => {
              const draft = ensureDraft(item);
              const isExpanded = expandedItemId === item.id;
              return (
                <article key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: "0.65rem", background: "#fafafa", overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(item)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      background: "#fff",
                      borderBottom: isExpanded ? "1px solid #e5e7eb" : "none",
                      padding: "0.6rem",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                      <strong style={{ color: "#111827" }}>[{item.type}] {truncateText(item.content, 110)}</strong>
                      <span style={{ color: "#6b7280", fontSize: "0.82rem" }}>{isExpanded ? "Collapse" : "Edit"}</span>
                    </div>
                    <div style={{ marginTop: "0.35rem", display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {item.meaning ? <span style={{ padding: "0.1rem 0.4rem", borderRadius: "999px", fontSize: "0.78rem", background: "#eef2ff", color: "#3730a3" }}>has meaning</span> : null}
                      {item.note ? <span style={{ padding: "0.1rem 0.4rem", borderRadius: "999px", fontSize: "0.78rem", background: "#ecfeff", color: "#155e75" }}>has note</span> : null}
                      {item.tags && item.tags.length > 0 ? <span style={{ padding: "0.1rem 0.4rem", borderRadius: "999px", fontSize: "0.78rem", background: "#f0fdf4", color: "#166534" }}>has tags</span> : null}
                      {item.example ? <span style={{ padding: "0.1rem 0.4rem", borderRadius: "999px", fontSize: "0.78rem", background: "#fffbeb", color: "#92400e" }}>has example</span> : null}
                    </div>
                  </button>

                  {isExpanded ? (
                    <div style={{ padding: "0.65rem", display: "grid", gap: "0.45rem" }}>
                      <p style={{ margin: 0, color: "#4b5563", fontSize: "0.82rem" }}>
                        {item.id} | created: {item.createdAt} | updated: {item.updatedAt}
                      </p>
                      <label style={{ display: "grid", gap: "0.2rem" }}>
                        Type
                        <select value={draft.type} onChange={(event) => setDraft(item.id, { ...draft, type: event.target.value as LearningItemType })}>
                          {learningTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: "grid", gap: "0.2rem" }}>
                        Content
                        <textarea value={draft.content} onChange={(event) => setDraft(item.id, { ...draft, content: event.target.value })} rows={2} />
                      </label>
                      <label style={{ display: "grid", gap: "0.2rem" }}>
                        Meaning (optional)
                        <input value={draft.meaning} onChange={(event) => setDraft(item.id, { ...draft, meaning: event.target.value })} />
                      </label>
                      <label style={{ display: "grid", gap: "0.2rem" }}>
                        Example (optional)
                        <input value={draft.example} onChange={(event) => setDraft(item.id, { ...draft, example: event.target.value })} />
                      </label>
                      <label style={{ display: "grid", gap: "0.2rem" }}>
                        Note (optional)
                        <textarea value={draft.note} onChange={(event) => setDraft(item.id, { ...draft, note: event.target.value })} rows={2} />
                      </label>
                      <label style={{ display: "grid", gap: "0.2rem" }}>
                        Tags (comma separated)
                        <input value={draft.tagsCsv} onChange={(event) => setDraft(item.id, { ...draft, tagsCsv: event.target.value })} />
                      </label>
                      <label style={{ display: "grid", gap: "0.2rem" }}>
                        Source report (optional)
                        <input value={draft.sourceReport} onChange={(event) => setDraft(item.id, { ...draft, sourceReport: event.target.value })} />
                      </label>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button type="button" onClick={() => void handleSaveItem(item)} disabled={isProcessing}>Save</button>
                        <button type="button" onClick={() => void handleDeleteItem(item.id)} disabled={isProcessing}>Delete</button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}

        {viewMode === "study" ? (
          <section style={{ border: "1px solid #e5e7eb", borderRadius: "0.7rem", padding: "0.75rem", background: "#fafafa" }}>
            {!studyItem ? <p style={{ margin: 0, color: "#6b7280" }}>No item available for this filter.</p> : null}
            {studyItem ? (
              <>
                <p style={{ margin: 0, color: "#4b5563", fontSize: "0.88rem" }}>Item {studyIndex + 1} / {items.length} | {studyItem.type}</p>
                <h4 style={{ margin: "0.45rem 0 0.35rem" }}>{studyItem.content}</h4>

                {studyRevealDetails ? (
                  <div style={{ display: "grid", gap: "0.35rem", marginTop: "0.35rem" }}>
                    {studyItem.meaning ? <p style={{ margin: 0 }}><strong>Meaning:</strong> {studyItem.meaning}</p> : null}
                    {studyItem.example ? <p style={{ margin: 0 }}><strong>Example:</strong> {studyItem.example}</p> : null}
                    {studyItem.note ? <p style={{ margin: 0 }}><strong>Note:</strong> {studyItem.note}</p> : null}
                    {studyItem.tags && studyItem.tags.length > 0 ? <p style={{ margin: 0 }}><strong>Tags:</strong> {studyItem.tags.join(", ")}</p> : null}
                    {studyItem.sourceReport ? <p style={{ margin: 0 }}><strong>Source report:</strong> {studyItem.sourceReport}</p> : null}
                  </div>
                ) : null}

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setStudyRevealDetails((current) => !current)}>
                    {studyRevealDetails ? "Hide details" : "Reveal details"}
                  </button>
                  <button type="button" onClick={() => { setStudyIndex((value) => Math.max(0, value - 1)); setStudyRevealDetails(false); }} disabled={studyIndex === 0}>Previous</button>
                  <button type="button" onClick={() => { setStudyIndex((value) => Math.min(items.length - 1, value + 1)); setStudyRevealDetails(false); }} disabled={studyIndex >= items.length - 1}>Next</button>
                </div>
              </>
            ) : null}
          </section>
        ) : null}
      </section>

      {message ? <p style={{ color: "#166534" }}>{message}</p> : null}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
    </AppShell>
  );
}
