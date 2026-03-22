import type { KnowledgePack } from "./types";
import type { NormalizedPendingCandidate } from "./pipelineTypes";

export class PendingNormalizationService {
  normalize(pack: KnowledgePack): NormalizedPendingCandidate[] {
    return [
      ...pack.items.words.map((word) => ({
        itemType: "word",
        id: word.id,
        canonicalValue: this.clean(word.canonical_word),
        normalizedValue: this.normalizeText(word.canonical_word),
        confidence: word.confidence,
        sourceSection: word.source_ref.section,
        sourceSentence: word.source_ref.sentence,
        payload: word
      })),
      ...pack.items.phrases.map((phrase) => ({
        itemType: "phrase",
        id: phrase.id,
        canonicalValue: this.clean(phrase.canonical_phrase),
        normalizedValue: this.normalizeText(phrase.canonical_phrase),
        confidence: phrase.confidence,
        sourceSection: phrase.source_ref.section,
        sourceSentence: phrase.source_ref.sentence,
        payload: phrase
      })),
      ...pack.items.sentences.map((sentence) => ({
        itemType: "sentence",
        id: sentence.id,
        canonicalValue: this.clean(sentence.canonical_sentence),
        normalizedValue: this.normalizeText(sentence.canonical_sentence),
        confidence: sentence.confidence,
        sourceSection: sentence.source_ref.section,
        sourceSentence: sentence.source_ref.sentence,
        payload: sentence
      })),
      ...pack.items.geo_materials.map((material) => ({
        itemType: "geo_material",
        id: material.id,
        canonicalValue: this.clean(material.canonical_name),
        normalizedValue: this.normalizeText(material.canonical_name),
        confidence: material.confidence,
        sourceSection: material.source_ref.section,
        sourceSentence: material.source_ref.sentence,
        payload: material
      })),
      ...pack.items.geo_features.map((feature) => ({
        itemType: "geo_feature",
        id: feature.id,
        canonicalValue: this.clean(feature.canonical_name),
        normalizedValue: this.normalizeText(feature.canonical_name),
        confidence: feature.confidence,
        sourceSection: feature.source_ref.section,
        sourceSentence: feature.source_ref.sentence,
        payload: feature
      })),
      ...pack.items.strategies.map((strategy) => ({
        itemType: "strategy",
        id: strategy.id,
        canonicalValue: this.clean(strategy.canonical_name),
        normalizedValue: this.normalizeText(strategy.canonical_name),
        confidence: strategy.confidence,
        sourceSection: strategy.source_ref.section,
        sourceSentence: strategy.source_ref.sentence,
        payload: strategy
      }))
    ];
  }

  private clean(value: string): string {
    return value.trim().replace(/\s+/g, " ").replace(/\n+/g, " ");
  }

  private normalizeText(value: string): string {
    return this.clean(value).toLowerCase();
  }
}
