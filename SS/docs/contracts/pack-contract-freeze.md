# Pack Contract Freeze (Current Phase)

Status: **FROZEN FOR CURRENT PHASE**

This app is now treated as a dual-engine system:

1. Learning Engine (primary for current product direction)
2. Knowledge Engine (structured engineering knowledge)

These contracts are frozen to stop repeated schema/import churn.

## 1) Learning Pack v1 (Frozen)

Schema identity:
- `schema_version`: `"1.0"`
- `pack_id`: string (required)
- `source_report`: object (optional)
- `items`: array (required)

Learning item schema:
- `id`: string (required)
- `type`: enum (required)
- `content`: string (required)
- `meaning`: string (optional)
- `example`: string (optional)
- `note`: string (optional)
- `tags`: string[] (optional)

Allowed `type` values:
- `word`
- `phrase`
- `sentence`
- `concept`

Learning import rules:
- Missing required fields: **block import**
- Missing optional fields: **warning only**
- Unknown extra fields: **ignore safely**
- Invalid `type`: **block import**

Guaranteed-valid sample:
- `/public/pack-samples/learning-pack-v1.sample.json`

## 2) System Pack v1 (Frozen)

Schema identity:
- `schema_version`: `"1.0"`
- `pack_id`: string (required)
- `geo_materials`: array (required)
- `geo_features`: array (required)
- `strategies`: array (required)

`geo_material` required fields:
- `id`
- `name`
- `category`
- `description`
- `key_properties[]`
- `engineering_behaviour[]`
- `reporting_expressions[]`

`geo_feature` required fields:
- `id`
- `name`
- `category`
- `mechanism`
- `description`
- `typical_conditions[]`
- `field_indicators[]`
- `engineering_assessment[]`
- `reporting_expressions[]`

`strategy` required fields:
- `id`
- `name`
- `category`
- `trigger_conditions[]`
- `actions[]`
- `reporting_expressions[]`

System import rules:
- Missing required fields: **block import**
- Invalid field type: **block import**
- Unknown extra fields: **block import**
- Empty arrays: **warning only**

Guaranteed-valid sample:
- `/public/pack-samples/system-pack-v1.sample.json`

## 3) Separation Rules (Frozen)

- Learning Pack is the fast-ingest learning contract.
- System Pack is the strict structured engineering contract.
- Learning Pack does **not** directly equal System Pack.
- Learning Pack should be transformed by AI/manual review before becoming System Pack.

## 4) Intended Bridge Contract

- Learning Pack -> Transformation Review Pack -> System Pack is the intended transformation path.
- Transformation Review Pack is review-only and not directly importable into the Knowledge Engine.

## 5) Current App Behavior Note

This batch is alignment-only. Existing runtime flows stay unchanged:
- Existing user import/review/commit flow remains as-is.
- Existing internal bundled system injection flow remains as-is.
- Contract freeze documentation is now explicit for future implementation steps.

