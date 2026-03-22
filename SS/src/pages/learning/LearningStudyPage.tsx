import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import type { LearningItemRecord, LearningItemStatus, LearningItemType } from "../../data/repositories/interfaces";
import { buildLearningDomainOptions, filterLearningItems, getLearningStatus } from "../../features/learning/classification";
import { AppShell } from "../../shared/ui/layout/AppShell";
import { LearningModuleService } from "../../services/learning/learningModuleService";
import { LearningSubnav } from "./LearningSubnav";

type LearningFilter = "all" | LearningItemType;
type DomainFilter = "all" | string;
type StatusFilter = "all" | LearningItemStatus;
type StudyViewMode = "list" | "card";
type ListDisplayCount = "10" | "20" | "50" | "all";
type CardRevealField = "meaning";

interface CardRevealState {
  meaning: boolean;
}

function truncateText(value: string, max = 140): string {
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
}

function createEmptyCardRevealState(): CardRevealState {
  return {
    meaning: false
  };
}

function getTotalPages(totalItems: number, pageSize: number): number {
  if (totalItems === 0) {
    return 0;
  }

  return Math.ceil(totalItems / pageSize);
}

function hasStudyDetails(item: LearningItemRecord): boolean {
  return Boolean(
    item.meaning
    || item.example
    || item.note
    || (item.tags && item.tags.length > 0)
    || item.sourceReport
  );
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

const sectionStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
  padding: "0.75rem",
  background: "#fff"
} as const;

const compactHintStyle = {
  margin: "0.2rem 0 0",
  color: "#4b5563",
  fontSize: "0.92rem",
  lineHeight: 1.45
} as const;

export function LearningStudyPage() {
  const learningService = useMemo(() => new LearningModuleService(), []);
  const learningTypes = learningService.getLearningTypes();
  const learningStatuses = learningService.getSuggestedStatuses();
  const studyContentRef = useRef<HTMLElement | null>(null);

  const [allItems, setAllItems] = useState<LearningItemRecord[]>([]);
  const [typeFilter, setTypeFilter] = useState<LearningFilter>("all");
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<StudyViewMode>("list");
  const [listDisplayCount, setListDisplayCount] = useState<ListDisplayCount>("10");
  const [listPage, setListPage] = useState(1);
  const [cardPage, setCardPage] = useState(1);
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);
  const [showMeaningPreview, setShowMeaningPreview] = useState(false);
  const [cardRevealStates, setCardRevealStates] = useState<Record<string, CardRevealState>>({});
  const [studyStarted, setStudyStarted] = useState(false);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [showStickyFilters, setShowStickyFilters] = useState(false);
  const [lastStudiedLabel, setLastStudiedLabel] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const deferredSearchText = useDeferredValue(searchText);

  async function refreshItems(): Promise<void> {
    setAllItems(await learningService.listItems("all"));
  }

  useEffect(() => {
    void refreshItems();
  }, []);

  function clearFeedback(): void {
    setMessage(undefined);
    setError(undefined);
  }

  const domainOptions = useMemo(() => buildLearningDomainOptions(allItems.map((item) => item.domain)), [allItems]);

  const items = useMemo(() => (
    filterLearningItems(allItems, {
      type: typeFilter,
      domain: domainFilter,
      status: statusFilter,
      searchText: deferredSearchText
    })
  ), [allItems, deferredSearchText, domainFilter, statusFilter, typeFilter]);

  useEffect(() => {
    setExpandedItemIds([]);
    setCardRevealStates({});
    setListPage(1);
    setCardPage(1);
  }, [typeFilter, domainFilter, statusFilter, deferredSearchText]);

  useEffect(() => {
    setExpandedItemIds([]);
    setListPage(1);
  }, [listDisplayCount]);

  function toggleExpanded(itemId: string): void {
    setExpandedItemIds((current) => (
      current.includes(itemId)
        ? current.filter((entry) => entry !== itemId)
        : [...current, itemId]
    ));
  }

  function getCardRevealState(itemId: string): CardRevealState {
    return cardRevealStates[itemId] ?? createEmptyCardRevealState();
  }

  function toggleCardReveal(itemId: string, field: CardRevealField): void {
    setCardRevealStates((current) => {
      const currentState = current[itemId] ?? createEmptyCardRevealState();
      return {
        ...current,
        [itemId]: {
          ...currentState,
          [field]: !currentState[field]
        }
      };
    });
  }

  async function handleSetStatus(item: LearningItemRecord, status: LearningItemStatus): Promise<void> {
    clearFeedback();

    try {
      await learningService.updateItem({
        id: item.id,
        type: item.type,
        content: item.content,
        meaning: item.meaning,
        example: item.example,
        note: item.note,
        domain: item.domain,
        status,
        tags: item.tags,
        sourceReport: item.sourceReport
      });
      setMessage(`Set learning item ${item.id} to ${status}.`);
      setLastStudiedLabel(`${truncateText(item.content, 36)} | ${status}`);
      await refreshItems();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Status update failed.");
    }
  }

  function handleStartStudy(): void {
    setStudyStarted(true);
    window.setTimeout(() => {
      studyContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function handleResetFilters(): void {
    setTypeFilter("all");
    setDomainFilter("all");
    setStatusFilter("all");
    setSearchText("");
    setListDisplayCount("10");
    setListPage(1);
    setCardPage(1);
    setExpandedItemIds([]);
    setCardRevealStates({});
    setShowMeaningPreview(false);
    setShowStickyFilters(false);
    setShowStickySearch(false);
    clearFeedback();
  }

  const listPageSize = listDisplayCount === "all"
    ? Math.max(items.length, 1)
    : Number(listDisplayCount);
  const listTotalPages = listDisplayCount === "all"
    ? (items.length > 0 ? 1 : 0)
    : getTotalPages(items.length, listPageSize);
  const safeListPage = listTotalPages === 0 ? 1 : Math.min(listPage, listTotalPages);
  const listStartIndex = listDisplayCount === "all" ? 0 : (safeListPage - 1) * listPageSize;
  const visibleListItems = listDisplayCount === "all"
    ? items
    : items.slice(listStartIndex, listStartIndex + listPageSize);
  const listRangeStart = items.length === 0 ? 0 : listStartIndex + 1;
  const listRangeEnd = items.length === 0 ? 0 : listStartIndex + visibleListItems.length;

  const cardTotalPages = items.length;
  const safeCardPage = cardTotalPages === 0 ? 1 : Math.min(cardPage, cardTotalPages);
  const currentCardItem = cardTotalPages === 0 ? undefined : items[safeCardPage - 1];
  const currentCardRevealState = currentCardItem ? getCardRevealState(currentCardItem.id) : createEmptyCardRevealState();
  const currentCardStatus = currentCardItem ? getLearningStatus(currentCardItem.status) : "new";
  const currentCardStatusStyle = getStatusBadgeStyle(currentCardStatus);

  return (
    <AppShell
      title="Learning Study"
      subtitle="Study learning items in list or card mode."
      pageDescription={null}
    >
      <LearningSubnav />

      <section style={sectionStyle}>
        <div style={{ display: "grid", gap: "0.65rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Start study</h3>
            <p style={compactHintStyle}>Start scanning a page of items or focus on one card at a time.</p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", color: "#6b7280", fontSize: "0.92rem" }}>
            <span>{items.length} items available</span>
            {lastStudiedLabel ? <span>Last studied: {lastStudiedLabel}</span> : null}
          </div>

          <div style={{ display: "grid", gap: "0.55rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <div style={{ display: "grid", gap: "0.3rem" }}>
              <span style={{ color: "#374151", fontSize: "0.92rem", fontWeight: 600 }}>View mode</span>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <button type="button" onClick={() => setViewMode("list")} disabled={viewMode === "list"}>List</button>
                <button type="button" onClick={() => setViewMode("card")} disabled={viewMode === "card"}>Card</button>
              </div>
            </div>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              Search
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search content, meaning, example, note, tags, source"
              />
            </label>
            <label style={{ display: "grid", gap: "0.25rem" }}>
              Type
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as LearningFilter)}>
                <option value="all">all</option>
                {learningTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>

          <details style={{ border: "1px solid #e5e7eb", borderRadius: "0.65rem", background: "#f9fafb" }}>
            <summary style={{ cursor: "pointer", padding: "0.7rem", fontWeight: 600, color: "#374151" }}>More study filters</summary>
            <div style={{ padding: "0 0.7rem 0.7rem", display: "grid", gap: "0.55rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <label style={{ display: "grid", gap: "0.25rem" }}>
                Domain
                <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)}>
                  <option value="all">all</option>
                  {domainOptions.map((domain) => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: "0.25rem" }}>
                Status
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                  <option value="all">all</option>
                  {learningStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              {viewMode === "list" ? (
                <>
                  <label style={{ display: "grid", gap: "0.25rem" }}>
                    Quantity
                    <select value={listDisplayCount} onChange={(event) => setListDisplayCount(event.target.value as ListDisplayCount)}>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="all">All</option>
                    </select>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "1.45rem" }}>
                    <input type="checkbox" checked={showMeaningPreview} onChange={(event) => setShowMeaningPreview(event.target.checked)} />
                    Meaning preview
                  </label>
                </>
              ) : null}
            </div>
          </details>

          <button
            type="button"
            onClick={handleStartStudy}
            disabled={items.length === 0}
            style={{ width: "100%", padding: "0.85rem 1rem", fontSize: "1rem", fontWeight: 700 }}
          >
            {studyStarted ? "Continue Study" : "Start Study"}
          </button>
        </div>
      </section>

      {studyStarted ? (
        <section ref={studyContentRef} style={{ marginTop: "0.75rem" }}>
          <div
            style={{
              position: "sticky",
              top: "0.5rem",
              zIndex: 5,
              marginBottom: "0.75rem",
              border: "1px solid #dbeafe",
              borderRadius: "0.75rem",
              padding: "0.5rem",
              background: "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)"
            }}
          >
            <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                <button type="button" onClick={() => setViewMode("list")} disabled={viewMode === "list"}>List</button>
                <button type="button" onClick={() => setViewMode("card")} disabled={viewMode === "card"}>Card</button>
              </div>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", alignItems: "center" }}>
                <button type="button" onClick={() => setShowStickySearch((value) => !value)}>Search</button>
                <button type="button" onClick={() => setShowStickyFilters((value) => !value)}>Filters</button>
              </div>
            </div>

            {showStickySearch ? (
              <div style={{ marginTop: "0.5rem" }}>
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search content, meaning, example, note, tags, source"
                  style={{ width: "100%" }}
                />
              </div>
            ) : null}

            {showStickyFilters ? (
              <div style={{ marginTop: "0.5rem", display: "grid", gap: "0.45rem", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                <label style={{ display: "grid", gap: "0.2rem" }}>
                  Type
                  <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as LearningFilter)}>
                    <option value="all">all</option>
                    {learningTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: "0.2rem" }}>
                  Domain
                  <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)}>
                    <option value="all">all</option>
                    {domainOptions.map((domain) => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: "0.2rem" }}>
                  Status
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                    <option value="all">all</option>
                    {learningStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                {viewMode === "list" ? (
                  <>
                    <label style={{ display: "grid", gap: "0.2rem" }}>
                      Quantity
                      <select value={listDisplayCount} onChange={(event) => setListDisplayCount(event.target.value as ListDisplayCount)}>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="all">All</option>
                      </select>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "1.35rem" }}>
                      <input type="checkbox" checked={showMeaningPreview} onChange={(event) => setShowMeaningPreview(event.target.checked)} />
                      Meaning preview
                    </label>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          {message ? <p style={{ color: "#166534", margin: "0 0 0.65rem" }}>{message}</p> : null}
          {error ? <p style={{ color: "#b91c1c", margin: "0 0 0.65rem" }}>{error}</p> : null}

          {items.length === 0 ? (
            <section style={sectionStyle}>
              <h3 style={{ marginTop: 0, marginBottom: "0.2rem" }}>No items match your filters</h3>
              <p style={compactHintStyle}>Clear the current filter set to resume study.</p>
              <button type="button" onClick={handleResetFilters} style={{ marginTop: "0.7rem" }}>Reset filters</button>
            </section>
          ) : null}

          {items.length > 0 && viewMode === "list" ? (
            <section style={sectionStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.45rem" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem" }}>Scan mode</h3>
                  <p style={compactHintStyle}>
                    {listDisplayCount === "all"
                      ? `Showing all ${items.length} items`
                      : `Page ${safeListPage} / ${listTotalPages} | Items ${listRangeStart}-${listRangeEnd} of ${items.length}`}
                  </p>
                </div>
                {listDisplayCount !== "all" ? (
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <button type="button" onClick={() => setListPage((value) => Math.max(1, value - 1))} disabled={safeListPage <= 1}>Previous</button>
                    <button type="button" onClick={() => setListPage((value) => Math.min(listTotalPages, value + 1))} disabled={safeListPage >= listTotalPages}>Next</button>
                  </div>
                ) : null}
              </div>

              <div style={{ display: "grid", gap: "0.28rem" }}>
                {visibleListItems.map((item) => {
                  const expanded = expandedItemIds.includes(item.id);
                  const status = getLearningStatus(item.status);
                  const statusBadgeStyle = getStatusBadgeStyle(status);

                  return (
                    <article key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: "0.7rem", background: expanded ? "#fff" : "#fafafa", overflow: "hidden" }}>
                      <div style={{ padding: "0.45rem 0.55rem" }}>
                        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.2rem" }}>
                          <span style={{ padding: "0.07rem 0.36rem", borderRadius: "999px", fontSize: "0.72rem", background: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}>{item.type}</span>
                          {item.tags?.slice(0, 2).map((tag) => (
                            <span key={tag} style={{ padding: "0.07rem 0.36rem", borderRadius: "999px", fontSize: "0.72rem", background: "#f3f4f6", color: "#4b5563" }}>{tag}</span>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.id)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            cursor: "pointer"
                          }}
                        >
                          <div style={{ color: "#111827", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3 }}>
                            {item.content}
                          </div>
                          {showMeaningPreview && item.meaning ? (
                            <div style={{ marginTop: "0.08rem", color: "#6b7280", fontSize: "0.84rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {truncateText(item.meaning, 72)}
                            </div>
                          ) : null}
                        </button>

                        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", alignItems: "center", marginTop: "0.35rem" }}>
                          <span style={{ padding: "0.07rem 0.36rem", borderRadius: "999px", fontSize: "0.72rem", background: statusBadgeStyle.background, color: statusBadgeStyle.color, fontWeight: 600 }}>{status}</span>
                          <button type="button" onClick={() => void handleSetStatus(item, "reviewed")} disabled={status === "reviewed"}>Know</button>
                          <button type="button" onClick={() => void handleSetStatus(item, "learning")} disabled={status === "learning"}>Review</button>
                          <button type="button" onClick={() => void handleSetStatus(item, "ignored")} disabled={status === "ignored"}>Skip</button>
                          <button type="button" onClick={() => toggleExpanded(item.id)}>{expanded ? "Less" : "More"}</button>
                        </div>
                      </div>

                      {expanded ? (
                        <div style={{ padding: "0 0.55rem 0.55rem", display: "grid", gap: "0.3rem", borderTop: "1px solid #f3f4f6" }}>
                          {item.meaning ? <p style={{ margin: "0.45rem 0 0", color: "#6b7280", lineHeight: 1.4 }}><strong style={{ color: "#374151" }}>Meaning:</strong> {item.meaning}</p> : null}
                          {item.example ? <p style={{ margin: 0, lineHeight: 1.4 }}><strong>Example:</strong> {item.example}</p> : null}
                          {item.note ? <p style={{ margin: 0, lineHeight: 1.4 }}><strong>Note:</strong> {item.note}</p> : null}
                          {item.tags && item.tags.length > 0 ? <p style={{ margin: 0, lineHeight: 1.4 }}><strong>Tags:</strong> {item.tags.join(", ")}</p> : null}
                          {item.sourceReport ? <p style={{ margin: 0, lineHeight: 1.4 }}><strong>Source:</strong> {item.sourceReport}</p> : null}
                          {!hasStudyDetails(item) ? <p style={{ margin: "0.45rem 0 0", color: "#6b7280" }}>No additional study details for this item.</p> : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>

              {listDisplayCount !== "all" ? (
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.65rem" }}>
                  <button type="button" onClick={() => setListPage((value) => Math.max(1, value - 1))} disabled={safeListPage <= 1}>Previous</button>
                  <button type="button" onClick={() => setListPage((value) => Math.min(listTotalPages, value + 1))} disabled={safeListPage >= listTotalPages}>Next</button>
                </div>
              ) : null}
            </section>
          ) : null}

          {items.length > 0 && viewMode === "card" && currentCardItem ? (
            <section style={{ ...sectionStyle, maxWidth: "32rem", margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "0.6rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.65rem" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem" }}>Focus mode</h3>
                  <p style={compactHintStyle}>{safeCardPage} / {cardTotalPages}</p>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setCardPage((value) => Math.max(1, value - 1))} disabled={safeCardPage <= 1}>Previous</button>
                  <button type="button" onClick={() => setCardPage((value) => Math.min(cardTotalPages, value + 1))} disabled={safeCardPage >= cardTotalPages}>Next</button>
                </div>
              </div>

              <article style={{ border: "1px solid #dbeafe", borderRadius: "0.9rem", overflow: "hidden", background: "#fff" }}>
                <div style={{ padding: "0.75rem", borderBottom: "1px solid #e5e7eb" }}>
                  <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.45rem" }}>
                    <span style={{ padding: "0.1rem 0.4rem", borderRadius: "999px", fontSize: "0.74rem", background: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}>{currentCardItem.type}</span>
                    {currentCardItem.domain ? <span style={{ padding: "0.1rem 0.4rem", borderRadius: "999px", fontSize: "0.74rem", background: "#f5f3ff", color: "#6d28d9", fontWeight: 600 }}>{currentCardItem.domain}</span> : null}
                    <span style={{ padding: "0.1rem 0.4rem", borderRadius: "999px", fontSize: "0.74rem", background: currentCardStatusStyle.background, color: currentCardStatusStyle.color, fontWeight: 600 }}>{currentCardStatus}</span>
                  </div>
                  <div style={{ color: "#111827", fontSize: "1.08rem", fontWeight: 700, lineHeight: 1.5 }}>
                    {currentCardItem.content}
                  </div>
                </div>

                <div style={{ padding: "0.75rem", display: "grid", gap: "0.55rem" }}>
                  {hasStudyDetails(currentCardItem) ? (
                    <button type="button" onClick={() => toggleCardReveal(currentCardItem.id, "meaning")} style={{ justifySelf: "start" }}>
                      {currentCardRevealState.meaning ? "Hide meaning" : "Reveal meaning"}
                    </button>
                  ) : null}

                  {currentCardRevealState.meaning ? (
                    <div style={{ display: "grid", gap: "0.35rem", padding: "0.7rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#fafafa" }}>
                      {currentCardItem.meaning ? <p style={{ margin: 0, lineHeight: 1.45 }}><strong>Meaning:</strong> {currentCardItem.meaning}</p> : null}
                      {currentCardItem.example ? <p style={{ margin: 0, lineHeight: 1.45 }}><strong>Example:</strong> {currentCardItem.example}</p> : null}
                      {currentCardItem.note ? <p style={{ margin: 0, lineHeight: 1.45 }}><strong>Note:</strong> {currentCardItem.note}</p> : null}
                      {currentCardItem.tags && currentCardItem.tags.length > 0 ? <p style={{ margin: 0, lineHeight: 1.45 }}><strong>Tags:</strong> {currentCardItem.tags.join(", ")}</p> : null}
                      {currentCardItem.sourceReport ? <p style={{ margin: 0, lineHeight: 1.45 }}><strong>Source:</strong> {currentCardItem.sourceReport}</p> : null}
                      {!hasStudyDetails(currentCardItem) ? <p style={{ margin: 0, color: "#6b7280" }}>No supporting detail on this card.</p> : null}
                    </div>
                  ) : null}
                </div>

                <footer style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", padding: "0.75rem", borderTop: "1px solid #e5e7eb", background: "#f9fafb" }}>
                  <button type="button" onClick={() => void handleSetStatus(currentCardItem, "reviewed")} disabled={currentCardStatus === "reviewed"}>Know</button>
                  <button type="button" onClick={() => void handleSetStatus(currentCardItem, "learning")} disabled={currentCardStatus === "learning"}>Review</button>
                  <button type="button" onClick={() => void handleSetStatus(currentCardItem, "ignored")} disabled={currentCardStatus === "ignored"}>Skip</button>
                </footer>
              </article>
            </section>
          ) : null}
        </section>
      ) : null}
    </AppShell>
  );
}
