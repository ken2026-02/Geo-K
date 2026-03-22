import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useDatabaseRuntime } from "../../data/db/DatabaseContext";
import type { ImportBatchRecord, PendingInboxItemRecord } from "../../data/repositories/interfaces";
import { AppShell } from "../../shared/ui/layout/AppShell";
import { ConfirmDialog } from "../../shared/ui/feedback/ConfirmDialog";
import { FeedbackBanner } from "../../shared/ui/feedback/FeedbackBanner";
import { ApprovedCommitService, type CommitBatchSummary } from "../../services/import/approvedCommitService";
import { InboxService, type PendingImageViewModel } from "../../services/review/inboxService";

type ItemTypeFilter = "all" | PendingInboxItemRecord["itemType"];
type ReviewStatusFilter = "all" | "unreviewed" | "approved" | "rejected" | "deferred";
type ConfidenceBandFilter = "all" | "high" | "medium" | "low" | "unknown";
type ConfirmAction = { kind: "approve_all"; label: string } | null;

const ITEM_TYPES: PendingInboxItemRecord["itemType"][] = ["word", "phrase", "sentence", "geo_material", "geo_feature", "strategy"];

const USER_BATCH_LIBRARY_TERMS = [
  "slick clay seam",
  "decomposed andesite",
  "active ravelling pocket",
  "wet open joint"
] as const;

const USER_BATCH_UNAPPROVED_TERMS = [
  "oxidized fracture infill",
  "residual volcanic soil",
  "blast damaged brow",
  "foliation daylighting plane",
  "short-interval re-inspection",
  "detailed face mapping"
] as const;

function toLabel(value: PendingInboxItemRecord["itemType"]): string {
  switch (value) {
    case "word":
      return "Words";
    case "phrase":
      return "Phrases";
    case "sentence":
      return "Sentences";
    case "geo_material":
      return "Geo Materials";
    case "geo_feature":
      return "Geo Features";
    case "strategy":
      return "Strategies";
  }
}

function imageMatchesItem(image: PendingImageViewModel, item: PendingInboxItemRecord): boolean {
  return image.links.some((link) => link.pendingItemId === item.id);
}

export function InboxBatchPage() {
  const { batchId = "" } = useParams();
  const { db } = useDatabaseRuntime();
  const [batch, setBatch] = useState<ImportBatchRecord>();
  const [items, setItems] = useState<PendingInboxItemRecord[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImageViewModel[]>([]);
  const [itemTypeFilter, setItemTypeFilter] = useState<ItemTypeFilter>("all");
  const [reviewStatusFilter, setReviewStatusFilter] = useState<ReviewStatusFilter>("all");
  const [confidenceBandFilter, setConfidenceBandFilter] = useState<ConfidenceBandFilter>("all");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [imageNoteDrafts, setImageNoteDrafts] = useState<Record<string, string>>({});
  const [commitSummary, setCommitSummary] = useState<CommitBatchSummary>();
  const [commitError, setCommitError] = useState<string>();
  const [showBatchGuide, setShowBatchGuide] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  async function refresh() {
    const inboxService = new InboxService();
    const loadedBatch = await inboxService.getBatch(db, batchId);
    const loadedItems = await inboxService.listPendingItems(db, batchId);
    const loadedImages = await inboxService.listPendingImages(db, batchId);

    setBatch(loadedBatch);
    setItems(loadedItems);
    setPendingImages(loadedImages);
    setNoteDrafts(Object.fromEntries(loadedItems.map((item) => [item.id, item.reviewerNote ?? ""])));
    setImageNoteDrafts(Object.fromEntries(loadedImages.map((image) => [image.image.id, image.image.reviewerNote ?? ""])));
  }

  function clearFeedback(): void {
    setMessage(undefined);
    setError(undefined);
  }

  useEffect(() => {
    void refresh();
  }, [batchId, db]);

  const [isProcessing, setIsProcessing] = useState(false);

  async function handleApprove(item: PendingInboxItemRecord) {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      await new InboxService().approve(db, item.itemType, item.id);
      setMessage(`Approved ${item.title}.`);
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to approve item.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleReject(item: PendingInboxItemRecord) {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      await new InboxService().reject(db, item.itemType, item.id);
      setMessage(`Rejected ${item.title}.`);
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reject item.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDefer(item: PendingInboxItemRecord) {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      await new InboxService().defer(db, item.itemType, item.id);
      setMessage(`Deferred ${item.title}.`);
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to defer item.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSaveNote(item: PendingInboxItemRecord) {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      await new InboxService().updateReviewerNote(db, item.itemType, item.id, noteDrafts[item.id] ?? "");
      setMessage(`Saved reviewer note for ${item.title}.`);
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save reviewer note.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCommitApproved() {
    if (isProcessing) return;
    setIsProcessing(true);
    setCommitError(undefined);
    setCommitSummary(undefined);
    clearFeedback();

    try {
      const summary = await new ApprovedCommitService().commitApprovedPendingBatch(db, batchId);
      setCommitSummary(summary);
      setMessage("Committed approved items to the library.");
      await refresh();
    } catch (error) {
      setCommitError(error instanceof Error ? error.message : "Commit failed.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleApproveImage(imageId: string) {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      await new InboxService().approveImage(db, imageId);
      setMessage("Approved image.");
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to approve image.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleRejectImage(imageId: string) {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      await new InboxService().rejectImage(db, imageId);
      setMessage("Rejected image.");
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to reject image.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeferImage(imageId: string) {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      await new InboxService().deferImage(db, imageId);
      setMessage("Deferred image.");
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to defer image.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSaveImageNote(imageId: string) {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      await new InboxService().updateImageReviewerNote(db, imageId, imageNoteDrafts[imageId] ?? "");
      setMessage("Saved image reviewer note.");
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save image reviewer note.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleApproveAll() {
    if (isProcessing) return;
    setIsProcessing(true);
    clearFeedback();
    try {
      await new InboxService().approveAll(db, batchId, itemTypeFilter);
      setMessage("Approved all matching pending items in this batch.");
      await refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to approve all items.");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConfirmAction(): Promise<void> {
    if (!confirmAction || isProcessing) {
      return;
    }

    setConfirmAction(null);
    await handleApproveAll();
  }

  const filteredItems = items.filter((item) => {
    if (itemTypeFilter !== "all" && item.itemType !== itemTypeFilter) {
      return false;
    }
    if (reviewStatusFilter !== "all" && item.reviewStatus !== reviewStatusFilter) {
      return false;
    }
    if (confidenceBandFilter !== "all" && (item.confidenceBand ?? "unknown") !== confidenceBandFilter) {
      return false;
    }
    return true;
  });

  const groupedItems = ITEM_TYPES.map((itemType) => ({
    itemType,
    title: toLabel(itemType),
    items: filteredItems.filter((item) => item.itemType === itemType)
  })).filter((group) => group.items.length > 0);

  return (
    <AppShell title="Pending Review" subtitle="Review staged items before approval." pageDescription={null}>
      <ConfirmDialog
        open={confirmAction !== null}
        title="Approve all visible pending items?"
        body={`This will approve all ${confirmAction?.label ?? "matching"} items in the current batch filter.`}
        confirmLabel="Approve all"
        tone="default"
        busy={isProcessing}
        onConfirm={() => void handleConfirmAction()}
        onCancel={() => setConfirmAction(null)}
      />
      <p><Link to="/inbox">Back to Inbox</Link></p>

      {message ? <div style={{ marginBottom: "1rem" }}><FeedbackBanner tone="success" message={message} /></div> : null}
      {error ? <div style={{ marginBottom: "1rem" }}><FeedbackBanner tone="error" message={error} /></div> : null}

      {batch ? (
        <section style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#fafaf9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <strong>{batch.batchName}</strong>
            <span style={{ 
              padding: "0.25rem 0.5rem", 
              borderRadius: "0.25rem", 
              fontSize: "0.875rem",
              background: batch.importStatus === "completed" ? "#dcfce7" : "#fef9c3",
              color: batch.importStatus === "completed" ? "#166534" : "#854d0e"
            }}>
              {batch.importStatus === "completed" ? "Completed" : "Review In Progress"}
            </span>
          </div>
          <p style={{ margin: "0.5rem 0 0" }}>Report ID: {batch.sourceReportId ?? "N/A"}</p>
          <p style={{ margin: "0.25rem 0 0" }}>Project: {batch.sourceReportProject ?? "N/A"}</p>
          <p style={{ margin: "0.25rem 0 0", color: "#64748b", fontSize: "0.92rem" }}>Pending {batch.pendingItems} | Approved {batch.approvedItems} | Rejected {batch.rejectedItems}</p>
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button 
              onClick={() => void handleCommitApproved()} 
              disabled={isProcessing || batch.importStatus === "completed"} 
              style={{ padding: "0.5rem 1rem" }}
            >
              Commit Approved to Library
            </button>
            <button 
              onClick={() => setConfirmAction({ kind: "approve_all", label: itemTypeFilter === "all" ? "visible" : toLabel(itemTypeFilter as PendingInboxItemRecord["itemType"]) })} 
              disabled={isProcessing || batch.importStatus === "completed"} 
              style={{ padding: "0.5rem 1rem", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "0.375rem" }}
            >
              Approve All {itemTypeFilter === "all" ? "" : toLabel(itemTypeFilter as any)}
            </button>
            <Link to="/library" style={{ alignSelf: "center", padding: "0.5rem 1rem", background: "#f3f4f6", borderRadius: "0.375rem", textDecoration: "none", color: "#111827" }}>Open Library</Link>
          </div>
          {batch.importStatus === "completed" && (
            <p style={{ marginTop: "0.5rem", color: "#166534", fontSize: "0.9rem" }}>
              This batch has been fully processed. You can still view the items below.
            </p>
          )}
          {commitSummary ? (
            <p style={{ marginTop: "0.5rem", color: "#166534" }}>
              Committed words={commitSummary.committed.words}, phrases={commitSummary.committed.phrases}, sentences={commitSummary.committed.sentences}, geo_materials={commitSummary.committed.geoMaterials}, geo_features={commitSummary.committed.geoFeatures}, strategies={commitSummary.committed.strategies}.
            </p>
          ) : null}
          {commitError ? <p style={{ marginTop: "0.5rem", color: "#b91c1c" }}>{commitError}</p> : null}
        </section>
      ) : null}

      <details style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#f8fafc" }} open={showBatchGuide} onToggle={(event) => setShowBatchGuide((event.currentTarget as HTMLDetailsElement).open)}>
        <summary style={{ cursor: "pointer", fontWeight: 700, color: "#334155" }}>Batch verification guide</summary>
        <p style={{ margin: "0.6rem 0 0", lineHeight: 1.45 }}>
          After commit, verify these terms in Library Search: {USER_BATCH_LIBRARY_TERMS.join(", ")}.
        </p>
        <p style={{ margin: "0.25rem 0 0", lineHeight: 1.45 }}>
          Rejected or deferred terms should stay out of Library: {USER_BATCH_UNAPPROVED_TERMS.join(", ")}.
        </p>
      </details>

      <section style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem" }}>
        <h3 style={{ marginTop: 0 }}>Filters</h3>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          <label>
            Item Type
            <select value={itemTypeFilter} onChange={(event) => setItemTypeFilter(event.target.value as ItemTypeFilter)} style={{ width: "100%" }}>
              <option value="all">All</option>
              {ITEM_TYPES.map((itemType) => (
                <option key={itemType} value={itemType}>{toLabel(itemType)}</option>
              ))}
            </select>
          </label>
          <label>
            Review Status
            <select value={reviewStatusFilter} onChange={(event) => setReviewStatusFilter(event.target.value as ReviewStatusFilter)} style={{ width: "100%" }}>
              <option value="all">All</option>
              <option value="unreviewed">Unreviewed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="deferred">Deferred</option>
            </select>
          </label>
          <label>
            Confidence Band
            <select value={confidenceBandFilter} onChange={(event) => setConfidenceBandFilter(event.target.value as ConfidenceBandFilter)} style={{ width: "100%" }}>
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
        </div>
        <p style={{ marginBottom: 0, color: "#4b5563" }}>Showing {filteredItems.length} of {items.length} pending items.</p>
      </section>

      {groupedItems.length === 0 ? <p>No pending items match the current filters.</p> : null}

      <div style={{ display: "grid", gap: "1rem" }}>
        {groupedItems.map((group) => (
          <section key={group.itemType}>
            <h3 style={{ marginBottom: "0.5rem" }}>{group.title} ({group.items.length})</h3>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {group.items.map((item) => {
                const itemImages = pendingImages.filter((image) => imageMatchesItem(image, item));

                return (
                  <article key={item.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem" }}>
                    <strong>{item.title}</strong>
                    <p style={{ margin: "0.25rem 0" }}>{item.itemType} | review: {item.reviewStatus} | confidence: {item.confidenceBand ?? "unknown"}</p>
                    <p style={{ margin: "0.25rem 0", color: "#4b5563" }}>Normalized: {item.normalizedValue}</p>

                    <div style={{ marginTop: "0.5rem", padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", background: "#f9fafb" }}>
                      <strong style={{ fontSize: "0.95rem" }}>Source Context</strong>
                      <p style={{ margin: "0.25rem 0 0" }}>Section: {item.sourceSection ?? "N/A"}</p>
                      <p style={{ margin: "0.25rem 0 0" }}>Sentence: {item.sourceSentence ?? "N/A"}</p>
                      <p style={{ margin: "0.25rem 0 0" }}>Report: {item.sourceReportId ?? batch?.sourceReportId ?? "N/A"}</p>
                    </div>

                    {itemImages.length > 0 ? (
                      <div style={{ marginTop: "0.5rem" }}>
                        <strong style={{ fontSize: "0.95rem" }}>Linked Images</strong>
                        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", marginTop: "0.35rem" }}>
                          {itemImages.map((image) => (
                            <div key={image.image.id} style={{ minWidth: "140px", border: "1px solid #e5e7eb", borderRadius: "0.5rem", padding: "0.4rem", background: "#fff" }}>
                              {image.previewUrl ? <img src={image.previewUrl} alt={image.image.caption ?? image.image.fileName} style={{ width: "100%", height: "90px", objectFit: "cover", borderRadius: "0.35rem" }} /> : <div style={{ height: "90px", display: "grid", placeItems: "center", color: "#6b7280" }}>No Preview</div>}
                              <p style={{ margin: "0.35rem 0 0", fontSize: "0.8rem" }}>{image.image.caption ?? image.image.fileName}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div style={{ marginTop: "0.75rem" }}>
                      <label style={{ display: "block", marginBottom: "0.25rem" }}>Reviewer Note</label>
                      <textarea
                        value={noteDrafts[item.id] ?? ""}
                        onChange={(event) => setNoteDrafts((previous) => ({ ...previous, [item.id]: event.target.value }))}
                        rows={3}
                        style={{ width: "100%" }}
                      />
                      <button style={{ marginTop: "0.4rem", padding: "0.5rem 1rem" }} onClick={() => void handleSaveNote(item)} disabled={isProcessing || batch?.importStatus === "completed"}>Save Note</button>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                      <button onClick={() => void handleApprove(item)} disabled={isProcessing || batch?.importStatus === "completed"} style={{ padding: "0.5rem 1rem" }}>Approve</button>
                      <button onClick={() => void handleReject(item)} disabled={isProcessing || batch?.importStatus === "completed"} style={{ padding: "0.5rem 1rem" }}>Reject</button>
                      <button onClick={() => void handleDefer(item)} disabled={isProcessing || batch?.importStatus === "completed"} style={{ padding: "0.5rem 1rem" }}>Defer</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section style={{ marginTop: "1rem" }}>
        <h3>Pending Images ({pendingImages.length})</h3>
        {pendingImages.length === 0 ? <p>No pending images in this batch.</p> : null}
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {pendingImages.map((imageView) => (
            <article key={imageView.image.id} style={{ border: "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", background: "#fff" }}>
              <strong>{imageView.image.fileName}</strong>
              <p style={{ margin: "0.25rem 0" }}>status: {imageView.image.processingStatus} | review: {imageView.image.reviewStatus}</p>
              {imageView.previewUrl ? <img src={imageView.previewUrl} alt={imageView.image.caption ?? imageView.image.fileName} style={{ width: "100%", maxWidth: "320px", borderRadius: "0.5rem" }} /> : <p style={{ color: "#6b7280" }}>No preview available.</p>}
              <p style={{ margin: "0.35rem 0 0" }}>caption: {imageView.image.caption ?? "N/A"}</p>
              <p style={{ margin: "0.25rem 0 0" }}>description: {imageView.image.description ?? "N/A"}</p>
              <p style={{ margin: "0.25rem 0 0" }}>linked items: {imageView.links.map((link) => `${link.pendingItemType}:${link.pendingItemId}`).join(", ") || "none"}</p>

              <div style={{ marginTop: "0.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.25rem" }}>Image Reviewer Note</label>
                <textarea
                  value={imageNoteDrafts[imageView.image.id] ?? ""}
                  onChange={(event) => setImageNoteDrafts((previous) => ({ ...previous, [imageView.image.id]: event.target.value }))}
                  rows={2}
                  style={{ width: "100%" }}
                />
                <button style={{ marginTop: "0.35rem", padding: "0.5rem 1rem" }} onClick={() => void handleSaveImageNote(imageView.image.id)} disabled={isProcessing || batch?.importStatus === "completed"}>Save Image Note</button>
              </div>

              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button onClick={() => void handleApproveImage(imageView.image.id)} disabled={isProcessing || batch?.importStatus === "completed"} style={{ padding: "0.5rem 1rem" }}>Approve Image</button>
                <button onClick={() => void handleRejectImage(imageView.image.id)} disabled={isProcessing || batch?.importStatus === "completed"} style={{ padding: "0.5rem 1rem" }}>Reject Image</button>
                <button onClick={() => void handleDeferImage(imageView.image.id)} disabled={isProcessing || batch?.importStatus === "completed"} style={{ padding: "0.5rem 1rem" }}>Defer Image</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
