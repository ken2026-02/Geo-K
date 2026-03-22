import { getValue, setValue } from "../../idb/storage";
import type { LearningItemRecord } from "../interfaces";
import { DEFAULT_LEARNING_COLLECTION_ID } from "./learningCollectionRepository";

const LEARNING_ITEMS_KEY = "learning:items:v2";
const LEGACY_LEARNING_ITEMS_KEY = "learning:items:v1";

function sortByUpdatedDescending(items: LearningItemRecord[]): LearningItemRecord[] {
  return [...items].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

export class LocalLearningItemRepository {
  private async loadItems(): Promise<LearningItemRecord[]> {
    const stored = await getValue<LearningItemRecord[]>(LEARNING_ITEMS_KEY);
    if (stored && stored.length > 0) {
      const normalized = stored.map((item) => ({
        ...item,
        collectionId: item.collectionId || DEFAULT_LEARNING_COLLECTION_ID
      }));

      if (normalized.some((item, index) => item.collectionId !== stored[index]?.collectionId)) {
        await setValue(LEARNING_ITEMS_KEY, normalized);
      }

      return normalized;
    }

    const legacy = await getValue<Omit<LearningItemRecord, "collectionId">[]>(LEGACY_LEARNING_ITEMS_KEY);
    if (!legacy || legacy.length === 0) {
      return [];
    }

    const migrated: LearningItemRecord[] = legacy.map((item) => ({
      ...item,
      collectionId: DEFAULT_LEARNING_COLLECTION_ID
    }));
    await setValue(LEARNING_ITEMS_KEY, migrated);
    return migrated;
  }

  async listAll(): Promise<LearningItemRecord[]> {
    const items = await this.loadItems();
    return sortByUpdatedDescending(items);
  }

  async getById(id: string): Promise<LearningItemRecord | undefined> {
    const all = await this.listAll();
    return all.find((item) => item.id === id);
  }

  async upsertMany(records: LearningItemRecord[]): Promise<{ inserted: number; updated: number }> {
    const existing = await this.listAll();
    const map = new Map(existing.map((item) => [item.id, item]));

    let inserted = 0;
    let updated = 0;

    for (const record of records) {
      if (map.has(record.id)) {
        updated += 1;
      } else {
        inserted += 1;
      }
      map.set(record.id, record);
    }

    await setValue(LEARNING_ITEMS_KEY, Array.from(map.values()));
    return { inserted, updated };
  }

  async insert(record: LearningItemRecord): Promise<void> {
    const existing = await this.listAll();
    await setValue(LEARNING_ITEMS_KEY, [record, ...existing.filter((entry) => entry.id !== record.id)]);
  }

  async update(record: LearningItemRecord): Promise<void> {
    const existing = await this.listAll();
    await setValue(
      LEARNING_ITEMS_KEY,
      existing.map((entry) => (entry.id === record.id ? record : entry))
    );
  }

  async delete(id: string): Promise<void> {
    await this.deleteMany([id]);
  }

  async deleteMany(ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const idSet = new Set(ids);
    const existing = await this.listAll();
    const next = existing.filter((entry) => !idSet.has(entry.id));
    const deletedCount = existing.length - next.length;

    if (deletedCount === 0) {
      return 0;
    }

    await setValue(LEARNING_ITEMS_KEY, next);
    return deletedCount;
  }
}
