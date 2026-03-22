# Data Object Architecture

## Source of Truth

This document captures the Step 3 data object architecture for Engineering Knowledge Vault. It defines the stable local-first object model, separation rules, and phase-1 storage boundaries.

## Core Principles

- Pending and approved objects are stored separately.
- Images are managed as independent assets and linked through explicit link tables.
- Imported content and user enhancement content remain distinguishable.
- Relationships are explicit objects, not only inferred at runtime.
- The schema must remain extensible for future object families without collapsing into a generic record table.

## Logical Layers

### Import Layer

- `ImportBatch`
- `PendingWord`
- `PendingPhrase`
- `PendingSentence`
- `PendingGeoMaterial`
- `PendingGeoFeature`
- `PendingStrategy`
- `PendingImageAsset`
- `PendingItemImageLink`

### Approved Knowledge Layer

- `Report`
- `Word`
- `Phrase`
- `Sentence`
- `GeoMaterial`
- `GeoFeature`
- `Strategy`
- `ImageAsset`
- `ItemSource`
- `ItemRelation`
- `ItemImageLink`

### User Enhancement Layer

- `UserNote`
- `Favorite`
- `CustomTag`
- `ReviewLog`
- `UserImageLink`
- `UserEntryMetadata`

### System Layer

- `RuleSet`
- `BackupSnapshot`
- `StorageMeta`
- `MigrationLog`

## Stability Decisions

- Approved objects keep canonical display fields and normalized search fields.
- Pending objects preserve raw AI outputs plus review-specific metadata.
- User-created entries reuse approved tables with provenance flags instead of requiring separate object families.
- Images use `asset_group_id` to group variants such as `thumbnail`, `standard`, and `original_optional`.
- Relations and source links are indexable first-class records.

## Phase 1 Required Minimum

### Import Layer

- `ImportBatch`
- `PendingWord`
- `PendingPhrase`
- `PendingSentence`
- `PendingGeoMaterial`
- `PendingGeoFeature`
- `PendingImageAsset`

### Approved Layer

- `Report`
- `Word`
- `Phrase`
- `Sentence`
- `GeoMaterial`
- `GeoFeature`
- `Strategy`
- `ImageAsset`
- `ItemSource`
- `ItemRelation`
- `ItemImageLink`

### User Layer

- `UserNote`
- `Favorite`
- `CustomTag`
- `ReviewLog`

### System Layer

- `RuleSet`
- `BackupSnapshot`

## Extension Strategy

The schema is designed so future objects such as `Formula`, `Standard`, `ConcreteDefect`, `SupportQA`, `MonitoringItem`, and `CaseStudy` can be added as new approved and pending tables while reusing:

- `ItemRelation`
- `ItemSource`
- `ItemImageLink`
- `UserNote`
- `Favorite`
- `CustomTag`
- `ReviewLog`

This preserves object-specific schemas while keeping cross-module graph and user enhancement behavior stable.
