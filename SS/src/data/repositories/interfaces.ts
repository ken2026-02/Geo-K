import type { Database } from "sql.js";

export interface BaseRepository<TRecord> {
  getById(id: string): Promise<TRecord | undefined>;
  insert(record: TRecord): Promise<void>;
  update(record: TRecord): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ImportBatchRecord {
  id: string;
  batchName: string;
  sourceFileName?: string;
  sourceFileType?: string;
  schemaVersion: string;
  importedAt: string;
  importStatus: string;
  validationStatus: string;
  totalItems: number;
  pendingItems: number;
  approvedItems: number;
  rejectedItems: number;
  sourceReportId?: string;
  sourceReportTitle?: string;
  sourceReportProject?: string;
  sourceReportDiscipline?: string;
  sourceReportAuthor?: string;
  sourceReportOrganization?: string;
  sourceReportDate?: string;
  sourceReportFileName?: string;
  warningsJson?: string;
  notes?: string;
}

export interface PendingInboxItemRecord {
  id: string;
  itemType: "word" | "phrase" | "sentence" | "geo_material" | "geo_feature" | "strategy";
  batchId: string;
  sourceReportId?: string;
  title: string;
  normalizedValue: string;
  reviewStatus: string;
  duplicateStatus: string;
  confidenceScore?: number;
  confidenceBand?: string;
  reviewerNote?: string;
  sourceSection?: string;
  sourceSentence?: string;
}

export interface PendingImageRecord {
  id: string;
  batchId: string;
  fileName: string;
  caption?: string;
  description?: string;
  processingStatus: string;
  reviewStatus: string;
  reviewerNote?: string;
  sourceType?: string;
  tempStoragePath?: string;
  hash?: string;
}

export interface PendingImageLinkRecord {
  pendingItemType: string;
  pendingItemId: string;
  pendingImageId: string;
  linkRole?: string;
}

export interface BackupSnapshotRecord {
  id: string;
  snapshotName: string;
  snapshotType: string;
  createdAt: string;
  schemaVersion: string;
  includesImages: boolean;
  includesPending: boolean;
  includesUserData: boolean;
  backupPath?: string;
  notes?: string;
}

export interface ImportBatchRepository extends BaseRepository<ImportBatchRecord> {
  listAll(): Promise<ImportBatchRecord[]>;
  listByStatus(status: string): Promise<ImportBatchRecord[]>;
}

export interface PendingInboxRepository {
  listByBatch(batchId: string): Promise<PendingInboxItemRecord[]>;
  updateReviewStatus(itemType: PendingInboxItemRecord["itemType"], id: string, reviewStatus: string): Promise<void>;
  updateReviewerNote(itemType: PendingInboxItemRecord["itemType"], id: string, reviewerNote: string): Promise<void>;
}

export interface AppSettingRecord {
  id: string;
  settingKey: string;
  settingValue?: string;
  updatedAt: string;
}

export interface MigrationLogRecord {
  id: string;
  migrationName: string;
  fromVersion?: string;
  toVersion: string;
  appliedAt: string;
  success: boolean;
  notes?: string;
}

export interface RuleSetRecord {
  id: string;
  ruleName: string;
  ruleType: string;
  version: string;
  ruleContent: string;
  schemaVersion?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


export type PersonalNoteType = "observation" | "risk" | "action" | "reminder" | "lesson";
export type PersonalNoteStatus = "active" | "archived";
export type PersonalNoteTargetItemType = "geo_material" | "geo_feature";

export interface PersonalNoteRecord {
  id: string;
  noteType: PersonalNoteType;
  body: string;
  status: PersonalNoteStatus;
  targetItemType: PersonalNoteTargetItemType;
  targetItemId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalNoteRepository extends BaseRepository<PersonalNoteRecord> {
  listByTarget(targetItemType: PersonalNoteTargetItemType, targetItemId: string): Promise<PersonalNoteRecord[]>;
  archive(id: string): Promise<void>;
}
export interface DatabaseContext {
  db: Database;
}

export interface AppSettingsRepository extends BaseRepository<AppSettingRecord> {
  getByKey(settingKey: string): Promise<AppSettingRecord | undefined>;
  upsert(record: AppSettingRecord): Promise<void>;
}

export interface MigrationLogRepository extends BaseRepository<MigrationLogRecord> {
  listAll(): Promise<MigrationLogRecord[]>;
}

export interface RuleSetRepository extends BaseRepository<RuleSetRecord> {
  listActive(): Promise<RuleSetRecord[]>;
}

export interface BackupSnapshotRepository extends BaseRepository<BackupSnapshotRecord> {
  listAll(): Promise<BackupSnapshotRecord[]>;
}


export type LearningItemType = "word" | "phrase" | "sentence" | "concept";
export type LearningItemStatus = "new" | "learning" | "reviewed" | "ignored";

export interface LearningItemRecord {
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
  createdAt: string;
  updatedAt: string;
}

export interface LearningItemRepository extends BaseRepository<LearningItemRecord> {
  listAll(): Promise<LearningItemRecord[]>;
  upsertMany(records: LearningItemRecord[]): Promise<{ inserted: number; updated: number }>;
  deleteMany(ids: string[]): Promise<number>;
}







