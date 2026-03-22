import type { Database } from "sql.js";

import { persistDatabase } from "../../data/db/database";
import { getBlob } from "../../data/idb/storage";
import type { ImportBatchRecord, PendingImageLinkRecord, PendingImageRecord, PendingInboxItemRecord } from "../../data/repositories/interfaces";
import { SqliteImportBatchRepository } from "../../data/repositories/sqlite/importBatchRepository";
import { SqlitePendingImageRepository } from "../../data/repositories/sqlite/pendingImageRepository";
import { SqlitePendingInboxRepository } from "../../data/repositories/sqlite/pendingInboxRepository";

export interface PendingImageViewModel {
  image: PendingImageRecord;
  links: PendingImageLinkRecord[];
  previewUrl?: string;
}

interface StoredVariantsPayload {
  variants?: Array<{ variant: string; storageKey: string }>;
}

function resolvePreviewStorageKey(tempStoragePath?: string): string | undefined {
  if (!tempStoragePath) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(tempStoragePath) as StoredVariantsPayload;
    const standard = parsed.variants?.find((variant) => variant.variant === "standard");
    if (standard?.storageKey) {
      return standard.storageKey;
    }

    const thumbnail = parsed.variants?.find((variant) => variant.variant === "thumbnail");
    return thumbnail?.storageKey;
  } catch {
    return undefined;
  }
}

export class InboxService {
  async listBatches(db: Database): Promise<ImportBatchRecord[]> {
    return new SqliteImportBatchRepository(db).listAll();
  }

  async getBatch(db: Database, batchId: string): Promise<ImportBatchRecord | undefined> {
    return new SqliteImportBatchRepository(db).getById(batchId);
  }

  async listPendingItems(db: Database, batchId: string): Promise<PendingInboxItemRecord[]> {
    return new SqlitePendingInboxRepository(db).listByBatch(batchId);
  }

  async listPendingImages(db: Database, batchId: string): Promise<PendingImageViewModel[]> {
    const imageRepository = new SqlitePendingImageRepository(db);
    const images = imageRepository.listByBatch(batchId);
    const links = imageRepository.listLinksByBatch(batchId);

    const views: PendingImageViewModel[] = [];

    for (const image of images) {
      const linkedItems = links.filter((link) => link.pendingImageId === image.id);
      const previewStorageKey = resolvePreviewStorageKey(image.tempStoragePath);
      let previewUrl: string | undefined;

      if (previewStorageKey) {
        const blob = await getBlob(previewStorageKey);
        if (blob) {
          previewUrl = URL.createObjectURL(blob);
        }
      }

      views.push({ image, links: linkedItems, previewUrl });
    }

    return views;
  }

  async approve(db: Database, itemType: PendingInboxItemRecord["itemType"], id: string): Promise<void> {
    await new SqlitePendingInboxRepository(db).updateReviewStatus(itemType, id, "approved");
    await persistDatabase(db);
  }

  async reject(db: Database, itemType: PendingInboxItemRecord["itemType"], id: string): Promise<void> {
    await new SqlitePendingInboxRepository(db).updateReviewStatus(itemType, id, "rejected");
    await persistDatabase(db);
  }

  async defer(db: Database, itemType: PendingInboxItemRecord["itemType"], id: string): Promise<void> {
    await new SqlitePendingInboxRepository(db).updateReviewStatus(itemType, id, "deferred");
    await persistDatabase(db);
  }

  async updateReviewerNote(db: Database, itemType: PendingInboxItemRecord["itemType"], id: string, reviewerNote: string): Promise<void> {
    await new SqlitePendingInboxRepository(db).updateReviewerNote(itemType, id, reviewerNote);
    await persistDatabase(db);
  }

  async approveImage(db: Database, pendingImageId: string): Promise<void> {
    new SqlitePendingImageRepository(db).updateReviewStatus(pendingImageId, "approved");
    await persistDatabase(db);
  }

  async rejectImage(db: Database, pendingImageId: string): Promise<void> {
    new SqlitePendingImageRepository(db).updateReviewStatus(pendingImageId, "rejected");
    await persistDatabase(db);
  }

  async deferImage(db: Database, pendingImageId: string): Promise<void> {
    new SqlitePendingImageRepository(db).updateReviewStatus(pendingImageId, "deferred");
    await persistDatabase(db);
  }

  async updateImageReviewerNote(db: Database, pendingImageId: string, reviewerNote: string): Promise<void> {
    new SqlitePendingImageRepository(db).updateReviewerNote(pendingImageId, reviewerNote);
    await persistDatabase(db);
  }
}
