import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useDatabaseRuntime } from "../../data/db/DatabaseContext";
import type { ImportBatchRecord, PendingInboxItemRecord } from "../../data/repositories/interfaces";
import { AppShell } from "../../shared/ui/layout/AppShell";
import { ApprovedCommitService, type CommitBatchSummary } from "../../services/import/approvedCommitService";
import { InboxService, type PendingImageViewModel } from "../../services/review/inboxService";

type ItemTypeFilter = "all" | PendingInboxItemRecord["itemType"];
type ReviewStatusFilter = "all" | "unreviewed" | "approved" | "rejected" | "deferred";
type ConfidenceBandFilter = "all" | "high" | "medium" | "low" | "unknown";

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

  useEffect(() => {
    void refresh();
  }, [batchId, db]);

  async function handleApprove(item: PendingInboxItemRecord) {
    await new InboxService().approve(db, item.itemType, item.id);
    await refresh();
  }

  async function handleReject(item: PendingInboxItemRecord) {
    await new InboxService().reject(db, item.itemType, item.id);
    await refresh();
  }

  async function handleDefer(item: PendingInboxItemRecord) {
    await new InboxService().defer(db, item.itemType, item.id);
    await refresh();
  }

  async function handleSaveNote(item: PendingInboxItemRecord) {
    await new InboxService().updateReviewerNote(db, item.itemType, item.id, noteDrafts[item.id] ?? "");
    await refresh();
  }

  async function handleCommitApproved() {
    setCommitError(undefined);
    setCommitSummary(undefined);

    try {
      const summary = await new ApprovedCommitService().commitApprovedPendingBatch(db, batchId);
      setCommitSummary(summary);
      await refresh();
    } catch (error) {
      setCommitError(error instanceof Error ? error.message : "Commit failed.");
    }
  }

  async function handleApproveImage(imageId: string) {
    await new InboxService().approveImage(db, imageId);
    await refresh();
  }

  async function handleRejectImage(imageId: string) {
    await new InboxService().rejectImage(db, imageId);
    await refresh();
  }

  async function handleDeferImage(imageId: string) {
    await new InboxService().deferImage(db, imageId);
    await refresh();
  }

  async function handleSaveImageNote(imageId: string) {
    await new InboxService().updateImageReviewerNote(db, imageId, imageNoteDrafts[imageId] ?? "");
    await refresh();
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
    <AppShell title="Pending Items" subtitle="Phase 1G pending review with image preview and image review actions.">
      <p><Link to="/">Back to batches</Link></p>

      {batch ? (
        <section style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#fafaf9" }}>
          <strong>{batch.batchName}</strong>
          <p style={{ margin: "0.5rem 0 0" }}>Report ID: {batch.sourceReportId ?? "N/A"}</p>
          <p style={{ margin: "0.25rem 0 0" }}>Project: {batch.sourceReportProject ?? "N/A"}</p>
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button onClick={() => void handleCommitApproved()}>Commit Approved Items to Library</button>
            <Link to="/library" style={{ alignSelf: "center" }}>Open Library</Link>
          </div>
          {commitSummary ? (
            <p style={{ marginTop: "0.5rem", color: "#166534" }}>
              Committed words={commitSummary.committed.words}, phrases={commitSummary.committed.phrases}, sentences={commitSummary.committed.sentences}, geo_materials={commitSummary.committed.geoMaterials}, geo_features={commitSummary.committed.geoFeatures}, strategies={commitSummary.committed.strategies}.
            </p>
          ) : null}
          {commitError ? <p style={{ marginTop: "0.5rem", color: "#b91c1c" }}>{commitError}</p> : null}
        </section>
      ) : null}

      <section style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.75rem", background: "#f8fafc" }}>
        <h3 style={{ marginTop: 0 }}>Batch Verification Guide</h3>
        <p style={{ margin: "0.25rem 0" }}>
          After commit, verify these terms in Library Search: {USER_BATCH_LIBRARY_TERMS.join(", ")}.
        </p>
        <p style={{ margin: "0.25rem 0" }}>
          Terms that are rejected or deferred should remain out of Library: {USER_BATCH_UNAPPROVED_TERMS.join(", ")}.
        </p>
        <p style={{ margin: "0.25rem 0" }}>
          Strategies are verified from related geo feature detail pages because strategies are not a standalone Library section.
        </p>
      </section>

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
                      <button style={{ marginTop: "0.4rem" }} onClick={() => void handleSaveNote(item)}>Save Note</button>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                      <button onClick={() => void handleApprove(item)}>Approve</button>
                      <button onClick={() => void handleReject(item)}>Reject</button>
                      <button onClick={() => void handleDefer(item)}>Defer</button>
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
              {imageView.previewUrl ? <img src={imageView.previewUrl} alt={imageView.image.caption ?? imageView.image.fileName} style={{ width: "180px", maxWidth: "100%", borderRadius: "0.5rem" }} /> : <p style={{ color: "#6b7280" }}>No preview available.</p>}
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
                <button style={{ marginTop: "0.35rem" }} onClick={() => void handleSaveImageNote(imageView.image.id)}>Save Image Note</button>
              </div>

              <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button onClick={() => void handleApproveImage(imageView.image.id)}>Approve Image</button>
                <button onClick={() => void handleRejectImage(imageView.image.id)}>Reject Image</button>
                <button onClick={() => void handleDeferImage(imageView.image.id)}>Defer Image</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
