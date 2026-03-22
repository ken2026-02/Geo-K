# System Architecture Specification (Steps 8-12)

## Source of Truth

This document captures the Step 8-12 system architecture for Engineering Knowledge Vault. It defines project structure, module boundaries, state-management strategy, local search strategy, image processing architecture, and review/learning architecture.

## Step 8: Project Folder Architecture

Recommended `src/` structure:

- `app`: bootstrap, router, providers, initialization
- `domain`: pure types, enums, models, contracts
- `data`: schema, migrations, repositories, query helpers
- `services`: business orchestration and domain coordination
- `features`: user workflow modules such as inbox, library, review, backup, rules
- `ui`: reusable presentation components
- `hooks`: reusable React hooks
- `utils`: pure helpers
- `config`: static app config
- `assets`: bundled images and icons

Dependency direction:

`UI -> Features -> Services -> Data -> Domain`

## Step 9: State Management Architecture

Recommended approach:

- `Zustand` for lightweight global workflow state
- local component state for UI-only ephemeral interactions
- persistent local state only for user preferences and critical workflow state

Current phase-1 store boundaries:

- import pipeline state
- inbox review state
- library browsing state
- review progress state
- user preferences state

## Step 10: Search Architecture

Phase 1 search uses indexed SQLite queries over normalized fields for:

- exact lookup
- normalized lookup
- category filter
- scenario filter
- tag search
- source report search

Future search can add SQLite FTS without breaking current core tables.

## Step 11: Image Processing Architecture

Image pipeline stages:

1. verify file
2. compute hash
3. generate thumbnail
4. generate standard resolution
5. optionally preserve original

Storage rule:

- image metadata in SQLite
- binary variants outside core database rows
- preferred output format WebP, fallback JPEG

## Step 12: Review & Learning Architecture

Phase 1 review modes:

- Word review
- Phrase review
- Sentence review
- Geo material cards
- Geo feature cards

Tracking baseline:

- `review_result`
- `response_time_ms`
- `reviewed_at`

Future enhancements such as spaced repetition or adaptive difficulty should build on `review_logs` and not require redesigning the base schema.
