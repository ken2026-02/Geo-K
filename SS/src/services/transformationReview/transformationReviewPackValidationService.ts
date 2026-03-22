import type { ZodIssue } from "zod";

import {
  TRANSFORMATION_REVIEW_PACK_SCHEMA_VERSION,
  transformationReviewPackSchema,
  type TransformationReviewPack
} from "../../features/transformationReview/types";

export interface TransformationReviewPackValidationReport {
  state: "valid" | "invalid";
  errors: string[];
  warnings: string[];
  supportedSchemaVersion: string;
}

export class TransformationReviewPackValidationService {
  validate(rawJson: string): TransformationReviewPackValidationReport {
    try {
      const parsed = JSON.parse(rawJson) as unknown;
      const result = transformationReviewPackSchema.safeParse(parsed);

      if (!result.success) {
        return {
          state: "invalid",
          errors: result.error.issues.map((issue: ZodIssue) => issue.message),
          warnings: [],
          supportedSchemaVersion: TRANSFORMATION_REVIEW_PACK_SCHEMA_VERSION
        };
      }

      return {
        state: "valid",
        errors: [],
        warnings: [],
        supportedSchemaVersion: TRANSFORMATION_REVIEW_PACK_SCHEMA_VERSION
      };
    } catch (error) {
      return {
        state: "invalid",
        errors: [error instanceof Error ? error.message : "Transformation Review Pack could not be parsed."],
        warnings: [],
        supportedSchemaVersion: TRANSFORMATION_REVIEW_PACK_SCHEMA_VERSION
      };
    }
  }

  parse(rawJson: string): TransformationReviewPack {
    return transformationReviewPackSchema.parse(JSON.parse(rawJson) as unknown);
  }
}
