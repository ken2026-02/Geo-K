import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import type {
  LearningCollectionRecord,
  LearningItemRecord,
  LearningItemStatus,
  LearningItemType
} from "../../data/repositories/interfaces";
import { buildLearningDomainOptions, filterLearningItems, getLearningStatus } from "../../features/learning/classification";
import { FeedbackBanner } from "../../shared/ui/feedback/FeedbackBanner";
import { AppShell } from "../../shared/ui/layout/AppShell";
import { LearningModuleService } from "../../services/learning/learningModuleService";
import { LearningSubnav } from "./LearningSubnav";
import {
  getLearningDetailRows,
  getLearningFieldConfig,
  getLearningSummaryText,
  getLearningTypeBadgeClasses
} from "./learningItemPresentation";

type LearningFilter = "all" | LearningItemType;
type DomainFilter = "all" | string;
type StatusFilter = "all" | LearningItemStatus;
type StudyViewMode = "list" | "card";
type ListDisplayCount = "10" | "20" | "50" | "all";
type CardDisplayCount = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
type CardRevealField = "meaning" | "example" | "note";

interface CardRevealState {
  meaning: boolean;
  example: boolean;
  note: boolean;
}

function truncateText(value: string, max = 140): string {
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
}

function createEmptyCardRevealState(): CardRevealState {
  return {
    meaning: false,
    example: false,
    note: false
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

function getStudyActionStatus(action: "know" | "review" | "skip"): LearningItemStatus {
  switch (action) {
    case "know":
      return "reviewed";
    case "review":
      return "learning";
    case "skip":
    default:
      return "new";
  }
}

function getStudyActionDescription(action: "know" | "review" | "skip"): string {
  switch (action) {
    case "know":
      return "Promote to longer review interval.";
    case "review":
      return "Keep in the active learning queue.";
    case "skip":
    default:
      return "Return to the queue without burying the item.";
  }
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
const toggleButtonBaseClass = "inline-flex min-h-10 items-center justify-center rounded-2xl border px-3 py-2 text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";
const neutralActionClass = `${toggleButtonBaseClass} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;
const primaryActionClass = `${toggleButtonBaseClass} border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700`;
const compactStudyActionClass = "inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";
const studySectionClass = "rounded-2xl border border-slate-200 bg-white shadow-sm";
const fieldLabelClass = "text-sm font-semibold text-slate-700";

export function LearningStudyPage() {
  const learningService = useMemo(() => new LearningModuleService(), []);
  const learningTypes = learningService.getLearningTypes();
  const learningStatuses = learningService.getSuggestedStatuses();
  const studyContentRef = useRef<HTMLElement | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [collections, setCollections] = useState<LearningCollectionRecord[]>([]);
  const [allItems, setAllItems] = useState<LearningItemRecord[]>([]);
  const [typeFilter, setTypeFilter] = useState<LearningFilter>("all");
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<StudyViewMode>("list");
  const [listDisplayCount, setListDisplayCount] = useState<ListDisplayCount>("10");
  const [cardDisplayCount, setCardDisplayCount] = useState<CardDisplayCount>("1");
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
  const [isProcessing, setIsProcessing] = useState(false);
  const deferredSearchText = useDeferredValue(searchText);
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
    setAllItems(await learningService.listItems("all", collectionId || undefined));
  }

  useEffect(() => {
    void refreshCollections();
  }, []);

  useEffect(() => {
    void refreshItems();
  }, [activeCollectionId]);

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
    setCardRevealStates({});
    setListPage(1);
    setCardPage(1);
    setStudyStarted(false);
  }, [activeCollectionId]);

  useEffect(() => {
    setExpandedItemIds([]);
    setListPage(1);
  }, [listDisplayCount]);

  useEffect(() => {
    setCardPage(1);
  }, [cardDisplayCount]);

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
    if (isProcessing) return;
    setIsProcessing(true);
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
      console.error("Failed to update status:", updateError);
      const errorMessage = updateError instanceof Error ? updateError.message : "Status update failed.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
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
    setCardDisplayCount("1");
    setListPage(1);
    setCardPage(1);
    setExpandedItemIds([]);
    setCardRevealStates({});
    setShowMeaningPreview(false);
    setShowStickyFilters(false);
    setShowStickySearch(false);
    clearFeedback();
  }

  const listPageSize = listDisplayCount === "all" ? Math.max(items.length, 1) : Number(listDisplayCount);
  const listTotalPages = listDisplayCount === "all" ? (items.length > 0 ? 1 : 0) : getTotalPages(items.length, listPageSize);
  const safeListPage = listTotalPages === 0 ? 1 : Math.min(listPage, listTotalPages);
  const listStartIndex = listDisplayCount === "all" ? 0 : (safeListPage - 1) * listPageSize;
  const visibleListItems = listDisplayCount === "all" ? items : items.slice(listStartIndex, listStartIndex + listPageSize);
  const listRangeStart = items.length === 0 ? 0 : listStartIndex + 1;
  const listRangeEnd = items.length === 0 ? 0 : listStartIndex + visibleListItems.length;

  const cardPageSize = Number(cardDisplayCount);
  const cardTotalPages = getTotalPages(items.length, cardPageSize);
  const safeCardPage = cardTotalPages === 0 ? 1 : Math.min(cardPage, cardTotalPages);
  const cardStartIndex = (safeCardPage - 1) * cardPageSize;
  const currentCardItems = items.slice(cardStartIndex, cardStartIndex + cardPageSize);
  const activeCollection = collections.find((collection) => collection.id === activeCollectionId);

  return (
    <AppShell
      title="Study Learning"
      subtitle="Study learning items in list or card mode."
      pageDescription={null}
    >
      <LearningSubnav />

      <section className={`${studySectionClass} mt-4 p-3.5 sm:p-4.5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900">Active Learning List</h3>
              <details className="text-sm">
                <summary className="cursor-pointer rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500">i</summary>
                <div className="mt-2 max-w-md rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600 shadow-sm">
                  Stay inside one standard, manual, or report while you study. Queue, pagination, and review status stay scoped to the selected list.
                </div>
              </details>
            </div>
          </div>
          <Link to={`/learning/import${activeCollectionId ? `?collection=${activeCollectionId}` : ""}`} className="ekv-button-compact">
            Open import
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <label className="grid gap-2">
            <span className={fieldLabelClass}>Current list</span>
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
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="ekv-chip bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">{activeCollection.sourceType}</span>
              {activeCollection.documentNumber ? <span className="ekv-chip bg-slate-100 text-slate-600 ring-1 ring-slate-200">{activeCollection.documentNumber}</span> : null}
              {activeCollection.authority ? <span className="ekv-chip bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">{activeCollection.authority}</span> : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className={`${studySectionClass} mt-4 p-3.5 sm:p-4.5`}>
        <div className="space-y-3.5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900">Start Study</h3>
              <details className="text-sm">
                <summary className="cursor-pointer rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500">i</summary>
                <div className="mt-2 max-w-md rounded-2xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600 shadow-sm">
                  Use List mode to scan many items quickly. Use Card mode to focus on fewer items with staged reveals.
                </div>
              </details>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
            <span>{items.length} items available</span>
            {lastStudiedLabel ? <span>Last studied: {lastStudiedLabel}</span> : null}
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <span className={fieldLabelClass}>View mode</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setViewMode("list")} disabled={viewMode === "list"} className={viewMode === "list" ? primaryActionClass : neutralActionClass}>
                  List
                </button>
                <button type="button" onClick={() => setViewMode("card")} disabled={viewMode === "card"} className={viewMode === "card" ? primaryActionClass : neutralActionClass}>
                  Card
                </button>
              </div>
            </div>

            <label className="grid gap-2 sm:col-span-1 lg:col-span-2">
              <span className={fieldLabelClass}>Search</span>
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search content, meaning, example, note, tags, source"
                className="ekv-input"
              />
            </label>

            <label className="grid gap-2">
              <span className={fieldLabelClass}>Type</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as LearningFilter)} className="ekv-select">
                <option value="all">all</option>
                {learningTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>

          <details className="rounded-2xl border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer px-3.5 py-2.5 text-sm font-semibold text-slate-800">More study filters</summary>
            <div className="grid grid-cols-1 gap-2.5 px-3.5 pb-3.5 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-2">
                <span className={fieldLabelClass}>Domain</span>
                <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)} className="ekv-select">
                  <option value="all">all</option>
                  {domainOptions.map((domain) => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className={fieldLabelClass}>Status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="ekv-select">
                  <option value="all">all</option>
                  {learningStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>

              {viewMode === "list" ? (
                <>
                  <label className="grid gap-2">
                    <span className={fieldLabelClass}>Quantity</span>
                    <select value={listDisplayCount} onChange={(event) => setListDisplayCount(event.target.value as ListDisplayCount)} className="ekv-select">
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="all">All</option>
                    </select>
                  </label>
                  <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={showMeaningPreview}
                      onChange={(event) => setShowMeaningPreview(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Meaning preview
                  </label>
                </>
              ) : (
                <label className="grid gap-2">
                  <span className={fieldLabelClass}>Quantity</span>
                  <select value={cardDisplayCount} onChange={(event) => setCardDisplayCount(event.target.value as CardDisplayCount)} className="ekv-select">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                      <option key={count} value={count.toString()}>{count}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </details>

          <button type="button" onClick={handleStartStudy} disabled={items.length === 0} className="ekv-button-primary w-full">
            {studyStarted ? "Continue Study" : "Start Study"}
          </button>
          <details className="rounded-2xl border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer px-3.5 py-2.5 text-sm font-semibold text-slate-700">Study actions guide</summary>
            <div className="space-y-1 px-3.5 pb-3.5 text-sm leading-6 text-slate-600">
              <p><strong className="text-slate-700">Know:</strong> promote the item to a longer review interval.</p>
              <p><strong className="text-slate-700">Review:</strong> keep the item active in the current learning queue.</p>
              <p><strong className="text-slate-700">Skip:</strong> return the item to the queue without burying it.</p>
            </div>
          </details>
        </div>
      </section>

      {studyStarted ? (
        <section ref={studyContentRef} className="mt-4 space-y-4">
          <div className="sticky top-2 z-10 rounded-3xl border border-cyan-200 bg-white/95 p-2.5 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setViewMode("list")} disabled={viewMode === "list"} className={viewMode === "list" ? primaryActionClass : compactStudyActionClass}>
                  List
                </button>
                <button type="button" onClick={() => setViewMode("card")} disabled={viewMode === "card"} className={viewMode === "card" ? primaryActionClass : compactStudyActionClass}>
                  Card
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setShowStickySearch((value) => !value)} className={compactStudyActionClass}>
                  Search
                </button>
                <button type="button" onClick={() => setShowStickyFilters((value) => !value)} className={compactStudyActionClass}>
                  Filters
                </button>
              </div>
            </div>

            {showStickySearch ? (
              <div className="mt-3">
                <input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search content, meaning, example, note, tags, source"
                  className="ekv-input"
                />
              </div>
            ) : null}

            {showStickyFilters ? (
              <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-2">
                  <span className={fieldLabelClass}>Type</span>
                  <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as LearningFilter)} className="ekv-select">
                    <option value="all">all</option>
                    {learningTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className={fieldLabelClass}>Domain</span>
                  <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)} className="ekv-select">
                    <option value="all">all</option>
                    {domainOptions.map((domain) => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className={fieldLabelClass}>Status</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="ekv-select">
                    <option value="all">all</option>
                    {learningStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                {viewMode === "list" ? (
                  <>
                    <label className="grid gap-2">
                      <span className={fieldLabelClass}>Quantity</span>
                      <select value={listDisplayCount} onChange={(event) => setListDisplayCount(event.target.value as ListDisplayCount)} className="ekv-select">
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="all">All</option>
                      </select>
                    </label>
                    <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 lg:col-span-2">
                      <input
                        type="checkbox"
                        checked={showMeaningPreview}
                        onChange={(event) => setShowMeaningPreview(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Meaning preview
                    </label>
                  </>
                ) : (
                  <label className="grid gap-2">
                    <span className={fieldLabelClass}>Quantity</span>
                    <select value={cardDisplayCount} onChange={(event) => setCardDisplayCount(event.target.value as CardDisplayCount)} className="ekv-select">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                        <option key={count} value={count.toString()}>{count}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            {message ? <FeedbackBanner tone="success" message={message} /> : null}
            {error ? <FeedbackBanner tone="error" message={error} /> : null}
          </div>

          {items.length === 0 ? (
            <section className={`${studySectionClass} p-3.5 sm:p-4.5`}>
              <h3 className="text-lg font-semibold text-slate-900">No items match your filters</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">Clear the current filter set to resume study.</p>
              <button type="button" onClick={handleResetFilters} className="ekv-button-compact mt-4">
                Reset filters
              </button>
            </section>
          ) : null}

          {items.length > 0 && viewMode === "list" ? (
            <section className={`${studySectionClass} p-3.5 sm:p-4.5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Scan Mode</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {listDisplayCount === "all"
                      ? `Showing all ${items.length} items`
                      : `Page ${safeListPage} / ${listTotalPages} | Items ${listRangeStart}-${listRangeEnd} of ${items.length}`}
                  </p>
                </div>
                {listDisplayCount !== "all" ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setListPage((value) => Math.max(1, value - 1))} disabled={safeListPage <= 1} className={compactStudyActionClass}>
                      Previous
                    </button>
                    <button type="button" onClick={() => setListPage((value) => Math.min(listTotalPages, value + 1))} disabled={safeListPage >= listTotalPages} className={compactStudyActionClass}>
                      Next
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="mt-3 space-y-2.5">
                {visibleListItems.map((item) => {
                  const expanded = expandedItemIds.includes(item.id);
                  const status = getLearningStatus(item.status);
                  const fieldConfig = getLearningFieldConfig(item.type);
                  const detailRows = getLearningDetailRows(item);
                  const summaryText = getLearningSummaryText(item);

                  return (
                    <article key={item.id} className={`overflow-hidden rounded-[1.5rem] border shadow-sm transition-all ${expanded ? "border-cyan-200 bg-white ring-1 ring-cyan-100" : "border-slate-200 bg-slate-50/60 hover:border-slate-300"}`}>
                      <div className="p-3.5 sm:p-4">
                        <div className="mb-2.5 flex flex-wrap items-center gap-2">
                          <span className={`${chipBaseClass} ${getLearningTypeBadgeClasses(item.type)}`}>{item.type.replaceAll("_", " ")}</span>
                          {item.tags?.slice(0, 2).map((tag) => (
                            <span key={tag} className={`${chipBaseClass} bg-slate-100 text-slate-600 ring-1 ring-slate-200`}>{tag}</span>
                          ))}
                          <span className={`${chipBaseClass} ${getStatusBadgeClasses(status)}`}>{status}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.id)}
                          className="w-full rounded-2xl text-left transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-[0.995]"
                        >
                          <div className="text-lg font-semibold leading-7 text-slate-900 line-clamp-3 sm:line-clamp-2">
                            {item.content}
                          </div>
                          {showMeaningPreview && summaryText ? (
                            <div className="mt-1 text-sm leading-6 text-slate-500 line-clamp-2">
                              {truncateText(summaryText, 72)}
                            </div>
                          ) : null}
                        </button>

                        <div className="mt-3 grid grid-cols-[repeat(3,minmax(0,1fr))_auto] gap-1.5">
                          <button type="button" onClick={() => void handleSetStatus(item, getStudyActionStatus("know"))} disabled={isProcessing} className={compactStudyActionClass}>
                            Know
                          </button>
                          <button type="button" onClick={() => void handleSetStatus(item, getStudyActionStatus("review"))} disabled={isProcessing} className={compactStudyActionClass}>
                            Review
                          </button>
                          <button type="button" onClick={() => void handleSetStatus(item, getStudyActionStatus("skip"))} disabled={isProcessing} className={compactStudyActionClass}>
                            Skip
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleExpanded(item.id)}
                            className="inline-flex min-h-9 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-95"
                          >
                            {expanded ? "Less" : "More"}
                          </button>
                        </div>
                      </div>

                      {expanded ? (
                        <div className="border-t border-slate-200 bg-white p-3.5 sm:p-4">
                          <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                            {detailRows.map((detailRow) => (
                              <div key={detailRow.label}>
                                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{detailRow.label}</div>
                                <p className="mt-1 text-sm leading-6 text-slate-800">{detailRow.value}</p>
                              </div>
                            ))}
                            {!hasStudyDetails(item) ? <p className="text-sm text-slate-500">No additional study details for this item.</p> : null}
                          </div>
                          <p className="mt-3 text-xs text-slate-500">Study fields: {fieldConfig.meaningLabel}, {fieldConfig.exampleLabel}, {fieldConfig.noteLabel}</p>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>

              {listDisplayCount !== "all" ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="text-sm text-slate-500">Page {safeListPage} / {listTotalPages}</div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setListPage((value) => Math.max(1, value - 1))} disabled={safeListPage <= 1} className={compactStudyActionClass}>
                      Previous
                    </button>
                    <button type="button" onClick={() => setListPage((value) => Math.min(listTotalPages, value + 1))} disabled={safeListPage >= listTotalPages} className={compactStudyActionClass}>
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {items.length > 0 && viewMode === "card" && currentCardItems.length > 0 ? (
            <section className={`${studySectionClass} mx-auto max-w-4xl p-3.5 sm:p-4.5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Focus Mode</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{safeCardPage} / {cardTotalPages}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setCardPage((value) => Math.max(1, value - 1))} disabled={safeCardPage <= 1} className={compactStudyActionClass}>
                    Previous
                  </button>
                  <button type="button" onClick={() => setCardPage((value) => Math.min(cardTotalPages, value + 1))} disabled={safeCardPage >= cardTotalPages} className={compactStudyActionClass}>
                    Next
                  </button>
                </div>
              </div>

              <div className={`mt-4 grid gap-4 ${currentCardItems.length > 1 ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"}`}>
                {currentCardItems.map((currentCardItem) => {
                  const currentCardRevealState = getCardRevealState(currentCardItem.id);
                  const currentCardStatus = getLearningStatus(currentCardItem.status);
                  const fieldConfig = getLearningFieldConfig(currentCardItem.type);
                  const detailRows = getLearningDetailRows(currentCardItem);

                  return (
                    <article key={currentCardItem.id} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-200 p-4">
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className={`${chipBaseClass} ${getLearningTypeBadgeClasses(currentCardItem.type)}`}>{currentCardItem.type.replaceAll("_", " ")}</span>
                          {currentCardItem.domain ? <span className={`${chipBaseClass} bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200`}>{currentCardItem.domain}</span> : null}
                          <span className={`${chipBaseClass} ${getStatusBadgeClasses(currentCardStatus)}`}>{currentCardStatus}</span>
                        </div>
                        <div className="text-xl font-semibold leading-8 text-slate-900">
                          {currentCardItem.content}
                        </div>
                      </div>

                      <div className="space-y-3 p-4">
                        {hasStudyDetails(currentCardItem) ? (
                          <div className="flex flex-wrap gap-2">
                            {currentCardItem.meaning ? (
                              <button type="button" onClick={() => toggleCardReveal(currentCardItem.id, "meaning")} className={currentCardRevealState.meaning ? primaryActionClass : neutralActionClass}>
                                {currentCardRevealState.meaning ? `Hide ${fieldConfig.meaningLabel.toLowerCase()}` : fieldConfig.meaningLabel}
                              </button>
                            ) : null}
                            {currentCardItem.example ? (
                              <button type="button" onClick={() => toggleCardReveal(currentCardItem.id, "example")} className={currentCardRevealState.example ? primaryActionClass : neutralActionClass}>
                                {currentCardRevealState.example ? `Hide ${fieldConfig.exampleLabel.toLowerCase()}` : fieldConfig.exampleLabel}
                              </button>
                            ) : null}
                            {currentCardItem.note ? (
                              <button type="button" onClick={() => toggleCardReveal(currentCardItem.id, "note")} className={currentCardRevealState.note ? primaryActionClass : neutralActionClass}>
                                {currentCardRevealState.note ? `Hide ${fieldConfig.noteLabel.toLowerCase()}` : fieldConfig.noteLabel}
                              </button>
                            ) : null}
                          </div>
                        ) : null}

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3.5">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Original</div>
                            <p className="mt-1 text-sm leading-6 text-slate-900">{currentCardItem.content}</p>
                          </div>
                          {currentCardRevealState.meaning && currentCardItem.meaning ? (
                            <div className="mt-3">
                              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{fieldConfig.meaningLabel}</div>
                              <p className="mt-1 text-sm leading-6 text-slate-700">{currentCardItem.meaning}</p>
                            </div>
                          ) : null}
                          {currentCardRevealState.example && currentCardItem.example ? (
                            <div className="mt-3">
                              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{fieldConfig.exampleLabel}</div>
                              <p className="mt-1 text-sm leading-6 text-slate-700">{currentCardItem.example}</p>
                            </div>
                          ) : null}
                          {currentCardRevealState.note && currentCardItem.note ? (
                            <div className="mt-3">
                              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{fieldConfig.noteLabel}</div>
                              <p className="mt-1 text-sm leading-6 text-slate-700">{currentCardItem.note}</p>
                            </div>
                          ) : null}
                          {currentCardItem.tags && currentCardItem.tags.length > 0 ? (
                            <div className="mt-3">
                              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tags</div>
                              <p className="mt-1 text-sm leading-6 text-slate-700">{currentCardItem.tags.join(", ")}</p>
                            </div>
                          ) : null}
                          {currentCardItem.sourceReport ? (
                            <div className="mt-3">
                              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Source</div>
                              <p className="mt-1 text-sm leading-6 text-slate-700">{currentCardItem.sourceReport}</p>
                            </div>
                          ) : null}
                          {!hasStudyDetails(currentCardItem) ? (
                            <p className="mt-3 text-sm text-slate-500">No supporting detail on this card.</p>
                          ) : null}
                        </div>

                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3.5">
                          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">Card structure</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {detailRows.slice(1).map((detailRow) => (
                              <span key={detailRow.label} className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
                                {detailRow.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <footer className="grid grid-cols-3 gap-2 border-t border-slate-200 bg-slate-50 p-3.5">
                        <button type="button" onClick={() => void handleSetStatus(currentCardItem, getStudyActionStatus("know"))} disabled={isProcessing} className={compactStudyActionClass}>
                          Know
                        </button>
                        <button type="button" onClick={() => void handleSetStatus(currentCardItem, getStudyActionStatus("review"))} disabled={isProcessing} className={compactStudyActionClass}>
                          Review
                        </button>
                        <button type="button" onClick={() => void handleSetStatus(currentCardItem, getStudyActionStatus("skip"))} disabled={isProcessing} className={compactStudyActionClass}>
                          Skip
                        </button>
                      </footer>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}
        </section>
      ) : null}
    </AppShell>
  );
}
