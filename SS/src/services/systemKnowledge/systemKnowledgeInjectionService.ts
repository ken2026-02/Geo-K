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
    geoMaterials: number;
    geoFeatures: number;
    strategies: number;
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
              id: buildSourceId("geo_material", material.id, pack.source_report.id, material.source_ref.section, material.source_ref.sentence),
              itemType: "geo_material",
              itemId: material.id,
              reportId: pack.source_report.id,
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
              id: buildSourceId("geo_feature", feature.id, pack.source_report.id, feature.source_ref.section, feature.source_ref.sentence),
              itemType: "geo_feature",
              itemId: feature.id,
              reportId: pack.source_report.id,
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
              id: buildSourceId("strategy", strategy.id, pack.source_report.id, strategy.source_ref.section, strategy.source_ref.sentence),
              itemType: "strategy",
              itemId: strategy.id,
              reportId: pack.source_report.id,
              sourceSection: strategy.source_ref.section,
              sourceSentence: strategy.source_ref.sentence,
              sourceExcerpt: strategy.source_ref.excerpt,
              sourcePageRef: strategy.source_ref.page,
              sourceParagraphRef: strategy.source_ref.paragraph,
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
          geoMaterials: pack.items.geo_materials.length,
          geoFeatures: pack.items.geo_features.length,
          strategies: pack.items.strategies.length,
          images: preparedImages.reduce((sum, image) => sum + image.variants.length, 0),
          itemSources: pack.items.geo_materials.length + pack.items.geo_features.length + pack.items.strategies.length,
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

