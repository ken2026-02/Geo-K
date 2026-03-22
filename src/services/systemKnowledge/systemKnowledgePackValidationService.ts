import type { ZodIssue } from "zod";

import type { SystemKnowledgePack } from "../../features/systemKnowledge/types";
import { SYSTEM_KNOWLEDGE_SCHEMA_VERSION, systemKnowledgePackSchema } from "../../features/systemKnowledge/types";

export interface SystemKnowledgeValidationReport {
  state: "valid" | "invalid";
  errors: string[];
  warnings: string[];
  supportedSchemaVersion: string;
}

export class SystemKnowledgePackValidationService {
  validate(rawJson: string): SystemKnowledgeValidationReport {
    try {
      const parsed = JSON.parse(rawJson) as unknown;
      const result = systemKnowledgePackSchema.safeParse(parsed);

      if (!result.success) {
        return {
          state: "invalid",
          errors: result.error.issues.map((issue: ZodIssue) => issue.message),
          warnings: [],
          supportedSchemaVersion: SYSTEM_KNOWLEDGE_SCHEMA_VERSION
        };
      }

      return {
        state: "valid",
        errors: [],
        warnings: [],
        supportedSchemaVersion: SYSTEM_KNOWLEDGE_SCHEMA_VERSION
      };
    } catch (error) {
      return {
        state: "invalid",
        errors: [error instanceof Error ? error.message : "System knowledge pack could not be parsed."],
        warnings: [],
        supportedSchemaVersion: SYSTEM_KNOWLEDGE_SCHEMA_VERSION
      };
    }
  }

  parse(rawJson: string): SystemKnowledgePack {
    return systemKnowledgePackSchema.parse(JSON.parse(rawJson) as unknown);
  }
}
