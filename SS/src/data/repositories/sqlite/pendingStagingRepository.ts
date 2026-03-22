import type { Database } from "sql.js";

import { escapeSqlString } from "./sqliteHelpers";

export interface PendingWordStageRecord {
  id: string;
  batchId: string;
  sourceReportId?: string;
  rawWord: string;
  normalizedWord: string;
  lemma?: string;
  partOfSpeech?: string;
  languageCategory?: string;
  chineseMeaning?: string;
  englishDefinition?: string;
  exampleSentence?: string;
  confidenceScore?: number;
  confidenceBand: string;
  sourceSection?: string;
  sourceSentence?: string;
  createdAt: string;
}

export interface PendingPhraseStageRecord {
  id: string;
  batchId: string;
  sourceReportId?: string;
  rawPhrase: string;
  normalizedPhrase: string;
  phraseType?: string;
  functionType?: string;
  scenarioType?: string;
  chineseMeaning?: string;
  explanation?: string;
  exampleSentence?: string;
  confidenceScore?: number;
  confidenceBand: string;
  sourceSection?: string;
  sourceSentence?: string;
  createdAt: string;
}

export interface PendingSentenceStageRecord {
  id: string;
  batchId: string;
  sourceReportId?: string;
  rawSentence: string;
  normalizedSentence: string;
  sentenceType?: string;
  functionType?: string;
  scenarioType?: string;
  chineseLiteral?: string;
  chineseNatural?: string;
  sectionName?: string;
  reusableScore?: number;
  confidenceScore?: number;
  confidenceBand: string;
  sourceSection?: string;
  sourceSentence?: string;
  createdAt: string;
}

export interface PendingGeoMaterialStageRecord {
  id: string;
  batchId: string;
  sourceReportId?: string;
  rawName: string;
  normalizedName: string;
  chineseName?: string;
  geoMaterialCategory?: string;
  geoMaterialSubtype?: string;
  description?: string;
  identificationMethod?: string;
  distinguishingPoints?: string;
  commonMisidentifications?: string;
  engineeringSignificance?: string;
  commonRisks?: string;
  commonTreatments?: string;
  australiaContext?: string;
  confidenceScore?: number;
  confidenceBand: string;
  sourceSection?: string;
  sourceSentence?: string;
  createdAt: string;
}

export interface PendingGeoFeatureStageRecord {
  id: string;
  batchId: string;
  sourceReportId?: string;
  rawName: string;
  normalizedName: string;
  chineseName?: string;
  geoFeatureCategory?: string;
  geoFeatureSubtype?: string;
  description?: string;
  identificationMethod?: string;
  distinguishingPoints?: string;
  commonCauses?: string;
  riskImplications?: string;
  treatmentOrMitigation?: string;
  reportingExpressions?: string;
  inspectionPoints?: string;
  confidenceScore?: number;
  confidenceBand: string;
  sourceSection?: string;
  sourceSentence?: string;
  createdAt: string;
}

export interface PendingStrategyStageRecord {
  id: string;
  batchId: string;
  sourceReportId?: string;
  rawName: string;
  normalizedName: string;
  chineseName?: string;
  strategyCategory?: string;
  description?: string;
  stepsOrMethod?: string;
  applicationConditions?: string;
  limitations?: string;
  linkedReportingExpression?: string;
  monitoringNotes?: string;
  confidenceScore?: number;
  confidenceBand: string;
  createdAt: string;
}
export interface PendingImageStageRecord {
  id: string;
  batchId: string;
  assetGroupId: string;
  fileName: string;
  mimeType?: string;
  originalWidth?: number;
  originalHeight?: number;
  originalSizeBytes?: number;
  hash?: string;
  caption?: string;
  description?: string;
  tagsJson?: string;
  tempStoragePath?: string;
  processingStatus: string;
  reviewStatus: string;
  reviewerNote?: string;
  sourceType?: string;
  createdAt: string;
}

export interface PendingItemImageLinkStageRecord {
  id: string;
  pendingItemType: string;
  pendingItemId: string;
  pendingImageId: string;
  displayOrder: number;
  linkRole?: string;
  createdAt: string;
}

function nullableText(value?: string): string {
  return value ? `'${escapeSqlString(value)}'` : "NULL";
}

function nullableNumber(value?: number): string {
  return value == null ? "NULL" : String(value);
}

export class SqlitePendingStagingRepository {
  constructor(private readonly db: Database) {}

  stageWords(records: PendingWordStageRecord[]): void {
    for (const record of records) {
      this.db.run(`
        INSERT INTO pending_words (id, batch_id, source_report_id, raw_word, normalized_word, lemma, part_of_speech, language_category, chinese_meaning, english_definition, example_sentence, confidence_score, confidence_band, duplicate_status, review_status, reviewer_note, source_section, source_sentence, created_at)
        VALUES ('${escapeSqlString(record.id)}', '${escapeSqlString(record.batchId)}', ${nullableText(record.sourceReportId)}, '${escapeSqlString(record.rawWord)}', '${escapeSqlString(record.normalizedWord)}', ${nullableText(record.lemma)}, ${nullableText(record.partOfSpeech)}, ${nullableText(record.languageCategory)}, ${nullableText(record.chineseMeaning)}, ${nullableText(record.englishDefinition)}, ${nullableText(record.exampleSentence)}, ${nullableNumber(record.confidenceScore)}, '${escapeSqlString(record.confidenceBand)}', 'none', 'unreviewed', NULL, ${nullableText(record.sourceSection)}, ${nullableText(record.sourceSentence)}, '${escapeSqlString(record.createdAt)}')
      `);
    }
  }

  stagePhrases(records: PendingPhraseStageRecord[]): void {
    for (const record of records) {
      this.db.run(`
        INSERT INTO pending_phrases (id, batch_id, source_report_id, raw_phrase, normalized_phrase, phrase_type, function_type, scenario_type, chinese_meaning, explanation, example_sentence, confidence_score, confidence_band, duplicate_status, review_status, reviewer_note, source_section, source_sentence, created_at)
        VALUES ('${escapeSqlString(record.id)}', '${escapeSqlString(record.batchId)}', ${nullableText(record.sourceReportId)}, '${escapeSqlString(record.rawPhrase)}', '${escapeSqlString(record.normalizedPhrase)}', ${nullableText(record.phraseType)}, ${nullableText(record.functionType)}, ${nullableText(record.scenarioType)}, ${nullableText(record.chineseMeaning)}, ${nullableText(record.explanation)}, ${nullableText(record.exampleSentence)}, ${nullableNumber(record.confidenceScore)}, '${escapeSqlString(record.confidenceBand)}', 'none', 'unreviewed', NULL, ${nullableText(record.sourceSection)}, ${nullableText(record.sourceSentence)}, '${escapeSqlString(record.createdAt)}')
      `);
    }
  }

  stageSentences(records: PendingSentenceStageRecord[]): void {
    for (const record of records) {
      this.db.run(`
        INSERT INTO pending_sentences (id, batch_id, source_report_id, raw_sentence, normalized_sentence, sentence_type, function_type, scenario_type, chinese_literal, chinese_natural, section_name, reusable_score, confidence_score, confidence_band, duplicate_status, review_status, reviewer_note, source_section, source_sentence, created_at)
        VALUES ('${escapeSqlString(record.id)}', '${escapeSqlString(record.batchId)}', ${nullableText(record.sourceReportId)}, '${escapeSqlString(record.rawSentence)}', '${escapeSqlString(record.normalizedSentence)}', ${nullableText(record.sentenceType)}, ${nullableText(record.functionType)}, ${nullableText(record.scenarioType)}, ${nullableText(record.chineseLiteral)}, ${nullableText(record.chineseNatural)}, ${nullableText(record.sectionName)}, ${nullableNumber(record.reusableScore)}, ${nullableNumber(record.confidenceScore)}, '${escapeSqlString(record.confidenceBand)}', 'none', 'unreviewed', NULL, ${nullableText(record.sourceSection)}, ${nullableText(record.sourceSentence)}, '${escapeSqlString(record.createdAt)}')
      `);
    }
  }

  stageGeoMaterials(records: PendingGeoMaterialStageRecord[]): void {
    for (const record of records) {
      this.db.run(`
        INSERT INTO pending_geo_materials (id, batch_id, source_report_id, raw_name, normalized_name, chinese_name, geo_material_category, geo_material_subtype, description, identification_method, distinguishing_points, common_misidentifications, engineering_significance, common_risks, common_treatments, australia_context, confidence_score, confidence_band, duplicate_status, review_status, reviewer_note, source_section, source_sentence, created_at)
        VALUES ('${escapeSqlString(record.id)}', '${escapeSqlString(record.batchId)}', ${nullableText(record.sourceReportId)}, '${escapeSqlString(record.rawName)}', '${escapeSqlString(record.normalizedName)}', ${nullableText(record.chineseName)}, ${nullableText(record.geoMaterialCategory)}, ${nullableText(record.geoMaterialSubtype)}, ${nullableText(record.description)}, ${nullableText(record.identificationMethod)}, ${nullableText(record.distinguishingPoints)}, ${nullableText(record.commonMisidentifications)}, ${nullableText(record.engineeringSignificance)}, ${nullableText(record.commonRisks)}, ${nullableText(record.commonTreatments)}, ${nullableText(record.australiaContext)}, ${nullableNumber(record.confidenceScore)}, '${escapeSqlString(record.confidenceBand)}', 'none', 'unreviewed', NULL, ${nullableText(record.sourceSection)}, ${nullableText(record.sourceSentence)}, '${escapeSqlString(record.createdAt)}')
      `);
    }
  }

  stageGeoFeatures(records: PendingGeoFeatureStageRecord[]): void {
    for (const record of records) {
      this.db.run(`
        INSERT INTO pending_geo_features (id, batch_id, source_report_id, raw_name, normalized_name, chinese_name, geo_feature_category, geo_feature_subtype, description, identification_method, distinguishing_points, common_causes, risk_implications, treatment_or_mitigation, reporting_expressions, inspection_points, confidence_score, confidence_band, duplicate_status, review_status, reviewer_note, source_section, source_sentence, created_at)
        VALUES ('${escapeSqlString(record.id)}', '${escapeSqlString(record.batchId)}', ${nullableText(record.sourceReportId)}, '${escapeSqlString(record.rawName)}', '${escapeSqlString(record.normalizedName)}', ${nullableText(record.chineseName)}, ${nullableText(record.geoFeatureCategory)}, ${nullableText(record.geoFeatureSubtype)}, ${nullableText(record.description)}, ${nullableText(record.identificationMethod)}, ${nullableText(record.distinguishingPoints)}, ${nullableText(record.commonCauses)}, ${nullableText(record.riskImplications)}, ${nullableText(record.treatmentOrMitigation)}, ${nullableText(record.reportingExpressions)}, ${nullableText(record.inspectionPoints)}, ${nullableNumber(record.confidenceScore)}, '${escapeSqlString(record.confidenceBand)}', 'none', 'unreviewed', NULL, ${nullableText(record.sourceSection)}, ${nullableText(record.sourceSentence)}, '${escapeSqlString(record.createdAt)}')
      `);
    }
  }

  stageStrategies(records: PendingStrategyStageRecord[]): void {
    for (const record of records) {
      this.db.run(`
        INSERT INTO pending_strategies (id, batch_id, source_report_id, raw_name, normalized_name, chinese_name, strategy_category, description, steps_or_method, application_conditions, limitations, linked_reporting_expression, monitoring_notes, confidence_score, confidence_band, duplicate_status, review_status, reviewer_note, created_at)
        VALUES ('${escapeSqlString(record.id)}', '${escapeSqlString(record.batchId)}', ${nullableText(record.sourceReportId)}, '${escapeSqlString(record.rawName)}', '${escapeSqlString(record.normalizedName)}', ${nullableText(record.chineseName)}, ${nullableText(record.strategyCategory)}, ${nullableText(record.description)}, ${nullableText(record.stepsOrMethod)}, ${nullableText(record.applicationConditions)}, ${nullableText(record.limitations)}, ${nullableText(record.linkedReportingExpression)}, ${nullableText(record.monitoringNotes)}, ${nullableNumber(record.confidenceScore)}, '${escapeSqlString(record.confidenceBand)}', 'none', 'unreviewed', NULL, '${escapeSqlString(record.createdAt)}')
      `);
    }
  }
  stagePendingImages(records: PendingImageStageRecord[]): void {
    for (const record of records) {
      this.db.run(`
        INSERT INTO pending_images (id, batch_id, asset_group_id, file_name, mime_type, original_width, original_height, original_size_bytes, hash, caption, description, tags_json, temp_storage_path, processing_status, review_status, reviewer_note, source_type, created_at)
        VALUES ('${escapeSqlString(record.id)}', '${escapeSqlString(record.batchId)}', '${escapeSqlString(record.assetGroupId)}', '${escapeSqlString(record.fileName)}', ${nullableText(record.mimeType)}, ${nullableNumber(record.originalWidth)}, ${nullableNumber(record.originalHeight)}, ${nullableNumber(record.originalSizeBytes)}, ${nullableText(record.hash)}, ${nullableText(record.caption)}, ${nullableText(record.description)}, ${nullableText(record.tagsJson)}, ${nullableText(record.tempStoragePath)}, '${escapeSqlString(record.processingStatus)}', '${escapeSqlString(record.reviewStatus)}', ${nullableText(record.reviewerNote)}, ${nullableText(record.sourceType)}, '${escapeSqlString(record.createdAt)}')
      `);
    }
  }

  stagePendingItemImageLinks(records: PendingItemImageLinkStageRecord[]): void {
    for (const record of records) {
      this.db.run(`
        INSERT INTO pending_item_image_links (id, pending_item_type, pending_item_id, pending_image_id, display_order, link_role, created_at)
        VALUES ('${escapeSqlString(record.id)}', '${escapeSqlString(record.pendingItemType)}', '${escapeSqlString(record.pendingItemId)}', '${escapeSqlString(record.pendingImageId)}', ${record.displayOrder}, ${nullableText(record.linkRole)}, '${escapeSqlString(record.createdAt)}')
      `);
    }
  }
}

