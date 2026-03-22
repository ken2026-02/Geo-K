import type { Database } from "sql.js";

import type { PendingInboxItemRecord, PendingInboxRepository } from "../interfaces";
import { escapeSqlString, readRows } from "./sqliteHelpers";

const PENDING_UNION_SQL = `
SELECT id, 'word' AS item_type, batch_id, source_report_id, raw_word AS title, normalized_word AS normalized_value, review_status, duplicate_status, confidence_score, confidence_band, reviewer_note, source_section, source_sentence FROM pending_words
UNION ALL
SELECT id, 'phrase' AS item_type, batch_id, source_report_id, raw_phrase AS title, normalized_phrase AS normalized_value, review_status, duplicate_status, confidence_score, confidence_band, reviewer_note, source_section, source_sentence FROM pending_phrases
UNION ALL
SELECT id, 'sentence' AS item_type, batch_id, source_report_id, raw_sentence AS title, normalized_sentence AS normalized_value, review_status, duplicate_status, confidence_score, confidence_band, reviewer_note, source_section, source_sentence FROM pending_sentences
UNION ALL
SELECT id, 'geo_material' AS item_type, batch_id, source_report_id, raw_name AS title, normalized_name AS normalized_value, review_status, duplicate_status, confidence_score, confidence_band, reviewer_note, source_section, source_sentence FROM pending_geo_materials
UNION ALL
SELECT id, 'geo_feature' AS item_type, batch_id, source_report_id, raw_name AS title, normalized_name AS normalized_value, review_status, duplicate_status, confidence_score, confidence_band, reviewer_note, source_section, source_sentence FROM pending_geo_features
UNION ALL
SELECT id, 'strategy' AS item_type, batch_id, source_report_id, raw_name AS title, normalized_name AS normalized_value, review_status, duplicate_status, confidence_score, confidence_band, reviewer_note, NULL AS source_section, NULL AS source_sentence FROM pending_strategies
`;

export class SqlitePendingInboxRepository implements PendingInboxRepository {
  constructor(private readonly db: Database) {}

  async listByBatch(batchId: string): Promise<PendingInboxItemRecord[]> {
    return readRows(this.db, `SELECT * FROM (${PENDING_UNION_SQL}) WHERE batch_id = '${escapeSqlString(batchId)}' ORDER BY item_type ASC, title ASC`).map((row) => this.map(row));
  }

  async updateReviewStatus(itemType: PendingInboxItemRecord["itemType"], id: string, reviewStatus: string): Promise<void> {
    const tableName = this.resolveTableName(itemType);
    this.db.run(`UPDATE ${tableName} SET review_status = '${escapeSqlString(reviewStatus)}' WHERE id = '${escapeSqlString(id)}'`);
  }

  async updateReviewerNote(itemType: PendingInboxItemRecord["itemType"], id: string, reviewerNote: string): Promise<void> {
    const tableName = this.resolveTableName(itemType);
    this.db.run(`UPDATE ${tableName} SET reviewer_note = '${escapeSqlString(reviewerNote)}' WHERE id = '${escapeSqlString(id)}'`);
  }

  private resolveTableName(itemType: PendingInboxItemRecord["itemType"]): string {
    switch (itemType) {
      case "word":
        return "pending_words";
      case "phrase":
        return "pending_phrases";
      case "sentence":
        return "pending_sentences";
      case "geo_material":
        return "pending_geo_materials";
      case "geo_feature":
        return "pending_geo_features";
      case "strategy":
        return "pending_strategies";
    }
  }

  private map(row: Record<string, unknown>): PendingInboxItemRecord {
    return {
      id: String(row.id),
      itemType: row.item_type as PendingInboxItemRecord["itemType"],
      batchId: String(row.batch_id),
      sourceReportId: row.source_report_id == null ? undefined : String(row.source_report_id),
      title: String(row.title),
      normalizedValue: String(row.normalized_value),
      reviewStatus: String(row.review_status),
      duplicateStatus: String(row.duplicate_status),
      confidenceScore: row.confidence_score == null ? undefined : Number(row.confidence_score),
      confidenceBand: row.confidence_band == null ? undefined : String(row.confidence_band),
      reviewerNote: row.reviewer_note == null ? undefined : String(row.reviewer_note),
      sourceSection: row.source_section == null ? undefined : String(row.source_section),
      sourceSentence: row.source_sentence == null ? undefined : String(row.source_sentence)
    };
  }
}
