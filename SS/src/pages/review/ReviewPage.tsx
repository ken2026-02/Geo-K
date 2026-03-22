import { useEffect, useMemo, useState } from "react";

import { useDatabaseRuntime } from "../../data/db/DatabaseContext";
import { useReviewProgressStore } from "../../features/review/store/reviewProgressStore";
import { AppShell } from "../../shared/ui/layout/AppShell";
import {
  ReviewWorkflowService,
  type ReviewQueueRecord,
  type ReviewResult,
  type ReviewStatsRecord
} from "../../services/review/reviewWorkflowService";

const reviewService = new ReviewWorkflowService();

function formatCount(label: string, value: number) {
  return <span><strong>{label}:</strong> {value}</span>;
}

export function ReviewPage() {
  const { db } = useDatabaseRuntime();
  const { activeMode, setActiveMode, completedToday, incrementCompleted } = useReviewProgressStore();
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [queue, setQueue] = useState<ReviewQueueRecord[]>([]);
  const [stats, setStats] = useState<ReviewStatsRecord>({ total: 0, correct: 0, incorrect: 0, skipped: 0, needsReview: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [cardStartedAt, setCardStartedAt] = useState<number>(() => Date.now());
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  const selectedMode = useMemo(() => reviewService.getMode(activeMode ?? "word-review"), [activeMode]);
  const currentCard = queue[currentIndex];

  async function loadSession(modeId: string, favorites: boolean): Promise<void> {
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
    if (!currentCard) {
      return;
    }

    const responseTimeMs = Math.max(0, Date.now() - cardStartedAt);
    const updatedStats = await reviewService.recordResult(db, selectedMode.id, currentCard.itemType, currentCard.itemId, result, responseTimeMs);
    const nextQueue = queue.filter((_, index) => index !== currentIndex);

    setStats(updatedStats);
    setQueue(nextQueue);
    setCurrentIndex((previous) => Math.min(previous, Math.max(nextQueue.length - 1, 0)));
    incrementCompleted();
    setMessage(`Recorded ${result} for ${currentCard.title}.`);
  }

  async function handleFavoriteToggle(): Promise<void> {
    if (!currentCard) {
      return;
    }

    const favorite = await reviewService.toggleFavorite(db, currentCard.itemType, currentCard.itemId, !currentCard.isFavorite);
    setQueue((previous) => previous.map((item, index) => index === currentIndex ? { ...item, isFavorite: favorite } : item));
    setMessage(favorite ? "Added to favorites." : "Removed from favorites.");

    if (favoritesOnly && !favorite) {
      await loadSession(selectedMode.id, true);
    }
  }

  return (
    <AppShell
      title="Review / Learning"
      subtitle="Phase 1I simple approved-library review with local queues, favorites mode, and review log persistence."
    >
      <section style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#fafaf9" }}>
        <h3 style={{ marginTop: 0 }}>Review Setup</h3>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <label>
            Mode
            <select value={selectedMode.id} onChange={(event) => setActiveMode(event.target.value)} style={{ width: "100%" }}>
              {reviewService.modes.map((mode) => (
                <option key={mode.id} value={mode.id}>{mode.label}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} />
            Favorites only
          </label>
        </div>
      </section>

      <section style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#fff" }}>
        <h3 style={{ marginTop: 0 }}>Simple Statistics</h3>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {formatCount("Queue", queue.length)}
          {formatCount("Completed today", completedToday)}
          {formatCount("Logged", stats.total)}
          {formatCount("Correct", stats.correct)}
          {formatCount("Incorrect", stats.incorrect)}
          {formatCount("Skipped", stats.skipped)}
          {formatCount("Needs review", stats.needsReview)}
        </div>
      </section>

      {!currentCard ? (
        <section style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>No Cards Available</h3>
          <p>{favoritesOnly ? "No favorite approved items are available for this mode yet." : "No approved items are available for this review mode yet."}</p>
        </section>
      ) : (
        <section style={{ padding: "0.9rem", border: "1px solid #e5e7eb", borderRadius: "0.9rem", background: "#fff" }}>
          <p style={{ marginTop: 0, color: "#4b5563" }}>Card {currentIndex + 1} of {queue.length}</p>
          <h3 style={{ marginBottom: "0.35rem" }}>{currentCard.title}</h3>
          <p style={{ marginTop: 0, color: "#4b5563" }}>{currentCard.subtitle ?? "No subtype / category"}</p>
          <p><strong>Prompt:</strong> {currentCard.prompt}</p>

          {showAnswer ? (
            <div style={{ marginTop: "0.75rem", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.65rem", background: "#f9fafb" }}>
              <strong>Answer / Study Notes</strong>
              <ul style={{ marginBottom: 0 }}>
                {currentCard.detailLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p style={{ margin: "0.5rem 0 0" }}><strong>Source section:</strong> {currentCard.sourceSection ?? "N/A"}</p>
              <p style={{ margin: "0.25rem 0 0" }}><strong>Source sentence:</strong> {currentCard.sourceSentence ?? "N/A"}</p>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
            <button onClick={() => setShowAnswer((value) => !value)}>{showAnswer ? "Hide Answer" : "Show Answer"}</button>
            <button onClick={() => void handleFavoriteToggle()}>{currentCard.isFavorite ? "Remove Favorite" : "Add Favorite"}</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.5rem", marginTop: "0.9rem" }}>
            <button onClick={() => void handleResult("correct")}>Correct</button>
            <button onClick={() => void handleResult("incorrect")}>Incorrect</button>
            <button onClick={() => void handleResult("skipped")}>Skipped</button>
            <button onClick={() => void handleResult("needs_review")}>Needs Review</button>
          </div>
        </section>
      )}

      {message ? <p style={{ marginTop: "1rem", color: "#166534" }}>{message}</p> : null}
      {error ? <p style={{ marginTop: "1rem", color: "#b91c1c" }}>{error}</p> : null}
    </AppShell>
  );
}
