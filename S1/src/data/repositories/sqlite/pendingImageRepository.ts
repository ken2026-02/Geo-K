import type { Database } from "sql.js";

import type { PendingImageLinkRecord, PendingImageRecord } from "../interfaces";
import { escapeSqlString, readRows } from "./sqliteHelpers";

export class SqlitePendingImageRepository {
  constructor(private readonly db: Database) {}

  listByBatch(batchId: string): PendingImageRecord[] {
    return readRows(this.db, `SELECT * FROM pending_images WHERE batch_id = '${escapeSqlString(batchId)}' ORDER BY created_at DESC`).map((row) => ({
      id: String(row.id),
      batchId: String(row.batch_id),
      fileName: String(row.file_name),
      caption: row.caption == null ? undefined : String(row.caption),
      description: row.description == null ? undefined : String(row.description),
      processingStatus: String(row.processing_status),
      reviewStatus: String(row.review_status),
      reviewerNote: row.reviewer_note == null ? undefined : String(row.reviewer_note),
      sourceType: row.source_type == null ? undefined : String(row.source_type),
      tempStoragePath: row.temp_storage_path == null ? undefined : String(row.temp_storage_path),
      hash: row.hash == null ? undefined : String(row.hash)
    }));
  }

  listLinksByBatch(batchId: string): PendingImageLinkRecord[] {
    return readRows(
      this.db,
      `
      SELECT l.pending_item_type, l.pending_item_id, l.pending_image_id, l.link_role
      FROM pending_item_image_links l
      INNER JOIN pending_images i ON i.id = l.pending_image_id
      WHERE i.batch_id = '${escapeSqlString(batchId)}'
      `
    ).map((row) => ({
      pendingItemType: String(row.pending_item_type),
      pendingItemId: String(row.pending_item_id),
      pendingImageId: String(row.pending_image_id),
      linkRole: row.link_role == null ? undefined : String(row.link_role)
    }));
  }

  updateReviewStatus(pendingImageId: string, reviewStatus: string): void {
    this.db.run(`UPDATE pending_images SET review_status = '${escapeSqlString(reviewStatus)}' WHERE id = '${escapeSqlString(pendingImageId)}'`);
  }

  updateReviewerNote(pendingImageId: string, reviewerNote: string): void {
    this.db.run(`UPDATE pending_images SET reviewer_note = '${escapeSqlString(reviewerNote)}' WHERE id = '${escapeSqlString(pendingImageId)}'`);
  }
}
