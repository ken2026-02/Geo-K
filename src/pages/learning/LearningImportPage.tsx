import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { LearningCollectionRecord, LearningCollectionSourceType } from "../../data/repositories/interfaces";
import { parseTagsCsv } from "../../features/learning/classification";
import { ConfirmDialog } from "../../shared/ui/feedback/ConfirmDialog";
import { FeedbackBanner } from "../../shared/ui/feedback/FeedbackBanner";
import { InlineInfo } from "../../shared/ui/feedback/InlineInfo";
import { AppShell } from "../../shared/ui/layout/AppShell";
import { LearningSubnav } from "./LearningSubnav";
import { LearningModuleService, type LearningValidationIssue } from "../../services/learning/learningModuleService";

function summarizeOptionalWarnings(
  warnings: LearningValidationIssue[]
): { byField: Record<string, number>; others: LearningValidationIssue[] } {
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

const inputLabelClass = "grid gap-2";
const sectionTitleClass = "text-lg font-semibold text-slate-900";
const sectionHintClass = "text-sm leading-6 text-slate-600";
type DeleteListMode = "move_to_general" | "delete_items";
const learningPackSampleJson = `{
  "schema_version": "1.0",
  "pack_id": "learning-pack-example",
  "collection": {
    "name": "AS 1726",
    "source_type": "standard",
    "authority": "Standards Australia",
    "document_number": "AS 1726"
  },
  "items": [
    {
      "id": "learn-word-basalt",
      "type": "word",
      "content": "Basalt",
      "meaning": "A dark, fine-grained volcanic rock.",
      "example": "The oceanic crust is primarily composed of basalt.",
      "domain": "geology",
      "status": "new",
      "tags": ["igneous", "rock"]
    },
    {
      "id": "learn-rule-fines-trace",
      "type": "classification_rule",
      "content": "In coarse grained soils, fines up to 5 percent are described as trace.",
      "meaning": "Use this rule when classifying coarse soils by fines content.",
      "example": "Up to 5 percent = trace, greater than 5 and up to 12 percent = with fines.",
      "note": "Prefer classification_rule or table_entry instead of plain sentence for threshold logic.",
      "domain": "classification",
      "source_report": "AS 1726 clause/table reference"
    },
    {
      "id": "learn-req-bore-logging",
      "type": "requirement",
      "content": "Log the borehole using the project soil and rock description system.",
      "meaning": "Treat this as a compliance requirement rather than free prose.",
      "note": "Use requirement for shall/must/minimum criteria statements.",
      "domain": "logging",
      "source_report": "Project spec section 4.2"
    },
    {
      "id": "learn-method-spt",
      "type": "method",
      "content": "Record SPT depth, hammer blows, recovery, and refusal observations for each test interval.",
      "meaning": "Method items should describe an actionable procedure or field workflow.",
      "domain": "site investigation",
      "source_report": "Field method note"
    }
  ]
}`;
const learningPackAiPrompt = `You are generating structured study data for a React/TypeScript learning app.

Return only one valid JSON object.
Do not use markdown.
Do not wrap the JSON in code fences.
Do not add any explanation before or after the JSON.

Goal:
Convert the provided standard, manual, report, or study notes into a Learning Pack v1 JSON object for import into a personal learning library.

Output schema requirements:
- Top-level object must contain:
  - "schema_version": must be "1.0"
  - "pack_id": unique string
  - "collection": optional but preferred metadata object
  - "items": array of learning items
- Each item must contain:
  - "id": unique string within the pack
  - "type": one of:
    "word", "phrase", "sentence", "concept", "requirement", "method", "classification_rule", "table_entry"
  - "content": the exact thing to study first
- Optional item fields:
  - "meaning": concise explanation or Chinese meaning
  - "example": usage example, worked example, or companion example
  - "note": caveat, boundary case, memory hook, or exception
  - "domain": stable category label
  - "status": usually "new"
  - "tags": array of short tags
  - "source_report": precise source anchor such as document + clause/table/section

Collection object format:
- "name": document or study set name
- "source_type": one of "standard", "manual", "guide", "report", "code", "personal"
- "authority": organization or issuer if known
- "document_number": document identifier if known
- "edition": edition/year if known
- "jurisdiction": country/state/project scope if known
- "description": short summary

Type selection rules:
- Use "word" for single terms, abbreviations, symbols, or compact technical words.
- Use "phrase" for short multi-word engineering expressions.
- Use "sentence" for reusable descriptive wording or report language.
- Use "concept" for definitions, explanatory ideas, or interpreted understanding.
- Use "requirement" for shall/must/should/minimum criteria/compliance obligations.
- Use "method" for procedures, tests, workflows, site steps, or inspection sequences.
- Use "classification_rule" for thresholds, if/then logic, naming boundaries, rule-based decisions.
- Use "table_entry" for one row or one explicit decision line extracted from a table.

Field semantics:
- "content" = original learning target itself, keep it short and exact.
- "meaning" = plain-language explanation, direct meaning, or Chinese meaning.
- "example" = example application, example sentence, worked case, or comparison case.
- "note" = exception, warning, edge case, or mnemonic.
- "domain" = stable grouping such as:
  "geology", "mapping", "classification", "groundwater", "logging", "site investigation", "safety", "materials", "reporting"
- "source_report" = must be specific when available, such as:
  "AS 1726 Table X", "Section 4.2", "Clause 7.3", "Project report SIR-008"

Quality rules:
- Prefer many small, clean items over long paragraphs.
- Do not invent clauses, tables, or source anchors.
- Do not create duplicate items with the same learning target.
- Do not leave "content" empty.
- Use "classification_rule" or "table_entry" instead of "sentence" for threshold logic.
- Use "requirement" instead of "sentence" for mandatory statements.
- Use consistent domains across the pack.
- Default item "status" to "new" unless instructed otherwise.
- Keep "tags" short and useful.
- If a field is unknown, omit it instead of fabricating it.

Normalization rules:
- Preserve the engineering meaning of the source.
- Rewrite into study-friendly units.
- Keep English technical wording when important.
- Chinese meaning can be used in "meaning" when helpful.
- Avoid copying long copyrighted passages verbatim; summarize and structure them.

Output size rules:
- Extract the most important study items first.
- If the source is large, prioritize:
  1. glossary terms
  2. key requirements
  3. methods and procedures
  4. classification rules
  5. table-derived decisions
  6. reusable reporting sentences

Example output shape:
{
  "schema_version": "1.0",
  "pack_id": "example-pack",
  "collection": {
    "name": "AS 1726",
    "source_type": "standard",
    "authority": "Standards Australia",
    "document_number": "AS 1726",
    "edition": "2017",
    "jurisdiction": "AU",
    "description": "Geotechnical site investigation study pack"
  },
  "items": [
    {
      "id": "as1726-word-basalt",
      "type": "word",
      "content": "basalt",
      "meaning": "A dark fine-grained volcanic rock.",
      "domain": "geology",
      "status": "new",
      "tags": ["rock", "igneous"]
    },
    {
      "id": "as1726-rule-fines-trace",
      "type": "classification_rule",
      "content": "In coarse grained soils, fines up to 5 percent are described as trace.",
      "meaning": "This rule controls coarse-soil naming based on fines content.",
      "note": "Use classification_rule for threshold logic instead of plain sentence.",
      "domain": "classification",
      "status": "new",
      "source_report": "AS 1726 table/section reference"
    }
  ]
}

Now generate the JSON from the source material I provide.`;

export function LearningImportPage() {
  const learningService = useMemo(() => new LearningModuleService(), []);
  const domainOptions = learningService.getSuggestedDomains();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedFile, setSelectedFile] = useState<File>();
  const [importRawJson, setImportRawJson] = useState("");
  const [defaultDomain, setDefaultDomain] = useState("");
  const [defaultTagsCsv, setDefaultTagsCsv] = useState("");
  const [showDefaults, setShowDefaults] = useState(false);
  const [collections, setCollections] = useState<LearningCollectionRecord[]>([]);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string>();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionSourceType, setNewCollectionSourceType] = useState<LearningCollectionSourceType>("standard");
  const [newCollectionAuthority, setNewCollectionAuthority] = useState("");
  const [newCollectionDocumentNumber, setNewCollectionDocumentNumber] = useState("");
  const [newCollectionEdition, setNewCollectionEdition] = useState("");
  const [newCollectionJurisdiction, setNewCollectionJurisdiction] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [validationErrors, setValidationErrors] = useState<LearningValidationIssue[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<LearningValidationIssue[]>([]);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteCollectionConfirm, setShowDeleteCollectionConfirm] = useState(false);
  const [deleteListMode, setDeleteListMode] = useState<DeleteListMode>("move_to_general");
  const activeCollectionId = searchParams.get("collection") ?? "";

  async function refreshCollections(): Promise<void> {
    const next = await learningService.listCollections();
    setCollections(next);
    if (!activeCollectionId && next[0]) {
      setSearchParams((current) => {
        const nextParams = new URLSearchParams(current);
        nextParams.set("collection", next[0].id);
        return nextParams;
      });
    }
  }

  useEffect(() => {
    void refreshCollections();
  }, []);

  function clearFeedback(): void {
    setMessage(undefined);
    setError(undefined);
  }

  function clearValidationState(): void {
    setValidationErrors([]);
    setValidationWarnings([]);
  }

  async function copyText(value: string, label: string): Promise<void> {
    clearFeedback();
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied to clipboard.`);
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : `Failed to copy ${label.toLowerCase()}.`);
    }
  }

  async function handleCreateCollection(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();

    try {
      const created = await learningService.createCollection({
        name: newCollectionName,
        sourceType: newCollectionSourceType,
        authority: newCollectionAuthority,
        documentNumber: newCollectionDocumentNumber,
        edition: newCollectionEdition,
        jurisdiction: newCollectionJurisdiction,
        description: newCollectionDescription
      });

      await refreshCollections();
      setSearchParams((current) => {
        const nextParams = new URLSearchParams(current);
        nextParams.set("collection", created.id);
        return nextParams;
      });
      setShowCreateCollection(false);
      setEditingCollectionId(undefined);
      setNewCollectionName("");
      setNewCollectionAuthority("");
      setNewCollectionDocumentNumber("");
      setNewCollectionEdition("");
      setNewCollectionJurisdiction("");
      setNewCollectionDescription("");
      setMessage(`Created learning list: ${created.name}.`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create learning list.");
    } finally {
      setIsProcessing(false);
    }
  }

  function startCreateCollection(): void {
    setEditingCollectionId(undefined);
    setShowCreateCollection((value) => {
      const next = !value;
      if (next) {
        setNewCollectionName("");
        setNewCollectionSourceType("standard");
        setNewCollectionAuthority("");
        setNewCollectionDocumentNumber("");
        setNewCollectionEdition("");
        setNewCollectionJurisdiction("");
        setNewCollectionDescription("");
      }
      return next;
    });
  }

  function startEditCollection(collection: LearningCollectionRecord): void {
    setShowCreateCollection(true);
    setEditingCollectionId(collection.id);
    setNewCollectionName(collection.name);
    setNewCollectionSourceType(collection.sourceType);
    setNewCollectionAuthority(collection.authority ?? "");
    setNewCollectionDocumentNumber(collection.documentNumber ?? "");
    setNewCollectionEdition(collection.edition ?? "");
    setNewCollectionJurisdiction(collection.jurisdiction ?? "");
    setNewCollectionDescription(collection.description ?? "");
  }

  function resetCollectionEditor(): void {
    setShowCreateCollection(false);
    setEditingCollectionId(undefined);
    setNewCollectionName("");
    setNewCollectionSourceType("standard");
    setNewCollectionAuthority("");
    setNewCollectionDocumentNumber("");
    setNewCollectionEdition("");
    setNewCollectionJurisdiction("");
    setNewCollectionDescription("");
  }

  async function handleSaveCollection(): Promise<void> {
    if (editingCollectionId) {
      setIsProcessing(true);
      clearFeedback();
      try {
        const updated = await learningService.updateCollection({
          id: editingCollectionId,
          name: newCollectionName,
          sourceType: newCollectionSourceType,
          authority: newCollectionAuthority,
          documentNumber: newCollectionDocumentNumber,
          edition: newCollectionEdition,
          jurisdiction: newCollectionJurisdiction,
          description: newCollectionDescription
        });
        await refreshCollections();
        setSearchParams((current) => {
          const nextParams = new URLSearchParams(current);
          nextParams.set("collection", updated.id);
          return nextParams;
        });
        resetCollectionEditor();
        setMessage(`Updated learning list: ${updated.name}.`);
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : "Failed to update learning list.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    await handleCreateCollection();
  }

  async function handleDeleteCollection(): Promise<void> {
    if (!activeCollection || isProcessing) {
      return;
    }

    setIsProcessing(true);
    clearFeedback();
    try {
      const result = await learningService.deleteCollection(activeCollection.id, {
        deleteItems: deleteListMode === "delete_items"
      });
      await refreshCollections();
      setSearchParams((current) => {
        const nextParams = new URLSearchParams(current);
        const nextCollection = collections.find((collection) => collection.id !== activeCollection.id)?.id;
        if (nextCollection) {
          nextParams.set("collection", nextCollection);
        } else {
          nextParams.delete("collection");
        }
        return nextParams;
      });
      setShowDeleteCollectionConfirm(false);
      resetCollectionEditor();
      setMessage(
        deleteListMode === "delete_items"
          ? `Deleted list ${activeCollection.name} and removed ${result.deletedItems} item(s).`
          : `Deleted list ${activeCollection.name}. ${result.movedItems} item(s) moved to General Learning.`
      );
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete learning list.");
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

  async function handleValidateImport(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    clearValidationState();

    try {
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
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : "Validation failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleImport(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    clearValidationState();

    try {
      if (!importRawJson.trim()) {
        setError("Select a JSON file or paste Learning Pack JSON first.");
        return;
      }

      const result = await learningService.importPack(importRawJson, {
        collectionId: activeCollectionId || undefined,
        defaultDomain,
        defaultTags: parseTagsCsv(defaultTagsCsv)
      });
      const targetCollection = collections.find((collection) => collection.id === activeCollectionId);
      setMessage(
        `Imported pack ${result.packId} into ${targetCollection?.name ?? "selected list"}. Items=${result.imported}, inserted=${result.inserted}, updated=${result.updated}.`
      );
      setValidationWarnings(result.warnings);
      setSelectedFile(undefined);
      setImportRawJson("");
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Learning import failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  const warningSummary = summarizeOptionalWarnings(validationWarnings);
  const activeCollection = collections.find((collection) => collection.id === activeCollectionId);

  return (
    <AppShell title="Learning Import" subtitle="Import one learning pack into one list at a time." pageDescription={null}>
      <ConfirmDialog
        open={showDeleteCollectionConfirm}
        title="Delete learning list?"
        body={
          deleteListMode === "delete_items"
            ? `Delete ${activeCollection?.name ?? "this list"} and permanently remove all items inside it.`
            : `Delete ${activeCollection?.name ?? "this list"} and move all items inside it to General Learning.`
        }
        confirmLabel={deleteListMode === "delete_items" ? "Delete list and items" : "Delete list"}
        tone="danger"
        busy={isProcessing}
        onConfirm={() => void handleDeleteCollection()}
        onCancel={() => setShowDeleteCollectionConfirm(false)}
      />
      <LearningSubnav />

      <div className="mt-4 space-y-4">
        {message ? <FeedbackBanner tone="success" message={message} /> : null}
        {error ? <FeedbackBanner tone="error" message={error} /> : null}
      </div>

      <section className="ekv-card mt-4 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={sectionTitleClass}>Import JSON</h3>
          <InlineInfo title="Import learning pack">
            Choose a target learning list first, then upload or paste a Learning Pack v1 JSON file.
          </InlineInfo>
        </div>

        <div className="mt-3 rounded-3xl border border-indigo-100 bg-indigo-50/70 p-3.5">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className={inputLabelClass}>
              <span className="ekv-label">Target learning list</span>
              <select
                value={activeCollectionId}
                onChange={(event) => setSearchParams((current) => {
                  const nextParams = new URLSearchParams(current);
                  nextParams.set("collection", event.target.value);
                  return nextParams;
                })}
                className="ekv-select"
              >
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-3 gap-2 lg:w-auto">
              <button type="button" onClick={startCreateCollection} className="ekv-button-compact min-w-0 px-2">
                {editingCollectionId ? "New" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => activeCollection ? startEditCollection(activeCollection) : undefined}
                disabled={!activeCollection}
                className="ekv-button-compact min-w-0 px-2"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteCollectionConfirm(true)}
                disabled={!activeCollection || activeCollection.id === "collection-general"}
                className="ekv-button-compact min-w-0 px-2 text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>

          {activeCollection ? (
            <div className="mt-3 rounded-2xl border border-white/80 bg-white/90 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                  {activeCollection.sourceType}
                </span>
                <p className="text-sm font-semibold text-slate-900">{activeCollection.name}</p>
                {activeCollection.documentNumber ? <span className="text-sm text-slate-500">{activeCollection.documentNumber}</span> : null}
                {activeCollection.authority ? <span className="text-sm text-slate-500">{activeCollection.authority}</span> : null}
              </div>
              {activeCollection.description ? <p className="mt-1 text-sm leading-5 text-slate-600">{activeCollection.description}</p> : null}
            </div>
          ) : null}

          {showCreateCollection ? (
            <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-indigo-200 bg-white p-4 sm:grid-cols-2">
              <label className={inputLabelClass}>
                <span className="ekv-label">List name</span>
                <input value={newCollectionName} onChange={(event) => setNewCollectionName(event.target.value)} placeholder="AS 1726: Site Investigations" className="ekv-input" />
              </label>
              <label className={inputLabelClass}>
                <span className="ekv-label">Source type</span>
                <select value={newCollectionSourceType} onChange={(event) => setNewCollectionSourceType(event.target.value as LearningCollectionSourceType)} className="ekv-select">
                  <option value="standard">standard</option>
                  <option value="manual">manual</option>
                  <option value="guide">guide</option>
                  <option value="report">report</option>
                  <option value="code">code</option>
                  <option value="personal">personal</option>
                </select>
              </label>
              <label className={inputLabelClass}>
                <span className="ekv-label">Authority</span>
                <input value={newCollectionAuthority} onChange={(event) => setNewCollectionAuthority(event.target.value)} placeholder="Standards Australia" className="ekv-input" />
              </label>
              <label className={inputLabelClass}>
                <span className="ekv-label">Document number</span>
                <input value={newCollectionDocumentNumber} onChange={(event) => setNewCollectionDocumentNumber(event.target.value)} placeholder="AS 1726" className="ekv-input" />
              </label>
              <label className={inputLabelClass}>
                <span className="ekv-label">Edition</span>
                <input value={newCollectionEdition} onChange={(event) => setNewCollectionEdition(event.target.value)} placeholder="2017" className="ekv-input" />
              </label>
              <label className={inputLabelClass}>
                <span className="ekv-label">Jurisdiction</span>
                <input value={newCollectionJurisdiction} onChange={(event) => setNewCollectionJurisdiction(event.target.value)} placeholder="AU / QLD" className="ekv-input" />
              </label>
              <label className="grid gap-2 sm:col-span-2">
                <span className="ekv-label">Notes</span>
                <textarea value={newCollectionDescription} onChange={(event) => setNewCollectionDescription(event.target.value)} rows={3} className="ekv-textarea" />
              </label>
              <div className="sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => void handleSaveCollection()} disabled={isProcessing} className="ekv-button-primary">
                    {editingCollectionId ? "Save List" : "Create List"}
                  </button>
                  <button type="button" onClick={resetCollectionEditor} className="ekv-button-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {showDeleteCollectionConfirm ? (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3">
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    checked={deleteListMode === "move_to_general"}
                    onChange={() => setDeleteListMode("move_to_general")}
                    className="h-4 w-4"
                  />
                  Move items to General Learning
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    checked={deleteListMode === "delete_items"}
                    onChange={() => setDeleteListMode("delete_items")}
                    className="h-4 w-4"
                  />
                  Delete list and all items inside it
                </label>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3">
            <label className={inputLabelClass}>
              <span className="ekv-label">Upload file</span>
              <input type="file" accept="application/json,.json" onChange={(event) => void handleFileChange(event)} className="ekv-input file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100" />
            </label>
            {selectedFile ? <p className="text-sm text-slate-500">Selected: {selectedFile.name}</p> : null}
            <label className="grid gap-2">
              <span className="ekv-label">Paste JSON</span>
              <textarea
                value={importRawJson}
                onChange={(event) => setImportRawJson(event.target.value)}
                rows={11}
                placeholder="Paste Learning Pack v1 JSON here"
                className="ekv-textarea min-h-[260px]"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void handleValidateImport()} disabled={!importRawJson.trim() || isProcessing} className="ekv-button-compact">
                Validate
              </button>
              <button type="button" onClick={() => void handleImport()} disabled={!importRawJson.trim() || !activeCollectionId || isProcessing} className="ekv-button-primary">
                Import
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <button
              type="button"
              onClick={() => setShowDefaults((value) => !value)}
              className="flex w-full items-center justify-between text-left"
            >
              <span>
                <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Optional defaults</span>
                <span className="mt-1 block text-sm leading-5 text-slate-600">
                  Fill blank domains or tags during import.
                </span>
              </span>
              <span className="text-sm font-semibold text-slate-500">{showDefaults ? "Hide" : "Show"}</span>
            </button>

            {showDefaults ? (
              <div className="mt-3 grid gap-3">
                <label className={inputLabelClass}>
                  <span className="ekv-label">Default domain</span>
                  <select value={defaultDomain} onChange={(event) => setDefaultDomain(event.target.value)} className="ekv-select">
                    <option value="">none</option>
                    {domainOptions.map((domain) => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </label>
                <label className={inputLabelClass}>
                  <span className="ekv-label">Default tags</span>
                  <input
                    value={defaultTagsCsv}
                    onChange={(event) => setDefaultTagsCsv(event.target.value)}
                    placeholder="comma, separated, tags"
                    className="ekv-input"
                  />
                </label>
              </div>
            ) : null}
          </div>
        </div>

        {validationErrors.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
            <strong className="text-sm font-semibold text-red-800">Blocking errors</strong>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-red-700">
              {validationErrors.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{issue.code}: {issue.message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {validationWarnings.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <strong className="text-sm font-semibold text-amber-900">Optional fields missing</strong>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-800">
              {Object.entries(warningSummary.byField).map(([field, count]) => (
                <li key={field}>{field}: {count} item(s)</li>
              ))}
            </ul>
            {warningSummary.others.length > 0 ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-800">
                {warningSummary.others.map((warning, index) => (
                  <li key={`${warning.code}-${index}`}>{warning.code}: {warning.message}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-sm text-amber-900">These warnings do not block import.</p>
          </div>
        ) : null}

        <details className="mt-6 rounded-3xl border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800">JSON Format Requirements & Sample</summary>
          <div className="grid gap-4 px-4 pb-4">
            <p className={sectionHintClass}>
              Learning import expects a Learning Pack v1 object with <code>schema_version</code>, <code>pack_id</code>, and an <code>items</code> array. This schema is shared by standards/manual study packs and ordinary personal word or phrase packs, so imported data stays consistent with the personal learning library.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
              <li><strong>schema_version</strong>: must be <code>1.0</code>.</li>
              <li><strong>pack_id</strong>: required export/import batch id.</li>
              <li><strong>collection</strong>: optional metadata block for the target standard, manual, code, or report.</li>
              <li><strong>items</strong>: array of learning items.</li>
              <li>Each item needs <strong>id</strong>, <strong>type</strong>, and <strong>content</strong>.</li>
              <li>Supported item types include <code>word</code>, <code>phrase</code>, <code>sentence</code>, <code>concept</code>, <code>requirement</code>, <code>method</code>, <code>classification_rule</code>, and <code>table_entry</code>.</li>
              <li>Optional fields include <strong>meaning</strong>, <strong>example</strong>, <strong>note</strong>, <strong>domain</strong>, <strong>tags</strong>, <strong>status</strong>, and <strong>source_report</strong>.</li>
              <li><strong>meaning/example/note</strong> stay available for every type, but for standards and manuals they should be used with stable semantics instead of as random free text.</li>
            </ul>
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-6 text-slate-700">
              <strong className="block text-slate-900">Recommended item mapping for standards, manuals, reports, and personal study</strong>
              <div className="mt-2 grid gap-1">
                <span><code>word / phrase</code>: glossary terms, abbreviations, short engineering expressions.</span>
                <span><code>sentence</code>: reusable wording, report descriptions, standard prose fragments.</span>
                <span><code>concept</code>: definitions or explanatory ideas that need interpretation, not just recall.</span>
                <span><code>requirement</code>: must / shall / minimum acceptance criteria / compliance conditions.</span>
                <span><code>method</code>: steps, tests, inspection workflows, procedures, or field methods.</span>
                <span><code>classification_rule</code>: threshold logic, if/then boundaries, naming rules, decision logic.</span>
                <span><code>table_entry</code>: one structured row or one explicit decision line extracted from a table.</span>
              </div>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm leading-6 text-slate-700">
              <strong className="block text-slate-900">Recommended field semantics</strong>
              <div className="mt-2 grid gap-1">
                <span><code>content</code>: the exact thing to study first.</span>
                <span><code>meaning</code>: plain-language explanation, interpretation, or direct Chinese meaning.</span>
                <span><code>example</code>: worked example, usage example, or companion row/value.</span>
                <span><code>note</code>: edge case, caveat, exception, comparison, or memory hook.</span>
                <span><code>domain</code>: stable grouping like geology, classification, mapping, groundwater, safety.</span>
                <span><code>source_report</code>: clause/table/report anchor that keeps later imports and exports traceable.</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => void copyText(learningPackSampleJson, "JSON sample")} className="ekv-button-compact">
                Copy JSON sample
              </button>
            </div>
            <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 text-xs leading-6 text-slate-100 sm:text-sm">{learningPackSampleJson}</pre>
          </div>
        </details>

        <details className="mt-4 rounded-3xl border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800">
            AI Prompt For Generating Learning Pack JSON
          </summary>
          <div className="px-4 pb-4">
            <p className="mb-3 text-sm leading-6 text-slate-600">
              Copy this prompt into your AI workflow when you want standards, manuals, reports, or personal notes summarized into import-ready Learning Pack v1 JSON.
            </p>
            <div className="mb-3 flex justify-end">
              <button type="button" onClick={() => void copyText(learningPackAiPrompt, "AI prompt")} className="ekv-button-compact">
                Copy AI prompt
              </button>
            </div>
            <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 text-xs leading-6 text-slate-100 sm:text-sm">{learningPackAiPrompt}</pre>
          </div>
        </details>
      </section>
    </AppShell>
  );
}
