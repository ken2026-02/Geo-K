import type { RuleSet } from "../../domain/models/types";
import type { KnowledgePack } from "../import/types";

export interface RuleExecutionContext {
  pack: KnowledgePack;
  now: string;
}

export interface RuleExecutionResult {
  normalizationWarnings: string[];
  classificationSuggestions: Array<{
    itemType: string;
    itemId: string;
    field: string;
    suggestedValue: string;
    ruleId: string;
  }>;
}

export class RuleEngine {
  execute(rulesets: RuleSet[], context: RuleExecutionContext): RuleExecutionResult {
    const activeRules = rulesets.filter((rule) => rule.isActive);
    const result: RuleExecutionResult = {
      normalizationWarnings: [],
      classificationSuggestions: []
    };

    for (const rule of activeRules) {
      if (rule.ruleType === "classification_rule") {
        this.applyClassificationRule(rule, context, result);
      }

      if (rule.ruleType === "extraction_rule") {
        this.applyValidationRule(rule, context, result);
      }
    }

    return result;
  }

  private applyClassificationRule(
    rule: RuleSet,
    context: RuleExecutionContext,
    result: RuleExecutionResult
  ): void {
    const ruleContent = rule.ruleContent.toLowerCase();
    for (const feature of context.pack.items.geo_features) {
      if (!feature.geo_feature_category && ruleContent.includes(feature.canonical_name.toLowerCase())) {
        result.classificationSuggestions.push({
          itemType: "geo_feature",
          itemId: feature.id,
          field: "geo_feature_category",
          suggestedValue: "unknown_feature",
          ruleId: rule.id
        });
      }
    }
  }

  private applyValidationRule(
    rule: RuleSet,
    context: RuleExecutionContext,
    result: RuleExecutionResult
  ): void {
    if (!rule.ruleContent.includes("source_ref") && !rule.ruleContent.includes("canonical")) {
      return;
    }

    for (const phrase of context.pack.items.phrases) {
      if (!phrase.canonical_phrase.trim()) {
        result.normalizationWarnings.push(`Phrase ${phrase.id} is missing canonical_phrase.`);
      }
    }
  }
}
