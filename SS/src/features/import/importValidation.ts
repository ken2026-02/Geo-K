import { ZodError } from "zod";

import { KnowledgePackImporter } from "./knowledgePackImporter";
import type { ImportErrorDetail, ImportValidationReport, ImportWarningDetail } from "./pipelineTypes";
import { SUPPORTED_SCHEMA_VERSION } from "./types";

export class ImportValidationService {
  constructor(private readonly importer = new KnowledgePackImporter()) {}

  validate(rawJson: string): ImportValidationReport {
    const warnings: ImportWarningDetail[] = [];

    try {
      const parsed = this.importer.prepareImport(rawJson, []);
      const { pack } = parsed;

      if (pack.images.length === 0) {
        warnings.push({
          code: "missing_optional_field",
          message: "No images were included in this knowledge pack.",
          phase: "validation"
        });
      }

      return {
        state: warnings.length > 0 ? "valid_with_warnings" : "valid",
        errors: [],
        warnings,
        supportedSchemaVersion: SUPPORTED_SCHEMA_VERSION
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: ImportErrorDetail[] = error.issues.map((issue) => ({
          code: "validation_error",
          message: issue.message,
          phase: "validation"
        }));

        return {
          state: "invalid",
          errors,
          warnings,
          supportedSchemaVersion: SUPPORTED_SCHEMA_VERSION
        };
      }

      return {
        state: "invalid",
        errors: [
          {
            code: "parse_error",
            message: error instanceof Error ? error.message : "Unknown import parsing error.",
            phase: "validation"
          }
        ],
        warnings,
        supportedSchemaVersion: SUPPORTED_SCHEMA_VERSION
      };
    }
  }
}
