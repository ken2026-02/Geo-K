import type { LearningItemRecord, LearningItemStatus, LearningItemType } from "../../data/repositories/interfaces";
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
import { learningPackV1Schema, learningItemTypes, type LearningPackV1 } from "../../features/learning/types";

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
  defaultDomain?: string;
  defaultTags?: string[];
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

  constructor(repository?: LocalLearningItemRepository) {
    this.repository = repository ?? new LocalLearningItemRepository();
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

    const records: LearningItemRecord[] = pack.items.map((item) => {
      const itemTags = normalizeLearningTags(item.tags);
      const mergedTags = mergeLearningTags(itemTags, defaultTags);
      const itemDomain = extractItemDomain(item);
      const itemStatus = extractItemStatus(item) ?? "new";

      return {
        id: item.id,
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

  async listItems(type?: LearningItemType | "all"): Promise<LearningItemRecord[]> {
    const all = (await this.repository.listAll()).map((item) => this.normalizeRecord(item));
    if (!type || type === "all") {
      return all;
    }
    return all.filter((item) => item.type === type);
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

  async addFromMultiline(type: LearningItemType, contentBlock: string, sourceReport?: string): Promise<number> {
    const lines = contentBlock
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return 0;
    }

    const timestamp = nowIso();
    const records: LearningItemRecord[] = lines.map((line) => ({
      id: createId(`learning-${type}`),
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

  async exportPack(packId?: string): Promise<LearningExportResult> {
    const items = (await this.repository.listAll()).map((item) => this.normalizeRecord(item));

    const exportPack = {
      schema_version: "1.0",
      pack_id: normalizeText(packId) ?? `learning-export-${new Date().toISOString().slice(0, 10)}`,
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

  getLearningTypes(): readonly LearningItemType[] {
    return learningItemTypes;
  }

  getSuggestedDomains(): readonly string[] {
    return suggestedLearningDomains;
  }

  getSuggestedStatuses(): readonly LearningItemStatus[] {
    return learningItemStatuses;
  }

  private normalizeRecord(record: LearningItemRecord): LearningItemRecord {
    return {
      ...record,
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


