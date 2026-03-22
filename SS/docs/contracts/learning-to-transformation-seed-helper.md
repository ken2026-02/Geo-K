# Learning Export -> Transformation Review Pack Seed Helper

Status: external helper only

## Purpose

This helper reads a valid Learning Pack v1 JSON file and generates a deterministic Transformation Review Pack v1 scaffold.

It exists to support the frozen bridge:

`Learning Pack -> Transformation Review Pack -> System Pack`

## Scope

- external developer-facing/offline tooling only
- no in-app runtime transformation
- no AI drafting
- no direct System Pack generation
- no app data-model or flow changes

## Script

- `scripts/transformationReview/generateTransformationReviewSeed.ts`

## Input

- valid Learning Pack v1 JSON

## Output

- valid Transformation Review Pack v1 JSON scaffold

## Deterministic Rules

- seeds candidates primarily from `concept`, `sentence`, and `phrase`
- skips `word` by default unless `--include-words` is provided
- uses simple keyword/domain heuristics only
- sets `transformation_method` to `manual`
- sets every candidate `reviewer_decision` to `pending`
- preserves `supporting_learning_item_ids`
- preserves `source_learning_pack_id`
- preserves `source_learning_export_id` when available or inferred

## What The Helper Does Not Do

- no AI inference
- no semantic merge/split reasoning
- no in-app review UI
- no System import
- no direct approved knowledge generation

## Usage

```bash
npx tsx scripts/transformationReview/generateTransformationReviewSeed.ts \
  --input public/pack-samples/learning-pack-v1.seed-helper.sample.json \
  --output public/pack-samples/transformation-review-pack-v1.seeded-from-learning.sample.json
```

Optional flags:
- `--source-learning-export-id <id>`
- `--transformation-batch-id <id>`
- `--include-words`

## Output Reporting

The helper reports:
- total learning items read
- total candidates created
- skipped items count
- candidate counts by proposed target type

## Limits

This helper creates a review scaffold only. The produced candidates still require explicit review before any future System Pack generation.
