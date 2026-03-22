# Classification Rule Architecture

## Source of Truth

This document captures the Step 4 classification architecture for Engineering Knowledge Vault. It defines the fixed enum-based classification system used across AI preprocessing output, pending review, approved library storage, UI filters, and rulesets.

## Core Decisions

- Phase 1 uses fixed enum values instead of free-text categories.
- Classification dimensions stay separate: object type, function, scenario, subtype, provenance, review state, and image linkage are never collapsed into one field.
- The same enum values are reused across import payloads, pending objects, approved objects, and Rule Center displays.
- Classification rule definitions are versioned through `RuleSet`.

## Phase 1 Required Enum Groups

- `object_type`
- `provenance_type`
- `duplicate_status`
- `review_status`
- `confidence_band`
- `language_category`
- `phrase_type`
- `function_type`
- `scenario_type`
- `sentence_type`
- `geo_material_category`
- `geo_material_subtype`
- `geo_feature_category`
- `geo_feature_subtype`
- `strategy_category`
- `image_variant_type`
- `image_link_role`
- `note_type`
- `review_result`
- `rule_type`

## Implementation Location

The shared runtime and TypeScript source of truth lives in:

- `src/shared/classification/enums.ts`

This file exports the full phase-1 enum sets plus recommended UI quick-filter groupings.

## AI Output Contract

AI preprocessing must:

- use only allowed enum values
- fall back to safe `unknown_*` values instead of inventing labels
- emit explicit `function_type` and `scenario_type` for phrases and sentences
- prefer high-value engineering language and knowledge items over low-value noise

## Migration Rule

New domains should extend classification by adding enum values where safe or by adding new enum groups for new object families. Existing phase-1 enum values should not be renamed without migration logic.
