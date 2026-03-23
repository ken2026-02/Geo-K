import type {
  LearningCollectionRecord,
  LearningCollectionSourceType,
  LearningItemRecord,
  LearningItemStatus,
  LearningItemType
} from "../../data/repositories/interfaces";
import {
  createDefaultLearningCollection,
  DEFAULT_LEARNING_COLLECTION_ID,
  LocalLearningCollectionRepository
} from "../../data/repositories/local/learningCollectionRepository";
import { LocalLearningItemRepository } from "../../data/repositories/local/learningItemRepository";
import {
  getLearningStatus,
  learningItemStatuses,
  mergeLearningTags,
  normalizeLearningDomain,
  normalizeLearningStatus,
  normalizeLearningTags,
  suggestedLearningDomains
} from "../../features/learning/classification";
import { knowledgePackSchema } from "../../features/import/types";
import { learningPackV1Schema, learningItemTypes, type LearningPackV1 } from "../../features/learning/types";
import { languageCategories, strategyCategories } from "../../shared/classification";

export interface LearningValidationIssue {
  code: string;
  message: string;
}

export interface LearningPackValidationResult {
  state: "valid" | "invalid";
  errors: LearningValidationIssue[];
  warnings: LearningValidationIssue[];
}

export interface LearningImportOptions {
  collectionId?: string;
  defaultDomain?: string;
  defaultTags?: string[];
}

export interface LearningCollectionCreateInput {
  name: string;
  sourceType?: LearningCollectionSourceType;
  authority?: string;
  documentNumber?: string;
  edition?: string;
  jurisdiction?: string;
  description?: string;
}

export interface LearningCollectionUpdateInput {
  id: string;
  name: string;
  sourceType?: LearningCollectionSourceType;
  authority?: string;
  documentNumber?: string;
  edition?: string;
  jurisdiction?: string;
  description?: string;
}

export interface LearningCollectionDeleteOptions {
  destinationCollectionId?: string;
  deleteItems?: boolean;
}

export interface LearningImportResult {
  packId: string;
  imported: number;
  inserted: number;
  updated: number;
  warnings: LearningValidationIssue[];
}

export interface LearningExportResult {
  fileName: string;
  json: string;
  itemCount: number;
}

export interface LearningItemUpdateInput {
  id: string;
  collectionId?: string;
  type: LearningItemType;
  content: string;
  meaning?: string;
  example?: string;
  note?: string;
  domain?: string;
  status?: LearningItemStatus;
  tags?: string[];
  sourceReport?: string;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeText(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeUniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0)));
}

function normalizeSourceReport(sourceReport: unknown): string | undefined {
  if (!sourceReport || typeof sourceReport !== "object") {
    return undefined;
  }

  const asRecord = sourceReport as Record<string, unknown>;
  const reportId = normalizeText(typeof asRecord.report_id === "string" ? asRecord.report_id : undefined);
  if (reportId) {
    return reportId;
  }

  const title = normalizeText(typeof asRecord.title === "string" ? asRecord.title : undefined);
  if (title) {
    return title;
  }

  return normalizeText(JSON.stringify(sourceReport));
}

function truncateText(value: string, max = 160): string {
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
}

function normalizeSourceSentence(item: LearningItemRecord): string {
  const preferred = normalizeText(item.example) ?? normalizeText(item.note) ?? item.content;
  return truncateText(preferred, 180);
}

function normalizeSourceSection(item: LearningItemRecord): string {
  return normalizeText(item.sourceReport) ?? "Learning Export";
}

function toLanguageCategory(domain?: string): (typeof languageCategories)[number] | undefined {
  if (!domain) {
    return undefined;
  }
  return (languageCategories as readonly string[]).includes(domain) ? domain as (typeof languageCategories)[number] : undefined;
}

function toStrategyCategory(domain?: string): (typeof strategyCategories)[number] {
  if (domain && (strategyCategories as readonly string[]).includes(domain)) {
    return domain as (typeof strategyCategories)[number];
  }
  return "unknown_strategy";
}

function extractItemDomain(item: LearningPackV1["items"][number]): string | undefined {
  const asRecord = item as Record<string, unknown>;
  return normalizeLearningDomain(typeof asRecord.domain === "string" ? asRecord.domain : undefined);
}

function extractItemStatus(item: LearningPackV1["items"][number]): LearningItemStatus | undefined {
  const asRecord = item as Record<string, unknown>;
  return normalizeLearningStatus(typeof asRecord.status === "string" ? asRecord.status : undefined);
}

function removeLearningTags(currentTags: string[] | undefined, tagsToRemove: string[]): string[] | undefined {
  if (!currentTags || currentTags.length === 0 || tagsToRemove.length === 0) {
    return normalizeLearningTags(currentTags);
  }

  const removeSet = new Set(tagsToRemove.map((tag) => tag.toLowerCase()));
  return normalizeLearningTags(currentTags.filter((tag) => !removeSet.has(tag.toLowerCase())));
}

function buildOptionalWarnings(pack: LearningPackV1): LearningValidationIssue[] {
  const optionalFields: Array<keyof LearningPackV1["items"][number]> = ["meaning", "example", "note", "tags"];
  const warnings: LearningValidationIssue[] = [];

  for (const field of optionalFields) {
    const missingCount = pack.items.filter((item) => item[field] === undefined).length;
    if (missingCount > 0) {
      warnings.push({
        code: "learning_optional_missing",
        message: `${missingCount} item(s) missing optional field '${field}'.`
      });
    }
  }

  return warnings;
}

export class LearningModuleService {
  private readonly repository: LocalLearningItemRepository;
  private readonly collectionRepository: LocalLearningCollectionRepository;

  constructor(repository?: LocalLearningItemRepository, collectionRepository?: LocalLearningCollectionRepository) {
    this.repository = repository ?? new LocalLearningItemRepository();
    this.collectionRepository = collectionRepository ?? new LocalLearningCollectionRepository();
  }

  validatePack(rawJson: string): LearningPackValidationResult {
    try {
      const parsed = JSON.parse(rawJson) as unknown;
      const result = learningPackV1Schema.safeParse(parsed);

      if (!result.success) {
        return {
          state: "invalid",
          errors: result.error.issues.map((issue) => ({ code: issue.code, message: issue.message })),
          warnings: []
        };
      }

      return {
        state: "valid",
        errors: [],
        warnings: buildOptionalWarnings(result.data)
      };
    } catch (error) {
      return {
        state: "invalid",
        errors: [{ code: "learning_parse_error", message: error instanceof Error ? error.message : "Learning pack parse failed." }],
        warnings: []
      };
    }
  }

  async listCollections(): Promise<LearningCollectionRecord[]> {
    return this.collectionRepository.listAll();
  }

  async createCollection(input: LearningCollectionCreateInput): Promise<LearningCollectionRecord> {
    const name = normalizeText(input.name);
    if (!name) {
      throw new Error("Collection name is required.");
    }

    const timestamp = nowIso();
    const record: LearningCollectionRecord = {
      id: `collection-${slugify(name)}-${Math.random().toString(16).slice(2, 8)}`,
      name,
      sourceType: input.sourceType ?? "personal",
      authority: normalizeText(input.authority),
      documentNumber: normalizeText(input.documentNumber),
      edition: normalizeText(input.edition),
      jurisdiction: normalizeText(input.jurisdiction),
      description: normalizeText(input.description),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await this.collectionRepository.insert(record);
    return record;
  }

  async updateCollection(input: LearningCollectionUpdateInput): Promise<LearningCollectionRecord> {
    const existing = await this.collectionRepository.getById(input.id);
    if (!existing) {
      throw new Error("Learning list not found.");
    }

    const name = normalizeText(input.name);
    if (!name) {
      throw new Error("Collection name is required.");
    }

    const updated: LearningCollectionRecord = {
      ...existing,
      name,
      sourceType: input.sourceType ?? existing.sourceType,
      authority: normalizeText(input.authority),
      documentNumber: normalizeText(input.documentNumber),
      edition: normalizeText(input.edition),
      jurisdiction: normalizeText(input.jurisdiction),
      description: normalizeText(input.description),
      updatedAt: nowIso()
    };

    await this.collectionRepository.update(updated);
    return updated;
  }

  async deleteCollection(collectionId: string, options?: LearningCollectionDeleteOptions): Promise<{ deletedItems: number; movedItems: number }> {
    const normalizedCollectionId = normalizeText(collectionId);
    if (!normalizedCollectionId || normalizedCollectionId === DEFAULT_LEARNING_COLLECTION_ID) {
      throw new Error("The default learning list cannot be deleted.");
    }

    const existing = await this.collectionRepository.getById(normalizedCollectionId);
    if (!existing) {
      throw new Error("Learning list not found.");
    }

    const allItems = await this.repository.listAll();
    const affectedItems = allItems
      .map((item) => this.normalizeRecord(item))
      .filter((item) => item.collectionId === normalizedCollectionId);

    let deletedItems = 0;
    let movedItems = 0;

    if (options?.deleteItems) {
      deletedItems = await this.repository.deleteMany(affectedItems.map((item) => item.id));
    } else {
      const destinationCollectionId = await this.ensureCollectionId(options?.destinationCollectionId ?? DEFAULT_LEARNING_COLLECTION_ID);
      const timestamp = nowIso();
      const movedRecords = affectedItems.map((item) => ({
        ...item,
        collectionId: destinationCollectionId,
        updatedAt: timestamp
      }));
      if (movedRecords.length > 0) {
        await this.repository.upsertMany(movedRecords);
      }
      movedItems = movedRecords.length;
    }

    await this.collectionRepository.delete(normalizedCollectionId);
    return { deletedItems, movedItems };
  }

  async importPack(rawJson: string, options?: LearningImportOptions): Promise<LearningImportResult> {
    const validation = this.validatePack(rawJson);

    if (validation.state === "invalid") {
      throw new Error(validation.errors[0]?.message ?? "Learning pack is invalid.");
    }

    const pack = learningPackV1Schema.parse(JSON.parse(rawJson) as unknown);
    const sourceReport = normalizeSourceReport(pack.source_report);
    const defaultDomain = normalizeLearningDomain(options?.defaultDomain);
    const defaultTags = normalizeLearningTags(options?.defaultTags);
    const timestamp = nowIso();
    const targetCollectionId = await this.resolveImportCollectionId(pack, options?.collectionId);

    const records: LearningItemRecord[] = pack.items.map((item) => {
      const itemTags = normalizeLearningTags(item.tags);
      const mergedTags = mergeLearningTags(itemTags, defaultTags);
      const itemDomain = extractItemDomain(item);
      const itemStatus = extractItemStatus(item) ?? "new";

      return {
        id: item.id,
        collectionId: targetCollectionId,
        type: item.type,
        content: item.content.trim(),
        meaning: normalizeText(item.meaning),
        example: normalizeText(item.example),
        note: normalizeText(item.note),
        domain: itemDomain ?? defaultDomain,
        status: itemStatus,
        tags: mergedTags,
        sourceReport: normalizeText(item.source_report) ?? sourceReport,
        createdAt: timestamp,
        updatedAt: timestamp
      };
    });

    const existing = await this.repository.listAll();
    const existingMap = new Map(existing.map((item) => [item.id, item]));
    const merged = records.map((record) => {
      const current = existingMap.get(record.id);
      return current
        ? {
            ...record,
            createdAt: current.createdAt,
            collectionId: record.collectionId,
            updatedAt: timestamp
          }
        : record;
    });

    const summary = await this.repository.upsertMany(merged);

    return {
      packId: pack.pack_id,
      imported: merged.length,
      inserted: summary.inserted,
      updated: summary.updated,
      warnings: validation.warnings
    };
  }

  async listItems(type?: LearningItemType | "all", collectionId?: string): Promise<LearningItemRecord[]> {
    const all = (await this.repository.listAll()).map((item) => this.normalizeRecord(item));
    const scoped = collectionId ? all.filter((item) => item.collectionId === collectionId) : all;
    if (!type || type === "all") {
      return scoped;
    }
    return scoped.filter((item) => item.type === type);
  }

  async updateItem(input: LearningItemUpdateInput): Promise<LearningItemRecord> {
    const existingRaw = await this.repository.getById(input.id);
    if (!existingRaw) {
      throw new Error("Learning item not found.");
    }

    const existing = this.normalizeRecord(existingRaw);
    const content = input.content.trim();
    if (!content) {
      throw new Error("Learning item content is required.");
    }

    const updated: LearningItemRecord = {
      ...existing,
      collectionId: normalizeText(input.collectionId) ?? existing.collectionId,
      type: input.type,
      content,
      meaning: normalizeText(input.meaning),
      example: normalizeText(input.example),
      note: normalizeText(input.note),
      domain: normalizeLearningDomain(input.domain),
      status: normalizeLearningStatus(input.status) ?? "new",
      tags: normalizeLearningTags(input.tags),
      sourceReport: normalizeText(input.sourceReport),
      updatedAt: nowIso()
    };

    await this.repository.update(updated);
    return updated;
  }

  async batchSetDomain(ids: string[], domain?: string): Promise<number> {
    const normalizedDomain = normalizeLearningDomain(domain);
    return this.batchUpdate(ids, (item, timestamp) => ({
      ...item,
      domain: normalizedDomain,
      updatedAt: timestamp
    }));
  }

  async batchSetStatus(ids: string[], status: LearningItemStatus): Promise<number> {
    const normalizedStatus = normalizeLearningStatus(status);
    if (!normalizedStatus) {
      return 0;
    }

    return this.batchUpdate(ids, (item, timestamp) => ({
      ...item,
      status: normalizedStatus,
      updatedAt: timestamp
    }));
  }

  async batchAddTags(ids: string[], tags?: string[]): Promise<number> {
    const normalizedTags = normalizeLearningTags(tags);
    if (!normalizedTags) {
      return 0;
    }

    return this.batchUpdate(ids, (item, timestamp) => ({
      ...item,
      tags: mergeLearningTags(item.tags, normalizedTags),
      updatedAt: timestamp
    }));
  }

  async batchRemoveTags(ids: string[], tags?: string[]): Promise<number> {
    const normalizedTags = normalizeLearningTags(tags);
    if (!normalizedTags) {
      return 0;
    }

    return this.batchUpdate(ids, (item, timestamp) => ({
      ...item,
      tags: removeLearningTags(item.tags, normalizedTags),
      updatedAt: timestamp
    }));
  }

  async deleteItem(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async batchDelete(ids: string[]): Promise<number> {
    const uniqueIds = normalizeUniqueIds(ids);
    if (uniqueIds.length === 0) {
      return 0;
    }

    return this.repository.deleteMany(uniqueIds);
  }

  async addFromMultiline(type: LearningItemType, contentBlock: string, sourceReport?: string, collectionId?: string): Promise<number> {
    const lines = contentBlock
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return 0;
    }

    const timestamp = nowIso();
    const targetCollectionId = await this.ensureCollectionId(collectionId);
    const records: LearningItemRecord[] = lines.map((line) => ({
      id: createId(`learning-${type}`),
      collectionId: targetCollectionId,
      type,
      content: line,
      status: "new",
      sourceReport: normalizeText(sourceReport),
      createdAt: timestamp,
      updatedAt: timestamp
    }));

    await this.repository.upsertMany(records);
    return records.length;
  }

  async exportPack(packId?: string, collectionId?: string): Promise<LearningExportResult> {
    const items = (await this.repository.listAll())
      .map((item) => this.normalizeRecord(item))
      .filter((item) => !collectionId || item.collectionId === collectionId);
    const collection = collectionId ? await this.collectionRepository.getById(collectionId) : undefined;

    const exportPack = {
      schema_version: "1.0",
      pack_id: normalizeText(packId) ?? `learning-export-${new Date().toISOString().slice(0, 10)}`,
      collection: collection ? {
        id: collection.id,
        name: collection.name,
        source_type: collection.sourceType,
        authority: collection.authority,
        document_number: collection.documentNumber,
        edition: collection.edition,
        jurisdiction: collection.jurisdiction,
        description: collection.description
      } : undefined,
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        content: item.content,
        meaning: item.meaning,
        example: item.example,
        note: item.note,
        domain: item.domain,
        status: item.status,
        tags: item.tags,
        source_report: item.sourceReport
      }))
    };

    const parsed = learningPackV1Schema.parse(exportPack);
    const fileName = `${parsed.pack_id}.json`;

    return {
      fileName,
      json: JSON.stringify(parsed, null, 2),
      itemCount: parsed.items.length
    };
  }

  async exportForInbox(selectedIds: string[]): Promise<LearningExportResult> {
    const allItems = await this.repository.listAll();
    const selectedSet = new Set(selectedIds);
    const items = allItems.filter(item => selectedSet.has(item.id)).map(item => this.normalizeRecord(item));

    const words: Array<Record<string, unknown>> = [];
    const phrases: Array<Record<string, unknown>> = [];
    const sentences: Array<Record<string, unknown>> = [];
    const geo_materials: Array<Record<string, unknown>> = [];
    const geo_features: Array<Record<string, unknown>> = [];
    const strategies: Array<Record<string, unknown>> = [];

    for (const item of items) {
      const source_ref = {
        section: normalizeSourceSection(item),
        sentence: normalizeSourceSentence(item)
      };

      if (item.type === "word") {
        words.push({
          id: item.id,
          canonical_word: item.content,
          chinese_meaning: item.meaning,
          english_definition: item.note,
          example_sentence: item.example,
          language_category: toLanguageCategory(item.domain),
          source_ref
        });
      } else if (item.type === "phrase") {
        phrases.push({
          id: item.id,
          canonical_phrase: item.content,
          chinese_meaning: item.meaning,
          explanation: item.note,
          example_sentence: item.example,
          source_ref
        });
      } else if (item.type === "sentence") {
        sentences.push({
          id: item.id,
          canonical_sentence: item.content,
          chinese_literal: item.meaning,
          chinese_natural: item.note,
          source_ref
        });
      } else if (item.type === "concept") {
        strategies.push({
          id: item.id,
          canonical_name: item.content,
          chinese_name: item.meaning,
          strategy_category: toStrategyCategory(item.domain),
          description: item.note,
          steps_or_method: item.example,
          source_ref
        });
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const packId = `learning-inbox-export-${timestamp}`;
    const sourceReportId = normalizeText(items[0]?.sourceReport) ?? packId;
    const exportPack = {
      schema_version: "1.0",
      pack_id: packId,
      generated_at: new Date().toISOString(),
      generator: {
        model: "learning-module",
        version: "1.0"
      },
      source_report: {
        report_id: sourceReportId,
        title: "Learning Export to Inbox",
        project: "Personal Learning",
        discipline: "general",
        author: "User",
        organization: "Self",
        date: new Date().toISOString().slice(0, 10),
        file_name: `${packId}.json`
      },
      statistics: {
        words: words.length,
        phrases: phrases.length,
        sentences: sentences.length,
        geo_materials: geo_materials.length,
        geo_features: geo_features.length,
        strategies: strategies.length,
        images: 0
      },
      items: {
        words,
        phrases,
        sentences,
        geo_materials,
        geo_features,
        strategies
      },
      images: []
    };
    const parsed = knowledgePackSchema.parse(exportPack);

    return {
      fileName: `${packId}.json`,
      json: JSON.stringify(parsed, null, 2),
      itemCount: items.length
    };
  }

  getLearningTypes(): readonly LearningItemType[] {
    return learningItemTypes;
  }

  getSuggestedDomains(): readonly string[] {
    return suggestedLearningDomains;
  }

  getSuggestedStatuses(): readonly LearningItemStatus[] {
    return learningItemStatuses;
  }

  private async ensureCollectionId(collectionId?: string): Promise<string> {
    const normalizedId = normalizeText(collectionId);
    if (!normalizedId) {
      return DEFAULT_LEARNING_COLLECTION_ID;
    }

    const existing = await this.collectionRepository.getById(normalizedId);
    if (existing) {
      return existing.id;
    }

    if (normalizedId === DEFAULT_LEARNING_COLLECTION_ID) {
      const defaultCollection = createDefaultLearningCollection();
      await this.collectionRepository.insert(defaultCollection);
      return defaultCollection.id;
    }

    throw new Error("Selected learning collection was not found.");
  }

  private async resolveImportCollectionId(pack: LearningPackV1, selectedCollectionId?: string): Promise<string> {
    const normalizedSelectedId = normalizeText(selectedCollectionId);
    if (normalizedSelectedId) {
      return this.ensureCollectionId(normalizedSelectedId);
    }

    const packCollection = pack.collection;
    if (packCollection?.name) {
      const allCollections = await this.collectionRepository.listAll();
      const existing = allCollections.find((collection) => collection.name.toLowerCase() === packCollection.name.trim().toLowerCase());
      if (existing) {
        return existing.id;
      }

      const created = await this.createCollection({
        name: packCollection.name,
        sourceType: packCollection.source_type,
        authority: packCollection.authority,
        documentNumber: packCollection.document_number,
        edition: packCollection.edition,
        jurisdiction: packCollection.jurisdiction,
        description: packCollection.description
      });
      return created.id;
    }

    return DEFAULT_LEARNING_COLLECTION_ID;
  }

  private normalizeRecord(record: LearningItemRecord): LearningItemRecord {
    return {
      ...record,
      collectionId: record.collectionId || DEFAULT_LEARNING_COLLECTION_ID,
      domain: normalizeLearningDomain(record.domain),
      status: getLearningStatus(record.status),
      tags: normalizeLearningTags(record.tags)
    };
  }

  private async batchUpdate(
    ids: string[],
    applyUpdate: (item: LearningItemRecord, timestamp: string) => LearningItemRecord
  ): Promise<number> {
    const uniqueIds = normalizeUniqueIds(ids);
    if (uniqueIds.length === 0) {
      return 0;
    }

    const idSet = new Set(uniqueIds);
    const existing = (await this.repository.listAll()).map((item) => this.normalizeRecord(item));
    const timestamp = nowIso();
    const updatedRecords = existing
      .filter((item) => idSet.has(item.id))
      .map((item) => applyUpdate(item, timestamp));

    if (updatedRecords.length === 0) {
      return 0;
    }

    await this.repository.upsertMany(updatedRecords);
    return updatedRecords.length;
  }
}


