import type { Database } from "sql.js";

import { escapeSqlString, readFirstRow, readRows } from "./sqliteHelpers";
import {
  SqliteApprovedLibraryRepository,
  type CommitItemType,
  type LibraryDetailRecord
} from "./approvedLibraryRepository";

export type ReviewableItemType = Exclude<CommitItemType, "requirement" | "method">;
export type ReviewResult = "correct" | "incorrect" | "skipped" | "needs_review";

export interface ReviewQueueRecord {
  itemType: ReviewableItemType;
  itemId: string;
  title: string;
  subtitle?: string;
  prompt: string;
  detailLines: string[];
  sourceSentence?: string;
  sourceSection?: string;
  isFavorite: boolean;
}

export interface ReviewLogRecord {
  id: string;
  itemType: ReviewableItemType;
  itemId: string;
  reviewMode: string;
  reviewResult: ReviewResult;
  responseTimeMs?: number;
  reviewedAt: string;
}

export interface ReviewStatsRecord {
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  needsReview: number;
  totalAvailable: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}-${nowIso()}-${Math.random().toString(16).slice(2, 8)}`;
}

function asOptionalString(value: unknown): string | undefined {
  return value == null ? undefined : String(value);
}

function buildQueueItem(itemType: ReviewableItemType, row: Record<string, unknown>): ReviewQueueRecord {
  switch (itemType) {
    case "word":
      return {
        itemType,
        itemId: String(row.id),
        title: String(row.canonical_word),
        subtitle: asOptionalString(row.language_category),
        prompt: "What does this word mean or how is it used in engineering context?",
        detailLines: [
          `Meaning: ${asOptionalString(row.chinese_meaning) ?? "N/A"}`,
          `Definition: ${asOptionalString(row.english_definition) ?? "N/A"}`,
          `Lemma: ${asOptionalString(row.lemma) ?? "N/A"}`,
          `Category: ${asOptionalString(row.language_category) ?? "N/A"}`
        ],
        sourceSentence: asOptionalString(row.source_sentence),
        sourceSection: asOptionalString(row.source_section),
        isFavorite: Number(row.is_favorite ?? 0) === 1
      };
    case "phrase":
      return {
        itemType,
        itemId: String(row.id),
        title: String(row.canonical_phrase),
        subtitle: asOptionalString(row.function_type),
        prompt: "What does this phrase communicate and when would you use it?",
        detailLines: [
          `Meaning: ${asOptionalString(row.chinese_meaning) ?? "N/A"}`,
          `Function: ${asOptionalString(row.function_type) ?? "N/A"}`,
          `Scenario: ${asOptionalString(row.scenario_type) ?? "N/A"}`,
          `Explanation: ${asOptionalString(row.explanation) ?? "N/A"}`
        ],
        sourceSentence: asOptionalString(row.source_sentence),
        sourceSection: asOptionalString(row.source_section),
        isFavorite: Number(row.is_favorite ?? 0) === 1
      };
    case "sentence":
      return {
        itemType,
        itemId: String(row.id),
        title: String(row.canonical_sentence),
        subtitle: asOptionalString(row.sentence_type),
        prompt: "Identify the sentence function and scenario, then recall the reusable reporting pattern.",
        detailLines: [
          `Function: ${asOptionalString(row.function_type) ?? "N/A"}`,
          `Scenario: ${asOptionalString(row.scenario_type) ?? "N/A"}`,
          `Chinese (natural): ${asOptionalString(row.chinese_natural) ?? "N/A"}`,
          `Chinese (literal): ${asOptionalString(row.chinese_literal) ?? "N/A"}`
        ],
        sourceSentence: asOptionalString(row.source_sentence),
        sourceSection: asOptionalString(row.source_section),
        isFavorite: Number(row.is_favorite ?? 0) === 1
      };
    case "geo_material":
      return {
        itemType,
        itemId: String(row.id),
        title: String(row.canonical_name),
        subtitle: asOptionalString(row.geo_material_category),
        prompt: "How do you identify this material and what are its engineering implications?",
        detailLines: [
          `Category: ${asOptionalString(row.geo_material_category) ?? "N/A"}`,
          `Subtype: ${asOptionalString(row.geo_material_subtype) ?? "N/A"}`,
          `Identification: ${asOptionalString(row.identification_method) ?? "N/A"}`,
          `Risks: ${asOptionalString(row.common_risks) ?? "N/A"}`,
          `Treatment: ${asOptionalString(row.common_treatments) ?? "N/A"}`
        ],
        sourceSentence: asOptionalString(row.source_sentence),
        sourceSection: asOptionalString(row.source_section),
        isFavorite: Number(row.is_favorite ?? 0) === 1
      };
    case "geo_feature":
      return {
        itemType,
        itemId: String(row.id),
        title: String(row.canonical_name),
        subtitle: asOptionalString(row.geo_feature_category),
        prompt: "What does this feature indicate, what causes it, and how should it be treated or reported?",
        detailLines: [
          `Category: ${asOptionalString(row.geo_feature_category) ?? "N/A"}`,
          `Subtype: ${asOptionalString(row.geo_feature_subtype) ?? "N/A"}`,
          `Identification: ${asOptionalString(row.identification_method) ?? "N/A"}`,
          `Causes: ${asOptionalString(row.common_causes) ?? "N/A"}`,
          `Mitigation: ${asOptionalString(row.treatment_or_mitigation) ?? "N/A"}`
        ],
        sourceSentence: asOptionalString(row.source_sentence),
        sourceSection: asOptionalString(row.source_section),
        isFavorite: Number(row.is_favorite ?? 0) === 1
      };
    case "strategy":
      return {
        itemType,
        itemId: String(row.id),
        title: String(row.canonical_name),
        subtitle: asOptionalString(row.strategy_category),
        prompt: "Recall the steps, method, and application conditions for this strategy.",
        detailLines: [
          `Category: ${asOptionalString(row.strategy_category) ?? "N/A"}`,
          `Description: ${asOptionalString(row.description) ?? "N/A"}`,
          `Steps: ${asOptionalString(row.steps_or_method) ?? "N/A"}`,
          `Conditions: ${asOptionalString(row.application_conditions) ?? "N/A"}`,
          `Limitations: ${asOptionalString(row.limitations) ?? "N/A"}`
        ],
        sourceSentence: undefined,
        sourceSection: undefined,
        isFavorite: Number(row.is_favorite ?? 0) === 1
      };
    default:
      // Fallback for other types
      return {
        itemType,
        itemId: String(row.id),
        title: String(row.canonical_name || row.canonical_word || row.canonical_phrase || row.canonical_sentence || "Untitled"),
        prompt: "Review this item.",
        detailLines: [],
        isFavorite: Number(row.is_favorite ?? 0) === 1
      };
  }
}

export class SqliteReviewRepository {
  constructor(private readonly db: Database) {}

  listQueue(itemType: ReviewableItemType, favoritesOnly: boolean): ReviewQueueRecord[] {
    const favoritesJoin = favoritesOnly
      ? "INNER JOIN favorites f ON f.item_type = '__ITEM_TYPE__' AND f.item_id = t.id"
      : "LEFT JOIN favorites f ON f.item_type = '__ITEM_TYPE__' AND f.item_id = t.id";

    const queryMap: Record<ReviewableItemType, string> = {
      word: `
        SELECT t.id, t.canonical_word, t.language_category, t.chinese_meaning, t.english_definition, t.lemma,
               s.source_sentence, s.source_section,
               CASE WHEN f.id IS NULL THEN 0 ELSE 1 END AS is_favorite
        FROM words t
        LEFT JOIN item_sources s ON s.item_type = 'word' AND s.item_id = t.id
        __FAVORITES_JOIN__
        WHERE t.is_archived = 0
        GROUP BY t.id
        ORDER BY t.updated_at DESC, t.canonical_word ASC
      `,
      phrase: `
        SELECT t.id, t.canonical_phrase, t.function_type, t.scenario_type, t.chinese_meaning, t.explanation,
               s.source_sentence, s.source_section,
               CASE WHEN f.id IS NULL THEN 0 ELSE 1 END AS is_favorite
        FROM phrases t
        LEFT JOIN item_sources s ON s.item_type = 'phrase' AND s.item_id = t.id
        __FAVORITES_JOIN__
        WHERE t.is_archived = 0
        GROUP BY t.id
        ORDER BY t.updated_at DESC, t.canonical_phrase ASC
      `,
      sentence: `
        SELECT t.id, t.canonical_sentence, t.sentence_type, t.function_type, t.scenario_type, t.chinese_literal, t.chinese_natural,
               s.source_sentence, s.source_section,
               CASE WHEN f.id IS NULL THEN 0 ELSE 1 END AS is_favorite
        FROM sentences t
        LEFT JOIN item_sources s ON s.item_type = 'sentence' AND s.item_id = t.id
        __FAVORITES_JOIN__
        WHERE t.is_archived = 0
        GROUP BY t.id
        ORDER BY t.updated_at DESC, t.canonical_sentence ASC
      `,
      geo_material: `
        SELECT t.id, t.canonical_name, t.geo_material_category, t.geo_material_subtype, t.identification_method, t.common_risks, t.common_treatments,
               s.source_sentence, s.source_section,
               CASE WHEN f.id IS NULL THEN 0 ELSE 1 END AS is_favorite
        FROM geo_materials t
        LEFT JOIN item_sources s ON s.item_type = 'geo_material' AND s.item_id = t.id
        __FAVORITES_JOIN__
        WHERE t.is_archived = 0
        GROUP BY t.id
        ORDER BY t.updated_at DESC, t.canonical_name ASC
      `,
      geo_feature: `
        SELECT t.id, t.canonical_name, t.geo_feature_category, t.geo_feature_subtype, t.identification_method, t.common_causes, t.treatment_or_mitigation,
               s.source_sentence, s.source_section,
               CASE WHEN f.id IS NULL THEN 0 ELSE 1 END AS is_favorite
        FROM geo_features t
        LEFT JOIN item_sources s ON s.item_type = 'geo_feature' AND s.item_id = t.id
        __FAVORITES_JOIN__
        WHERE t.is_archived = 0
        GROUP BY t.id
        ORDER BY t.updated_at DESC, t.canonical_name ASC
      `,
      strategy: `
        SELECT t.id, t.canonical_name, t.strategy_category, t.description, t.steps_or_method, t.application_conditions, t.limitations,
               CASE WHEN f.id IS NULL THEN 0 ELSE 1 END AS is_favorite
        FROM strategies t
        __FAVORITES_JOIN__
        WHERE t.is_archived = 0
        GROUP BY t.id
        ORDER BY t.updated_at DESC, t.canonical_name ASC
      `
    };

    const sql = queryMap[itemType]
      .replace(/__ITEM_TYPE__/g, escapeSqlString(itemType))
      .replace("__FAVORITES_JOIN__", favoritesJoin.replace(/__ITEM_TYPE__/g, escapeSqlString(itemType)));

    return readRows(this.db, sql).map((row) => buildQueueItem(itemType, row));
  }

  insertReviewLog(record: ReviewLogRecord): void {
    this.db.run(`
      INSERT INTO review_logs (id, item_type, item_id, review_mode, review_result, response_time_ms, reviewed_at)
      VALUES (
        '${escapeSqlString(record.id)}',
        '${escapeSqlString(record.itemType)}',
        '${escapeSqlString(record.itemId)}',
        '${escapeSqlString(record.reviewMode)}',
        '${escapeSqlString(record.reviewResult)}',
        ${record.responseTimeMs == null ? "NULL" : record.responseTimeMs},
        '${escapeSqlString(record.reviewedAt)}'
      )
    `);
  }

  createReviewLog(itemType: ReviewableItemType, itemId: string, reviewMode: string, reviewResult: ReviewResult, responseTimeMs?: number): void {
    this.insertReviewLog({
      id: createId("review-log"),
      itemType,
      itemId,
      reviewMode,
      reviewResult,
      responseTimeMs,
      reviewedAt: nowIso()
    });
  }

  getStats(reviewMode: string, itemType: ReviewableItemType): ReviewStatsRecord & { totalAvailable: number } {
    const escapedMode = escapeSqlString(reviewMode);
    const escapedType = escapeSqlString(itemType);
    
    // Get total items available for this type
    const totalAvailableRow = readFirstRow(this.db, `SELECT COUNT(*) as count FROM ${itemType}s WHERE is_archived = 0`);
    const totalAvailable = Number(totalAvailableRow?.count ?? 0);

    const sql = `
      SELECT review_result, COUNT(*) AS total_count 
      FROM (
        SELECT l.review_result
        FROM review_logs l
        WHERE l.id IN (
          SELECT MAX(id)
          FROM review_logs
          WHERE review_mode = '${escapedMode}' AND item_type = '${escapedType}'
          GROUP BY item_id
        )
      )
      GROUP BY review_result
    `;
    
    const rows = readRows(this.db, sql);

    const stats = {
      total: 0,
      correct: 0,
      incorrect: 0,
      skipped: 0,
      needsReview: 0,
      totalAvailable
    };

    for (const row of rows) {
      const result = String(row.review_result);
      const count = Number(row.total_count);
      stats.total += count;
      if (result === "correct") {
        stats.correct = count;
      } else if (result === "incorrect") {
        stats.incorrect = count;
      } else if (result === "skipped") {
        stats.skipped = count;
      } else if (result === "needs_review") {
        stats.needsReview = count;
      }
    }

    return stats;
  }

  isFavorite(itemType: ReviewableItemType, itemId: string): boolean {
    const row = readFirstRow(
      this.db,
      `SELECT id FROM favorites WHERE item_type = '${escapeSqlString(itemType)}' AND item_id = '${escapeSqlString(itemId)}'`
    );
    return Boolean(row?.id);
  }

  setFavorite(itemType: ReviewableItemType, itemId: string, favorite: boolean): void {
    const existing = readFirstRow(
      this.db,
      `SELECT id FROM favorites WHERE item_type = '${escapeSqlString(itemType)}' AND item_id = '${escapeSqlString(itemId)}'`
    );

    if (favorite && !existing?.id) {
      this.db.run(`
        INSERT INTO favorites (id, item_type, item_id, folder_name, created_at)
        VALUES ('${createId("favorite")}', '${escapeSqlString(itemType)}', '${escapeSqlString(itemId)}', 'review', '${nowIso()}')
      `);
      return;
    }

    if (!favorite && existing?.id) {
      this.db.run(`DELETE FROM favorites WHERE id = '${escapeSqlString(String(existing.id))}'`);
    }
  }

  getDetail(itemType: ReviewableItemType, id: string): LibraryDetailRecord | undefined {
    return new SqliteApprovedLibraryRepository(this.db).getDetail(itemType, id);
  }

  updateItem(itemType: ReviewableItemType, id: string, fields: Record<string, unknown>): void {
    new SqliteApprovedLibraryRepository(this.db).updateItem(itemType, id, fields);
  }
}
