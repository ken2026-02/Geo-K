export type ImportInputFormat = "json" | "zip";

export type ImportBatchState =
  | "uploaded"
  | "validated"
  | "validation_failed"
  | "snapshot_created"
  | "staged"
  | "processing_images"
  | "ready_for_review"
  | "review_in_progress"
  | "committing"
  | "completed"
  | "completed_with_warnings"
  | "failed";

export type ImportValidationState = "valid" | "valid_with_warnings" | "invalid";

export type ImportErrorClass =
  | "schema_error"
  | "file_error"
  | "validation_error"
  | "parse_error"
  | "image_processing_error"
  | "transaction_error"
  | "commit_error"
  | "finalize_error";

export type ImportWarningClass =
  | "missing_optional_field"
  | "unknown_enum_fallback"
  | "missing_image_file"
  | "low_confidence_item"
  | "possible_duplicate"
  | "partial_image_failure";

export type TransactionGroup =
  | "batch_and_pending_staging"
  | "image_registration"
  | "approval_commit"
  | "batch_finalization";

export interface ImportErrorDetail {
  code: ImportErrorClass;
  message: string;
  itemType?: string;
  itemId?: string;
  phase?: string;
}

export interface ImportWarningDetail {
  code: ImportWarningClass;
  message: string;
  itemType?: string;
  itemId?: string;
  phase?: string;
}

export interface ImportValidationReport {
  state: ImportValidationState;
  errors: ImportErrorDetail[];
  warnings: ImportWarningDetail[];
  supportedSchemaVersion: string;
}

export interface ImportAcquiredPayload {
  format: ImportInputFormat;
  sourceFileName: string;
  rawJson: string;
  imageFileNames: string[];
}

export interface NormalizedPendingCandidate {
  itemType: string;
  id: string;
  canonicalValue: string;
  normalizedValue: string;
  confidence?: number;
  sourceSection?: string;
  sourceSentence?: string;
  payload: Record<string, unknown>;
}

export interface PendingStageResult {
  batchId: string;
  candidates: NormalizedPendingCandidate[];
  stagedCounts: Record<string, number>;
  transactionGroup: TransactionGroup;
}

export interface DuplicateCandidate {
  itemType: string;
  itemId: string;
  duplicateStatus: "none" | "exact_duplicate" | "likely_duplicate" | "normalized_match" | "possible_related";
  matchedApprovedId?: string;
  reason: string;
}

export interface ReviewQueueGroup {
  id:
    | "all_pending"
    | "high_confidence"
    | "low_confidence"
    | "duplicate_candidates"
    | "image_issues"
    | "unreviewed_only";
  label: string;
  itemCount: number;
}

export interface ReviewQueueSummary {
  groups: ReviewQueueGroup[];
  filters: Array<"object_type" | "confidence_band" | "duplicate_status" | "source_report" | "review_status">;
}

export interface ImportBatchFinalization {
  finalState: "completed" | "completed_with_warnings" | "partially_completed" | "failed" | "review_in_progress";
  approvedCount: number;
  rejectedCount: number;
  warningCount: number;
  imageSummary: string;
  duplicateSummary: string;
}
