# Transformation Review Pack v1

Status: **FROZEN FOR CURRENT PHASE**

## Purpose

Transformation Review Pack v1 is the intermediate contract between Learning Pack export and final System Pack generation.

It exists to:
- represent candidate structured engineering knowledge derived from Learning items
- preserve evidence links back to Learning items
- support AI-assisted, manual, or hybrid drafting
- require explicit review before any final System Pack generation

Intended path:

`Learning Pack -> Transformation Review Pack -> System Pack`

## Boundary Rules

- Transformation Review Pack is **not** directly importable into the Knowledge Engine.
- `proposed_fields` are candidate structure only, not approved knowledge.
- every candidate must preserve evidence links through `supporting_learning_item_ids`
- every candidate must carry explicit reviewer state
- final System Pack generation should only happen from reviewed Transformation Review Pack candidates

## Top-Level Structure

- `schema_version`: `"1.0"`
- `transformation_batch_id`: string
- `source_learning_pack_id`: string
- `source_learning_export_id`: string (optional)
- `transformation_method`: `"ai_assisted" | "manual" | "hybrid"`
- `candidates[]`: array of candidate records

## Candidate Structure

- `candidate_id`: string
- `proposed_target_type`: `"geo_material" | "geo_feature" | "strategy"`
- `proposed_fields`: structured object, target-dependent
- `supporting_learning_item_ids[]`: non-empty array of Learning item ids
- `confidence`: `"high" | "medium" | "low"`
- `ambiguity_flags[]`: optional string array
- `reviewer_decision`: `"pending" | "accepted" | "rejected" | "needs_split" | "needs_merge" | "needs_rewrite"`
- `reviewer_notes`: optional string

## Proposed Fields By Target Type

### `geo_material`

- `name`
- `category`
- `description`
- `key_properties[]`
- `engineering_behaviour[]`
- `reporting_expressions[]`

### `geo_feature`

- `name`
- `category`
- `mechanism`
- `description`
- `typical_conditions[]`
- `field_indicators[]`
- `engineering_assessment[]`
- `reporting_expressions[]`

### `strategy`

- `name`
- `category`
- `trigger_conditions[]`
- `actions[]`
- `reporting_expressions[]`

## Separation From Other Contracts

- Learning Pack captures fast-ingest learning content
- Transformation Review Pack captures reviewed transformation candidates plus evidence
- System Pack captures final strict structured knowledge for import

This contract is intentionally strict so that candidate structure remains auditable and distinct from both Learning Pack and System Pack.
