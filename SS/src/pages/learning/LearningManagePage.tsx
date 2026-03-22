import { useDeferredValue, useEffect, useMemo, useState } from "react";

import type { LearningItemRecord, LearningItemStatus, LearningItemType } from "../../data/repositories/interfaces";
import {
  buildLearningDomainOptions,
  filterLearningItems,
  getLearningStatus,
  parseTagsCsv,
  tagsToCsv
} from "../../features/learning/classification";
import { AppShell } from "../../shared/ui/layout/AppShell";
import { LearningModuleService } from "../../services/learning/learningModuleService";
import { LearningSubnav } from "./LearningSubnav";

type LearningFilter = "all" | LearningItemType;
type DomainFilter = "all" | string;
type StatusFilter = "all" | LearningItemStatus;
type ManagePageSize = "10" | "20" | "50" | "100" | "all";

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

function getStatusBadgeStyle(status: LearningItemStatus): { background: string; color: string } {
  switch (status) {
    case "learning":
      return { background: "#ecfeff", color: "#155e75" };
    case "reviewed":
      return { background: "#f0fdf4", color: "#166534" };
    case "ignored":
      return { background: "#f3f4f6", color: "#4b5563" };
    case "new":
    default:
      return { background: "#fffbeb", color: "#92400e" };
  }
}

export function LearningManagePage() {
  const learningService = useMemo(() => new LearningModuleService(), []);
  const learningTypes = learningService.getLearningTypes();
  const learningStatuses = learningService.getSuggestedStatuses();

  const [items, setItems] = useState<LearningItemRecord[]>([]);
  const [typeFilter, setTypeFilter] = useState<LearningFilter>("all");
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pageSize, setPageSize] = useState<ManagePageSize>("20");
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [expandedItemId, setExpandedItemId] = useState<string>();
  const [bulkType, setBulkType] = useState<LearningItemType>("word");
  const [bulkSourceReport, setBulkSourceReport] = useState("");
  const [bulkLines, setBulkLines] = useState("");
  const [batchDomain, setBatchDomain] = useState("");
  const [batchStatus, setBatchStatus] = useState<LearningItemStatus>("learning");
  const [batchAddTagsCsv, setBatchAddTagsCsv] = useState("");
  const [batchRemoveTagsCsv, setBatchRemoveTagsCsv] = useState("");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const deferredSearchText = useDeferredValue(searchText.trim().toLowerCase());

  async function refreshItems(): Promise<void> {
    setItems(await learningService.listItems("all"));
  }

  useEffect(() => {
    void refreshItems();
  }, []);

  useEffect(() => {
    setPage(1);
    setExpandedItemId(undefined);
  }, [typeFilter, domainFilter, statusFilter, deferredSearchText, pageSize]);

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
      return;
    }

    setDraft(item.id, ensureDraft(item));
    setExpandedItemId(item.id);
  }

  function toggleSelection(itemId: string): void {
    setSelectedItemIds((current) => (
      current.includes(itemId)
        ? current.filter((entry) => entry !== itemId)
        : [...current, itemId]
    ));
  }

  async function handleSaveItem(item: LearningItemRecord): Promise<void> {
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
    }
  }

  async function handleDeleteItem(itemId: string): Promise<void> {
    clearFeedback();
    await learningService.deleteItem(itemId);
    if (expandedItemId === itemId) {
      setExpandedItemId(undefined);
    }
    setDrafts((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
    setSelectedItemIds((current) => current.filter((entry) => entry !== itemId));
    setMessage(`Deleted learning item: ${itemId}`);
    await refreshItems();
  }

  async function handleBatchDelete(): Promise<void> {
    clearFeedback();

    if (selectedItemIds.length === 0) {
      setError("No selected items available for batch delete.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${selectedItemIds.length} selected learning item${selectedItemIds.length === 1 ? "" : "s"}? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    const deletedCount = await learningService.batchDelete(selectedItemIds);
    if (deletedCount === 0) {
      setError("No selected items were deleted.");
      return;
    }

    clearSelection();
    resetBatchUi();
    setMessage(`Deleted ${deletedCount} selected learning item(s).`);
    await refreshItems();
  }

  async function handleBulkAdd(): Promise<void> {
    clearFeedback();
    const added = await learningService.addFromMultiline(bulkType, bulkLines, bulkSourceReport);
    if (added === 0) {
      setError("No non-empty lines found.");
      return;
    }

    setBulkLines("");
    setMessage(`Added ${added} learning item(s) from multiline input.`);
    await refreshItems();
  }

  async function handleExport(): Promise<void> {
    clearFeedback();
    const exported = await learningService.exportPack();
    const blob = new Blob([exported.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = exported.fileName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    setMessage(`Exported ${exported.itemCount} item(s) as ${exported.fileName}.`);
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
  const pageItems = pageSize === "all"
    ? filteredItems
    : filteredItems.slice(pageStartIndex, pageStartIndex + pageSizeNumber);
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
  }, [expandedItemId, pageItemIds]);

  async function handleBatchSetDomain(): Promise<void> {
    clearFeedback();
    const updatedCount = await learningService.batchSetDomain(selectedItemIds, batchDomain);
    if (updatedCount === 0) {
      setError("No selected items available for batch domain update.");
      return;
    }

    resetBatchUi();
    clearSelection();
    setMessage(`Set domain for ${updatedCount} selected learning item(s).`);
    await refreshItems();
  }

  async function handleBatchSetStatus(): Promise<void> {
    clearFeedback();
    const updatedCount = await learningService.batchSetStatus(selectedItemIds, batchStatus);
    if (updatedCount === 0) {
      setError("No selected items available for batch status update.");
      return;
    }

    resetBatchUi();
    clearSelection();
    setMessage(`Set status for ${updatedCount} selected learning item(s).`);
    await refreshItems();
  }

  async function handleBatchAddTags(): Promise<void> {
    clearFeedback();
    const tags = parseTagsCsv(batchAddTagsCsv);
    if (!tags) {
      setError("Enter one or more tags to add.");
      return;
    }

    const updatedCount = await learningService.batchAddTags(selectedItemIds, tags);
    if (updatedCount === 0) {
      setError("No selected items available for tag update.");
      return;
    }

    resetBatchUi();
    clearSelection();
    setMessage(`Added tags to ${updatedCount} selected learning item(s).`);
    await refreshItems();
  }

  async function handleBatchRemoveTags(): Promise<void> {
    clearFeedback();
    const tags = parseTagsCsv(batchRemoveTagsCsv);
    if (!tags) {
      setError("Enter one or more tags to remove.");
      return;
    }

    const updatedCount = await learningService.batchRemoveTags(selectedItemIds, tags);
    if (updatedCount === 0) {
      setError("No selected items available for tag removal.");
      return;
    }

    resetBatchUi();
    clearSelection();
    setMessage(`Removed tags from ${updatedCount} selected learning item(s).`);
    await refreshItems();
  }

  function handleSelectPage(): void {
    setSelectedItemIds(pageItemIds);
  }

  return (
    <AppShell
      title="Learning Manage"
      subtitle="Browse, classify, update, and export learning items."
      pageDescription={null}
    >
      <LearningSubnav />

      <section style={{ marginBottom: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", background: "#fff" }}>
        <h3 style={{ marginTop: 0, marginBottom: "0.2rem" }}>Manage items</h3>
        <p style={{ margin: "0 0 0.75rem", color: "#4b5563", fontSize: "0.92rem", lineHeight: 1.45 }}>Search and filter first. Batch actions stay scoped to the current page selection.</p>
        <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: "0.5rem" }}>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            Search
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search content, meaning, example, note, tags, source"
            />
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            Filter type
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as LearningFilter)}>
              <option value="all">all</option>
              {learningTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            Filter domain
            <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)}>
              <option value="all">all</option>
              {domainOptions.map((domain) => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: "0.25rem" }}>
            Filter status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="all">all</option>
              {learningStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <details style={{ gridColumn: "1 / -1", border: "1px solid #e5e7eb", borderRadius: "0.65rem", background: "#f9fafb" }}>
            <summary style={{ cursor: "pointer", padding: "0.65rem", fontWeight: 600, color: "#374151" }}>More controls</summary>
            <div style={{ padding: "0 0.65rem 0.65rem", display: "grid", gap: "0.25rem" }}>
              <label style={{ display: "grid", gap: "0.25rem" }}>
                Page size
                <select value={pageSize} onChange={(event) => setPageSize(event.target.value as ManagePageSize)}>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="all">All</option>
                </select>
              </label>
            </div>
          </details>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" onClick={() => void handleExport()}>Export Learning Pack v1 JSON</button>
            <button type="button" onClick={handleSelectPage} disabled={pageItems.length === 0 || allPageSelected}>Select page</button>
            <button type="button" onClick={clearSelection} disabled={selectedItemIds.length === 0}>Clear selection</button>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ color: "#6b7280" }}>Filtered: {filteredItems.length} / {items.length}</span>
            <span style={{ color: "#6b7280" }}>Page: {filteredItems.length === 0 ? 0 : safePage} / {totalPages}</span>
            <span style={{ color: "#6b7280" }}>Selected: {selectedItemIds.length}</span>
          </div>
        </div>
      </section>

      {selectedItemIds.length > 0 ? (
        <section style={{ marginBottom: "1rem", border: "1px solid #dbeafe", borderRadius: "0.75rem", padding: "0.75rem", background: "#eff6ff" }}>
          <h3 style={{ marginTop: 0, marginBottom: "0.2rem" }}>Batch Actions</h3>
          <p style={{ margin: "0 0 0.75rem", color: "#1f2937", lineHeight: 1.45, fontSize: "0.92rem" }}>
            Apply updates to the selected items on this page only.
          </p>
          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <div style={{ border: "1px solid #bfdbfe", borderRadius: "0.65rem", padding: "0.7rem", background: "#fff" }}>
              <strong style={{ display: "block", marginBottom: "0.45rem" }}>Set Domain</strong>
              <label style={{ display: "grid", gap: "0.25rem" }}>
                Domain
                <select value={batchDomain} onChange={(event) => setBatchDomain(event.target.value)}>
                  <option value="">none (clear)</option>
                  {domainOptions.map((domain) => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => void handleBatchSetDomain()} style={{ marginTop: "0.55rem" }}>Apply domain</button>
            </div>

            <div style={{ border: "1px solid #bfdbfe", borderRadius: "0.65rem", padding: "0.7rem", background: "#fff" }}>
              <strong style={{ display: "block", marginBottom: "0.45rem" }}>Set Status</strong>
              <label style={{ display: "grid", gap: "0.25rem" }}>
                Status
                <select value={batchStatus} onChange={(event) => setBatchStatus(event.target.value as LearningItemStatus)}>
                  {learningStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => void handleBatchSetStatus()} style={{ marginTop: "0.55rem" }}>Apply status</button>
            </div>

            <div style={{ border: "1px solid #bfdbfe", borderRadius: "0.65rem", padding: "0.7rem", background: "#fff" }}>
              <strong style={{ display: "block", marginBottom: "0.45rem" }}>Add Tags</strong>
              <label style={{ display: "grid", gap: "0.25rem" }}>
                Tags to add
                <input
                  value={batchAddTagsCsv}
                  onChange={(event) => setBatchAddTagsCsv(event.target.value)}
                  placeholder="comma, separated, tags"
                />
              </label>
              <button type="button" onClick={() => void handleBatchAddTags()} style={{ marginTop: "0.55rem" }}>Add tags</button>
            </div>

            <div style={{ border: "1px solid #bfdbfe", borderRadius: "0.65rem", padding: "0.7rem", background: "#fff" }}>
              <strong style={{ display: "block", marginBottom: "0.45rem" }}>Remove Tags</strong>
              <label style={{ display: "grid", gap: "0.25rem" }}>
                Tags to remove
                <input
                  value={batchRemoveTagsCsv}
                  onChange={(event) => setBatchRemoveTagsCsv(event.target.value)}
                  placeholder="comma, separated, tags"
                />
              </label>
              <button type="button" onClick={() => void handleBatchRemoveTags()} style={{ marginTop: "0.55rem" }}>Remove tags</button>
            </div>

            <div style={{ border: "1px solid #fecaca", borderRadius: "0.65rem", padding: "0.7rem", background: "#fff1f2" }}>
              <strong style={{ display: "block", marginBottom: "0.45rem", color: "#991b1b" }}>Delete Selected</strong>
              <p style={{ margin: "0 0 0.55rem", color: "#7f1d1d", lineHeight: 1.5 }}>
                Deletes {selectedItemIds.length} selected learning item{selectedItemIds.length === 1 ? "" : "s"} from the current page after confirmation.
              </p>
              <button type="button" onClick={() => void handleBatchDelete()}>Delete selected</button>
            </div>
          </div>
        </section>
      ) : null}

      <section style={{ marginBottom: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", background: "#fff" }}>
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 600, color: "#374151" }}>Quick Multi-line Add</summary>
          <div style={{ marginTop: "0.65rem" }}>
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
        <button type="button" onClick={() => void handleBulkAdd()} style={{ marginTop: "0.5rem" }}>Add Lines As Learning Items</button>
          </div>
        </details>
      </section>

      <section style={{ marginBottom: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", background: "#fff" }}>
        <h3 style={{ marginTop: 0, marginBottom: "0.2rem" }}>Learning Items</h3>
        <p style={{ margin: "0 0 0.75rem", color: "#4b5563", lineHeight: 1.45, fontSize: "0.92rem" }}>
          Compact rows stay first. Expand one item when you need the full editor.
        </p>
        {items.length === 0 ? <p style={{ color: "#6b7280" }}>No learning items yet. Import or add lines first.</p> : null}
        {items.length > 0 && filteredItems.length === 0 ? <p style={{ color: "#6b7280" }}>No learning items match the current search and filters.</p> : null}

        {filteredItems.length > 0 ? (
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBottom: "0.8rem" }}>
            <div style={{ color: "#6b7280", fontSize: "0.92rem" }}>
              {pageSize === "all"
                ? `Showing all ${filteredItems.length} filtered items`
                : `Page ${safePage} / ${totalPages} | Items ${pageRangeStart}-${pageRangeEnd} of ${filteredItems.length}`}
            </div>
            {pageSize !== "all" ? (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={safePage <= 1}>Previous page</button>
                <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={safePage >= totalPages}>Next page</button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div style={{ display: "grid", gap: "0.45rem" }}>
          {pageItems.map((item) => {
            const draft = ensureDraft(item);
            const isExpanded = expandedItemId === item.id;
            const isSelected = selectedIdSet.has(item.id);
            const status = getLearningStatus(item.status);
            const statusBadgeStyle = getStatusBadgeStyle(status);
            const editDomainOptions = draft.domain && !domainOptions.includes(draft.domain)
              ? [...domainOptions, draft.domain]
              : domainOptions;

            return (
              <article key={item.id} style={{ border: isSelected ? "2px solid #2563eb" : "1px solid #e5e7eb", borderRadius: "0.65rem", background: "#fafafa", overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "stretch", background: "#fff", borderBottom: isExpanded ? "1px solid #e5e7eb" : "none" }}>
                  <div style={{ padding: "0.7rem 0 0 0.7rem" }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(item.id)}
                      aria-label={`Select ${item.content}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleExpand(item)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      background: "#fff",
                      padding: "0.6rem 0.75rem 0.6rem 0.3rem",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                      <div style={{ display: "grid", gap: "0.25rem", minWidth: 0, flex: "1 1 260px" }}>
                        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                          <span style={{ padding: "0.12rem 0.45rem", borderRadius: "999px", fontSize: "0.78rem", background: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}>
                            {item.type}
                          </span>
                          {item.domain ? (
                            <span style={{ padding: "0.12rem 0.45rem", borderRadius: "999px", fontSize: "0.78rem", background: "#f5f3ff", color: "#6d28d9", fontWeight: 600 }}>
                              {item.domain}
                            </span>
                          ) : null}
                          <span style={{ padding: "0.12rem 0.45rem", borderRadius: "999px", fontSize: "0.78rem", background: statusBadgeStyle.background, color: statusBadgeStyle.color, fontWeight: 600 }}>
                            {status}
                          </span>
                        </div>
                        <strong style={{ color: "#111827" }}>{truncateText(item.content, 110)}</strong>
                        {item.meaning ? <span style={{ color: "#4b5563", fontSize: "0.88rem", lineHeight: 1.4 }}>{truncateText(item.meaning, 100)}</span> : null}
                      </div>
                      <span style={{ color: "#6b7280", fontSize: "0.82rem" }}>{isExpanded ? "Collapse editor" : "Expand to edit"}</span>
                    </div>
                    <div style={{ marginTop: "0.35rem", display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {item.meaning ? <span style={{ padding: "0.1rem 0.4rem", borderRadius: "999px", fontSize: "0.78rem", background: "#eef2ff", color: "#3730a3" }}>has meaning</span> : null}
                      {item.example ? <span style={{ padding: "0.1rem 0.4rem", borderRadius: "999px", fontSize: "0.78rem", background: "#fffbeb", color: "#92400e" }}>has example</span> : null}
                      {item.note ? <span style={{ padding: "0.1rem 0.4rem", borderRadius: "999px", fontSize: "0.78rem", background: "#ecfeff", color: "#155e75" }}>has note</span> : null}
                      {item.tags && item.tags.length > 0 ? <span style={{ padding: "0.1rem 0.4rem", borderRadius: "999px", fontSize: "0.78rem", background: "#f0fdf4", color: "#166534" }}>has tags</span> : null}
                      {item.sourceReport ? <span style={{ padding: "0.1rem 0.4rem", borderRadius: "999px", fontSize: "0.78rem", background: "#f5f3ff", color: "#6d28d9" }}>has source</span> : null}
                    </div>
                  </button>
                </div>

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
                      Status
                      <select value={draft.status} onChange={(event) => setDraft(item.id, { ...draft, status: event.target.value as LearningItemStatus })}>
                        {learningStatuses.map((statusOption) => (
                          <option key={statusOption} value={statusOption}>{statusOption}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: "0.2rem" }}>
                      Content
                      <textarea value={draft.content} onChange={(event) => setDraft(item.id, { ...draft, content: event.target.value })} rows={2} />
                    </label>
                    <label style={{ display: "grid", gap: "0.2rem" }}>
                      Domain (optional)
                      <select value={draft.domain} onChange={(event) => setDraft(item.id, { ...draft, domain: event.target.value })}>
                        <option value="">none</option>
                        {editDomainOptions.map((domain) => (
                          <option key={domain} value={domain}>{domain}</option>
                        ))}
                      </select>
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
                      <button type="button" onClick={() => void handleSaveItem(item)}>Save</button>
                      <button type="button" onClick={() => void handleDeleteItem(item.id)}>Delete</button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {filteredItems.length > 0 && pageSize !== "all" ? (
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginTop: "0.8rem" }}>
            <div style={{ color: "#6b7280", fontSize: "0.92rem" }}>Page {safePage} / {totalPages}</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={safePage <= 1}>Previous page</button>
              <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={safePage >= totalPages}>Next page</button>
            </div>
          </div>
        ) : null}
      </section>

      {message ? <p style={{ color: "#166534" }}>{message}</p> : null}
      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
    </AppShell>
  );
}
