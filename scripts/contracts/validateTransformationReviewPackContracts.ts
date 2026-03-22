import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { learningPackV1Schema } from "../../src/features/learning/types";
import { systemKnowledgePackSchema } from "../../src/features/systemKnowledge/types";
import { transformationReviewPackSchema } from "../../src/features/transformationReview/types";
import { TransformationReviewPackValidationService } from "../../src/services/transformationReview/transformationReviewPackValidationService";

function readJson(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

export function validateTransformationReviewPackContracts(): void {
  const validRaw = readJson("../../public/pack-samples/transformation-review-pack-v1.sample.json");
  const invalidRaw = readJson("../../public/pack-samples/transformation-review-pack-v1.invalid.json");

  const validator = new TransformationReviewPackValidationService();
  const validReport = validator.validate(validRaw);
  const invalidReport = validator.validate(invalidRaw);

  assert.equal(validReport.state, "valid", "valid Transformation Review Pack sample must pass validation");
  assert.equal(invalidReport.state, "invalid", "invalid Transformation Review Pack sample must fail validation");

  const validParsed = JSON.parse(validRaw) as unknown;
  assert.equal(transformationReviewPackSchema.safeParse(validParsed).success, true, "Transformation Review Pack schema should parse valid sample");
  assert.equal(learningPackV1Schema.safeParse(validParsed).success, false, "Transformation Review Pack sample must not validate as Learning Pack");
  assert.equal(systemKnowledgePackSchema.safeParse(validParsed).success, false, "Transformation Review Pack sample must not validate as System Pack");
}
