import type {
  DuplicateStatus,
  FunctionType,
  GeoFeatureCategory,
  GeoFeatureSubtype,
  GeoMaterialCategory,
  GeoMaterialSubtype,
  ImageLinkRole,
  ImageSourceType,
  ImageVariantType,
  LanguageCategory,
  NoteType,
  ObjectType,
  PhraseType,
  ProvenanceType,
  ReviewResult,
  ReviewStatus,
  RuleType,
  ScenarioType,
  SentenceType,
  StrategyCategory
} from "../../shared/classification";

export type ApprovedItemType = Exclude<ObjectType, "image"> | "image_asset";
export type PendingItemType =
  | "pending_word"
  | "pending_phrase"
  | "pending_sentence"
  | "pending_geo_material"
  | "pending_geo_feature"
  | "pending_strategy"
  | "pending_image_asset";

export type AnyItemType = ApprovedItemType | PendingItemType;

export interface AuditFields {
  createdAt: string;
  updatedAt?: string;
}

export interface ImportBatch extends AuditFields {
  id: string;
  batchName: string;
  sourceFileName: string;
  sourceFileType: string;
  schemaVersion: string;
  importedAt: string;
  importStatus: "imported" | "reviewing" | "completed" | "failed" | "review_in_progress";
  validationStatus: "valid" | "warning" | "invalid" | "valid_with_warnings";
  totalItems: number;
  pendingItems: number;
  approvedItems: number;
  rejectedItems: number;
  notes?: string;
}

export interface Report extends AuditFields {
  id: string;
  sourceReportId?: string;
  title?: string;
  project?: string;
  discipline?: string;
  reportDate?: string;
  sourceType?: string;
  author?: string;
  organization?: string;
  tagsJson?: string;
  summary?: string;
}

export interface ApprovedBase extends AuditFields {
  id: string;
  provenance: ProvenanceType;
  createdBy: "system" | "user";
  firstAddedAt: string;
  isStarred: boolean;
  isArchived: boolean;
}

export interface Word extends ApprovedBase {
  canonicalWord: string;
  normalizedWord: string;
  lemma?: string;
  partOfSpeech?: string;
  category?: LanguageCategory;
  chineseMeaning?: string;
  englishDefinition?: string;
  difficultyLevel?: number;
  masteryLevel?: number;
  frequencyScore?: number;
}

export interface Phrase extends ApprovedBase {
  canonicalPhrase: string;
  normalizedPhrase: string;
  phraseType?: PhraseType;
  functionType?: FunctionType;
  scenarioType?: ScenarioType;
  chineseMeaning?: string;
  explanation?: string;
  difficultyLevel?: number;
  masteryLevel?: number;
  reusableScore?: number;
}

export interface Sentence extends ApprovedBase {
  canonicalSentence: string;
  normalizedSentence: string;
  sentenceType?: SentenceType;
  functionType?: FunctionType;
  scenarioType?: ScenarioType;
  chineseLiteral?: string;
  chineseNatural?: string;
  sectionName?: string;
  reusableFlag: boolean;
  reusableScore?: number;
  difficultyLevel?: number;
  masteryLevel?: number;
}

export interface GeoMaterial extends ApprovedBase {
  canonicalName: string;
  normalizedName: string;
  chineseName?: string;
  materialCategory?: GeoMaterialCategory;
  materialSubtype?: GeoMaterialSubtype;
  description?: string;
  identificationMethod?: string;
  distinguishingPoints?: string;
  commonMisidentifications?: string;
  engineeringSignificance?: string;
  commonRisks?: string;
  commonTreatments?: string;
  australiaContext?: string;
  difficultyLevel?: number;
  masteryLevel?: number;
}

export interface GeoFeature extends ApprovedBase {
  canonicalName: string;
  normalizedName: string;
  chineseName?: string;
  featureCategory?: GeoFeatureCategory;
  featureSubtype?: GeoFeatureSubtype;
  description?: string;
  identificationMethod?: string;
  distinguishingPoints?: string;
  commonCauses?: string;
  riskImplications?: string;
  treatmentOrMitigation?: string;
  reportingExpressions?: string;
  inspectionPoints?: string;
  difficultyLevel?: number;
  masteryLevel?: number;
}

export interface Strategy extends ApprovedBase {
  canonicalName: string;
  normalizedName: string;
  chineseName?: string;
  strategyCategory?: StrategyCategory;
  description?: string;
  stepsOrMethod?: string;
  applicationConditions?: string;
  limitations?: string;
  linkedReportingExpression?: string;
  monitoringNotes?: string;
  difficultyLevel?: number;
}

export interface ImageVariant {
  id: string;
  assetGroupId: string;
  variantType: ImageVariantType;
  storagePath: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface ImageAsset extends AuditFields {
  id: string;
  assetGroupId: string;
  fileName: string;
  mimeType: string;
  originalWidth?: number;
  originalHeight?: number;
  originalSizeBytes?: number;
  hash?: string;
  caption?: string;
  description?: string;
  tagsJson?: string;
  sourceType?: ImageSourceType;
  provenance: ImageSourceType;
  addedByUser: boolean;
  variants: ImageVariant[];
}

export interface ItemSource extends AuditFields {
  id: string;
  itemType: ApprovedItemType;
  itemId: string;
  reportId?: string;
  sourceSection?: string;
  sourceSentence?: string;
  sourceExcerpt?: string;
  sourcePageRef?: string;
  sourceParagraphRef?: string;
}

export interface ItemRelation extends AuditFields {
  id: string;
  fromItemType: ApprovedItemType;
  fromItemId: string;
  relationType: string;
  toItemType: ApprovedItemType;
  toItemId: string;
  confidenceScore?: number;
  createdBy: "system" | "user";
}

export interface ItemImageLink {
  id: string;
  itemType: ApprovedItemType;
  itemId: string;
  imageAssetId: string;
  displayOrder: number;
  linkRole: ImageLinkRole;
  createdAt: string;
}

export interface PendingBase {
  id: string;
  batchId: string;
  sourceReportId?: string;
  sourceSection?: string;
  sourceSentence?: string;
  confidenceScore?: number;
  confidenceBand?: "high" | "medium" | "low" | "unknown";
  duplicateStatus: DuplicateStatus;
  reviewStatus: ReviewStatus;
  reviewerNote?: string;
  createdAt: string;
}

export interface PendingWord extends PendingBase {
  rawWord: string;
  normalizedWord: string;
  lemma?: string;
  partOfSpeech?: string;
  category?: LanguageCategory;
  chineseMeaning?: string;
  englishDefinition?: string;
  exampleSentence?: string;
}

export interface PendingPhrase extends PendingBase {
  rawPhrase: string;
  normalizedPhrase: string;
  phraseType?: PhraseType;
  functionType?: FunctionType;
  scenarioType?: ScenarioType;
  chineseMeaning?: string;
  explanation?: string;
  exampleSentence?: string;
}

export interface PendingSentence extends PendingBase {
  rawSentence: string;
  normalizedSentence: string;
  sentenceType?: SentenceType;
  functionType?: FunctionType;
  scenarioType?: ScenarioType;
  chineseLiteral?: string;
  chineseNatural?: string;
  sectionName?: string;
  reusableScore?: number;
}

export interface PendingGeoMaterial extends PendingBase {
  rawName: string;
  normalizedName: string;
  chineseName?: string;
  materialCategory?: GeoMaterialCategory;
  materialSubtype?: GeoMaterialSubtype;
  description?: string;
  identificationMethod?: string;
  distinguishingPoints?: string;
  commonMisidentifications?: string;
  engineeringSignificance?: string;
  commonRisks?: string;
  commonTreatments?: string;
  australiaContext?: string;
}

export interface PendingGeoFeature extends PendingBase {
  rawName: string;
  normalizedName: string;
  chineseName?: string;
  featureCategory?: GeoFeatureCategory;
  featureSubtype?: GeoFeatureSubtype;
  description?: string;
  identificationMethod?: string;
  distinguishingPoints?: string;
  commonCauses?: string;
  riskImplications?: string;
  treatmentOrMitigation?: string;
  reportingExpressions?: string;
  inspectionPoints?: string;
}

export interface PendingStrategy extends PendingBase {
  rawName: string;
  normalizedName: string;
  chineseName?: string;
  strategyCategory?: StrategyCategory;
  description?: string;
  stepsOrMethod?: string;
  applicationConditions?: string;
  limitations?: string;
}

export interface PendingImageAsset {
  id: string;
  batchId: string;
  fileName: string;
  mimeType?: string;
  originalWidth?: number;
  originalHeight?: number;
  originalSizeBytes?: number;
  hash?: string;
  tempStoragePath?: string;
  caption?: string;
  description?: string;
  tagsJson?: string;
  linkedPendingItemType?: PendingItemType;
  linkedPendingItemId?: string;
  processingStatus: "pending" | "processed" | "failed";
  reviewStatus: ReviewStatus;
  reviewerNote?: string;
  createdAt: string;
}

export interface PendingItemImageLink {
  id: string;
  pendingItemType: PendingItemType;
  pendingItemId: string;
  pendingImageId: string;
  displayOrder: number;
  linkRole: ImageLinkRole;
  createdAt: string;
}

export interface UserNote extends AuditFields {
  id: string;
  itemType: ApprovedItemType;
  itemId: string;
  noteText: string;
  noteType: NoteType;
}

export interface Favorite {
  id: string;
  itemType: ApprovedItemType;
  itemId: string;
  folderName?: string;
  createdAt: string;
}

export interface CustomTag {
  id: string;
  itemType: ApprovedItemType;
  itemId: string;
  tagName: string;
  createdAt: string;
}

export interface ReviewLog {
  id: string;
  itemType: ApprovedItemType;
  itemId: string;
  reviewMode: string;
  reviewResult: ReviewResult;
  responseTimeMs?: number;
  reviewedAt: string;
}

export interface UserImageLink {
  id: string;
  itemType: ApprovedItemType;
  itemId: string;
  imageAssetId: string;
  createdAt: string;
}

export interface UserEntryMetadata extends AuditFields {
  id: string;
  itemType: ApprovedItemType;
  itemId: string;
  createdBy: "user";
  visibility: "private" | "default";
  customLinksJson?: string;
}

export interface RuleSet extends AuditFields {
  id: string;
  ruleName: string;
  ruleType: RuleType;
  version: string;
  ruleContent: string;
  schemaVersion: string;
  isActive: boolean;
}

export interface BackupSnapshot {
  id: string;
  snapshotName: string;
  snapshotType: "auto_pre_import" | "auto_pre_restore" | "manual_full" | "manual_partial";
  createdAt: string;
  schemaVersion: string;
  includesImages: boolean;
  includesPending: boolean;
  includesUserData: boolean;
  backupPath: string;
  notes?: string;
}

export interface StorageMeta extends AuditFields {
  id: string;
  storageKey: string;
  storageType: string;
  byteSize: number;
  checksum?: string;
}

export interface MigrationLog {
  version: number;
  appliedAt: string;
  notes?: string;
}



