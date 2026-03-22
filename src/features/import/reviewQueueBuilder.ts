import type { DuplicateCandidate, NormalizedPendingCandidate, ReviewQueueSummary } from "./pipelineTypes";

export class ReviewQueueBuilder {
  build(candidates: NormalizedPendingCandidate[], duplicates: DuplicateCandidate[], imageIssueCount: number): ReviewQueueSummary {
    const highConfidenceCount = candidates.filter((candidate) => (candidate.confidence ?? 0) >= 0.85).length;
    const lowConfidenceCount = candidates.filter((candidate) => (candidate.confidence ?? 1) < 0.6).length;
    const duplicateCount = duplicates.filter((candidate) => candidate.duplicateStatus !== "none").length;

    return {
      groups: [
        { id: "all_pending", label: "All Pending", itemCount: candidates.length },
        { id: "high_confidence", label: "High Confidence", itemCount: highConfidenceCount },
        { id: "low_confidence", label: "Low Confidence", itemCount: lowConfidenceCount },
        { id: "duplicate_candidates", label: "Duplicate Candidates", itemCount: duplicateCount },
        { id: "image_issues", label: "Image Issues", itemCount: imageIssueCount },
        { id: "unreviewed_only", label: "Unreviewed Only", itemCount: candidates.length }
      ],
      filters: ["object_type", "confidence_band", "duplicate_status", "source_report", "review_status"]
    };
  }
}
