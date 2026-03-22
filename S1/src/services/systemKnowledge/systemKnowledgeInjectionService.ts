import type { Database } from "sql.js";

import { persistDatabase } from "../../data/db/database";
import { deleteValue, getBlob, setBlob } from "../../data/idb/storage";
import type { BackupSnapshotRecord } from "../../data/repositories/interfaces";
import { SqliteSystemKnowledgeRepository } from "../../data/repositories/sqlite/systemKnowledgeRepository";
import type { ProcessedImageVariant } from "../../features/images/imagePipeline";
import { ImagePipeline } from "../../features/images/imagePipeline";
import type { SystemKnowledgePack } from "../../features/systemKnowledge/types";
import { BackupOrchestrationService } from "../backup/backupOrchestrationService";
import { ImageVariantStorageService } from "../images/imageVariantStorageService";
import { PerformanceMetricsService } from "../performance/performanceMetricsService";
import {
  SystemKnowledgePackValidationService,
  type SystemKnowledgeValidationReport
} from "./systemKnowledgePackValidationService";

export interface SystemKnowledgeInjectionResult {
  packId: string;
  reportId: string;
  snapshotRecord: BackupSnapshotRecord;
  injected: {
    sourceDocuments: number;
    words: number;
    phrases: number;
    sentences: number;
    geoMaterials: number;
    geoFeatures: number;
    strategies: number;
    requirements: number;
    methods: number;
    images: number;
    itemSources: number;
    itemRelations: number;
    itemImageLinks: number;
  };
  validationReport: SystemKnowledgeValidationReport;
}

export class SystemKnowledgeInjectionError extends Error {
  constructor(public readonly validationReport: SystemKnowledgeValidationReport) {
    super(validationReport.errors[0] ?? "System knowledge injection failed.");
    this.name = "SystemKnowledgeInjectionError";
  }
}

interface PreparedVariant {
  rowId: string;
  storageKey: string;
  variant: "thumbnail" | "standard";
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
}

interface PreparedImageAsset {
  imageId: string;
  fileName: string;
  hash: string;
  caption?: string;
  description?: string;
  tagsJson?: string;
  sourceType?: string;
  linkedItems: Array<{ itemType: "geo_material" | "geo_feature" | "strategy"; itemId: string; linkRole?: string }>;
  variants: PreparedVariant[];
}

interface ImagePipelineLike {
  process(input: { id: string; fileName: string; mimeType: string; blob: Blob }, keepOriginal: boolean): Promise<{ id: string; variants: ProcessedImageVariant[] }>;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function stableToken(value?: string): string {
  const source = (value ?? "").trim().toLowerCase();
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function buildSourceId(itemType: string, itemId: string, reportId: string, section?: string, sentence?: string): string {
  return `system-source:${itemType}:${itemId}:${reportId}:${stableToken(section)}:${stableToken(sentence)}`;
}

function buildImageVariantId(imageId: string, variant: "thumbnail" | "standard"): string {
  return `system-image:${imageId}:${variant}`;
}

function buildImageLinkId(itemType: string, itemId: string, imageId: string, linkRole?: string): string {
  return `system-image-link:${itemType}:${itemId}:${imageId}:${linkRole ?? "source_image"}`;
}

async function hashBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

export class SystemKnowledgeInjectionService {
  private readonly validationService: SystemKnowledgePackValidationService;
  private readonly backupService: BackupOrchestrationService;
  private readonly imagePipeline: ImagePipelineLike;
  private readonly imageStorageService: ImageVariantStorageService;
  private readonly performanceService: PerformanceMetricsService;
  private readonly pendingVariantBlobs = new Map<string, Blob>();

  constructor(deps?: {
    validationService?: SystemKnowledgePackValidationService;
    backupService?: BackupOrchestrationService;
    imagePipeline?: ImagePipelineLike;
    imageStorageService?: ImageVariantStorageService;
    performanceService?: PerformanceMetricsService;
  }) {
    this.validationService = deps?.validationService ?? new SystemKnowledgePackValidationService();
    this.backupService = deps?.backupService ?? new BackupOrchestrationService();
    this.imagePipeline = deps?.imagePipeline ?? new ImagePipeline();
    this.imageStorageService = deps?.imageStorageService ?? new ImageVariantStorageService();
    this.performanceService = deps?.performanceService ?? new PerformanceMetricsService();
  }

  validate(rawJson: string): SystemKnowledgeValidationReport {
    return this.validationService.validate(rawJson);
  }

  async inject(db: Database, rawJson: string, imageFiles: Map<string, Blob> = new Map<string, Blob>()): Promise<SystemKnowledgeInjectionResult> {
    return this.performanceService.measure("commit", { mode: "system_knowledge_injection" }, async () => {
      const validationReport = this.validate(rawJson);
      if (validationReport.state === "invalid") {
        throw new SystemKnowledgeInjectionError(validationReport);
      }

      const pack = this.validationService.parse(rawJson);
      this.pendingVariantBlobs.clear();
      const snapshotRecord = await this.backupService.createPreSystemInjectionSnapshot(db);

      const preparedImages = await this.prepareImages(pack, imageFiles);
      const touchedKeys = new Map<string, Blob | undefined>();
      const repository = new SqliteSystemKnowledgeRepository(db);
      const injectedAt = nowIso();

      try {
        db.exec("BEGIN TRANSACTION;");
        try {
          repository.upsertReport({
            id: pack.source_report.id,
            sourceReportId: pack.source_report.source_report_id,
            title: pack.source_report.title,
            documentType: "reference_pack",
            project: pack.source_report.project,
            discipline: pack.source_report.discipline,
            reportDate: pack.source_report.date,
            sourceType: "system_knowledge_pack",
            author: pack.source_report.author,
            organization: pack.source_report.organization,
            summary: pack.source_report.notes,
            createdAt: injectedAt,
            updatedAt: injectedAt
          });

          for (const sourceDocument of pack.source_documents) {
            repository.upsertReport({
              id: sourceDocument.id,
              sourceReportId: sourceDocument.source_report_id,
              title: sourceDocument.title,
              documentType: sourceDocument.document_type,
              documentNumber: sourceDocument.document_number,
              edition: sourceDocument.edition,
              jurisdiction: sourceDocument.jurisdiction,
              authorityLevel: sourceDocument.authority_level,
              documentStatus: sourceDocument.document_status,
              publisher: sourceDocument.publisher,
              sourceUrl: sourceDocument.url,
              project: sourceDocument.project,
              discipline: sourceDocument.discipline,
              reportDate: sourceDocument.date,
              effectiveDate: sourceDocument.effective_date,
              sourceType: "system_source_register",
              author: sourceDocument.author,
              organization: sourceDocument.organization,
              keywordsJson: sourceDocument.keywords.length > 0 ? JSON.stringify(sourceDocument.keywords) : undefined,
              summary: sourceDocument.notes,
              reviewedAt: sourceDocument.reviewed_at,
              createdAt: injectedAt,
              updatedAt: injectedAt
            });
          }

          for (const word of pack.items.words) {
            repository.upsertWord({
              id: word.id,
              canonicalWord: word.canonical_word,
              normalizedWord: normalizeText(word.canonical_word),
              lemma: word.lemma,
              partOfSpeech: word.part_of_speech,
              languageCategory: word.language_category,
              chineseMeaning: word.chinese_meaning,
              englishDefinition: word.english_definition,
              provenanceType: "system_generated",
              firstAddedAt: injectedAt,
              updatedAt: injectedAt
            });
            repository.upsertItemSource({
              id: buildSourceId("word", word.id, word.source_ref.source_document_id ?? pack.source_report.id, word.source_ref.section, word.source_ref.sentence),
              itemType: "word",
              itemId: word.id,
              reportId: word.source_ref.source_document_id ?? pack.source_report.id,
              sourceSection: word.source_ref.section,
              sourceSentence: word.source_ref.sentence,
              sourceExcerpt: word.source_ref.excerpt,
              sourcePageRef: word.source_ref.page,
              sourceParagraphRef: word.source_ref.paragraph,
              createdAt: injectedAt
            });
          }

          for (const phrase of pack.items.phrases) {
            repository.upsertPhrase({
              id: phrase.id,
              canonicalPhrase: phrase.canonical_phrase,
              normalizedPhrase: normalizeText(phrase.canonical_phrase),
              phraseType: phrase.phrase_type,
              functionType: phrase.function_type,
              scenarioType: phrase.scenario_type,
              chineseMeaning: phrase.chinese_meaning,
              explanation: phrase.explanation,
              provenanceType: "system_generated",
              firstAddedAt: injectedAt,
              updatedAt: injectedAt
            });
            repository.upsertItemSource({
              id: buildSourceId("phrase", phrase.id, phrase.source_ref.source_document_id ?? pack.source_report.id, phrase.source_ref.section, phrase.source_ref.sentence),
              itemType: "phrase",
              itemId: phrase.id,
              reportId: phrase.source_ref.source_document_id ?? pack.source_report.id,
              sourceSection: phrase.source_ref.section,
              sourceSentence: phrase.source_ref.sentence,
              sourceExcerpt: phrase.source_ref.excerpt,
              sourcePageRef: phrase.source_ref.page,
              sourceParagraphRef: phrase.source_ref.paragraph,
              createdAt: injectedAt
            });
          }

          for (const sentence of pack.items.sentences) {
            repository.upsertSentence({
              id: sentence.id,
              canonicalSentence: sentence.canonical_sentence,
              normalizedSentence: normalizeText(sentence.canonical_sentence),
              sentenceType: sentence.sentence_type,
              functionType: sentence.function_type,
              scenarioType: sentence.scenario_type,
              chineseLiteral: sentence.chinese_literal,
              chineseNatural: sentence.chinese_natural,
              sectionName: sentence.section_name,
              provenanceType: "system_generated",
              firstAddedAt: injectedAt,
              updatedAt: injectedAt
            });
            repository.upsertItemSource({
              id: buildSourceId("sentence", sentence.id, sentence.source_ref.source_document_id ?? pack.source_report.id, sentence.source_ref.section, sentence.source_ref.sentence),
              itemType: "sentence",
              itemId: sentence.id,
              reportId: sentence.source_ref.source_document_id ?? pack.source_report.id,
              sourceSection: sentence.source_ref.section,
              sourceSentence: sentence.source_ref.sentence,
              sourceExcerpt: sentence.source_ref.excerpt,
              sourcePageRef: sentence.source_ref.page,
              sourceParagraphRef: sentence.source_ref.paragraph,
              createdAt: injectedAt
            });
          }

          for (const material of pack.items.geo_materials) {
            repository.upsertGeoMaterial({
              id: material.id,
              canonicalName: material.canonical_name,
              normalizedName: normalizeText(material.canonical_name),
              chineseName: material.chinese_name,
              category: material.geo_material_category,
              subtype: material.geo_material_subtype,
              description: material.description,
              identificationMethod: material.identification_method,
              distinguishingPoints: material.distinguishing_points,
              commonMisidentifications: material.common_misidentifications,
              engineeringSignificance: material.engineering_significance,
              commonRisks: material.common_risks,
              commonTreatments: material.common_treatments,
              australiaContext: material.australia_context,
              provenanceType: "system_generated",
              firstAddedAt: injectedAt,
              updatedAt: injectedAt
            });
            repository.upsertItemSource({
              id: buildSourceId("geo_material", material.id, material.source_ref.source_document_id ?? pack.source_report.id, material.source_ref.section, material.source_ref.sentence),
              itemType: "geo_material",
              itemId: material.id,
              reportId: material.source_ref.source_document_id ?? pack.source_report.id,
              sourceSection: material.source_ref.section,
              sourceSentence: material.source_ref.sentence,
              sourceExcerpt: material.source_ref.excerpt,
              sourcePageRef: material.source_ref.page,
              sourceParagraphRef: material.source_ref.paragraph,
              createdAt: injectedAt
            });
          }

          for (const feature of pack.items.geo_features) {
            repository.upsertGeoFeature({
              id: feature.id,
              canonicalName: feature.canonical_name,
              normalizedName: normalizeText(feature.canonical_name),
              chineseName: feature.chinese_name,
              category: feature.geo_feature_category,
              subtype: feature.geo_feature_subtype,
              description: feature.description,
              identificationMethod: feature.identification_method,
              distinguishingPoints: feature.distinguishing_points,
              commonCauses: feature.common_causes,
              riskImplications: feature.risk_implications,
              treatmentOrMitigation: feature.treatment_or_mitigation,
              reportingExpressions: feature.reporting_expressions.length > 0 ? JSON.stringify(feature.reporting_expressions) : undefined,
              inspectionPoints: feature.inspection_points,
              provenanceType: "system_generated",
              firstAddedAt: injectedAt,
              updatedAt: injectedAt
            });
            repository.upsertItemSource({
              id: buildSourceId("geo_feature", feature.id, feature.source_ref.source_document_id ?? pack.source_report.id, feature.source_ref.section, feature.source_ref.sentence),
              itemType: "geo_feature",
              itemId: feature.id,
              reportId: feature.source_ref.source_document_id ?? pack.source_report.id,
              sourceSection: feature.source_ref.section,
              sourceSentence: feature.source_ref.sentence,
              sourceExcerpt: feature.source_ref.excerpt,
              sourcePageRef: feature.source_ref.page,
              sourceParagraphRef: feature.source_ref.paragraph,
              createdAt: injectedAt
            });
          }

          for (const strategy of pack.items.strategies) {
            repository.upsertStrategy({
              id: strategy.id,
              canonicalName: strategy.canonical_name,
              normalizedName: normalizeText(strategy.canonical_name),
              chineseName: strategy.chinese_name,
              strategyCategory: strategy.strategy_category,
              description: strategy.description,
              stepsOrMethod: strategy.steps_or_method,
              applicationConditions: strategy.application_conditions,
              limitations: strategy.limitations,
              linkedReportingExpression: strategy.linked_reporting_expression,
              monitoringNotes: strategy.monitoring_notes,
              provenanceType: "system_generated",
              firstAddedAt: injectedAt,
              updatedAt: injectedAt
            });
            repository.upsertItemSource({
              id: buildSourceId("strategy", strategy.id, strategy.source_ref.source_document_id ?? pack.source_report.id, strategy.source_ref.section, strategy.source_ref.sentence),
              itemType: "strategy",
              itemId: strategy.id,
              reportId: strategy.source_ref.source_document_id ?? pack.source_report.id,
              sourceSection: strategy.source_ref.section,
              sourceSentence: strategy.source_ref.sentence,
              sourceExcerpt: strategy.source_ref.excerpt,
              sourcePageRef: strategy.source_ref.page,
              sourceParagraphRef: strategy.source_ref.paragraph,
              createdAt: injectedAt
            });
          }

          for (const requirement of pack.items.requirements) {
            repository.upsertRequirement({
              id: requirement.id,
              sourceDocumentId: requirement.source_ref.source_document_id,
              canonicalName: requirement.canonical_name,
              normalizedName: normalizeText(requirement.canonical_name),
              requirementCategory: requirement.requirement_category,
              jurisdiction: requirement.jurisdiction,
              authorityLevel: requirement.authority_level,
              clauseReference: requirement.clause_reference,
              requirementText: requirement.requirement_text,
              plainLanguageSummary: requirement.plain_language_summary,
              whyItMatters: requirement.why_it_matters,
              triggerConditions: requirement.trigger_conditions,
              verificationMethod: requirement.verification_method,
              tagsJson: requirement.tags.length > 0 ? JSON.stringify(requirement.tags) : undefined,
              provenanceType: "system_generated",
              firstAddedAt: injectedAt,
              updatedAt: injectedAt
            });
            repository.upsertItemSource({
              id: buildSourceId("requirement", requirement.id, requirement.source_ref.source_document_id ?? pack.source_report.id, requirement.source_ref.section, requirement.source_ref.sentence),
              itemType: "requirement",
              itemId: requirement.id,
              reportId: requirement.source_ref.source_document_id ?? pack.source_report.id,
              sourceSection: requirement.source_ref.section,
              sourceSentence: requirement.source_ref.sentence,
              sourceExcerpt: requirement.source_ref.excerpt,
              sourcePageRef: requirement.source_ref.page,
              sourceParagraphRef: requirement.source_ref.paragraph,
              createdAt: injectedAt
            });
          }

          for (const method of pack.items.methods) {
            repository.upsertMethod({
              id: method.id,
              sourceDocumentId: method.source_ref.source_document_id,
              canonicalName: method.canonical_name,
              normalizedName: normalizeText(method.canonical_name),
              methodCategory: method.method_category,
              jurisdiction: method.jurisdiction,
              authorityLevel: method.authority_level,
              purpose: method.purpose,
              procedureSummary: method.procedure_summary,
              inputsOrPrerequisites: method.inputs_or_prerequisites,
              outputsOrResults: method.outputs_or_results,
              limitations: method.limitations,
              tagsJson: method.tags.length > 0 ? JSON.stringify(method.tags) : undefined,
              provenanceType: "system_generated",
              firstAddedAt: injectedAt,
              updatedAt: injectedAt
            });
            repository.upsertItemSource({
              id: buildSourceId("method", method.id, method.source_ref.source_document_id ?? pack.source_report.id, method.source_ref.section, method.source_ref.sentence),
              itemType: "method",
              itemId: method.id,
              reportId: method.source_ref.source_document_id ?? pack.source_report.id,
              sourceSection: method.source_ref.section,
              sourceSentence: method.source_ref.sentence,
              sourceExcerpt: method.source_ref.excerpt,
              sourcePageRef: method.source_ref.page,
              sourceParagraphRef: method.source_ref.paragraph,
              createdAt: injectedAt
            });
          }

          for (const relation of pack.relations) {
            repository.upsertRelation({
              id: relation.id,
              fromItemType: relation.from_item_type,
              fromItemId: relation.from_item_id,
              relationType: relation.relation_type,
              toItemType: relation.to_item_type,
              toItemId: relation.to_item_id,
              confidenceScore: relation.confidence_score,
              createdBy: "system",
              createdAt: injectedAt
            });
          }

          for (const image of preparedImages) {
            for (const variant of image.variants) {
              await this.persistPreparedVariant(pack.pack_id, image.imageId, variant, touchedKeys);
              repository.upsertImage({
                id: variant.rowId,
                assetGroupId: image.imageId,
                fileName: image.fileName,
                mimeType: variant.mimeType,
                originalWidth: variant.width,
                originalHeight: variant.height,
                originalSizeBytes: variant.sizeBytes,
                hash: image.hash,
                variantType: variant.variant,
                storagePath: variant.storageKey,
                caption: image.caption,
                description: image.description,
                tagsJson: image.tagsJson,
                sourceType: image.sourceType,
                provenanceType: "system_generated",
                addedByUser: false,
                createdAt: injectedAt,
                updatedAt: injectedAt
              });
            }

            const standardVariant = image.variants.find((variant) => variant.variant === "standard") ?? image.variants[0];
            for (const linkedItem of image.linkedItems) {
              repository.upsertItemImageLink({
                id: buildImageLinkId(linkedItem.itemType, linkedItem.itemId, image.imageId, linkedItem.linkRole),
                itemType: linkedItem.itemType,
                itemId: linkedItem.itemId,
                imageAssetId: standardVariant.rowId,
                displayOrder: 0,
                linkRole: linkedItem.linkRole ?? "source_image",
                createdAt: injectedAt
              });
            }
          }

          db.exec("COMMIT;");
        } catch (error) {
          db.exec("ROLLBACK;");
          throw error;
        }
      } catch (error) {
        await this.restoreTouchedBlobs(touchedKeys);
        this.pendingVariantBlobs.clear();
        throw error;
      }

      this.pendingVariantBlobs.clear();
      await persistDatabase(db);

      return {
        packId: pack.pack_id,
        reportId: pack.source_report.id,
        snapshotRecord,
        injected: {
          sourceDocuments: pack.source_documents.length,
          words: pack.items.words.length,
          phrases: pack.items.phrases.length,
          sentences: pack.items.sentences.length,
          geoMaterials: pack.items.geo_materials.length,
          geoFeatures: pack.items.geo_features.length,
          strategies: pack.items.strategies.length,
          requirements: pack.items.requirements.length,
          methods: pack.items.methods.length,
          images: preparedImages.reduce((sum, image) => sum + image.variants.length, 0),
          itemSources: pack.items.words.length + pack.items.phrases.length + pack.items.sentences.length + pack.items.geo_materials.length + pack.items.geo_features.length + pack.items.strategies.length + pack.items.requirements.length + pack.items.methods.length,
          itemRelations: pack.relations.length,
          itemImageLinks: preparedImages.reduce((sum, image) => sum + image.linkedItems.length, 0)
        },
        validationReport
      };
    });
  }

  private async prepareImages(pack: SystemKnowledgePack, imageFiles: Map<string, Blob>): Promise<PreparedImageAsset[]> {
    const prepared: PreparedImageAsset[] = [];

    for (const image of pack.images) {
      const sourceBlob = imageFiles.get(image.file_name);
      if (!sourceBlob) {
        throw new Error(`Missing system image file: ${image.file_name}`);
      }

      const processed = await this.imagePipeline.process(
        {
          id: image.id,
          fileName: image.file_name,
          mimeType: sourceBlob.type || "image/jpeg",
          blob: sourceBlob
        },
        false
      );

      const imageHash = await hashBlob(sourceBlob);
      const variants = processed.variants
        .filter((variant): variant is ProcessedImageVariant & { variant: "thumbnail" | "standard" } => variant.variant === "thumbnail" || variant.variant === "standard")
        .map((variant) => ({
          rowId: buildImageVariantId(image.id, variant.variant),
          storageKey: `image:system:${pack.pack_id}:${image.id}:${variant.variant}`,
          variant: variant.variant,
          mimeType: variant.mimeType,
          width: variant.width,
          height: variant.height,
          sizeBytes: variant.blob.size,
          blob: variant.blob
        }));

      if (variants.length === 0) {
        throw new Error(`No approved image variants were generated for ${image.file_name}.`);
      }

      prepared.push({
        imageId: image.id,
        fileName: image.file_name,
        hash: imageHash,
        caption: image.caption,
        description: image.description,
        tagsJson: image.tags.length > 0 ? JSON.stringify(image.tags) : undefined,
        sourceType: image.source_type ?? "imported_from_pack",
        linkedItems: image.linked_items.map((linkedItem) => ({
          itemType: linkedItem.item_type,
          itemId: linkedItem.item_id,
          linkRole: linkedItem.link_role
        })),
        variants: variants.map(({ blob: _blob, ...variant }) => variant)
      });

      for (const variant of variants) {
        this.pendingVariantBlobs.set(variant.storageKey, variant.blob);
      }
    }

    return prepared;
  }

  private async persistPreparedVariant(
    packId: string,
    imageId: string,
    variant: PreparedVariant,
    touchedKeys: Map<string, Blob | undefined>
  ): Promise<void> {
    const blob = this.pendingVariantBlobs.get(variant.storageKey);
    if (!blob) {
      throw new Error(`Missing prepared variant blob for ${variant.storageKey}`);
    }

    if (!touchedKeys.has(variant.storageKey)) {
      touchedKeys.set(variant.storageKey, await getBlob(variant.storageKey));
    }

    await this.imageStorageService.saveVariant(`system:${packId}`, imageId, variant.variant, blob, variant.mimeType, variant.width, variant.height);
  }

  private async restoreTouchedBlobs(touchedKeys: Map<string, Blob | undefined>): Promise<void> {
    for (const [storageKey, previousBlob] of touchedKeys.entries()) {
      if (previousBlob) {
        await setBlob(storageKey, previousBlob);
      } else {
        await deleteValue(storageKey);
      }
    }
  }
}

