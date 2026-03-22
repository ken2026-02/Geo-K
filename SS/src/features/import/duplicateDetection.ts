import type { DuplicateCandidate, NormalizedPendingCandidate } from "./pipelineTypes";

export class DuplicateDetectionService {
  detect(candidates: NormalizedPendingCandidate[]): DuplicateCandidate[] {
    const seen = new Map<string, NormalizedPendingCandidate>();
    const results: DuplicateCandidate[] = [];

    for (const candidate of candidates) {
      const key = `${candidate.itemType}:${candidate.normalizedValue}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, candidate);
        results.push({
          itemType: candidate.itemType,
          itemId: candidate.id,
          duplicateStatus: "none",
          reason: "No duplicate evidence found."
        });
        continue;
      }

      const duplicateStatus = existing.canonicalValue === candidate.canonicalValue ? "exact_duplicate" : "normalized_match";
      results.push({
        itemType: candidate.itemType,
        itemId: candidate.id,
        duplicateStatus,
        matchedApprovedId: existing.id,
        reason:
          duplicateStatus === "exact_duplicate"
            ? "Exact canonical match found in current import candidate set."
            : "Normalized content matches an existing candidate."
      });
    }

    return results;
  }
}
