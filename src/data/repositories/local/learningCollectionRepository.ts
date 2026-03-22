import { getValue, setValue } from "../../idb/storage";
import type {
  LearningCollectionRecord,
  LearningCollectionRepository,
  LearningCollectionSourceType
} from "../interfaces";

const LEARNING_COLLECTIONS_KEY = "learning:collections:v1";
export const DEFAULT_LEARNING_COLLECTION_ID = "collection-general";

function nowIso(): string {
  return new Date().toISOString();
}

export function createDefaultLearningCollection(): LearningCollectionRecord {
  const timestamp = nowIso();
  return {
    id: DEFAULT_LEARNING_COLLECTION_ID,
    name: "General Learning",
    sourceType: "personal",
    description: "Legacy or uncategorized learning items.",
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function sortCollections(records: LearningCollectionRecord[]): LearningCollectionRecord[] {
  return [...records].sort((left, right) => left.name.localeCompare(right.name));
}

function normalizeCollection(record: LearningCollectionRecord): LearningCollectionRecord {
  return {
    ...record,
    sourceType: (record.sourceType || "personal") as LearningCollectionSourceType
  };
}

export class LocalLearningCollectionRepository implements LearningCollectionRepository {
  private async loadCollections(): Promise<LearningCollectionRecord[]> {
    const stored = (await getValue<LearningCollectionRecord[]>(LEARNING_COLLECTIONS_KEY)) ?? [];
    const normalized = stored.map(normalizeCollection);
    const hasDefault = normalized.some((record) => record.id === DEFAULT_LEARNING_COLLECTION_ID);
    const next = hasDefault ? normalized : [createDefaultLearningCollection(), ...normalized];

    if (stored.length !== next.length) {
      await setValue(LEARNING_COLLECTIONS_KEY, next);
    }

    return sortCollections(next);
  }

  async listAll(): Promise<LearningCollectionRecord[]> {
    return this.loadCollections();
  }

  async getById(id: string): Promise<LearningCollectionRecord | undefined> {
    const all = await this.loadCollections();
    return all.find((record) => record.id === id);
  }

  async insert(record: LearningCollectionRecord): Promise<void> {
    const existing = await this.loadCollections();
    await setValue(LEARNING_COLLECTIONS_KEY, sortCollections([record, ...existing.filter((entry) => entry.id !== record.id)]));
  }

  async update(record: LearningCollectionRecord): Promise<void> {
    const existing = await this.loadCollections();
    await setValue(
      LEARNING_COLLECTIONS_KEY,
      sortCollections(existing.map((entry) => (entry.id === record.id ? record : entry)))
    );
  }

  async delete(id: string): Promise<void> {
    if (id === DEFAULT_LEARNING_COLLECTION_ID) {
      return;
    }

    const existing = await this.loadCollections();
    await setValue(
      LEARNING_COLLECTIONS_KEY,
      sortCollections(existing.filter((entry) => entry.id !== id))
    );
  }
}
