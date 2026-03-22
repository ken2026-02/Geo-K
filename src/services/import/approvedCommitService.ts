import type { Database } from "sql.js";

import { persistDatabase } from "../../data/db/database";
import { SqliteApprovedImageRepository } from "../../data/repositories/sqlite/approvedImageRepository";
import { SqliteApprovedLibraryRepository } from "../../data/repositories/sqlite/approvedLibraryRepository";
import { SqlitePendingCommitRepository } from "../../data/repositories/sqlite/pendingCommitRepository";
import { SqliteSystemKnowledgeRepository } from "../../data/repositories/sqlite/systemKnowledgeRepository";
import { PerformanceMetricsService } from "../performance/performanceMetricsService";

export interface CommitBatchSummary {
  batchId: string;
  committed: {
    words: number;
    phrases: number;
    sentences: number;
    geoMaterials: number;
    geoFeatures: number;
    strategies: number;
    images: number;
  };
  relationsCreated: number;
  sourcesLinked: number;
  imageLinksCreated: number;
}

interface StoredVariant {
  variant: string;
  storageKey: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function containsToken(haystack: string, needle: string): boolean {
  if (!needle) {
    return false;
  }
  const pattern = new RegExp(`(^|\\s)${needle.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(\\s|$)`);
  return pattern.test(haystack);
}

function mapPendingItemType(pendingItemType: string): "word" | "phrase" | "sentence" | "geo_material" | "geo_feature" | "strategy" | undefined {
  switch (pendingItemType) {
    case "pending_word":
      return "word";
    case "pending_phrase":
      return "phrase";
    case "pending_sentence":
      return "sentence";
    case "pending_geo_material":
      return "geo_material";
    case "pending_geo_feature":
      return "geo_feature";
    case "pending_strategy":
      return "strategy";
    default:
      return undefined;
  }
}

function parseStoredVariants(tempStoragePath?: string): StoredVariant[] {
  if (!tempStoragePath) {
    return [];
  }

  try {
    const parsed = JSON.parse(tempStoragePath) as { variants?: StoredVariant[] };
    return parsed.variants ?? [];
  } catch {
    return [];
  }
}

export class ApprovedCommitService {
  private readonly performanceService = new PerformanceMetricsService();

  async commitApprovedPendingBatch(db: Database, batchId: string): Promise<CommitBatchSummary> {
    return this.performanceService.measure("commit", { batchId }, async () => {
      const pendingRepository = new SqlitePendingCommitRepository(db);
      const approvedRepository = new SqliteApprovedLibraryRepository(db);
      const approvedImageRepository = new SqliteApprovedImageRepository(db);
      const strategyRepository = new SqliteSystemKnowledgeRepository(db);

      const batchMeta = pendingRepository.getBatchMeta(batchId);
      if (!batchMeta) {
        throw new Error(`Batch not found: ${batchId}`);
      }

      const approvedWords = pendingRepository.listApprovedWords(batchId);
      const approvedPhrases = pendingRepository.listApprovedPhrases(batchId);
      const approvedSentences = pendingRepository.listApprovedSentences(batchId);
      const approvedMaterials = pendingRepository.listApprovedGeoMaterials(batchId);
      const approvedFeatures = pendingRepository.listApprovedGeoFeatures(batchId);
      const approvedStrategies = pendingRepository.listApprovedStrategies(batchId);
      const approvedImages = pendingRepository.listApprovedImages(batchId);
      const approvedImageLinks = pendingRepository.listApprovedImageLinks(batchId);

      let relationsCreated = 0;
      let sourcesLinked = 0;
      let imagesCommitted = 0;
      let imageLinksCreated = 0;

      db.exec("BEGIN TRANSACTION;");
      try {
        const reportId = approvedRepository.ensureReport(batchMeta);
        const pendingToApproved = new Map<string, string>();

        const committedWordIds = approvedWords.map((item) => {
          const id = approvedRepository.upsertWord({
            id: item.id,
            canonicalWord: item.rawWord,
            normalizedWord: item.normalizedWord,
            lemma: item.lemma,
            partOfSpeech: item.partOfSpeech,
            languageCategory: item.languageCategory,
            chineseMeaning: item.chineseMeaning,
            englishDefinition: item.englishDefinition
          });
          pendingToApproved.set(`word:${item.id}`, id);
          approvedRepository.ensureItemSource("word", id, reportId, item.sourceSection, item.sourceSentence);
          sourcesLinked += 1;
          return { id, normalizedWord: item.normalizedWord };
        });

        const committedPhraseIds = approvedPhrases.map((item) => {
          const id = approvedRepository.upsertPhrase({
            canonicalPhrase: item.rawPhrase,
            normalizedPhrase: item.normalizedPhrase,
            phraseType: item.phraseType,
            functionType: item.functionType,
            scenarioType: item.scenarioType,
            chineseMeaning: item.chineseMeaning,
            explanation: item.explanation
          });
          pendingToApproved.set(`phrase:${item.id}`, id);
          approvedRepository.ensureItemSource("phrase", id, reportId, item.sourceSection, item.sourceSentence);
          sourcesLinked += 1;
          return { id, normalizedPhrase: item.normalizedPhrase };
        });

        const committedSentenceIds = approvedSentences.map((item) => {
          const id = approvedRepository.upsertSentence({
            canonicalSentence: item.rawSentence,
            normalizedSentence: item.normalizedSentence,
            sentenceType: item.sentenceType,
            functionType: item.functionType,
            scenarioType: item.scenarioType,
            chineseLiteral: item.chineseLiteral,
            chineseNatural: item.chineseNatural,
            sectionName: item.sourceSection,
            reusableScore: item.reusableScore
          });
          pendingToApproved.set(`sentence:${item.id}`, id);
          approvedRepository.ensureItemSource("sentence", id, reportId, item.sourceSection, item.sourceSentence);
          sourcesLinked += 1;
          return { id, normalizedSentence: item.normalizedSentence };
        });

        const committedMaterialIds = approvedMaterials.map((item) => {
          const id = approvedRepository.upsertGeoMaterial({
            canonicalName: item.rawName,
            normalizedName: item.normalizedName,
            chineseName: item.chineseName,
            category: item.geoMaterialCategory,
            subtype: item.geoMaterialSubtype,
            description: item.description,
            identificationMethod: item.identificationMethod,
            distinguishingPoints: item.distinguishingPoints,
            commonMisidentifications: item.commonMisidentifications,
            engineeringSignificance: item.engineeringSignificance,
            commonRisks: item.commonRisks,
            commonTreatments: item.commonTreatments,
            australiaContext: item.australiaContext
          });
          pendingToApproved.set(`geo_material:${item.id}`, id);
          approvedRepository.ensureItemSource("geo_material", id, reportId, item.sourceSection, item.sourceSentence);
          sourcesLinked += 1;
          return { id, normalizedName: item.normalizedName };
        });

        const committedFeatureIds = approvedFeatures.map((item) => {
          const id = approvedRepository.upsertGeoFeature({
            canonicalName: item.rawName,
            normalizedName: item.normalizedName,
            chineseName: item.chineseName,
            category: item.geoFeatureCategory,
            subtype: item.geoFeatureSubtype,
            description: item.description,
            identificationMethod: item.identificationMethod,
            distinguishingPoints: item.distinguishingPoints,
            commonCauses: item.commonCauses,
            riskImplications: item.riskImplications,
            treatmentOrMitigation: item.treatmentOrMitigation,
            reportingExpressions: item.reportingExpressions,
            inspectionPoints: item.inspectionPoints
          });
          pendingToApproved.set(`geo_feature:${item.id}`, id);
          approvedRepository.ensureItemSource("geo_feature", id, reportId, item.sourceSection, item.sourceSentence);
          sourcesLinked += 1;
          return {
            id,
            normalizedName: item.normalizedName,
            context: normalizeText(`${item.rawName} ${item.description ?? ""} ${item.sourceSentence ?? ""}`)
          };
        });

        const timestamp = new Date().toISOString();
        const committedStrategyIds = approvedStrategies.map((item) => {
          const id = approvedRepository.upsertStrategy({
            canonicalName: item.rawName,
            normalizedName: item.normalizedName,
            chineseName: item.chineseName,
            category: item.strategyCategory,
            description: item.description,
            stepsOrMethod: item.stepsOrMethod,
            applicationConditions: item.applicationConditions,
            limitations: item.limitations,
            linkedReportingExpression: item.linkedReportingExpression,
            monitoringNotes: item.monitoringNotes
          });

          pendingToApproved.set(`strategy:${item.id}`, id);
          approvedRepository.ensureItemSource("strategy", id, reportId, item.sourceSection, item.sourceSentence);
          sourcesLinked += 1;

          return { id, normalizedName: item.normalizedName };
        });

        const allWords = approvedRepository.listWordHeads();
        const allPhrases = approvedRepository.listPhraseHeads();
        const allMaterials = approvedRepository.listGeoMaterialHeads();

        for (const phrase of committedPhraseIds) {
          for (const word of allWords) {
            if (containsToken(phrase.normalizedPhrase, word.normalizedWord)) {
              approvedRepository.ensureRelation("phrase", phrase.id, "contains_word", "word", word.id, 0.8);
              relationsCreated += 1;
            }
          }
        }

        for (const sentence of committedSentenceIds) {
          for (const phrase of allPhrases) {
            if (sentence.normalizedSentence.includes(phrase.normalizedPhrase)) {
              approvedRepository.ensureRelation("sentence", sentence.id, "contains_phrase", "phrase", phrase.id, 0.8);
              relationsCreated += 1;
            }
          }
          for (const word of allWords) {
            if (containsToken(sentence.normalizedSentence, word.normalizedWord)) {
              approvedRepository.ensureRelation("sentence", sentence.id, "contains_word", "word", word.id, 0.75);
              relationsCreated += 1;
            }
          }
        }

        for (const feature of committedFeatureIds) {
          for (const material of allMaterials) {
            if (feature.context.includes(material.normalizedName)) {
              approvedRepository.ensureRelation("geo_feature", feature.id, "related_material", "geo_material", material.id, 0.55);
              relationsCreated += 1;
            }
          }
          for (const strategy of committedStrategyIds) {
            if (feature.context.includes(strategy.normalizedName)) {
              approvedRepository.ensureRelation("geo_feature", feature.id, "recommended_strategy", "strategy", strategy.id, 0.55);
              relationsCreated += 1;
            }
          }
        }

        const standardVariantByPendingImage = new Map<string, string>();
        for (const pendingImage of approvedImages) {
          const variants = parseStoredVariants(pendingImage.tempStoragePath);
          for (const variant of variants) {
            const imageAssetId = `image-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
            approvedImageRepository.insertImageVariant({
              id: imageAssetId,
              assetGroupId: pendingImage.id,
              fileName: pendingImage.fileName,
              mimeType: variant.mimeType,
              originalWidth: variant.width,
              originalHeight: variant.height,
              originalSizeBytes: variant.sizeBytes,
              hash: pendingImage.hash,
              variantType: variant.variant,
              storagePath: variant.storageKey,
              caption: pendingImage.caption,
              description: pendingImage.description,
              tagsJson: pendingImage.tagsJson,
              sourceType: pendingImage.sourceType,
              provenanceType: "imported_ai",
              addedByUser: false,
              createdAt: timestamp,
              updatedAt: timestamp
            });

            imagesCommitted += 1;

            if (variant.variant === "standard") {
              standardVariantByPendingImage.set(pendingImage.id, imageAssetId);
            }
          }
        }

        for (const link of approvedImageLinks) {
          const approvedItemType = mapPendingItemType(link.pendingItemType);
          if (!approvedItemType) {
            continue;
          }
          const approvedItemId = pendingToApproved.get(`${approvedItemType}:${link.pendingItemId}`);
          const imageAssetId = standardVariantByPendingImage.get(link.pendingImageId);
          if (!approvedItemId || !imageAssetId) {
            continue;
          }

          approvedImageRepository.ensureItemImageLink(approvedItemType, approvedItemId, imageAssetId, link.linkRole ?? "source_image");
          imageLinksCreated += 1;
        }

        pendingRepository.updateBatchCounters(batchId);

        db.exec("COMMIT;");
      } catch (error) {
        db.exec("ROLLBACK;");
        throw error;
      }

      await persistDatabase(db);

      return {
        batchId,
        committed: {
          words: approvedWords.length,
          phrases: approvedPhrases.length,
          sentences: approvedSentences.length,
          geoMaterials: approvedMaterials.length,
          geoFeatures: approvedFeatures.length,
          strategies: approvedStrategies.length,
          images: imagesCommitted
        },
        relationsCreated,
        sourcesLinked,
        imageLinksCreated
      };
    });
  }
}
