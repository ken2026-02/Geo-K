import type { Database } from "sql.js";

import { persistDatabase } from "../../data/db/database";
import type { ImportBatchRecord } from "../../data/repositories/interfaces";
import { SqliteImportBatchRepository } from "../../data/repositories/sqlite/importBatchRepository";
import {
  SqlitePendingStagingRepository,
  type PendingGeoFeatureStageRecord,
  type PendingGeoMaterialStageRecord,
  type PendingImageStageRecord,
  type PendingItemImageLinkStageRecord,
  type PendingPhraseStageRecord,
  type PendingSentenceStageRecord,
  type PendingStrategyStageRecord,
  type PendingWordStageRecord
} from "../../data/repositories/sqlite/pendingStagingRepository";
import { KnowledgePackImporter } from "../../features/import/knowledgePackImporter";
import { ImagePipeline } from "../../features/images/imagePipeline";
import { ImportValidationService } from "../../features/import/importValidation";
import type { ImportErrorDetail, ImportValidationReport } from "../../features/import/pipelineTypes";
import type { KnowledgePack } from "../../features/import/types";
import { BackupOrchestrationService } from "../backup/backupOrchestrationService";
import { ImageVariantStorageService } from "../images/imageVariantStorageService";
import { PerformanceMetricsService } from "../performance/performanceMetricsService";

export interface JsonImportResult {
  batch: ImportBatchRecord;
  validationReport: ImportValidationReport;
  imageSummary: {
    processed: number;
    failed: number;
    missing: number;
  };
}

export interface ImportFailureInfo {
  phase: "validation" | "staging";
  message: string;
  validationReport: ImportValidationReport;
  errors: ImportErrorDetail[];
  attemptedBatch?: Pick<ImportBatchRecord, "id" | "batchName" | "schemaVersion" | "sourceReportId">;
}

export class ImportExecutionError extends Error {
  constructor(public readonly failure: ImportFailureInfo) {
    super(failure.message);
    this.name = "ImportExecutionError";
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}-${nowIso()}-${Math.random().toString(16).slice(2, 8)}`;
}

function confidenceBand(confidence?: number): string {
  if (confidence == null) {
    return "unknown";
  }
  if (confidence >= 0.85) {
    return "high";
  }
  if (confidence >= 0.6) {
    return "medium";
  }
  return "low";
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function mapLinkedItemType(type: string): string | undefined {
  switch (type) {
    case "word":
      return "pending_word";
    case "phrase":
      return "pending_phrase";
    case "sentence":
      return "pending_sentence";
    case "geo_material":
      return "pending_geo_material";
    case "geo_feature":
      return "pending_geo_feature";
    case "strategy":
      return "pending_strategy";
    default:
      return undefined;
  }
}

async function hashBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

export class JsonKnowledgePackImportService {
  private readonly validationService = new ImportValidationService();
  private readonly importer = new KnowledgePackImporter();
  private readonly imagePipeline = new ImagePipeline();
  private readonly imageStorageService = new ImageVariantStorageService();
  private readonly backupService = new BackupOrchestrationService();
  private readonly performanceService = new PerformanceMetricsService();

  async validate(rawJson: string): Promise<ImportValidationReport> {
    return this.validationService.validate(rawJson);
  }

  async importIntoPending(db: Database, sourceFileName: string, rawJson: string, imageFiles: Map<string, Blob> = new Map<string, Blob>()): Promise<JsonImportResult> {
    return this.performanceService.measure("import", { sourceFileName }, async () => {
      const validationReport = await this.validate(rawJson);
      if (validationReport.state === "invalid") {
        throw new ImportExecutionError({
          phase: "validation",
          message: "Knowledge pack validation failed.",
          validationReport,
          errors: validationReport.errors
        });
      }

      const prepared = this.importer.prepareImport(rawJson, []);
      const importedAt = nowIso();
      const importSessionId = createId("import");
      const importBatchRepository = new SqliteImportBatchRepository(db);
      const pendingStagingRepository = new SqlitePendingStagingRepository(db);

      const existingBatch = await importBatchRepository.findDuplicate(prepared.pack.source_report.report_id);
      if (existingBatch) {
        throw new Error(`A batch for report ID "${prepared.pack.source_report.report_id}" is already in progress (ID: ${existingBatch.id}). Please complete or delete the existing batch before re-importing.`);
      }

      const totalItems =
        prepared.pack.statistics.words +
        prepared.pack.statistics.phrases +
        prepared.pack.statistics.sentences +
        prepared.pack.statistics.geo_materials +
        prepared.pack.statistics.geo_features +
        prepared.pack.statistics.strategies +
        (prepared.pack.images?.length ?? 0);

      const batchId = `${prepared.pack.pack_id}-${importSessionId}`;

      const batch: ImportBatchRecord = {
        id: batchId,
        batchName: prepared.pack.source_report.title,
        sourceFileName,
        sourceFileType: sourceFileName.toLowerCase().endsWith(".zip") ? "zip" : "json",
        schemaVersion: prepared.pack.schema_version,
        importedAt,
        importStatus: "review_in_progress",
        validationStatus: validationReport.state,
        totalItems,
        pendingItems: totalItems,
        approvedItems: 0,
        rejectedItems: 0,
        sourceReportId: prepared.pack.source_report.report_id,
        sourceReportTitle: prepared.pack.source_report.title,
        sourceReportProject: prepared.pack.source_report.project,
        sourceReportDiscipline: prepared.pack.source_report.discipline,
        sourceReportAuthor: prepared.pack.source_report.author,
        sourceReportOrganization: prepared.pack.source_report.organization,
        sourceReportDate: prepared.pack.source_report.date,
        sourceReportFileName: prepared.pack.source_report.file_name,
        warningsJson: validationReport.warnings.length > 0 ? JSON.stringify(validationReport.warnings) : undefined,
        notes: prepared.pack.source_report.notes
      };

      await this.backupService.createPreImportSnapshot(db);

      try {
        db.exec("BEGIN TRANSACTION;");
        await importBatchRepository.insert(batch);
        pendingStagingRepository.stageWords(this.mapWords(batch.id, prepared.pack, importSessionId));
        pendingStagingRepository.stagePhrases(this.mapPhrases(batch.id, prepared.pack, importSessionId));
        pendingStagingRepository.stageSentences(this.mapSentences(batch.id, prepared.pack, importSessionId));
        pendingStagingRepository.stageGeoMaterials(this.mapGeoMaterials(batch.id, prepared.pack, importSessionId));
        pendingStagingRepository.stageGeoFeatures(this.mapGeoFeatures(batch.id, prepared.pack, importSessionId));
        pendingStagingRepository.stageStrategies(this.mapStrategies(batch.id, prepared.pack, importSessionId));
        db.exec("COMMIT;");
      } catch (error) {
        db.exec("ROLLBACK;");
        throw new ImportExecutionError({
          phase: "staging",
          message: "Pending staging failed and the transaction was rolled back.",
          validationReport,
          errors: [
            {
              code: "transaction_error",
              message: error instanceof Error ? error.message : "Unknown staging transaction failure.",
              phase: "staging"
            }
          ],
          attemptedBatch: {
            id: batch.id,
            batchName: batch.batchName,
            schemaVersion: batch.schemaVersion,
            sourceReportId: batch.sourceReportId
          }
        });
      }

      const imageSummary = await this.processPendingImages(db, batch.id, prepared.pack, imageFiles, validationReport, importSessionId);

      await persistDatabase(db);
      return { batch, validationReport, imageSummary };
    });
  }

  private async processPendingImages(
    db: Database,
    batchId: string,
    pack: KnowledgePack,
    imageFiles: Map<string, Blob>,
    validationReport: ImportValidationReport,
    importSessionId: string
  ): Promise<{ processed: number; failed: number; missing: number }> {
    const pendingStagingRepository = new SqlitePendingStagingRepository(db);
    const pendingImages: PendingImageStageRecord[] = [];
    const pendingLinks: PendingItemImageLinkStageRecord[] = [];

    let processed = 0;
    let failed = 0;
    let missing = 0;

    for (const image of pack.images) {
      const sourceBlob = imageFiles.get(image.file_name);
      const imageId = `${image.id}-${importSessionId}`;
      if (!sourceBlob) {
        missing += 1;
        pendingImages.push({
          id: imageId,
          batchId,
          assetGroupId: imageId,
          fileName: image.file_name,
          caption: image.caption,
          description: image.description,
          tagsJson: image.tags.length > 0 ? JSON.stringify(image.tags) : undefined,
          processingStatus: "failed",
          reviewStatus: "rejected",
          reviewerNote: `Missing image file: ${image.file_name}`,
          sourceType: image.source_type,
          createdAt: nowIso()
        });
        validationReport.warnings.push({
          code: "missing_image_file",
          message: `Missing image file: ${image.file_name}`,
          itemType: "image",
          itemId: imageId,
          phase: "image_processing"
        });
        continue;
      }

      try {
        const preferredMime = sourceBlob.type || "image/jpeg";
        const processedAsset = await this.imagePipeline.process(
          { id: imageId, fileName: image.file_name, mimeType: preferredMime, blob: sourceBlob },
          false
        );

        const variantsMeta: Array<{ variant: string; storageKey: string; mimeType: string; width: number; height: number; sizeBytes: number }> = [];

        for (const variant of processedAsset.variants) {
          const saved = await this.imageStorageService.saveVariant(batchId, imageId, variant.variant, variant.blob, variant.mimeType, variant.width, variant.height);
          variantsMeta.push(saved);
        }

        const standard = variantsMeta.find((variant) => variant.variant === "standard") ?? variantsMeta[0];
        const dimensions = variantsMeta.find((variant) => variant.variant === "standard") ?? variantsMeta[0];

        pendingImages.push({
          id: imageId,
          batchId,
          assetGroupId: imageId,
          fileName: image.file_name,
          mimeType: standard?.mimeType,
          originalWidth: dimensions?.width,
          originalHeight: dimensions?.height,
          originalSizeBytes: sourceBlob.size,
          hash: await hashBlob(sourceBlob),
          caption: image.caption,
          description: image.description,
          tagsJson: image.tags.length > 0 ? JSON.stringify(image.tags) : undefined,
          tempStoragePath: JSON.stringify({ variants: variantsMeta }),
          processingStatus: "processed",
          reviewStatus: "unreviewed",
          sourceType: image.source_type,
          createdAt: nowIso()
        });

        image.linked_items.forEach((linkedItem, index) => {
          const pendingItemType = mapLinkedItemType(linkedItem.item_type);
          if (!pendingItemType) {
            return;
          }

          pendingLinks.push({
            id: createId("pending-img-link"),
            pendingItemType,
            pendingItemId: `${linkedItem.item_id}-${importSessionId}`,
            pendingImageId: imageId,
            displayOrder: index,
            linkRole: "source_image",
            createdAt: nowIso()
          });
        });

        processed += 1;
      } catch (error) {
        failed += 1;
        pendingImages.push({
          id: imageId,
          batchId,
          assetGroupId: imageId,
          fileName: image.file_name,
          caption: image.caption,
          description: image.description,
          tagsJson: image.tags.length > 0 ? JSON.stringify(image.tags) : undefined,
          processingStatus: "failed",
          reviewStatus: "rejected",
          reviewerNote: error instanceof Error ? error.message : "Image processing failed.",
          sourceType: image.source_type,
          createdAt: nowIso()
        });
        validationReport.warnings.push({
          code: "partial_image_failure",
          message: `Image processing failed for ${image.file_name}`,
          itemType: "image",
          itemId: imageId,
          phase: "image_processing"
        });
      }
    }

    if (pendingImages.length > 0 || pendingLinks.length > 0) {
      db.exec("BEGIN TRANSACTION;");
      try {
        pendingStagingRepository.stagePendingImages(pendingImages);
        pendingStagingRepository.stagePendingItemImageLinks(pendingLinks);
        db.exec("COMMIT;");
      } catch (error) {
        db.exec("ROLLBACK;");
        validationReport.warnings.push({
          code: "partial_image_failure",
          message: error instanceof Error ? error.message : "Pending image metadata registration failed.",
          phase: "image_processing"
        });
      }
    }

    return { processed, failed, missing };
  }

  private mapWords(batchId: string, pack: KnowledgePack, importSessionId: string): PendingWordStageRecord[] {
    return pack.items.words.map((word) => ({
      id: `${word.id}-${importSessionId}`,
      batchId,
      sourceReportId: pack.source_report.report_id,
      rawWord: word.canonical_word,
      normalizedWord: normalizeText(word.canonical_word),
      lemma: word.lemma,
      partOfSpeech: word.part_of_speech,
      languageCategory: word.language_category,
      chineseMeaning: word.chinese_meaning,
      englishDefinition: word.english_definition,
      exampleSentence: word.example_sentence,
      confidenceScore: word.confidence,
      confidenceBand: confidenceBand(word.confidence),
      sourceSection: word.source_ref.section,
      sourceSentence: word.source_ref.sentence,
      createdAt: nowIso()
    }));
  }

  private mapPhrases(batchId: string, pack: KnowledgePack, importSessionId: string): PendingPhraseStageRecord[] {
    return pack.items.phrases.map((phrase) => ({
      id: `${phrase.id}-${importSessionId}`,
      batchId,
      sourceReportId: pack.source_report.report_id,
      rawPhrase: phrase.canonical_phrase,
      normalizedPhrase: normalizeText(phrase.canonical_phrase),
      phraseType: phrase.phrase_type,
      functionType: phrase.function_type,
      scenarioType: phrase.scenario_type,
      chineseMeaning: phrase.chinese_meaning,
      explanation: phrase.explanation,
      exampleSentence: phrase.example_sentence,
      confidenceScore: phrase.confidence,
      confidenceBand: confidenceBand(phrase.confidence),
      sourceSection: phrase.source_ref.section,
      sourceSentence: phrase.source_ref.sentence,
      createdAt: nowIso()
    }));
  }

  private mapSentences(batchId: string, pack: KnowledgePack, importSessionId: string): PendingSentenceStageRecord[] {
    return pack.items.sentences.map((sentence) => ({
      id: `${sentence.id}-${importSessionId}`,
      batchId,
      sourceReportId: pack.source_report.report_id,
      rawSentence: sentence.canonical_sentence,
      normalizedSentence: normalizeText(sentence.canonical_sentence),
      sentenceType: sentence.sentence_type,
      functionType: sentence.function_type,
      scenarioType: sentence.scenario_type,
      chineseLiteral: sentence.chinese_literal,
      chineseNatural: sentence.chinese_natural,
      sectionName: sentence.source_ref.section,
      reusableScore: sentence.reusable_score,
      confidenceScore: sentence.confidence,
      confidenceBand: confidenceBand(sentence.confidence),
      sourceSection: sentence.source_ref.section,
      sourceSentence: sentence.source_ref.sentence,
      createdAt: nowIso()
    }));
  }

  private mapGeoMaterials(batchId: string, pack: KnowledgePack, importSessionId: string): PendingGeoMaterialStageRecord[] {
    return pack.items.geo_materials.map((material) => ({
      id: `${material.id}-${importSessionId}`,
      batchId,
      sourceReportId: pack.source_report.report_id,
      rawName: material.canonical_name,
      normalizedName: normalizeText(material.canonical_name),
      chineseName: material.chinese_name,
      geoMaterialCategory: material.geo_material_category,
      geoMaterialSubtype: material.geo_material_subtype,
      description: material.description,
      identificationMethod: material.identification_method,
      distinguishingPoints: material.distinguishing_points,
      commonMisidentifications: material.common_misidentifications,
      engineeringSignificance: material.engineering_significance,
      commonRisks: material.common_risks,
      commonTreatments: material.common_treatments,
      australiaContext: material.australia_context,
      confidenceScore: material.confidence,
      confidenceBand: confidenceBand(material.confidence),
      sourceSection: material.source_ref.section,
      sourceSentence: material.source_ref.sentence,
      createdAt: nowIso()
    }));
  }

  private mapGeoFeatures(batchId: string, pack: KnowledgePack, importSessionId: string): PendingGeoFeatureStageRecord[] {
    return pack.items.geo_features.map((feature) => ({
      id: `${feature.id}-${importSessionId}`,
      batchId,
      sourceReportId: pack.source_report.report_id,
      rawName: feature.canonical_name,
      normalizedName: normalizeText(feature.canonical_name),
      chineseName: feature.chinese_name,
      geoFeatureCategory: feature.geo_feature_category,
      geoFeatureSubtype: feature.geo_feature_subtype,
      description: feature.description,
      identificationMethod: feature.identification_method,
      distinguishingPoints: feature.distinguishing_points,
      commonCauses: feature.common_causes,
      riskImplications: feature.risk_implications,
      treatmentOrMitigation: feature.treatment_or_mitigation,
      reportingExpressions: feature.reporting_expressions.length > 0 ? JSON.stringify(feature.reporting_expressions) : undefined,
      inspectionPoints: feature.inspection_points,
      confidenceScore: feature.confidence,
      confidenceBand: confidenceBand(feature.confidence),
      sourceSection: feature.source_ref.section,
      sourceSentence: feature.source_ref.sentence,
      createdAt: nowIso()
    }));
  }

  private mapStrategies(batchId: string, pack: KnowledgePack, importSessionId: string): PendingStrategyStageRecord[] {
    return pack.items.strategies.map((strategy) => ({
      id: `${strategy.id}-${importSessionId}`,
      batchId,
      sourceReportId: pack.source_report.report_id,
      rawName: strategy.canonical_name,
      normalizedName: normalizeText(strategy.canonical_name),
      chineseName: strategy.chinese_name,
      strategyCategory: strategy.strategy_category,
      description: strategy.description,
      stepsOrMethod: strategy.steps_or_method,
      applicationConditions: strategy.application_conditions,
      limitations: strategy.limitations,
      confidenceScore: strategy.confidence,
      confidenceBand: confidenceBand(strategy.confidence),
      createdAt: nowIso()
    }));
  }
}


