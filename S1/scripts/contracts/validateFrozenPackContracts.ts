import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { z } from "zod";

const learningTypeSchema = z.enum(["word", "phrase", "sentence", "concept"]);

const learningItemSchema = z.object({
  id: z.string().min(1),
  type: learningTypeSchema,
  content: z.string().min(1),
  meaning: z.string().optional(),
  example: z.string().optional(),
  note: z.string().optional(),
  tags: z.array(z.string()).optional()
}).passthrough();

const learningPackV1Schema = z.object({
  schema_version: z.literal("1.0"),
  pack_id: z.string().min(1),
  source_report: z.record(z.unknown()).optional(),
  items: z.array(learningItemSchema)
}).passthrough();

const systemMaterialSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  key_properties: z.array(z.string()),
  engineering_behaviour: z.array(z.string()),
  reporting_expressions: z.array(z.string())
}).strict();

const systemFeatureSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  mechanism: z.string().min(1),
  description: z.string().min(1),
  typical_conditions: z.array(z.string()),
  field_indicators: z.array(z.string()),
  engineering_assessment: z.array(z.string()),
  reporting_expressions: z.array(z.string())
}).strict();

const systemStrategySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  trigger_conditions: z.array(z.string()),
  actions: z.array(z.string()),
  reporting_expressions: z.array(z.string())
}).strict();

const systemPackV1Schema = z.object({
  schema_version: z.literal("1.0"),
  pack_id: z.string().min(1),
  geo_materials: z.array(systemMaterialSchema),
  geo_features: z.array(systemFeatureSchema),
  strategies: z.array(systemStrategySchema)
}).strict().superRefine((pack, ctx) => {
  const warnIfEmpty = (path: (string | number)[], list: unknown[]) => {
    if (list.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message: "empty_array_warning" });
    }
  };

  warnIfEmpty(["geo_materials"], pack.geo_materials);
  warnIfEmpty(["geo_features"], pack.geo_features);
  warnIfEmpty(["strategies"], pack.strategies);
});

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")) as unknown;
}

export function validateFrozenPackContracts(): void {
  const learningSample = readJson("../../public/pack-samples/learning-pack-v1.sample.json");
  const systemSample = readJson("../../public/pack-samples/system-pack-v1.sample.json");

  const learningResult = learningPackV1Schema.safeParse(learningSample);
  assert.equal(learningResult.success, true, "Learning Pack v1 sample must be valid");

  const systemResult = systemPackV1Schema.safeParse(systemSample);
  assert.equal(systemResult.success, true, "System Pack v1 sample must be valid");

  const crossLearningAsSystem = systemPackV1Schema.safeParse(learningSample);
  const crossSystemAsLearning = learningPackV1Schema.safeParse(systemSample);
  assert.equal(crossLearningAsSystem.success, false, "Learning Pack sample must not pass System Pack schema");
  assert.equal(crossSystemAsLearning.success, false, "System Pack sample must not pass Learning Pack schema");
}
