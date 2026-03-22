import { z } from "zod";

import {
  authorityLevels,
  geoFeatureCategories,
  geoFeatureSubtypes,
  geoMaterialCategories,
  geoMaterialSubtypes,
  imageLinkRoles,
  imageSourceTypes,
  languageCategories,
  methodCategories,
  objectTypes,
  phraseTypes,
  requirementCategories,
  scenarioTypes,
  sentenceTypes,
  sourceDocumentStatuses,
  sourceDocumentTypes,
  functionTypes,
  strategyCategories
} from "../../shared/classification";

export const SYSTEM_KNOWLEDGE_SCHEMA_VERSION = "1.1" as const;

const deterministicIdSchema = z.string().min(1).regex(/^[a-zA-Z0-9._:-]+$/);
const systemItemTypeSchema = z.enum(objectTypes.filter((value) => value !== "image" && value !== "report") as ["word", "phrase", "sentence", "geo_material", "geo_feature", "strategy", "requirement", "method"]);
const geoMaterialCategorySchema = z.enum(geoMaterialCategories);
const geoMaterialSubtypeSchema = z.enum(geoMaterialSubtypes);
const geoFeatureCategorySchema = z.enum(geoFeatureCategories);
const geoFeatureSubtypeSchema = z.enum(geoFeatureSubtypes);
const strategyCategorySchema = z.enum(strategyCategories);
const languageCategorySchema = z.enum(languageCategories);
const phraseTypeSchema = z.enum(phraseTypes);
const functionTypeSchema = z.enum(functionTypes);
const scenarioTypeSchema = z.enum(scenarioTypes);
const sentenceTypeSchema = z.enum(sentenceTypes);
const requirementCategorySchema = z.enum(requirementCategories);
const methodCategorySchema = z.enum(methodCategories);
const authorityLevelSchema = z.enum(authorityLevels);
const sourceDocumentTypeSchema = z.enum(sourceDocumentTypes);
const sourceDocumentStatusSchema = z.enum(sourceDocumentStatuses);
const imageSourceTypeSchema = z.enum(imageSourceTypes);
const imageLinkRoleSchema = z.enum(imageLinkRoles);

const sourceRefSchema = z.object({
  source_document_id: deterministicIdSchema.optional(),
  section: z.string().min(1),
  sentence: z.string().min(1),
  excerpt: z.string().optional(),
  paragraph: z.string().optional(),
  page: z.string().optional()
});

const sourceDocumentSchema = z.object({
  id: deterministicIdSchema,
  source_report_id: deterministicIdSchema,
  title: z.string().min(1),
  document_type: sourceDocumentTypeSchema,
  document_number: z.string().optional(),
  edition: z.string().optional(),
  jurisdiction: z.string().optional(),
  authority_level: authorityLevelSchema.optional(),
  document_status: sourceDocumentStatusSchema.optional(),
  publisher: z.string().optional(),
  url: z.string().url().optional(),
  project: z.string().optional(),
  discipline: z.string().optional(),
  author: z.string().optional(),
  organization: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reviewed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  keywords: z.array(z.string()).default([]),
  notes: z.string().optional()
});

const wordSchema = z.object({
  id: deterministicIdSchema,
  canonical_word: z.string().min(1),
  lemma: z.string().optional(),
  part_of_speech: z.string().optional(),
  language_category: languageCategorySchema.optional(),
  chinese_meaning: z.string().optional(),
  english_definition: z.string().optional(),
  example_sentence: z.string().optional(),
  source_ref: sourceRefSchema
});

const phraseSchema = z.object({
  id: deterministicIdSchema,
  canonical_phrase: z.string().min(1),
  phrase_type: phraseTypeSchema.optional(),
  function_type: functionTypeSchema.optional(),
  scenario_type: scenarioTypeSchema.optional(),
  chinese_meaning: z.string().optional(),
  explanation: z.string().optional(),
  example_sentence: z.string().optional(),
  source_ref: sourceRefSchema
});

const sentenceSchema = z.object({
  id: deterministicIdSchema,
  canonical_sentence: z.string().min(1),
  sentence_type: sentenceTypeSchema.optional(),
  function_type: functionTypeSchema.optional(),
  scenario_type: scenarioTypeSchema.optional(),
  chinese_literal: z.string().optional(),
  chinese_natural: z.string().optional(),
  section_name: z.string().optional(),
  source_ref: sourceRefSchema
});

const geoMaterialSchema = z.object({
  id: deterministicIdSchema,
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
  source_ref: sourceRefSchema
});

const geoFeatureSchema = z.object({
  id: deterministicIdSchema,
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
  source_ref: sourceRefSchema
});

const strategySchema = z.object({
  id: deterministicIdSchema,
  canonical_name: z.string().min(1),
  chinese_name: z.string().optional(),
  strategy_category: strategyCategorySchema.optional(),
  description: z.string().optional(),
  steps_or_method: z.string().optional(),
  application_conditions: z.string().optional(),
  limitations: z.string().optional(),
  linked_reporting_expression: z.string().optional(),
  monitoring_notes: z.string().optional(),
  source_ref: sourceRefSchema
});

const requirementSchema = z.object({
  id: deterministicIdSchema,
  canonical_name: z.string().min(1),
  requirement_category: requirementCategorySchema.optional(),
  jurisdiction: z.string().optional(),
  authority_level: authorityLevelSchema.optional(),
  clause_reference: z.string().optional(),
  requirement_text: z.string().min(1),
  plain_language_summary: z.string().optional(),
  why_it_matters: z.string().optional(),
  trigger_conditions: z.string().optional(),
  verification_method: z.string().optional(),
  tags: z.array(z.string()).default([]),
  source_ref: sourceRefSchema
});

const methodSchema = z.object({
  id: deterministicIdSchema,
  canonical_name: z.string().min(1),
  method_category: methodCategorySchema.optional(),
  jurisdiction: z.string().optional(),
  authority_level: authorityLevelSchema.optional(),
  purpose: z.string().optional(),
  procedure_summary: z.string().optional(),
  inputs_or_prerequisites: z.string().optional(),
  outputs_or_results: z.string().optional(),
  limitations: z.string().optional(),
  tags: z.array(z.string()).default([]),
  source_ref: sourceRefSchema
});

const imageLinkedItemSchema = z.object({
  item_type: z.enum(["geo_material", "geo_feature", "strategy"]),
  item_id: deterministicIdSchema,
  link_role: imageLinkRoleSchema.optional()
});

const imageSchema = z.object({
  id: deterministicIdSchema,
  file_name: z.string().min(1),
  caption: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  source_type: imageSourceTypeSchema.optional(),
  linked_items: z.array(imageLinkedItemSchema).default([])
});

const relationSchema = z.object({
  id: deterministicIdSchema,
  from_item_type: z.enum(["geo_material", "geo_feature", "strategy"]),
  from_item_id: deterministicIdSchema,
  relation_type: z.string().min(1),
  to_item_type: systemItemTypeSchema,
  to_item_id: deterministicIdSchema,
  confidence_score: z.number().min(0).max(1).optional()
});

export const systemKnowledgePackSchema = z.object({
  schema_version: z.literal(SYSTEM_KNOWLEDGE_SCHEMA_VERSION),
  pack_id: deterministicIdSchema,
  pack_name: z.string().min(1),
  ownership: z.literal("system"),
  source_report: z.object({
    id: deterministicIdSchema,
    source_report_id: deterministicIdSchema,
    title: z.string().min(1),
    project: z.string().min(1),
    discipline: z.string().min(1),
    author: z.string().min(1),
    organization: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    file_name: z.string().min(1),
    notes: z.string().optional()
  }),
  source_documents: z.array(sourceDocumentSchema).default([]),
  items: z.object({
    words: z.array(wordSchema).default([]),
    phrases: z.array(phraseSchema).default([]),
    sentences: z.array(sentenceSchema).default([]),
    geo_materials: z.array(geoMaterialSchema).default([]),
    geo_features: z.array(geoFeatureSchema).default([]),
    strategies: z.array(strategySchema).default([]),
    requirements: z.array(requirementSchema).default([]),
    methods: z.array(methodSchema).default([])
  }),
  relations: z.array(relationSchema).default([]),
  images: z.array(imageSchema).default([])
}).superRefine((pack, ctx) => {
  const ids = new Set<string>();
  const packItemIds = new Set<string>();
  const sourceDocumentIds = new Set<string>(pack.source_documents.map((source) => source.id));

  for (const sourceDocument of pack.source_documents) {
    if (ids.has(sourceDocument.id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate source document id: ${sourceDocument.id}` });
    }
    ids.add(sourceDocument.id);
  }

  for (const item of [...pack.items.words, ...pack.items.phrases, ...pack.items.sentences, ...pack.items.geo_materials, ...pack.items.geo_features, ...pack.items.strategies, ...pack.items.requirements, ...pack.items.methods]) {
    if (ids.has(item.id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate system item id: ${item.id}` });
    }
    ids.add(item.id);
    packItemIds.add(item.id);

    if (item.source_ref.source_document_id && !sourceDocumentIds.has(item.source_ref.source_document_id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Item ${item.id} references missing source document ${item.source_ref.source_document_id}` });
    }
  }

  for (const image of pack.images) {
    if (ids.has(image.id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate system image id: ${image.id}` });
    }
    ids.add(image.id);

    for (const linked of image.linked_items) {
      if (!packItemIds.has(linked.item_id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `System image ${image.id} links to missing pack item ${linked.item_id}` });
      }
    }
  }

  for (const relation of pack.relations) {
    if (ids.has(relation.id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Duplicate system relation id: ${relation.id}` });
    }
    ids.add(relation.id);

    if (!packItemIds.has(relation.from_item_id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Relation ${relation.id} references missing source item ${relation.from_item_id}` });
    }

    if (!packItemIds.has(relation.to_item_id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Relation ${relation.id} references missing target item ${relation.to_item_id}` });
    }
  }
});

export type SystemKnowledgePack = z.infer<typeof systemKnowledgePackSchema>;
