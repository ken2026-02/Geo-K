> Direction update (contract freeze): refer to `docs/contracts/pack-contract-freeze.md` for frozen Learning Pack v1 and System Pack v1 contracts. This document describes the existing legacy import contract and remains useful for current runtime behavior.
# Knowledge Pack Schema Architecture

## Source of Truth

This document captures the Step 5 knowledge pack schema for Engineering Knowledge Vault. It defines the import contract produced by external AI preprocessing and consumed by the app import pipeline.

## Delivery Formats

A knowledge pack may be delivered as:

- JSON file
- ZIP package containing `knowledge_pack.json` plus an `images/` directory

Preferred structure:

```text
ZIP
  knowledge_pack.json
  images/
    img_001.jpg
    img_002.jpg
```

## Root JSON Structure

```json
{
  "schema_version": "1.0",
  "pack_id": "uuid",
  "generated_at": "ISO8601",
  "generator": {
    "model": "AI system name",
    "version": "model version"
  },
  "source_report": {},
  "statistics": {},
  "items": {},
  "images": []
}
```

## Validation Guarantees

The app validates:

- supported `schema_version`
- required fields
- enum values
- id uniqueness across items and images
- statistic counts matching actual item counts
- linked image item references pointing to real items
- image filename basename matching image id
- size-control limits for phase-1 imports

Validation failure means import rejection plus a generated error report.

## Phase 1 Supported Item Arrays

- `items.words`
- `items.phrases`
- `items.sentences`
- `items.geo_materials`
- `items.geo_features`
- `items.strategies`
- `images`

## Source Traceability Rule

Each imported item must contain a `source_ref` object with at least:

- `section`
- `sentence`

Optional extensions:

- `paragraph`
- `page`

## Size-Control Recommendations

- `words <= 500`
- `phrases <= 300`
- `sentences <= 200`
- `geo_materials <= 100`
- `geo_features <= 100`
- `images <= 200`

Large reports should be split into multiple packs.

## Versioning Rule

The root `schema_version` is mandatory. New versions should extend by adding new top-level item arrays rather than mutating existing object structures incompatibly.

