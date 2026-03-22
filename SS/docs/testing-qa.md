# Testing & QA Architecture

## Source of Truth

This document captures Step 16 for Engineering Knowledge Vault.

## Testing Layers

- unit tests for deterministic helpers and validators
- integration tests for import, commit, backup, restore, migration, and search
- workflow tests for inbox, library, offline reopen, and restore confirmations

## Mandatory Phase 1 Scenarios

- valid JSON import without images
- valid ZIP import with images
- invalid schema rejection
- duplicate candidate handling
- image partial failure
- commit rollback on failure
- valid restore
- invalid restore rejection
- unfinished batch reopen after restart
- migration from previous schema version
- approved-library search after import

## Release Checklist

- app loads offline
- library remains visible after update
- pending batches reopen
- backups export
- restore preview works
- thumbnails render
- detail links are not broken
