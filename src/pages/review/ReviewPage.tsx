import { useEffect, useMemo, useState } from "react";

import { useDatabaseRuntime } from "../../data/db/DatabaseContext";
import { useReviewProgressStore } from "../../features/review/store/reviewProgressStore";
import { FeedbackBanner } from "../../shared/ui/feedback/FeedbackBanner";
import { InlineInfo } from "../../shared/ui/feedback/InlineInfo";
import { AppShell } from "../../shared/ui/layout/AppShell";
import {
  actionRowStyle,
  mutedSectionStyle,
  pageSectionStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  statCardStyle,
  statGridStyle,
  subtleButtonStyle
} from "../../shared/ui/layout/pageChrome";
import {
  ReviewWorkflowService,
  type ReviewQueueRecord,
  type ReviewResult,
  type ReviewStatsRecord
} from "../../services/review/reviewWorkflowService";

const reviewService = new ReviewWorkflowService();

export function ReviewPage() {
  const { db } = useDatabaseRuntime();
  const { activeMode, setActiveMode, completedToday, incrementCompleted } = useReviewProgressStore();
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [queue, setQueue] = useState<ReviewQueueRecord[]>([]);
  const [stats, setStats] = useState<ReviewStatsRecord>({
    total: 0,
    correct: 0,
    incorrect: 0,
    skipped: 0,
    needsReview: 0,
    totalAvailable: 0
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [cardStartedAt, setCardStartedAt] = useState<number>(() => Date.now());
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAllStats, setShowAllStats] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);

  const selectedMode = useMemo(() => reviewService.getMode(activeMode ?? "word-review"), [activeMode]);
  const currentCard = queue[currentIndex];

  async function loadSession(modeId: string, favorites: boolean): Promise<void> {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const session = reviewService.loadSession(db, modeId, favorites);
      setQueue(session.queue);
      setStats(session.stats);
      setCurrentIndex(0);
      setShowAnswer(false);
      setCardStartedAt(Date.now());
      setError(undefined);
      setMessage(undefined);
    } catch (sessionError) {
      setError(sessionError instanceof Error ? sessionError.message : "Failed to load review session.");
    } finally {
      setIsProcessing(false);
    }
  }

  useEffect(() => {
    if (!activeMode) {
      setActiveMode(selectedMode.id);
      return;
    }

    void loadSession(activeMode, favoritesOnly);
  }, [activeMode, favoritesOnly, db]);

  useEffect(() => {
    setCardStartedAt(Date.now());
    setShowAnswer(false);
  }, [currentIndex, queue]);

  async function handleResult(result: ReviewResult): Promise<void> {
    if (!currentCard || isProcessing) {
      return;
    }
    setIsProcessing(true);
    setError(undefined);

    try {
      const responseTimeMs = Math.max(0, Date.now() - cardStartedAt);
      const updatedStats = await reviewService.recordResult(
        db,
        selectedMode.id,
        currentCard.itemType,
        currentCard.itemId,
        result,
        responseTimeMs
      );
      const nextQueue = queue.filter((_, index) => index !== currentIndex);

      setStats(updatedStats);
      setQueue(nextQueue);
      setCurrentIndex((previous) => Math.min(previous, Math.max(nextQueue.length - 1, 0)));
      incrementCompleted();
      setMessage(`Recorded ${result} for ${currentCard.title}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record result.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleFavoriteToggle(): Promise<void> {
    if (!currentCard || isProcessing) {
      return;
    }
    setIsProcessing(true);
    setError(undefined);

    try {
      const favorite = await reviewService.toggleFavorite(db, currentCard.itemType, currentCard.itemId, !currentCard.isFavorite);
      setQueue((previous) => previous.map((item, index) => (
        index === currentIndex ? { ...item, isFavorite: favorite } : item
      )));
      setMessage(favorite ? "Added to favorites." : "Removed from favorites.");

      if (favoritesOnly && !favorite) {
        await loadSession(selectedMode.id, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle favorite.");
    } finally {
      setIsProcessing(false);
    }
  }

  const fieldLabels: Record<string, string> = {
    canonical_word: "Content",
    canonical_phrase: "Content",
    canonical_sentence: "Content",
    canonical_name: "Content",
    english_definition: "Meaning",
    explanation: "Meaning",
    description: "Meaning",
    chinese_natural: "Meaning",
    example_sentence: "Example",
    identification_method: "Example / Method",
    chinese_meaning: "Note",
    chinese_literal: "Note",
    engineering_significance: "Note",
    risk_implications: "Note",
    notes: "Note",
    reviewer_note: "Note",
    language_category: "Domain",
    phrase_type: "Domain",
    sentence_type: "Domain",
    geo_material_category: "Domain",
    geo_feature_category: "Domain",
    tags: "Tags",
    sourceReport: "Source Report"
  };

  const editFieldKeys = useMemo(() => {
    if (!currentCard) return [];
    const itemType = currentCard.itemType;
    const keys: string[] = [];

    if (itemType === "word") keys.push("canonical_word");
    else if (itemType === "phrase") keys.push("canonical_phrase");
    else if (itemType === "sentence") keys.push("canonical_sentence");
    else keys.push("canonical_name");

    if (itemType === "word") keys.push("english_definition");
    else if (itemType === "phrase") keys.push("explanation");
    else if (itemType === "sentence") keys.push("chinese_natural");
    else keys.push("description");

    if (itemType === "sentence") keys.push("example_sentence");
    else if (itemType === "geo_material" || itemType === "geo_feature") keys.push("identification_method");

    if (itemType === "word" || itemType === "phrase") keys.push("chinese_meaning");
    else if (itemType === "sentence") keys.push("chinese_literal");
    else if (itemType === "geo_material") keys.push("engineering_significance");
    else if (itemType === "geo_feature") keys.push("risk_implications");
    else keys.push("notes");

    if (itemType === "word") keys.push("language_category");
    else if (itemType === "phrase") keys.push("phrase_type");
    else if (itemType === "sentence") keys.push("sentence_type");
    else if (itemType === "geo_material") keys.push("geo_material_category");
    else if (itemType === "geo_feature") keys.push("geo_feature_category");

    keys.push("tags");
    keys.push("sourceReport");

    return keys;
  }, [currentCard]);

  const getLabel = (key: string) => fieldLabels[key] || key.replace(/_/g, " ").toUpperCase();

  async function handleStartEdit(): Promise<void> {
    if (!currentCard) return;
    try {
      const detail = await reviewService.getItemDetail(db, currentCard.itemType, currentCard.itemId);
      if (detail) {
        setEditFields(detail.fields);
        setIsEditing(true);
      }
    } catch {
      setError("Failed to load item details for editing.");
    }
  }

  async function handleSaveEdit(): Promise<void> {
    if (!currentCard || !db) return;
    setIsSaving(true);
    try {
      await reviewService.updateItem(db, currentCard.itemType, currentCard.itemId, editFields);
      setIsEditing(false);
      setMessage("Item updated successfully.");
      await loadSession(selectedMode.id, favoritesOnly);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  }

  const summaryCards = [
    { label: "Queue", value: queue.length, tone: "neutral" as const },
    { label: "Completed Today", value: completedToday, tone: "neutral" as const },
    { label: "Unique Reviewed", value: `${stats.total} / ${stats.totalAvailable}`, tone: "success" as const }
  ];

  return (
    <AppShell
      title="Review"
      subtitle="Study approved items and record progress."
      pageDescription={null}
    >
      <section style={mutedSectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.9rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0 }}>Session Controls</h3>
              <InlineInfo title="Review controls">
                Pick a review mode, optionally limit the queue to favorites, then work card by card.
              </InlineInfo>
            </div>
          </div>
          <div style={{ minWidth: "220px", display: "grid", gap: "0.5rem" }}>
            <div style={{ color: "#64748b", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Current mode
            </div>
            <div style={{ fontWeight: 700, color: "#0f172a" }}>{selectedMode.label}</div>
            <div style={{ color: "#64748b", fontSize: "0.92rem" }}>
              {favoritesOnly ? "Favorites filter enabled" : "All approved items included"}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: "0.75rem", alignItems: "end" }}>
            <label style={{ display: "grid", gap: "0.3rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Mode
              </span>
              <select value={selectedMode.id} onChange={(event) => setActiveMode(event.target.value)} style={{ width: "100%" }}>
                {reviewService.modes.map((mode) => (
                  <option key={mode.id} value={mode.id}>{mode.label}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center", whiteSpace: "nowrap", paddingBottom: "0.85rem", fontWeight: 600, color: "#0f172a" }}>
              <input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} />
              <span>Favorites only</span>
            </label>
          </div>
          {message ? <FeedbackBanner tone="success" message={message} /> : null}
          {error ? <FeedbackBanner tone="error" message={error} /> : null}
        </div>
      </section>

      {!currentCard ? (
        <section style={{ ...pageSectionStyle, textAlign: "center" }}>
          <h3 style={{ marginTop: 0 }}>No Cards Available</h3>
          <p style={{ color: "#6b7280", marginBottom: 0 }}>
            {favoritesOnly ? "No favorite approved items are available for this mode yet." : "No approved items are available for this review mode yet."}
          </p>
        </section>
      ) : null}

      <section style={pageSectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0 }}>Session Snapshot</h3>
              <InlineInfo title="Review stats">
                Keep the first row focused on queue health. Expand for deeper stats only when you need them.
              </InlineInfo>
            </div>
          </div>
          <button type="button" onClick={() => setShowAllStats((value) => !value)} style={subtleButtonStyle}>
            {showAllStats ? "Show less" : "Show more"}
          </button>
        </div>
        <div style={statGridStyle}>
          {summaryCards.map((card) => (
            <div
              key={card.label}
              style={{
                ...statCardStyle,
                background: card.tone === "success" ? "#f0fdf4" : statCardStyle.background,
                border: card.tone === "success" ? "1px solid #bbf7d0" : statCardStyle.border
              }}
            >
              <span style={{ display: "block", fontSize: "0.78rem", color: card.tone === "success" ? "#166534" : "#6b7280", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                {card.label}
              </span>
              <span style={{ fontSize: "1.3rem", fontWeight: 800, color: card.tone === "success" ? "#166534" : "#0f172a" }}>{card.value}</span>
            </div>
          ))}
          {showAllStats ? (
            <>
              {[
                ["Correct", stats.correct],
                ["Incorrect", stats.incorrect],
                ["Needs Review", stats.needsReview]
              ].map(([label, value]) => (
                <div key={label} style={statCardStyle}>
                  <span style={{ display: "block", fontSize: "0.78rem", color: "#6b7280", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>
                    {label}
                  </span>
                  <span style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>{value}</span>
                </div>
              ))}
            </>
          ) : null}
        </div>
      </section>

      {currentCard ? (
        <section style={pageSectionStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.85rem", color: "#6b7280", fontWeight: 600 }}>
              Card {currentIndex + 1} of {queue.length}
            </span>
            <span style={{ fontSize: "0.85rem", color: "#475569", background: "#f1f5f9", padding: "0.3rem 0.55rem", borderRadius: "999px", fontWeight: 600 }}>
              {currentCard.subtitle ?? "General"}
            </span>
          </div>

          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 800, color: "#111827" }}>{currentCard.title}</h2>

          <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "0.85rem", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
            <p style={{ margin: 0, fontWeight: 700, color: "#475569", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Prompt
            </p>
            <p style={{ margin: "0.3rem 0 0", fontSize: "1.08rem", color: "#0f172a" }}>{currentCard.prompt}</p>
          </div>

          {showAnswer ? (
            <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #bbf7d0", borderRadius: "0.85rem", background: "#f0fdf4" }}>
              <p style={{ margin: 0, fontWeight: 700, color: "#166534", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Answer / Study Notes
              </p>
              <ul style={{ margin: "0.55rem 0", paddingLeft: "1.25rem", color: "#14532d" }}>
                {currentCard.detailLines.map((line) => (
                  <li key={line} style={{ marginBottom: "0.25rem" }}>{line}</li>
                ))}
              </ul>
              <div style={{ marginTop: "0.75rem", fontSize: "0.88rem", color: "#15803d", borderTop: "1px solid #bbf7d0", paddingTop: "0.55rem" }}>
                <p style={{ margin: 0 }}><strong>Source Section:</strong> {currentCard.sourceSection ?? "N/A"}</p>
                <p style={{ margin: "0.25rem 0 0" }}><strong>Source Sentence:</strong> {currentCard.sourceSentence ?? "N/A"}</p>
              </div>
            </div>
          ) : null}

          <div style={{ ...actionRowStyle, marginTop: "1.25rem" }}>
            <button
              onClick={() => setShowAnswer((value) => !value)}
              disabled={isProcessing}
              style={{
                ...primaryButtonStyle,
                flex: "1 1 180px",
                background: showAnswer ? "#0f172a" : "#2563eb",
                border: `1px solid ${showAnswer ? "#0f172a" : "#2563eb"}`
              }}
            >
              {showAnswer ? "Hide Answer" : "Show Answer"}
            </button>
            <button
              onClick={() => void handleFavoriteToggle()}
              disabled={isProcessing}
              style={{ ...secondaryButtonStyle, flex: "1 1 180px" }}
            >
              {currentCard.isFavorite ? "Favorited" : "Favorite"}
            </button>
            <button
              onClick={handleStartEdit}
              disabled={isProcessing}
              style={{ ...secondaryButtonStyle, flex: "1 1 180px" }}
            >
              Edit Item
            </button>
          </div>

          {isEditing ? (
            <section style={{ ...mutedSectionStyle, border: "1px solid #bfdbfe", marginTop: "1.25rem", marginBottom: 0 }}>
              <h3 style={{ marginTop: 0 }}>Edit Item</h3>
              <div style={{ display: "grid", gap: "1rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>Type</span>
                  <input
                    value={currentCard.itemType}
                    readOnly
                    style={{ width: "100%", background: "#f1f5f9" }}
                  />
                </label>
                {editFieldKeys.map((key) => (
                  <label key={key} style={{ display: "block" }}>
                    <span style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#475569", marginBottom: "0.3rem" }}>{getLabel(key)}</span>
                    <textarea
                      value={String(editFields[key] ?? "")}
                      onChange={(event) => setEditFields((previous) => ({ ...previous, [key]: event.target.value }))}
                      readOnly={key === "sourceReport"}
                      style={{
                        width: "100%",
                        minHeight: key === "tags" || key === "sourceReport" ? "52px" : "96px",
                        background: key === "sourceReport" ? "#f1f5f9" : "#ffffff"
                      }}
                    />
                  </label>
                ))}
              </div>
              <div style={{ ...actionRowStyle, marginTop: "1rem" }}>
                <button type="button" onClick={() => void handleSaveEdit()} disabled={isSaving} style={primaryButtonStyle}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} style={secondaryButtonStyle}>
                  Cancel
                </button>
              </div>
            </section>
          ) : null}

          <div style={{ ...statGridStyle, marginTop: "1.25rem" }}>
            <button
              onClick={() => void handleResult("correct")}
              disabled={isProcessing}
              style={{ ...primaryButtonStyle, background: "#16a34a", border: "1px solid #16a34a" }}
            >
              Correct
            </button>
            <button
              onClick={() => void handleResult("incorrect")}
              disabled={isProcessing}
              style={{ ...primaryButtonStyle, background: "#dc2626", border: "1px solid #dc2626" }}
            >
              Incorrect
            </button>
            <button
              onClick={() => void handleResult("skipped")}
              disabled={isProcessing}
              style={secondaryButtonStyle}
            >
              Skipped
            </button>
            <button
              onClick={() => void handleResult("needs_review")}
              disabled={isProcessing}
              style={{ ...secondaryButtonStyle, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}
            >
              Needs Review
            </button>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
