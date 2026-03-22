import { readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { learningPackV1Schema, type LearningPackV1, type LearningPackItem } from "../../src/features/learning/types";
import { transformationReviewPackSchema, type TransformationReviewPack } from "../../src/features/transformationReview/types";
import { TransformationReviewPackValidationService } from "../../src/services/transformationReview/transformationReviewPackValidationService";

type SeededTargetType = TransformationReviewPack["candidates"][number]["proposed_target_type"];
type SeededConfidence = TransformationReviewPack["candidates"][number]["confidence"];

type SeedCandidate = TransformationReviewPack["candidates"][number];

interface TargetPattern {
  label: string;
  phrases: string[];
  category: string;
}

interface SeedHelperOptions {
  includeWords?: boolean;
  sourceLearningExportId?: string;
  transformationBatchId?: string;
}

interface SeedSummary {
  learningItemsRead: number;
  candidatesCreated: number;
  skippedItems: number;
  candidateCountsByTargetType: Record<SeededTargetType, number>;
}

interface SeedHelperResult {
  pack: TransformationReviewPack;
  json: string;
  summary: SeedSummary;
}

interface DetectionResult {
  targetType: SeededTargetType;
  label: string;
  category: string;
  confidence: SeededConfidence;
  ambiguityFlags: string[];
}

interface PatternMatch {
  pattern: TargetPattern;
  matchedSpecificity: number;
  labelMatched: boolean;
}

const TRANSFORMATION_ID_PATTERN = /^[a-zA-Z0-9._:-]+$/;

const MATERIAL_PATTERNS: TargetPattern[] = [
  { label: "fault gouge", phrases: ["fault gouge"], category: "geological material" },
  { label: "clay infill", phrases: ["clay infill"], category: "geological material" },
  { label: "calcite infill", phrases: ["calcite infill"], category: "geological material" },
  { label: "quartz vein", phrases: ["quartz vein"], category: "geological material" },
  { label: "residual soil", phrases: ["residual soil"], category: "geological material" },
  { label: "colluvium", phrases: ["colluvium"], category: "geological material" },
  { label: "andesite", phrases: ["andesite"], category: "geological material" },
  { label: "highly weathered rock", phrases: ["highly weathered rock"], category: "weathered material" },
  { label: "weathered volcanics", phrases: ["weathered volcanics", "weathered volcanic"], category: "weathered material" },
  { label: "oxidized zone", phrases: ["oxidized zone"], category: "weathered material" }
];

const FEATURE_PATTERNS: TargetPattern[] = [
  { label: "open joint", phrases: ["open joint", "open joints"], category: "discontinuity feature" },
  { label: "infilled joint", phrases: ["infilled joint", "infilled joints"], category: "discontinuity feature" },
  { label: "detached block", phrases: ["detached block", "detached blocks"], category: "instability feature" },
  { label: "wedge", phrases: ["wedge", "wedge failure"], category: "instability feature" },
  { label: "seepage", phrases: ["seepage", "seeping"], category: "hydrogeological feature" },
  { label: "ravelling", phrases: ["ravelling", "raveling"], category: "instability feature" },
  { label: "foliation plane", phrases: ["foliation plane", "foliation"], category: "structural feature" },
  { label: "bedding plane", phrases: ["bedding plane", "bedding"], category: "structural feature" },
  { label: "blast damaged zone", phrases: ["blast damaged zone", "blast damage"], category: "damage feature" },
  { label: "scaling hazard", phrases: ["scaling hazard", "loose rock"], category: "instability feature" },
  { label: "overbreak", phrases: ["overbreak"], category: "excavation feature" }
];

const STRATEGY_PATTERNS: TargetPattern[] = [
  { label: "hand scaling", phrases: ["hand scaling", "scaling"], category: "hazard reduction action" },
  { label: "spot bolting", phrases: ["spot bolting", "spot bolted", "bolting"], category: "support action" },
  { label: "mesh installation", phrases: ["mesh installation", "mesh"], category: "support action" },
  { label: "re-inspection", phrases: ["re-inspection", "reinspection", "repeat inspection"], category: "monitoring action" },
  { label: "exclusion zone", phrases: ["exclusion zone"], category: "safety control" },
  { label: "detailed mapping", phrases: ["detailed mapping", "mapping"], category: "investigation action" },
  { label: "support upgrade", phrases: ["support upgrade", "upgrade support"], category: "support action" },
  { label: "shotcrete extension", phrases: ["shotcrete extension", "shotcrete"], category: "support action" }
];

const DOMAIN_FALLBACKS: Record<string, { targetType: SeededTargetType; category: string }> = {
  geology: { targetType: "geo_material", category: "geological material" },
  weathering: { targetType: "geo_material", category: "weathered material" },
  groundwater: { targetType: "geo_feature", category: "hydrogeological feature" },
  slope: { targetType: "geo_feature", category: "instability feature" },
  blasting: { targetType: "geo_feature", category: "blasting-related feature" },
  reporting: { targetType: "geo_feature", category: "reported field feature" },
  support: { targetType: "strategy", category: "support action" },
  safety: { targetType: "strategy", category: "safety control" }
};

function normalizeText(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeMatchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "seed";
}

function ensureCompatibleTransformationId(name: string, value: string): string {
  const trimmed = value.trim();
  if (!TRANSFORMATION_ID_PATTERN.test(trimmed)) {
    throw new Error(`${name} must match ${TRANSFORMATION_ID_PATTERN.source}. Received: ${value}`);
  }

  return trimmed;
}

function uniqueStrings(values: Array<string | undefined>, fallback: string): string[] {
  const seen = new Set<string>();
  const next: string[] = [];

  for (const value of values) {
    const normalized = normalizeText(value);
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    next.push(normalized);
  }

  return next.length > 0 ? next : [fallback];
}

function collectSignalText(item: LearningPackItem): string {
  return [
    item.content,
    item.meaning,
    item.example,
    item.note
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n");
}

function findPatternMatches(text: string, patterns: TargetPattern[]): PatternMatch[] {
  return patterns.flatMap((pattern) => {
    const matchedSpecificity = Math.max(
      0,
      ...pattern.phrases
        .filter((phrase) => text.includes(phrase))
        .map((phrase) => phrase.split(" ").filter(Boolean).length)
    );

    if (matchedSpecificity === 0) {
      return [];
    }

    return [{
      pattern,
      matchedSpecificity,
      labelMatched: text.includes(normalizeMatchText(pattern.label))
    }];
  });
}

function getPatternSpecificity(pattern: TargetPattern): number {
  return Math.max(...pattern.phrases.map((phrase) => phrase.split(" ").filter(Boolean).length));
}

function extractOptionalDomain(item: LearningPackItem): string | undefined {
  const value = (item as Record<string, unknown>).domain;
  return typeof value === "string" ? normalizeText(value)?.toLowerCase() : undefined;
}

function inferSourceLearningExportId(packId: string): string | undefined {
  return packId.includes("learning-export") ? packId : undefined;
}

function deriveFallbackLabel(item: LearningPackItem): string {
  const cleaned = normalizeMatchText(item.content);
  const words = cleaned.split(" ").filter(Boolean);
  return words.slice(0, Math.min(words.length, 5)).join(" ") || "manual-review";
}

function detectTarget(item: LearningPackItem): DetectionResult | undefined {
  const normalizedSignalText = normalizeMatchText(collectSignalText(item));
  const materialMatches = findPatternMatches(normalizedSignalText, MATERIAL_PATTERNS);
  const featureMatches = findPatternMatches(normalizedSignalText, FEATURE_PATTERNS);
  const strategyMatches = findPatternMatches(normalizedSignalText, STRATEGY_PATTERNS);
  const domain = extractOptionalDomain(item);
  const domainFallback = domain ? DOMAIN_FALLBACKS[domain] : undefined;

  const groupedMatches: Array<{
    targetType: SeededTargetType;
    matches: PatternMatch[];
    specificity: number;
    exactLabelMatches: number;
  }> = [
    {
      targetType: "geo_material",
      matches: materialMatches,
      specificity: Math.max(0, ...materialMatches.map((match) => match.matchedSpecificity)),
      exactLabelMatches: materialMatches.filter((match) => match.labelMatched).length
    },
    {
      targetType: "geo_feature",
      matches: featureMatches,
      specificity: Math.max(0, ...featureMatches.map((match) => match.matchedSpecificity)),
      exactLabelMatches: featureMatches.filter((match) => match.labelMatched).length
    },
    {
      targetType: "strategy",
      matches: strategyMatches,
      specificity: Math.max(0, ...strategyMatches.map((match) => match.matchedSpecificity)),
      exactLabelMatches: strategyMatches.filter((match) => match.labelMatched).length
    }
  ].filter((entry) => entry.matches.length > 0);

  const ambiguityFlags: string[] = [];
  if (groupedMatches.length > 1) {
    ambiguityFlags.push("multiple_target_type_matches");
  }

  const sentenceLike = item.type === "sentence";
  if (sentenceLike) {
    ambiguityFlags.push("sentence_requires_manual_name_review");
  }

  if (groupedMatches.length > 0) {
    const chosenGroup = [...groupedMatches].sort((left, right) => {
      if (right.exactLabelMatches !== left.exactLabelMatches) {
        return right.exactLabelMatches - left.exactLabelMatches;
      }

      if (right.specificity !== left.specificity) {
        return right.specificity - left.specificity;
      }

      if (domainFallback) {
        const leftDomainPreference = left.targetType === domainFallback.targetType ? 1 : 0;
        const rightDomainPreference = right.targetType === domainFallback.targetType ? 1 : 0;
        if (rightDomainPreference !== leftDomainPreference) {
          return rightDomainPreference - leftDomainPreference;
        }
      }

      return right.matches.length - left.matches.length;
    })[0];

    const chosenPattern = [...chosenGroup.matches].sort((left, right) => {
      if (Number(right.labelMatched) !== Number(left.labelMatched)) {
        return Number(right.labelMatched) - Number(left.labelMatched);
      }

      if (right.matchedSpecificity !== left.matchedSpecificity) {
        return right.matchedSpecificity - left.matchedSpecificity;
      }

      return getPatternSpecificity(right.pattern) - getPatternSpecificity(left.pattern);
    })[0];
    const confidence: SeededConfidence = groupedMatches.length === 1 && !sentenceLike ? "high" : "medium";

    return {
      targetType: chosenGroup.targetType,
      label: chosenPattern.pattern.label,
      category: chosenPattern.pattern.category,
      confidence,
      ambiguityFlags
    };
  }

  if (!domainFallback) {
    return undefined;
  }

  return {
    targetType: domainFallback.targetType,
    label: deriveFallbackLabel(item),
    category: domainFallback.category,
    confidence: "low",
    ambiguityFlags: [...ambiguityFlags, "target_type_inferred_from_domain"]
  };
}

function buildDescription(item: LearningPackItem, label: string, kind: string): string {
  return normalizeText(item.meaning)
    ?? normalizeText(item.note)
    ?? normalizeText(item.example)
    ?? `Seeded ${kind} candidate for ${label} from Learning item content: ${item.content}`;
}

function buildReportingExpressions(item: LearningPackItem, label: string, fallback: string): string[] {
  return uniqueStrings([
    item.type === "sentence" ? item.content : undefined,
    item.example,
    item.content.includes(".") ? item.content : `${label} ${fallback}`
  ], `${label} ${fallback}`);
}

function buildGeoMaterialCandidate(item: LearningPackItem, detection: DetectionResult): SeedCandidate {
  return {
    candidate_id: `candidate:${detection.targetType}:${normalizeId(detection.label)}:${normalizeId(item.id)}`,
    proposed_target_type: "geo_material",
    proposed_fields: {
      name: detection.label,
      category: detection.category,
      description: buildDescription(item, detection.label, "material"),
      key_properties: uniqueStrings([
        item.meaning,
        item.note,
        item.content
      ], `Manual review required for key properties of ${detection.label}`),
      engineering_behaviour: uniqueStrings([
        item.note,
        item.example,
        item.meaning
      ], `Manual review required for engineering behaviour of ${detection.label}`),
      reporting_expressions: buildReportingExpressions(item, detection.label, "observed.")
    },
    supporting_learning_item_ids: [item.id],
    confidence: detection.confidence,
    ambiguity_flags: detection.ambiguityFlags.length > 0 ? detection.ambiguityFlags : undefined,
    reviewer_decision: "pending"
  };
}

function buildGeoFeatureCandidate(item: LearningPackItem, detection: DetectionResult): SeedCandidate {
  return {
    candidate_id: `candidate:${detection.targetType}:${normalizeId(detection.label)}:${normalizeId(item.id)}`,
    proposed_target_type: "geo_feature",
    proposed_fields: {
      name: detection.label,
      category: detection.category,
      mechanism: normalizeText(item.meaning)
        ?? normalizeText(item.note)
        ?? `Mechanism for ${detection.label} requires manual review from supporting Learning evidence.`,
      description: buildDescription(item, detection.label, "feature"),
      typical_conditions: uniqueStrings([
        extractOptionalDomain(item) ? `${extractOptionalDomain(item)} context` : undefined,
        item.example
      ], `Manual review required for typical conditions of ${detection.label}`),
      field_indicators: uniqueStrings([
        item.meaning,
        item.note,
        item.content
      ], `Manual review required for field indicators of ${detection.label}`),
      engineering_assessment: uniqueStrings([
        item.note,
        item.meaning,
        item.example
      ], `Manual review required for engineering assessment of ${detection.label}`),
      reporting_expressions: buildReportingExpressions(item, detection.label, "observed.")
    },
    supporting_learning_item_ids: [item.id],
    confidence: detection.confidence,
    ambiguity_flags: detection.ambiguityFlags.length > 0 ? detection.ambiguityFlags : undefined,
    reviewer_decision: "pending"
  };
}

function buildStrategyCandidate(item: LearningPackItem, detection: DetectionResult): SeedCandidate {
  return {
    candidate_id: `candidate:${detection.targetType}:${normalizeId(detection.label)}:${normalizeId(item.id)}`,
    proposed_target_type: "strategy",
    proposed_fields: {
      name: detection.label,
      category: detection.category,
      trigger_conditions: uniqueStrings([
        item.note,
        item.meaning,
        extractOptionalDomain(item) ? `${extractOptionalDomain(item)} trigger context` : undefined
      ], `Manual review required for trigger conditions of ${detection.label}`),
      actions: uniqueStrings([
        item.content,
        item.example,
        item.note
      ], `Manual review required for actions of ${detection.label}`),
      reporting_expressions: buildReportingExpressions(item, detection.label, "recommended.")
    },
    supporting_learning_item_ids: [item.id],
    confidence: detection.confidence,
    ambiguity_flags: detection.ambiguityFlags.length > 0 ? detection.ambiguityFlags : undefined,
    reviewer_decision: "pending"
  };
}

function seedCandidate(item: LearningPackItem, includeWords: boolean): SeedCandidate | undefined {
  if (item.type === "word" && !includeWords) {
    return undefined;
  }

  const detection = detectTarget(item);
  if (!detection) {
    return undefined;
  }

  switch (detection.targetType) {
    case "geo_material":
      return buildGeoMaterialCandidate(item, detection);
    case "geo_feature":
      return buildGeoFeatureCandidate(item, detection);
    case "strategy":
      return buildStrategyCandidate(item, detection);
    default:
      return undefined;
  }
}

export function buildTransformationReviewPackSeed(rawLearningPackJson: string, options: SeedHelperOptions = {}): SeedHelperResult {
  const learningPack = learningPackV1Schema.parse(JSON.parse(rawLearningPackJson) as unknown);
  const sourceLearningPackId = ensureCompatibleTransformationId("source_learning_pack_id", learningPack.pack_id);
  const sourceLearningExportId = options.sourceLearningExportId ?? inferSourceLearningExportId(learningPack.pack_id);
  const compatibleSourceLearningExportId = sourceLearningExportId
    ? ensureCompatibleTransformationId("source_learning_export_id", sourceLearningExportId)
    : undefined;

  const candidates = learningPack.items
    .map((item) => seedCandidate(item, options.includeWords ?? false))
    .filter((candidate): candidate is SeedCandidate => Boolean(candidate));

  if (candidates.length === 0) {
    throw new Error("Seed helper did not produce any candidates. Provide concept/phrase/sentence items with recognizable transformation signals.");
  }

  const pack: TransformationReviewPack = transformationReviewPackSchema.parse({
    schema_version: "1.0",
    transformation_batch_id: options.transformationBatchId ?? `seed-batch:${normalizeId(learningPack.pack_id)}`,
    source_learning_pack_id: sourceLearningPackId,
    source_learning_export_id: compatibleSourceLearningExportId,
    transformation_method: "manual",
    candidates
  });

  const json = JSON.stringify(pack, null, 2);
  const validator = new TransformationReviewPackValidationService();
  const validation = validator.validate(json);
  if (validation.state !== "valid") {
    throw new Error(`Generated Transformation Review Pack is invalid: ${validation.errors.join("; ")}`);
  }

  const summary: SeedSummary = {
    learningItemsRead: learningPack.items.length,
    candidatesCreated: pack.candidates.length,
    skippedItems: learningPack.items.length - pack.candidates.length,
    candidateCountsByTargetType: {
      geo_material: pack.candidates.filter((candidate) => candidate.proposed_target_type === "geo_material").length,
      geo_feature: pack.candidates.filter((candidate) => candidate.proposed_target_type === "geo_feature").length,
      strategy: pack.candidates.filter((candidate) => candidate.proposed_target_type === "strategy").length
    }
  };

  return { pack, json, summary };
}

export function generateTransformationReviewPackSeedFromFile(
  inputPath: string,
  outputPath?: string,
  options: SeedHelperOptions = {}
): SeedHelperResult & { outputPath: string } {
  const resolvedInputPath = resolve(inputPath);
  const rawInput = readFileSync(resolvedInputPath, "utf8");
  const result = buildTransformationReviewPackSeed(rawInput, options);
  const resolvedOutputPath = outputPath
    ? resolve(outputPath)
    : resolve(dirname(resolvedInputPath), `${resolvedInputPath.slice(0, -extname(resolvedInputPath).length)}.transformation-review-seed.json`);

  writeFileSync(resolvedOutputPath, `${result.json}\n`, "utf8");
  return { ...result, outputPath: resolvedOutputPath };
}

interface CliOptions extends SeedHelperOptions {
  inputPath?: string;
  outputPath?: string;
}

function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    switch (arg) {
      case "--input":
        options.inputPath = next;
        index += 1;
        break;
      case "--output":
        options.outputPath = next;
        index += 1;
        break;
      case "--source-learning-export-id":
        options.sourceLearningExportId = next;
        index += 1;
        break;
      case "--transformation-batch-id":
        options.transformationBatchId = next;
        index += 1;
        break;
      case "--include-words":
        options.includeWords = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.inputPath) {
    throw new Error("--input is required.");
  }

  return options;
}

function printUsage(): void {
  console.log("Usage: npx tsx scripts/transformationReview/generateTransformationReviewSeed.ts --input <learning-pack.json> [--output <transformation-review-pack.json>] [--source-learning-export-id <id>] [--transformation-batch-id <id>] [--include-words]");
}

function isMainModule(): boolean {
  if (!process.argv[1]) {
    return false;
  }

  return resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

async function main(): Promise<void> {
  const cli = parseCliArgs(process.argv.slice(2));
  const result = generateTransformationReviewPackSeedFromFile(cli.inputPath!, cli.outputPath, cli);

  console.log("Transformation Review Pack seed generation completed:");
  console.log(`- input: ${resolve(cli.inputPath!)}`);
  console.log(`- output: ${result.outputPath}`);
  console.log(`- learning items read: ${result.summary.learningItemsRead}`);
  console.log(`- candidates created: ${result.summary.candidatesCreated}`);
  console.log(`- skipped items: ${result.summary.skippedItems}`);
  console.log(`- geo_material candidates: ${result.summary.candidateCountsByTargetType.geo_material}`);
  console.log(`- geo_feature candidates: ${result.summary.candidateCountsByTargetType.geo_feature}`);
  console.log(`- strategy candidates: ${result.summary.candidateCountsByTargetType.strategy}`);
}

if (isMainModule()) {
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

