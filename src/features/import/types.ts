import { z } from "zod";

import {
  functionTypes,
  geoFeatureCategories,
  geoFeatureSubtypes,
  geoMaterialCategories,
  geoMaterialSubtypes,
  imageSourceTypes,
  languageCategories,
  objectTypes,
  phraseTypes,
  scenarioTypes,
  sentenceTypes,
  strategyCategories
} from "../../shared/classification";

const SUPPORTED_SCHEMA_VERSION = "1.0" as const;

const IMPORT_LIMITS = {
  maxWords: 500,
  maxPhrases: 300,
  maxSentences: 200,
  maxGeoMaterials: 100,
  maxGeoFeatures: 100,
  maxImages: 200
} as const;

const objectTypeSchema = z.enum(objectTypes);
const languageCategorySchema = z.enum(languageCategories);
const phraseTypeSchema = z.enum(phraseTypes);
const functionTypeSchema = z.enum(functionTypes);
const scenarioTypeSchema = z.enum(scenarioTypes);
const sentenceTypeSchema = z.enum(sentenceTypes);
const geoMaterialCategorySchema = z.enum(geoMaterialCategories);
const geoMaterialSubtypeSchema = z.enum(geoMaterialSubtypes);
const geoFeatureCategorySchema = z.enum(geoFeatureCategories);
const geoFeatureSubtypeSchema = z.enum(geoFeatureSubtypes);
const strategyCategorySchema = z.enum(strategyCategories);
const imageSourceTypeSchema = z.enum(imageSourceTypes);

const sourceRefSchema = z.object({
  section: z.string().min(1),
  sentence: z.string().min(1),
  paragraph: z.string().optional(),
  page: z.string().optional()
});

const linkedItemSchema = z.object({
  item_type: objectTypeSchema,
  item_id: z.string().min(1)
});

const wordSchema = z.object({
  id: z.string().min(1),
  canonical_word: z.string().min(1),
  lemma: z.string().optional(),
  part_of_speech: z.string().optional(),
  language_category: languageCategorySchema.optional(),
  chinese_meaning: z.string().optional(),
  english_definition: z.string().optional(),
  example_sentence: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  source_ref: sourceRefSchema
});

const phraseSchema = z.object({
  id: z.string().min(1),
  canonical_phrase: z.string().min(1),
  phrase_type: phraseTypeSchema.optional(),
  function_type: functionTypeSchema.optional(),
  scenario_type: scenarioTypeSchema.optional(),
  chinese_meaning: z.string().optional(),
  explanation: z.string().optional(),
  example_sentence: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  source_ref: sourceRefSchema
});

const sentenceSchema = z.object({
  id: z.string().min(1),
  canonical_sentence: z.string().min(1),
  sentence_type: sentenceTypeSchema.optional(),
  function_type: functionTypeSchema.optional(),
  scenario_type: scenarioTypeSchema.optional(),
  chinese_literal: z.string().optional(),
  chinese_natural: z.string().optional(),
  reusable_score: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  source_ref: sourceRefSchema
});

const geoMaterialSchema = z.object({
  id: z.string().min(1),
  canonical_name: z.string().min(1),
  chinese_name: z.string().optional(),
  geo_material_category: geoMaterialCategorySchema.optional(),
  geo_material_subtype: geoMaterialSubtypeSchema.optional(),
  description: z.string().optional(),
  identification_method: z.string().optional(),
  distinguishing_points: z.string().optional(),
  common_misidentifications: z.string().optional(),
  engineering_significance: z.string().optional(),
  common_risks: z.string().optional(),
  common_treatments: z.string().optional(),
  australia_context: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  source_ref: sourceRefSchema
});

const geoFeatureSchema = z.object({
  id: z.string().min(1),
  canonical_name: z.string().min(1),
  chinese_name: z.string().optional(),
  geo_feature_category: geoFeatureCategorySchema.optional(),
  geo_feature_subtype: geoFeatureSubtypeSchema.optional(),
  description: z.string().optional(),
  identification_method: z.string().optional(),
  distinguishing_points: z.string().optional(),
  common_causes: z.string().optional(),
  risk_implications: z.string().optional(),
  treatment_or_mitigation: z.string().optional(),
  reporting_expressions: z.array(z.string()).default([]),
  inspection_points: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  source_ref: sourceRefSchema
});

const strategySchema = z.object({
  id: z.string().min(1),
  canonical_name: z.string().min(1),
  chinese_name: z.string().optional(),
  strategy_category: strategyCategorySchema.optional(),
  description: z.string().optional(),
  steps_or_method: z.string().optional(),
  application_conditions: z.string().optional(),
  limitations: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  source_ref: sourceRefSchema
});

const imageSchema = z.object({
  id: z.string().min(1),
  file_name: z.string().min(1),
  caption: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  source_type: imageSourceTypeSchema.optional(),
  linked_items: z.array(linkedItemSchema).default([])
});

export const knowledgePackSchema = z.object({
  schema_version: z.literal(SUPPORTED_SCHEMA_VERSION),
  pack_id: z.string().min(1),
  generated_at: z.string().datetime(),
  generator: z.object({
    model: z.string().min(1),
    version: z.string().min(1)
  }),
  source_report: z.object({
    report_id: z.string().min(1),
    title: z.string().min(1),
    project: z.string().min(1),
    discipline: z.string().min(1),
    author: z.string().min(1),
    organization: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    file_name: z.string().min(1),
    notes: z.string().optional()
  }),
  statistics: z.object({
    words: z.number().int().min(0),
    phrases: z.number().int().min(0),
    sentences: z.number().int().min(0),
    geo_materials: z.number().int().min(0),
    geo_features: z.number().int().min(0),
    strategies: z.number().int().min(0),
    images: z.number().int().min(0)
  }),
  items: z.object({
    words: z.array(wordSchema).max(IMPORT_LIMITS.maxWords).default([]),
    phrases: z.array(phraseSchema).max(IMPORT_LIMITS.maxPhrases).default([]),
    sentences: z.array(sentenceSchema).max(IMPORT_LIMITS.maxSentences).default([]),
    geo_materials: z.array(geoMaterialSchema).max(IMPORT_LIMITS.maxGeoMaterials).default([]),
    geo_features: z.array(geoFeatureSchema).max(IMPORT_LIMITS.maxGeoFeatures).default([]),
    strategies: z.array(strategySchema).default([])
  }),
  images: z.array(imageSchema).max(IMPORT_LIMITS.maxImages).default([])
}).superRefine((pack, ctx) => {
  const ids = new Set<string>();
  const itemIds = new Set<string>();

  const itemGroups = [
    ...pack.items.words,
    ...pack.items.phrases,
    ...pack.items.sentences,
    ...pack.items.geo_materials,
    ...pack.items.geo_features,
    ...pack.items.strategies
  ];

  for (const item of itemGroups) {
    if (ids.has(item.id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate item id: ${item.id}` });
    }
    ids.add(item.id);
    itemIds.add(item.id);
  }

  for (const image of pack.images) {
    if (ids.has(image.id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate id found in images/items: ${image.id}` });
    }
    ids.add(image.id);

    const fileBaseName = image.file_name.replace(/\.[^.]+$/, "");
    if (fileBaseName !== image.id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Image file_name must match image id basename: ${image.id}` });
    }

    for (const linkedItem of image.linked_items) {
      if (!itemIds.has(linkedItem.item_id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Image ${image.id} links to missing item ${linkedItem.item_id}` });
      }
    }
  }

  if (pack.statistics.words !== pack.items.words.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "statistics.words does not match items.words length" });
  }
  if (pack.statistics.phrases !== pack.items.phrases.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "statistics.phrases does not match items.phrases length" });
  }
  if (pack.statistics.sentences !== pack.items.sentences.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "statistics.sentences does not match items.sentences length" });
  }
  if (pack.statistics.geo_materials !== pack.items.geo_materials.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "statistics.geo_materials does not match items.geo_materials length" });
  }
  if (pack.statistics.geo_features !== pack.items.geo_features.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "statistics.geo_features does not match items.geo_features length" });
  }
  if (pack.statistics.strategies !== pack.items.strategies.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "statistics.strategies does not match items.strategies length" });
  }
  if (pack.statistics.images !== pack.images.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "statistics.images does not match images length" });
  }
});

export type KnowledgePack = z.infer<typeof knowledgePackSchema>;
export { IMPORT_LIMITS, SUPPORTED_SCHEMA_VERSION };
