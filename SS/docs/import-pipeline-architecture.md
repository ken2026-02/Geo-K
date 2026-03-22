# Import Pipeline Architecture

## Source of Truth

This document captures the Step 6 import pipeline architecture for Engineering Knowledge Vault. It defines the local-first staged import flow, transaction boundaries, recovery rules, and phase-1 minimum responsibilities.

## Fixed Pipeline

`Knowledge Pack Input -> Pre-Import Validation -> Pre-Import Snapshot -> Parse Pack -> Stage into Pending Layer -> Process Images -> Normalize Data -> Run Duplicate Detection -> Build Review Queues -> User Review in Inbox -> Approve / Reject / Merge / Edit -> Commit Approved Items to Library -> Refresh Search/Relations -> Finalize Import Batch`

Approved library writes must never happen before pending review staging.

## Batch Lifecycle States

- `uploaded`
- `validated`
- `validation_failed`
- `snapshot_created`
- `staged`
- `processing_images`
- `ready_for_review`
- `review_in_progress`
- `committing`
- `completed`
- `completed_with_warnings`
- `failed`

## Transaction Groups

1. `batch_and_pending_staging`
2. `image_registration`
3. `approval_commit`
4. `batch_finalization`

## Rollback Rules

- validation failure: no staging writes
- staging failure: rollback pending-stage transaction
- image processing failure: continue non-image items and record warnings
- approval commit failure: rollback commit transaction and preserve pending state
- finalization failure: keep recoverable batch state and allow retry

## Phase 1 Required Capabilities

- JSON and ZIP input acquisition
- schema validation
- auto pre-import snapshot
- batch creation
- pending staging
- image processing
- duplicate marking
- inbox review queue construction
- approval commit orchestration boundary
- batch finalization
- recoverable failure handling
