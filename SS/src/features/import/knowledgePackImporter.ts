import { knowledgePackSchema, type KnowledgePack } from "./types";
import type { RuleSet } from "../../domain/models/types";

export interface ImportPreparationResult {
  pack: KnowledgePack;
  duplicateHints: Array<{ itemType: string; itemId: string; duplicateOfId: string }>;
  appliedRuleIds: string[];
}

export class KnowledgePackImporter {
  prepareImport(rawJson: string, rulesets: RuleSet[]): ImportPreparationResult {
    const parsed = knowledgePackSchema.parse(JSON.parse(rawJson));
    const appliedRuleIds = rulesets.filter((rule) => rule.isActive).map((rule) => rule.id);

    return {
      pack: parsed,
      duplicateHints: this.detectDuplicates(parsed),
      appliedRuleIds
    };
  }

  private detectDuplicates(pack: KnowledgePack): Array<{ itemType: string; itemId: string; duplicateOfId: string }> {
    const duplicateHints: Array<{ itemType: string; itemId: string; duplicateOfId: string }> = [];
    const seen = new Map<string, string>();

    for (const word of pack.items.words) {
      const key = `word:${this.normalizeText(word.canonical_word)}`;
      const existingId = seen.get(key);
      if (existingId) {
        duplicateHints.push({ itemType: "word", itemId: word.id, duplicateOfId: existingId });
      } else {
        seen.set(key, word.id);
      }
    }

    for (const phrase of pack.items.phrases) {
      const key = `phrase:${this.normalizeText(phrase.canonical_phrase)}`;
      const existingId = seen.get(key);
      if (existingId) {
        duplicateHints.push({ itemType: "phrase", itemId: phrase.id, duplicateOfId: existingId });
      } else {
        seen.set(key, phrase.id);
      }
    }

    for (const material of pack.items.geo_materials) {
      const key = `geo_material:${this.normalizeText(material.canonical_name)}`;
      const existingId = seen.get(key);
      if (existingId) {
        duplicateHints.push({ itemType: "geo_material", itemId: material.id, duplicateOfId: existingId });
      } else {
        seen.set(key, material.id);
      }
    }

    return duplicateHints;
  }

  private normalizeText(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, " ");
  }
}
