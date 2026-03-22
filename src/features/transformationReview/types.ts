import { z } from "zod";

export const TRANSFORMATION_REVIEW_PACK_SCHEMA_VERSION = "1.0" as const;

export const transformationMethodSchema = z.enum(["ai_assisted", "manual", "hybrid"]);
export const transformationConfidenceSchema = z.enum(["high", "medium", "low"]);
export const reviewerDecisionSchema = z.enum(["pending", "accepted", "rejected", "needs_split", "needs_merge", "needs_rewrite"]);
export const proposedTargetTypeSchema = z.enum(["geo_material", "geo_feature", "strategy"]);

const idSchema = z.string().min(1).regex(/^[a-zA-Z0-9._:-]+$/);
const nonEmptyStringSchema = z.string().min(1);
const nonEmptyStringArraySchema = z.array(nonEmptyStringSchema);

const proposedGeoMaterialFieldsSchema = z.object({
  name: nonEmptyStringSchema,
  category: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
  key_properties: nonEmptyStringArraySchema,
  engineering_behaviour: nonEmptyStringArraySchema,
  reporting_expressions: nonEmptyStringArraySchema
}).strict();

const proposedGeoFeatureFieldsSchema = z.object({
  name: nonEmptyStringSchema,
  category: nonEmptyStringSchema,
  mechanism: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
  typical_conditions: nonEmptyStringArraySchema,
  field_indicators: nonEmptyStringArraySchema,
  engineering_assessment: nonEmptyStringArraySchema,
  reporting_expressions: nonEmptyStringArraySchema
}).strict();

const proposedStrategyFieldsSchema = z.object({
  name: nonEmptyStringSchema,
  category: nonEmptyStringSchema,
  trigger_conditions: nonEmptyStringArraySchema,
  actions: nonEmptyStringArraySchema,
  reporting_expressions: nonEmptyStringArraySchema
}).strict();

const transformationCandidateBaseSchema = z.object({
  candidate_id: idSchema,
  supporting_learning_item_ids: z.array(idSchema).min(1),
  confidence: transformationConfidenceSchema,
  ambiguity_flags: z.array(nonEmptyStringSchema).optional(),
  reviewer_decision: reviewerDecisionSchema,
  reviewer_notes: z.string().optional()
});

const geoMaterialCandidateSchema = transformationCandidateBaseSchema.extend({
  proposed_target_type: z.literal("geo_material"),
  proposed_fields: proposedGeoMaterialFieldsSchema
});

const geoFeatureCandidateSchema = transformationCandidateBaseSchema.extend({
  proposed_target_type: z.literal("geo_feature"),
  proposed_fields: proposedGeoFeatureFieldsSchema
});

const strategyCandidateSchema = transformationCandidateBaseSchema.extend({
  proposed_target_type: z.literal("strategy"),
  proposed_fields: proposedStrategyFieldsSchema
});

export const transformationReviewCandidateSchema = z.discriminatedUnion("proposed_target_type", [
  geoMaterialCandidateSchema,
  geoFeatureCandidateSchema,
  strategyCandidateSchema
]);

export const transformationReviewPackSchema = z.object({
  schema_version: z.literal(TRANSFORMATION_REVIEW_PACK_SCHEMA_VERSION),
  transformation_batch_id: idSchema,
  source_learning_pack_id: idSchema,
  source_learning_export_id: idSchema.optional(),
  transformation_method: transformationMethodSchema,
  candidates: z.array(transformationReviewCandidateSchema).min(1)
}).strict().superRefine((pack, ctx) => {
  const seenIds = new Set<string>();

  for (const candidate of pack.candidates) {
    if (seenIds.has(candidate.candidate_id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate candidate_id: ${candidate.candidate_id}`
      });
    }
    seenIds.add(candidate.candidate_id);
  }
});

export type TransformationReviewPack = z.infer<typeof transformationReviewPackSchema>;
