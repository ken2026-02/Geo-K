import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import type {
  LearningCollectionRecord,
  LearningItemRecord,
  LearningItemStatus,
  LearningItemType
} from "../../data/repositories/interfaces";
import {
  buildLearningDomainOptions,
  filterLearningItems,
  getLearningStatus,
  parseTagsCsv,
  tagsToCsv
} from "../../features/learning/classification";
import { ConfirmDialog } from "../../shared/ui/feedback/ConfirmDialog";
import { FeedbackBanner } from "../../shared/ui/feedback/FeedbackBanner";
import { InlineInfo } from "../../shared/ui/feedback/InlineInfo";
import { AppShell } from "../../shared/ui/layout/AppShell";
import { LearningModuleService } from "../../services/learning/learningModuleService";
import { LearningSubnav } from "./LearningSubnav";
import {
  getLearningDetailRows,
  getLearningFieldConfig,
  getLearningSignalChips,
  getLearningSummaryText,
  getLearningTypeBadgeClasses
} from "./learningItemPresentation";

type LearningFilter = "all" | LearningItemType;
type DomainFilter = "all" | string;
type StatusFilter = "all" | LearningItemStatus;
type ManagePageSize = "10" | "20" | "50" | "100" | "all";
type ConfirmAction = { kind: "delete_selected"; count: number } | null;

interface DraftState {
  type: LearningItemType;
  content: string;
  meaning: string;
  example: string;
  note: string;
  domain: string;
  status: LearningItemStatus;
  tagsCsv: string;
  sourceReport: string;
}

function truncateText(value: string, max = 120): string {
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
}

function getTotalPages(totalItems: number, pageSize: number): number {
  if (totalItems === 0) {
    return 0;
  }

  return Math.ceil(totalItems / pageSize);
}

function getStatusBadgeClasses(status: LearningItemStatus): string {
  switch (status) {
    case "learning":
      return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200";
    case "reviewed":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "ignored":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
    case "new":
    default:
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }
}

const chipBaseClass = "ekv-chip";
const inputLabelClass = "grid gap-2";
const sectionTitleClass = "text-lg font-semibold text-slate-900";
const sectionHintClass = "text-sm leading-6 text-slate-600";
const mobileMetaChipClass = "ekv-chip bg-slate-100 text-[11px] text-slate-600";
export function LearningManagePage() {
  const learningService = useMemo(() => new LearningModuleService(), []);
  const learningTypes = learningService.getLearningTypes();
  const learningStatuses = learningService.getSuggestedStatuses();
  const [searchParams, setSearchParams] = useSearchParams();

  const [collections, setCollections] = useState<LearningCollectionRecord[]>([]);
  const [items, setItems] = useState<LearningItemRecord[]>([]);
  const [typeFilter, setTypeFilter] = useState<LearningFilter>("all");
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pageSize, setPageSize] = useState<ManagePageSize>("20");
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [expandedItemId, setExpandedItemId] = useState<string>();
  const [editingItemId, setEditingItemId] = useState<string>();
  const [bulkType, setBulkType] = useState<LearningItemType>("word");
  const [bulkSourceReport, setBulkSourceReport] = useState("");
  const [bulkLines, setBulkLines] = useState("");
  const [batchDomain, setBatchDomain] = useState("");
  const [batchStatus, setBatchStatus] = useState<LearningItemStatus>("learning");
  const [batchAddTagsCsv, setBatchAddTagsCsv] = useState("");
  const [batchRemoveTagsCsv, setBatchRemoveTagsCsv] = useState("");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const deferredSearchText = useDeferredValue(searchText.trim().toLowerCase());
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

  async function refreshItems(collectionId = activeCollectionId): Promise<void> {
    setItems(await learningService.listItems("all", collectionId || undefined));
  }

  useEffect(() => {
    void refreshCollections();
  }, []);

  useEffect(() => {
    void refreshItems();
  }, [activeCollectionId]);

  useEffect(() => {
    setPage(1);
    setExpandedItemId(undefined);
    setEditingItemId(undefined);
  }, [typeFilter, domainFilter, statusFilter, deferredSearchText, pageSize]);

  useEffect(() => {
    clearSelection();
    setExpandedItemId(undefined);
    setEditingItemId(undefined);
    setPage(1);
  }, [activeCollectionId]);

  function clearFeedback(): void {
    setMessage(undefined);
    setError(undefined);
  }

  function clearSelection(): void {
    setSelectedItemIds([]);
  }

  function resetBatchUi(): void {
    setBatchDomain("");
    setBatchStatus("learning");
    setBatchAddTagsCsv("");
    setBatchRemoveTagsCsv("");
    setDrafts({});
    setExpandedItemId(undefined);
    setEditingItemId(undefined);
  }

  function toDraft(item: LearningItemRecord): DraftState {
    return {
      type: item.type,
      content: item.content,
      meaning: item.meaning ?? "",
      example: item.example ?? "",
      note: item.note ?? "",
      domain: item.domain ?? "",
      status: getLearningStatus(item.status),
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
      if (editingItemId === item.id) {
        setEditingItemId(undefined);
      }
      return;
    }

    setDraft(item.id, ensureDraft(item));
    setExpandedItemId(item.id);
    setEditingItemId(undefined);
  }

  function openEditor(item: LearningItemRecord): void {
    setDraft(item.id, ensureDraft(item));
    setExpandedItemId(item.id);
    setEditingItemId(item.id);
  }

  function closeEditor(itemId: string): void {
    if (editingItemId === itemId) {
      setEditingItemId(undefined);
    }
  }

  function toggleSelection(itemId: string): void {
    setSelectedItemIds((current) => (
      current.includes(itemId)
        ? current.filter((entry) => entry !== itemId)
        : [...current, itemId]
    ));
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
        domain: draft.domain,
        status: draft.status,
        tags: parseTagsCsv(draft.tagsCsv),
        sourceReport: draft.sourceReport
      });
      setMessage(`Saved learning item: ${item.id}`);
      await refreshItems();
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
      if (editingItemId === itemId) {
        setEditingItemId(undefined);
      }
      setDrafts((current) => {
        const next = { ...current };
        delete next[itemId];
        return next;
      });
      setSelectedItemIds((current) => current.filter((entry) => entry !== itemId));
      setMessage(`Deleted learning item: ${itemId}`);
      await refreshItems();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleBatchDelete(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();

    if (selectedItemIds.length === 0) {
      setError("No selected items available for batch delete.");
      setIsProcessing(false);
      return;
    }

    try {
      const deletedCount = await learningService.batchDelete(selectedItemIds);
      if (deletedCount === 0) {
        setError("No selected items were deleted.");
        return;
      }

      clearSelection();
      resetBatchUi();
      setMessage(`Deleted ${deletedCount} selected learning item(s).`);
      await refreshItems();
    } catch (batchDeleteError) {
      setError(batchDeleteError instanceof Error ? batchDeleteError.message : "Batch delete failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConfirmAction(): Promise<void> {
    if (!confirmAction || isProcessing) {
      return;
    }

    setConfirmAction(null);
    await handleBatchDelete();
  }

  async function handleBulkAdd(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      const added = await learningService.addFromMultiline(bulkType, bulkLines, bulkSourceReport, activeCollectionId || undefined);
      if (added === 0) {
        setError("No non-empty lines found.");
        return;
      }

      setBulkLines("");
      setMessage(`Added ${added} learning item(s) from multiline input.`);
      await refreshItems();
    } catch (bulkAddError) {
      setError(bulkAddError instanceof Error ? bulkAddError.message : "Bulk add failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleExport(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      const exported = await learningService.exportPack(undefined, activeCollectionId || undefined);
      const blob = new Blob([exported.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = exported.fileName;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      setMessage(`Exported ${exported.itemCount} item(s) as ${exported.fileName}.`);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Export failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleExportForInbox(): Promise<void> {
    if (isProcessing) return;
    if (selectedItemIds.length === 0) {
      setError("Please select at least one item to export for Inbox.");
      return;
    }
    setIsProcessing(true);
    clearFeedback();
    try {
      const exported = await learningService.exportForInbox(selectedItemIds);
      const blob = new Blob([exported.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = exported.fileName;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);

      setMessage(`Exported ${exported.itemCount} selected item(s) for Inbox as ${exported.fileName}.`);
      clearSelection();
    } catch (exportInboxError) {
      setError(exportInboxError instanceof Error ? exportInboxError.message : "Export for Inbox failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  const domainOptions = useMemo(() => buildLearningDomainOptions(items.map((item) => item.domain)), [items]);

  const filteredItems = useMemo(() => (
    filterLearningItems(items, {
      type: typeFilter,
      domain: domainFilter,
      status: statusFilter,
      searchText: deferredSearchText
    })
  ), [deferredSearchText, domainFilter, items, statusFilter, typeFilter]);

  const pageSizeNumber = pageSize === "all" ? Math.max(filteredItems.length, 1) : Number(pageSize);
  const totalPages = pageSize === "all" ? (filteredItems.length > 0 ? 1 : 0) : getTotalPages(filteredItems.length, pageSizeNumber);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const pageStartIndex = pageSize === "all" ? 0 : (safePage - 1) * pageSizeNumber;
  const pageItems = useMemo(() => (
    pageSize === "all" ? filteredItems : filteredItems.slice(pageStartIndex, pageStartIndex + pageSizeNumber)
  ), [filteredItems, pageSize, pageSizeNumber, pageStartIndex]);
  const pageRangeStart = filteredItems.length === 0 ? 0 : pageStartIndex + 1;
  const pageRangeEnd = filteredItems.length === 0 ? 0 : pageStartIndex + pageItems.length;
  const pageItemIds = useMemo(() => pageItems.map((item) => item.id), [pageItems]);
  const selectedIdSet = useMemo(() => new Set(selectedItemIds), [selectedItemIds]);
  const allPageSelected = pageItems.length > 0 && pageItems.every((item) => selectedIdSet.has(item.id));

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  useEffect(() => {
    const pageIdSet = new Set(pageItemIds);
    setSelectedItemIds((current) => {
      const next = current.filter((id) => pageIdSet.has(id));
      return next.length === current.length ? current : next;
    });

    if (expandedItemId && !pageIdSet.has(expandedItemId)) {
      setExpandedItemId(undefined);
    }
    if (editingItemId && !pageIdSet.has(editingItemId)) {
      setEditingItemId(undefined);
    }
  }, [editingItemId, expandedItemId, pageItemIds]);

  async function handleBatchSetDomain(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      const updatedCount = await learningService.batchSetDomain(selectedItemIds, batchDomain);
      if (updatedCount === 0) {
        setError("No selected items available for batch domain update.");
        return;
      }

      resetBatchUi();
      clearSelection();
      setMessage(`Set domain for ${updatedCount} selected learning item(s).`);
      await refreshItems();
    } catch (domainError) {
      setError(domainError instanceof Error ? domainError.message : "Batch domain update failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleBatchSetStatus(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      const updatedCount = await learningService.batchSetStatus(selectedItemIds, batchStatus);
      if (updatedCount === 0) {
        setError("No selected items available for batch status update.");
        return;
      }

      resetBatchUi();
      clearSelection();
      setMessage(`Set status for ${updatedCount} selected learning item(s).`);
      await refreshItems();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Batch status update failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleBatchAddTags(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    const tags = parseTagsCsv(batchAddTagsCsv);
    if (!tags) {
      setError("Enter one or more tags to add.");
      setIsProcessing(false);
      return;
    }

    try {
      const updatedCount = await learningService.batchAddTags(selectedItemIds, tags);
      if (updatedCount === 0) {
        setError("No selected items available for tag update.");
        return;
      }

      resetBatchUi();
      clearSelection();
      setMessage(`Added tags to ${updatedCount} selected learning item(s).`);
      await refreshItems();
    } catch (addTagsError) {
      setError(addTagsError instanceof Error ? addTagsError.message : "Batch add tags failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleBatchRemoveTags(): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    const tags = parseTagsCsv(batchRemoveTagsCsv);
    if (!tags) {
      setError("Enter one or more tags to remove.");
      setIsProcessing(false);
      return;
    }

    try {
      const updatedCount = await learningService.batchRemoveTags(selectedItemIds, tags);
      if (updatedCount === 0) {
        setError("No selected items available for tag removal.");
        return;
      }

      resetBatchUi();
      clearSelection();
      setMessage(`Removed tags from ${updatedCount} selected learning item(s).`);
      await refreshItems();
    } catch (removeTagsError) {
      setError(removeTagsError instanceof Error ? removeTagsError.message : "Batch remove tags failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleSelectPage(): void {
    setSelectedItemIds(pageItemIds);
  }

  const activeCollection = collections.find((collection) => collection.id === activeCollectionId);

  return (
    <AppShell
      title="Manage Learning"
      subtitle="Browse, classify, update, and export learning items."
      pageDescription={null}
    >
      <ConfirmDialog
        open={confirmAction !== null}
        title="Delete selected learning items?"
        body={`This will permanently delete ${confirmAction?.count ?? 0} selected learning item(s) from the current page.`}
        confirmLabel="Delete selected"
        tone="danger"
        busy={isProcessing}
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => setConfirmAction(null)}
      />

      <LearningSubnav />

      <div className="mt-4 space-y-4">
        {message ? <FeedbackBanner tone="success" message={message} /> : null}
        {error ? <FeedbackBanner tone="error" message={error} /> : null}
      </div>

      <section className="ekv-card mt-2 p-2.5 sm:p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={sectionTitleClass}>Active Learning List</h3>
            <InlineInfo title="Active learning list">
              Manage one standard, manual, report, or notebook at a time. Study and batch actions stay inside the selected list.
            </InlineInfo>
          </div>
          <Link to={`/learning/import${activeCollectionId ? `?collection=${activeCollectionId}` : ""}`} className="ekv-button-compact">
            Open import
          </Link>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-1.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className={inputLabelClass}>
            <span className="ekv-label">Current list</span>
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
                <option key={collection.id} value={collection.id}>{collection.name}</option>
              ))}
            </select>
          </label>
          {activeCollection && (activeCollection.sourceType || activeCollection.documentNumber || activeCollection.authority) ? (
            <div className="flex flex-wrap gap-2 text-sm lg:justify-end">
              <span className="ekv-chip bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">{activeCollection.sourceType}</span>
              {activeCollection.documentNumber ? <span className="ekv-chip bg-slate-100 text-slate-600 ring-1 ring-slate-200">{activeCollection.documentNumber}</span> : null}
              {activeCollection.authority ? <span className="ekv-chip bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">{activeCollection.authority}</span> : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="ekv-card mt-2 p-2.5 sm:p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={sectionTitleClass}>Manage Items</h3>
            <InlineInfo title="Manage items">
              Search first, then use page-scoped selection for batch updates, export, or cleanup.
            </InlineInfo>
          </div>
          <button type="button" onClick={() => setShowFilters((value) => !value)} className="ekv-button-compact">
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <label className={inputLabelClass}>
            <span className="ekv-label">Search</span>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search content, meaning, example, note, tags, source"
              className="ekv-input"
            />
          </label>

          {showFilters ? (
            <>
              <label className={inputLabelClass}>
                <span className="ekv-label">Type</span>
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as LearningFilter)} className="ekv-select">
                  <option value="all">all</option>
                  {learningTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className={inputLabelClass}>
                <span className="ekv-label">Domain</span>
                <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)} className="ekv-select">
                  <option value="all">all</option>
                  {domainOptions.map((domain) => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </label>
              <label className={inputLabelClass}>
                <span className="ekv-label">Status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="ekv-select">
                  <option value="all">all</option>
                  {learningStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
        </div>

        {showFilters ? (
          <div className="mt-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className={inputLabelClass}>
                <span className="ekv-label">Page size</span>
                <select value={pageSize} onChange={(event) => setPageSize(event.target.value as ManagePageSize)} className="ekv-select">
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="all">All</option>
                </select>
              </label>
            </div>
          </div>
        ) : null}

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <button type="button" onClick={() => void handleExport()} disabled={isProcessing} className="ekv-button-primary px-2.5 text-xs sm:px-4 sm:text-sm">
              Export
            </button>
            <button
              type="button"
              onClick={handleSelectPage}
              disabled={pageItems.length === 0 || allPageSelected || isProcessing}
              className="ekv-button-compact px-2.5 text-xs sm:px-3 sm:text-sm"
            >
              Select
            </button>
            <button
              type="button"
              onClick={clearSelection}
              disabled={selectedItemIds.length === 0 || isProcessing}
              className="ekv-button-compact px-2.5 text-xs sm:px-3 sm:text-sm"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 sm:text-sm">
            <span>Filtered: {filteredItems.length} / {items.length}</span>
            <span>Page: {filteredItems.length === 0 ? 0 : safePage} / {totalPages}</span>
            <span>Selected: {selectedItemIds.length}</span>
          </div>
        </div>
      </section>

      {selectedItemIds.length > 0 ? (
        <section className="ekv-card mt-4 border-cyan-200 bg-cyan-50/60 p-3.5 sm:p-4.5">
          <details>
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className={sectionTitleClass}>Batch Actions</h3>
                  <p className={`${sectionHintClass} mt-1`}>
                    {selectedItemIds.length} selected on this page. Open to update, export, or delete.
                  </p>
                </div>
                <span className="ekv-chip bg-white text-cyan-700 ring-1 ring-cyan-200">{selectedItemIds.length} selected</span>
              </div>
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <h4 className="text-sm font-semibold text-slate-900">Set Domain</h4>
                <label className={`${inputLabelClass} mt-2`}>
                  <span className="ekv-label">Domain</span>
                  <select value={batchDomain} onChange={(event) => setBatchDomain(event.target.value)} className="ekv-select">
                    <option value="">none (clear)</option>
                    {domainOptions.map((domain) => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </label>
                <button type="button" onClick={() => void handleBatchSetDomain()} disabled={isProcessing} className="ekv-button-compact mt-3 w-full">
                  Apply domain
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <h4 className="text-sm font-semibold text-slate-900">Set Status</h4>
                <label className={`${inputLabelClass} mt-2`}>
                  <span className="ekv-label">Status</span>
                  <select value={batchStatus} onChange={(event) => setBatchStatus(event.target.value as LearningItemStatus)} className="ekv-select">
                    {learningStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <button type="button" onClick={() => void handleBatchSetStatus()} disabled={isProcessing} className="ekv-button-compact mt-3 w-full">
                  Apply status
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <h4 className="text-sm font-semibold text-slate-900">Add Tags</h4>
                <label className={`${inputLabelClass} mt-2`}>
                  <span className="ekv-label">Tags to add</span>
                  <input
                    value={batchAddTagsCsv}
                    onChange={(event) => setBatchAddTagsCsv(event.target.value)}
                    placeholder="comma, separated, tags"
                    className="ekv-input"
                  />
                </label>
                <button type="button" onClick={() => void handleBatchAddTags()} disabled={isProcessing} className="ekv-button-compact mt-3 w-full">
                  Add tags
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <h4 className="text-sm font-semibold text-slate-900">Remove Tags</h4>
                <label className={`${inputLabelClass} mt-2`}>
                  <span className="ekv-label">Tags to remove</span>
                  <input
                    value={batchRemoveTagsCsv}
                    onChange={(event) => setBatchRemoveTagsCsv(event.target.value)}
                    placeholder="comma, separated, tags"
                    className="ekv-input"
                  />
                </label>
                <button type="button" onClick={() => void handleBatchRemoveTags()} disabled={isProcessing} className="ekv-button-compact mt-3 w-full">
                  Remove tags
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <h4 className="text-sm font-semibold text-slate-900">Export to Inbox</h4>
                <p className="mt-2 text-sm leading-5 text-slate-600">
                  Export selected items as an Engineering Knowledge Pack for Inbox import.
                </p>
                <button type="button" onClick={() => void handleExportForInbox()} disabled={isProcessing} className="ekv-button-compact mt-3 w-full">
                  Export for Inbox
                </button>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-3">
                <h4 className="text-sm font-semibold text-red-800">Delete Selected</h4>
                <p className="mt-2 text-sm leading-5 text-red-700">
                  Deletes {selectedItemIds.length} selected learning item{selectedItemIds.length === 1 ? "" : "s"} from the current page after confirmation.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmAction({ kind: "delete_selected", count: selectedItemIds.length })}
                  disabled={isProcessing}
                  className="ekv-button-danger mt-3 w-full"
                >
                  Delete selected
                </button>
              </div>
            </div>
          </details>
        </section>
      ) : null}

      <section className="ekv-card mt-2 p-2.5 sm:p-3">
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-slate-800">Quick Multi-line Add</summary>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={inputLabelClass}>
                <span className="ekv-label">Type</span>
                <select value={bulkType} onChange={(event) => setBulkType(event.target.value as LearningItemType)} className="ekv-select">
                  {learningTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label className={inputLabelClass}>
                <span className="ekv-label">Source report (optional)</span>
                <input value={bulkSourceReport} onChange={(event) => setBulkSourceReport(event.target.value)} className="ekv-input" />
              </label>
            </div>
            <textarea
              value={bulkLines}
              onChange={(event) => setBulkLines(event.target.value)}
              rows={4}
              placeholder="One learning item per line"
              className="ekv-textarea"
            />
            <button type="button" onClick={() => void handleBulkAdd()} disabled={isProcessing} className="ekv-button-primary">
              Add Lines As Learning Items
            </button>
          </div>
        </details>
      </section>

      <section className="ekv-card mt-2 p-2.5 sm:p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className={sectionTitleClass}>Learning Items</h3>
          <div className="flex items-center gap-2">
            <InlineInfo title="Learning items">
              Tap a row to inspect details. Edit only when you need to change fields.
            </InlineInfo>
            {filteredItems.length > 0 ? (
              <span className="text-xs text-slate-500 sm:text-sm">
                {pageSize === "all"
                  ? `${filteredItems.length} items`
                  : `P ${safePage}/${totalPages} · ${pageRangeStart}-${pageRangeEnd} / ${filteredItems.length}`}
              </span>
            ) : null}
          </div>
        </div>

        {items.length === 0 ? <p className="mt-4 text-sm text-slate-500">No learning items yet. Import or add lines first.</p> : null}
        {items.length > 0 && filteredItems.length === 0 ? <p className="mt-4 text-sm text-slate-500">No learning items match the current search and filters.</p> : null}

        {filteredItems.length > 0 && pageSize !== "all" ? (
          <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={safePage <= 1}
              className="ekv-button-compact"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={safePage >= totalPages}
              className="ekv-button-compact"
            >
              Next
            </button>
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {pageItems.map((item) => {
            const draft = ensureDraft(item);
            const isExpanded = expandedItemId === item.id;
            const isEditing = editingItemId === item.id;
            const isSelected = selectedIdSet.has(item.id);
            const status = getLearningStatus(item.status);
            const fieldConfig = getLearningFieldConfig(item.type);
            const detailRows = getLearningDetailRows(item);
            const signalChips = getLearningSignalChips(item);
            const summaryText = getLearningSummaryText(item);
            const editDomainOptions = draft.domain && !domainOptions.includes(draft.domain)
              ? [...domainOptions, draft.domain]
              : domainOptions;

            return (
              <article
                key={item.id}
                className={`overflow-hidden rounded-[1.6rem] border bg-white shadow-sm transition-all ${isSelected || isExpanded ? "border-indigo-300 ring-2 ring-indigo-200/80" : "border-slate-200 hover:border-slate-300"} ${isEditing ? "bg-indigo-50/[0.03]" : ""}`}
              >
                <div className={`grid grid-cols-[auto_minmax(0,1fr)] gap-0 ${isExpanded ? "border-b border-slate-200" : ""}`}>
                  <div className="px-3 py-3.5 sm:px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(item.id)}
                      aria-label={`Select ${item.content}`}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="w-full px-2 py-2.5 pr-3 sm:px-3 sm:py-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(item)}
                      className="w-full min-w-0 rounded-2xl px-1 py-1 text-left transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-[0.995]"
                    >
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`${chipBaseClass} ${getLearningTypeBadgeClasses(item.type)}`}>{item.type.replaceAll("_", " ")}</span>
                          {item.domain ? (
                            <span className={`${chipBaseClass} bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200`}>
                              {truncateText(item.domain, 24)}
                            </span>
                          ) : null}
                          <span className={`${chipBaseClass} ${getStatusBadgeClasses(status)}`}>{status}</span>
                        </div>
                        <strong className="block text-[15px] font-semibold leading-6 text-slate-900 line-clamp-3 sm:text-base sm:line-clamp-2">
                          {item.content}
                        </strong>
                        {summaryText ? (
                          <span className="block text-sm leading-5 text-slate-600 line-clamp-2">
                            {summaryText}
                          </span>
                        ) : null}
                        {signalChips.length > 0 ? (
                          <>
                            <div className="flex flex-wrap gap-2 sm:hidden">
                              {signalChips.slice(0, 3).map((signalChip) => (
                                <span key={signalChip.label} className={`${mobileMetaChipClass} ${signalChip.className}`}>
                                  {signalChip.label}
                                </span>
                              ))}
                            </div>
                            <div className="hidden flex-wrap gap-2 sm:flex">
                              {signalChips.map((signalChip) => (
                                <span key={signalChip.label} className={`${chipBaseClass} ${signalChip.className}`}>
                                  {signalChip.label}
                                </span>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="space-y-3 bg-slate-50/80 px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-4">
                    <div className="rounded-3xl border border-indigo-100 bg-indigo-50/80 p-3">
                      <strong className="block text-sm font-semibold text-indigo-800">Item detail</strong>
                      <div className="mt-2.5 space-y-2.5">
                        {detailRows.map((detailRow) => (
                          <div key={detailRow.label}>
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700/80">{detailRow.label}</div>
                            <div className="mt-1 break-words text-sm leading-6 text-slate-900">{detailRow.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-[11px] leading-5 text-slate-500">
                      {item.id} | created: {item.createdAt} | updated: {item.updatedAt}
                    </p>

                    {!isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => openEditor(item)} className="ekv-button-compact">
                          Edit this item
                        </button>
                        <button type="button" onClick={() => void handleDeleteItem(item.id)} disabled={isProcessing} className="ekv-button-danger">
                          Delete
                        </button>
                      </div>
                    ) : null}

                    {isEditing ? (
                      <>
                    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                      <label className={inputLabelClass}>
                        <span className="ekv-label">Type</span>
                        <select
                          value={draft.type}
                          onChange={(event) => setDraft(item.id, { ...draft, type: event.target.value as LearningItemType })}
                          className="ekv-select"
                        >
                          {learningTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </label>

                      <label className={inputLabelClass}>
                        <span className="ekv-label">Status</span>
                        <select
                          value={draft.status}
                          onChange={(event) => setDraft(item.id, { ...draft, status: event.target.value as LearningItemStatus })}
                          className="ekv-select"
                        >
                          {learningStatuses.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>{statusOption}</option>
                          ))}
                        </select>
                      </label>

                      <label className="grid gap-2 lg:col-span-2">
                        <span className="ekv-label">{fieldConfig.contentLabel}</span>
                        <textarea
                          value={draft.content}
                          onChange={(event) => setDraft(item.id, { ...draft, content: event.target.value })}
                          rows={3}
                          placeholder={fieldConfig.contentPlaceholder}
                          className="ekv-textarea"
                        />
                      </label>

                      <label className={inputLabelClass}>
                        <span className="ekv-label">Domain (optional)</span>
                        <select
                          value={draft.domain}
                          onChange={(event) => setDraft(item.id, { ...draft, domain: event.target.value })}
                          className="ekv-select"
                        >
                          <option value="">none</option>
                          {editDomainOptions.map((domain) => (
                            <option key={domain} value={domain}>{domain}</option>
                          ))}
                        </select>
                      </label>

                      <label className={inputLabelClass}>
                        <span className="ekv-label">{fieldConfig.meaningLabel} (optional)</span>
                        <input
                          value={draft.meaning}
                          onChange={(event) => setDraft(item.id, { ...draft, meaning: event.target.value })}
                          placeholder={fieldConfig.meaningPlaceholder}
                          className="ekv-input"
                        />
                      </label>

                      <label className={inputLabelClass}>
                        <span className="ekv-label">{fieldConfig.exampleLabel} (optional)</span>
                        <input
                          value={draft.example}
                          onChange={(event) => setDraft(item.id, { ...draft, example: event.target.value })}
                          placeholder={fieldConfig.examplePlaceholder}
                          className="ekv-input"
                        />
                      </label>

                      <label className="grid gap-2 lg:col-span-2">
                        <span className="ekv-label">{fieldConfig.noteLabel} (optional)</span>
                        <textarea
                          value={draft.note}
                          onChange={(event) => setDraft(item.id, { ...draft, note: event.target.value })}
                          rows={3}
                          placeholder={fieldConfig.notePlaceholder}
                          className="ekv-textarea"
                        />
                      </label>

                      <label className={inputLabelClass}>
                        <span className="ekv-label">Tags (comma separated)</span>
                        <input
                          value={draft.tagsCsv}
                          onChange={(event) => setDraft(item.id, { ...draft, tagsCsv: event.target.value })}
                          className="ekv-input"
                        />
                      </label>

                      <label className={inputLabelClass}>
                        <span className="ekv-label">Source report (optional)</span>
                        <input
                          value={draft.sourceReport}
                          onChange={(event) => setDraft(item.id, { ...draft, sourceReport: event.target.value })}
                          className="ekv-input"
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => void handleSaveItem(item)} disabled={isProcessing} className="ekv-button-primary">
                        Save
                      </button>
                      <button type="button" onClick={() => closeEditor(item.id)} className="ekv-button-secondary">
                        Close editor
                      </button>
                      <button type="button" onClick={() => void handleDeleteItem(item.id)} disabled={isProcessing} className="ekv-button-danger">
                        Delete
                      </button>
                    </div>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {filteredItems.length > 0 && pageSize !== "all" ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">Page {safePage} / {totalPages}</div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={safePage <= 1}
                className="ekv-button-secondary"
              >
                Previous page
              </button>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={safePage >= totalPages}
                className="ekv-button-secondary"
              >
                Next page
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
