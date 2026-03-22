import { BackupService, type SnapshotDescriptor } from "../backup/backupService";
import { ImagePipeline, type ImageProcessingInput, type ProcessedImageAsset } from "../images/imagePipeline";
import { RuleEngine } from "../rules/ruleEngine";
import type { RuleSet } from "../../domain/models/types";
import { DuplicateDetectionService } from "./duplicateDetection";
import { ImportInputAcquisitionService } from "./inputAcquisition";
import { KnowledgePackImporter } from "./knowledgePackImporter";
import { PendingNormalizationService } from "./pendingNormalization";
import type {
  DuplicateCandidate,
  ImportAcquiredPayload,
  ImportBatchFinalization,
  ImportBatchState,
  ImportValidationReport,
  PendingStageResult,
  ReviewQueueSummary
} from "./pipelineTypes";
import { ReviewQueueBuilder } from "./reviewQueueBuilder";
import { ImportValidationService } from "./importValidation";

export interface ImportOrchestrationInput {
  sourceFileName: string;
  rawJson: string;
  images: ImageProcessingInput[];
  rulesets: RuleSet[];
  keepOriginalImages: boolean;
  inputFormat?: "json" | "zip";
}

export interface ImportOrchestrationResult {
  batchId: string;
  batchState: ImportBatchState;
  acquiredPayload: ImportAcquiredPayload;
  validationReport: ImportValidationReport;
  snapshot?: SnapshotDescriptor;
  stagedPending: PendingStageResult | undefined;
  processedImages: ProcessedImageAsset[];
  duplicateHints: DuplicateCandidate[];
  reviewQueues: ReviewQueueSummary | undefined;
  normalizationWarnings: string[];
  appliedRuleIds: string[];
  finalization: ImportBatchFinalization;
}

export class ImportPipeline {
  constructor(
    private readonly acquisitionService = new ImportInputAcquisitionService(),
    private readonly validationService = new ImportValidationService(),
    private readonly importer = new KnowledgePackImporter(),
    private readonly backupService = new BackupService(),
    private readonly normalizationService = new PendingNormalizationService(),
    private readonly duplicateDetectionService = new DuplicateDetectionService(),
    private readonly reviewQueueBuilder = new ReviewQueueBuilder(),
    private readonly imagePipeline = new ImagePipeline(),
    private readonly ruleEngine = new RuleEngine()
  ) {}

  async run(input: ImportOrchestrationInput): Promise<ImportOrchestrationResult> {
    const acquiredPayload = input.inputFormat === "zip"
      ? this.acquisitionService.acquireFromZip(input.sourceFileName, input.rawJson, input.images.map((image) => image.fileName))
      : this.acquisitionService.acquireFromJson(input.sourceFileName, input.rawJson);

    const validationReport = this.validationService.validate(acquiredPayload.rawJson);
    if (validationReport.state === "invalid") {
      return {
        batchId: "unassigned",
        batchState: "validation_failed",
        acquiredPayload,
        validationReport,
        stagedPending: undefined,
        processedImages: [],
        duplicateHints: [],
        reviewQueues: undefined,
        normalizationWarnings: [],
        appliedRuleIds: [],
        finalization: {
          finalState: "failed",
          approvedCount: 0,
          rejectedCount: 0,
          warningCount: validationReport.warnings.length,
          imageSummary: "No image processing started.",
          duplicateSummary: "Validation failed before duplicate detection."
        }
      };
    }

    const snapshot = this.backupService.createSnapshotDescriptor("auto_pre_import", "1");
    const prepared = this.importer.prepareImport(acquiredPayload.rawJson, input.rulesets);

    const batchId = prepared.pack.pack_id;
    const normalizedCandidates = this.normalizationService.normalize(prepared.pack);
    const stagedPending: PendingStageResult = {
      batchId,
      candidates: normalizedCandidates,
      stagedCounts: {
        words: prepared.pack.items.words.length,
        phrases: prepared.pack.items.phrases.length,
        sentences: prepared.pack.items.sentences.length,
        geo_materials: prepared.pack.items.geo_materials.length,
        geo_features: prepared.pack.items.geo_features.length,
        strategies: prepared.pack.items.strategies.length,
        images: prepared.pack.images.length
      },
      transactionGroup: "batch_and_pending_staging"
    };

    const processedImages: ProcessedImageAsset[] = [];
    const imageWarnings = [...validationReport.warnings];
    for (const image of input.images) {
      try {
        processedImages.push(await this.imagePipeline.process(image, input.keepOriginalImages));
      } catch (error) {
        imageWarnings.push({
          code: "partial_image_failure",
          message: error instanceof Error ? error.message : `Image processing failed for ${image.fileName}.`,
          itemType: "image",
          itemId: image.id,
          phase: "image_processing"
        });
      }
    }

    const duplicateHints = this.duplicateDetectionService.detect(normalizedCandidates);
    const ruleResult = this.ruleEngine.execute(input.rulesets, {
      pack: prepared.pack,
      now: new Date().toISOString()
    });
    const reviewQueues = this.reviewQueueBuilder.build(
      normalizedCandidates,
      duplicateHints,
      imageWarnings.filter((warning) => warning.code === "partial_image_failure").length
    );

    const finalization: ImportBatchFinalization = {
      finalState: imageWarnings.length > 0 ? "completed_with_warnings" : "review_in_progress",
      approvedCount: 0,
      rejectedCount: 0,
      warningCount: imageWarnings.length,
      imageSummary: `${processedImages.length} images processed, ${imageWarnings.filter((warning) => warning.code === "partial_image_failure").length} warnings.`,
      duplicateSummary: `${duplicateHints.filter((hint) => hint.duplicateStatus !== "none").length} duplicate candidates flagged.`
    };

    return {
      batchId,
      batchState: "ready_for_review",
      acquiredPayload,
      validationReport: {
        ...validationReport,
        warnings: imageWarnings
      },
      snapshot,
      stagedPending,
      processedImages,
      duplicateHints,
      reviewQueues,
      normalizationWarnings: ruleResult.normalizationWarnings,
      appliedRuleIds: prepared.appliedRuleIds,
      finalization
    };
  }
}
