import type { Database } from "sql.js";

import { escapeSqlString, readFirstRow, readRows } from "./sqliteHelpers";

export interface PendingWordCommitRecord {
  id: string;
  rawWord: string;
  normalizedWord: string;
  lemma?: string;
  partOfSpeech?: string;
  languageCategory?: string;
  chineseMeaning?: string;
  englishDefinition?: string;
  confidenceScore?: number;
  sourceSection?: string;
  sourceSentence?: string;
}

export interface PendingPhraseCommitRecord {
  id: string;
  rawPhrase: string;
  normalizedPhrase: string;
  phraseType?: string;
  functionType?: string;
  scenarioType?: string;
  chineseMeaning?: string;
  explanation?: string;
  confidenceScore?: number;
  sourceSection?: string;
  sourceSentence?: string;
}

export interface PendingSentenceCommitRecord {
  id: string;
  rawSentence: string;
  normalizedSentence: string;
  sentenceType?: string;
  functionType?: string;
  scenarioType?: string;
  chineseLiteral?: string;
  chineseNatural?: string;
  reusableScore?: number;
  confidenceScore?: number;
  sourceSection?: string;
  sourceSentence?: string;
}

export interface PendingGeoMaterialCommitRecord {
  id: string;
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
  sourceSection?: string;
  sourceSentence?: string;
}

export interface PendingGeoFeatureCommitRecord {
  id: string;
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
  sourceSection?: string;
  sourceSentence?: string;
}

export interface PendingStrategyCommitRecord {
  id: string;
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
  sourceSection?: string;
  sourceSentence?: string;
}

export interface PendingApprovedImageRecord {
  id: string;
  fileName: string;
  mimeType?: string;
  originalWidth?: number;
  originalHeight?: number;
  originalSizeBytes?: number;
  hash?: string;
  caption?: string;
  description?: string;
  tagsJson?: string;
  sourceType?: string;
  tempStoragePath?: string;
}

export interface PendingApprovedImageLinkRecord {
  pendingItemType: string;
  pendingItemId: string;
  pendingImageId: string;
  linkRole?: string;
}

function asNumber(value: unknown): number | undefined {
  return value == null ? undefined : Number(value);
}

function asString(value: unknown): string | undefined {
  return value == null ? undefined : String(value);
}

function mapWord(row: Record<string, unknown>): PendingWordCommitRecord {
  return {
    id: String(row.id),
    rawWord: String(row.raw_word),
    normalizedWord: String(row.normalized_word),
    lemma: asString(row.lemma),
    partOfSpeech: asString(row.part_of_speech),
    languageCategory: asString(row.language_category),
    chineseMeaning: asString(row.chinese_meaning),
    englishDefinition: asString(row.english_definition),
    confidenceScore: asNumber(row.confidence_score),
    sourceSection: asString(row.source_section),
    sourceSentence: asString(row.source_sentence)
  };
}

function mapPhrase(row: Record<string, unknown>): PendingPhraseCommitRecord {
  return {
    id: String(row.id),
    rawPhrase: String(row.raw_phrase),
    normalizedPhrase: String(row.normalized_phrase),
    phraseType: asString(row.phrase_type),
    functionType: asString(row.function_type),
    scenarioType: asString(row.scenario_type),
    chineseMeaning: asString(row.chinese_meaning),
    explanation: asString(row.explanation),
    confidenceScore: asNumber(row.confidence_score),
    sourceSection: asString(row.source_section),
    sourceSentence: asString(row.source_sentence)
  };
}

function mapSentence(row: Record<string, unknown>): PendingSentenceCommitRecord {
  return {
    id: String(row.id),
    rawSentence: String(row.raw_sentence),
    normalizedSentence: String(row.normalized_sentence),
    sentenceType: asString(row.sentence_type),
    functionType: asString(row.function_type),
    scenarioType: asString(row.scenario_type),
    chineseLiteral: asString(row.chinese_literal),
    chineseNatural: asString(row.chinese_natural),
    reusableScore: asNumber(row.reusable_score),
    confidenceScore: asNumber(row.confidence_score),
    sourceSection: asString(row.source_section),
    sourceSentence: asString(row.source_sentence)
  };
}

function mapGeoMaterial(row: Record<string, unknown>): PendingGeoMaterialCommitRecord {
  return {
    id: String(row.id),
    rawName: String(row.raw_name),
    normalizedName: String(row.normalized_name),
    chineseName: asString(row.chinese_name),
    geoMaterialCategory: asString(row.geo_material_category),
    geoMaterialSubtype: asString(row.geo_material_subtype),
    description: asString(row.description),
    identificationMethod: asString(row.identification_method),
    distinguishingPoints: asString(row.distinguishing_points),
    commonMisidentifications: asString(row.common_misidentifications),
    engineeringSignificance: asString(row.engineering_significance),
    commonRisks: asString(row.common_risks),
    commonTreatments: asString(row.common_treatments),
    australiaContext: asString(row.australia_context),
    sourceSection: asString(row.source_section),
    sourceSentence: asString(row.source_sentence)
  };
}

function mapGeoFeature(row: Record<string, unknown>): PendingGeoFeatureCommitRecord {
  return {
    id: String(row.id),
    rawName: String(row.raw_name),
    normalizedName: String(row.normalized_name),
    chineseName: asString(row.chinese_name),
    geoFeatureCategory: asString(row.geo_feature_category),
    geoFeatureSubtype: asString(row.geo_feature_subtype),
    description: asString(row.description),
    identificationMethod: asString(row.identification_method),
    distinguishingPoints: asString(row.distinguishing_points),
    commonCauses: asString(row.common_causes),
    riskImplications: asString(row.risk_implications),
    treatmentOrMitigation: asString(row.treatment_or_mitigation),
    reportingExpressions: asString(row.reporting_expressions),
    inspectionPoints: asString(row.inspection_points),
    sourceSection: asString(row.source_section),
    sourceSentence: asString(row.source_sentence)
  };
}

function mapStrategy(row: Record<string, unknown>): PendingStrategyCommitRecord {
  return {
    id: String(row.id),
    rawName: String(row.raw_name),
    normalizedName: String(row.normalized_name),
    chineseName: asString(row.chinese_name),
    strategyCategory: asString(row.strategy_category),
    description: asString(row.description),
    stepsOrMethod: asString(row.steps_or_method),
    applicationConditions: asString(row.application_conditions),
    limitations: asString(row.limitations),
    linkedReportingExpression: asString(row.linked_reporting_expression),
    monitoringNotes: asString(row.monitoring_notes),
    sourceSection: asString(row.source_section),
    sourceSentence: asString(row.source_sentence)
  };
}

export class SqlitePendingCommitRepository {
  constructor(private readonly db: Database) {}

  listApprovedWords(batchId: string): PendingWordCommitRecord[] {
    return readRows(this.db, `SELECT * FROM pending_words WHERE batch_id = '${escapeSqlString(batchId)}' AND review_status = 'approved'`).map(mapWord);
  }

  listApprovedPhrases(batchId: string): PendingPhraseCommitRecord[] {
    return readRows(this.db, `SELECT * FROM pending_phrases WHERE batch_id = '${escapeSqlString(batchId)}' AND review_status = 'approved'`).map(mapPhrase);
  }

  listApprovedSentences(batchId: string): PendingSentenceCommitRecord[] {
    return readRows(this.db, `SELECT * FROM pending_sentences WHERE batch_id = '${escapeSqlString(batchId)}' AND review_status = 'approved'`).map(mapSentence);
  }

  listApprovedGeoMaterials(batchId: string): PendingGeoMaterialCommitRecord[] {
    return readRows(this.db, `SELECT * FROM pending_geo_materials WHERE batch_id = '${escapeSqlString(batchId)}' AND review_status = 'approved'`).map(mapGeoMaterial);
  }

  listApprovedGeoFeatures(batchId: string): PendingGeoFeatureCommitRecord[] {
    return readRows(this.db, `SELECT * FROM pending_geo_features WHERE batch_id = '${escapeSqlString(batchId)}' AND review_status = 'approved'`).map(mapGeoFeature);
  }

  listApprovedStrategies(batchId: string): PendingStrategyCommitRecord[] {
    return readRows(this.db, `SELECT * FROM pending_strategies WHERE batch_id = '${escapeSqlString(batchId)}' AND review_status = 'approved'`).map(mapStrategy);
  }

  listApprovedImages(batchId: string): PendingApprovedImageRecord[] {
    return readRows(this.db, `SELECT * FROM pending_images WHERE batch_id = '${escapeSqlString(batchId)}' AND review_status = 'approved' AND processing_status = 'processed'`).map((row) => ({
      id: String(row.id),
      fileName: String(row.file_name),
      mimeType: asString(row.mime_type),
      originalWidth: asNumber(row.original_width),
      originalHeight: asNumber(row.original_height),
      originalSizeBytes: asNumber(row.original_size_bytes),
      hash: asString(row.hash),
      caption: asString(row.caption),
      description: asString(row.description),
      tagsJson: asString(row.tags_json),
      sourceType: asString(row.source_type),
      tempStoragePath: asString(row.temp_storage_path)
    }));
  }

  listApprovedImageLinks(batchId: string): PendingApprovedImageLinkRecord[] {
    return readRows(
      this.db,
      `
      SELECT l.pending_item_type, l.pending_item_id, l.pending_image_id, l.link_role
      FROM pending_item_image_links l
      INNER JOIN pending_images i ON i.id = l.pending_image_id
      WHERE i.batch_id = '${escapeSqlString(batchId)}' AND i.review_status = 'approved' AND i.processing_status = 'processed'
      `
    ).map((row) => ({
      pendingItemType: String(row.pending_item_type),
      pendingItemId: String(row.pending_item_id),
      pendingImageId: String(row.pending_image_id),
      linkRole: asString(row.link_role)
    }));
  }

  countByStatus(batchId: string, reviewStatus: string): number {
    const unionSql = `
      SELECT COUNT(*) AS count_value FROM pending_words WHERE batch_id = '${escapeSqlString(batchId)}' AND review_status = '${escapeSqlString(reviewStatus)}'
      UNION ALL
      SELECT COUNT(*) AS count_value FROM pending_phrases WHERE batch_id = '${escapeSqlString(batchId)}' AND review_status = '${escapeSqlString(reviewStatus)}'
      UNION ALL
      SELECT COUNT(*) AS count_value FROM pending_sentences WHERE batch_id = '${escapeSqlString(batchId)}' AND review_status = '${escapeSqlString(reviewStatus)}'
      UNION ALL
      SELECT COUNT(*) AS count_value FROM pending_geo_materials WHERE batch_id = '${escapeSqlString(batchId)}' AND review_status = '${escapeSqlString(reviewStatus)}'
      UNION ALL
      SELECT COUNT(*) AS count_value FROM pending_geo_features WHERE batch_id = '${escapeSqlString(batchId)}' AND review_status = '${escapeSqlString(reviewStatus)}'
      UNION ALL
      SELECT COUNT(*) AS count_value FROM pending_strategies WHERE batch_id = '${escapeSqlString(batchId)}' AND review_status = '${escapeSqlString(reviewStatus)}'
      UNION ALL
      SELECT COUNT(*) AS count_value FROM pending_images WHERE batch_id = '${escapeSqlString(batchId)}' AND review_status = '${escapeSqlString(reviewStatus)}'
    `;

    return readRows(this.db, unionSql).reduce((sum, row) => sum + Number(row.count_value), 0);
  }

  updateBatchCounters(batchId: string): void {
    const approvedCount = this.countByStatus(batchId, "approved");
    const rejectedCount = this.countByStatus(batchId, "rejected");
    const deferredCount = this.countByStatus(batchId, "deferred");
    const unreviewedCount = this.countByStatus(batchId, "unreviewed");
    const pendingCount = deferredCount + unreviewedCount;

    const status = unreviewedCount === 0 ? "completed" : "review_in_progress";

    this.db.run(`
      UPDATE import_batches
      SET approved_items = ${approvedCount},
          rejected_items = ${rejectedCount},
          pending_items = ${pendingCount},
          import_status = '${status}'
      WHERE id = '${escapeSqlString(batchId)}'
    `);
  }

  getBatchMeta(batchId: string): Record<string, unknown> | undefined {
    return readFirstRow(this.db, `SELECT * FROM import_batches WHERE id = '${escapeSqlString(batchId)}'`);
  }
}
