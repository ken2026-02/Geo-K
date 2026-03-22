import type { Database } from "sql.js";

import { persistDatabase } from "../../data/db/database";
import {
  SqliteReviewRepository,
  type ReviewQueueRecord,
  type ReviewResult,
  type ReviewStatsRecord,
  type ReviewableItemType
} from "../../data/repositories/sqlite/reviewRepository";

export interface ReviewModeOption {
  id: string;
  label: string;
  itemType: ReviewableItemType;
}

export interface ReviewSessionData {
  mode: ReviewModeOption;
  favoritesOnly: boolean;
  queue: ReviewQueueRecord[];
  stats: ReviewStatsRecord;
}

export class ReviewWorkflowService {
  readonly modes: ReviewModeOption[] = [
    { id: "word-review", label: "Word Review", itemType: "word" },
    { id: "phrase-review", label: "Phrase Review", itemType: "phrase" },
    { id: "sentence-review", label: "Sentence Review", itemType: "sentence" },
    { id: "geo-material-review", label: "Geo Material Review", itemType: "geo_material" },
    { id: "geo-feature-review", label: "Geo Feature Review", itemType: "geo_feature" }
  ];

  getMode(modeId: string): ReviewModeOption {
    return this.modes.find((mode) => mode.id === modeId) ?? this.modes[0];
  }

  loadSession(db: Database, modeId: string, favoritesOnly: boolean): ReviewSessionData {
    const mode = this.getMode(modeId);
    const repository = new SqliteReviewRepository(db);
    return {
      mode,
      favoritesOnly,
      queue: repository.listQueue(mode.itemType, favoritesOnly),
      stats: repository.getStats(mode.id, mode.itemType)
    };
  }

  async recordResult(
    db: Database,
    modeId: string,
    itemType: ReviewableItemType,
    itemId: string,
    result: ReviewResult,
    responseTimeMs?: number
  ): Promise<ReviewStatsRecord & { totalAvailable: number }> {
    const repository = new SqliteReviewRepository(db);
    repository.createReviewLog(itemType, itemId, modeId, result, responseTimeMs);
    await persistDatabase(db);
    return repository.getStats(modeId, itemType);
  }

  async toggleFavorite(db: Database, itemType: ReviewableItemType, itemId: string, favorite: boolean): Promise<boolean> {
    const repository = new SqliteReviewRepository(db);
    repository.setFavorite(itemType, itemId, favorite);
    await persistDatabase(db);
    return repository.isFavorite(itemType, itemId);
  }

  async getItemDetail(db: Database, itemType: ReviewableItemType, itemId: string) {
    const repository = new SqliteReviewRepository(db);
    return repository.getDetail(itemType, itemId);
  }

  async updateItem(db: Database, itemType: ReviewableItemType, itemId: string, fields: Record<string, unknown>) {
    const repository = new SqliteReviewRepository(db);
    repository.updateItem(itemType, itemId, fields);
    await persistDatabase(db);
  }
}

export type { ReviewResult, ReviewQueueRecord, ReviewStatsRecord, ReviewableItemType } from "../../data/repositories/sqlite/reviewRepository";

