# Database Schema Blueprint

## Source of Truth

This document captures the Step 7 relational database blueprint for Engineering Knowledge Vault. It defines the phase-1 SQLite table groups, physical separation rules, key strategies, index priorities, and migration-safe extension approach.

## Runtime Architecture

- SQLite via WASM / `sql.js`
- IndexedDB persistence for the SQLite database file
- IndexedDB or equivalent browser-managed resource storage for image binaries

## Table Groups

### Import / Pending

- `import_batches`
- `pending_words`
- `pending_phrases`
- `pending_sentences`
- `pending_geo_materials`
- `pending_geo_features`
- `pending_strategies`
- `pending_images`
- `pending_item_image_links`

### Approved / Core

- `reports`
- `words`
- `phrases`
- `sentences`
- `geo_materials`
- `geo_features`
- `strategies`
- `images`
- `item_sources`
- `item_relations`
- `item_image_links`

### User Enhancement

- `user_notes`
- `favorites`
- `custom_tags`
- `review_logs`
- `user_entry_metadata`

### System

- `rulesets`
- `backup_snapshots`
- `storage_meta`
- `migration_log`
- `app_settings`

## Key Schema Decisions

- Pending and approved content are physically separated.
- Core knowledge object types use explicit tables, not a generic mega-table.
- Polymorphic cross-item references use `item_type + item_id` and are enforced in app logic.
- Image binaries stay outside core item rows; SQLite stores only metadata and `storage_path`.
- All public identifiers use stable `TEXT PRIMARY KEY` values.
- Search and duplicate detection depend on indexed normalized fields.

## Phase 1 Priority Tables

Must exist in phase 1:

- all pending tables except optional cleanup/archive tables
- all approved/core tables listed above
- `user_notes`
- `favorites`
- `custom_tags`
- `review_logs`
- `rulesets`
- `backup_snapshots`
- `migration_log`
- `app_settings`

## Migration Rule

Future changes should prefer:

- adding nullable columns
- adding new explicit tables
- adding new enum values
- additive migration scripts logged in `migration_log`

Avoid renaming or deleting core columns without explicit migration handling.
