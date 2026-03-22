# Performance & Offline Stability Architecture

## Source of Truth

This document captures Step 13 for Engineering Knowledge Vault.

## Core Rules

- local-first operation for all approved-library workflows
- non-blocking UI wherever practical
- controlled memory usage
- chunked import and image processing
- explicit recovery behavior
- predictable storage growth

## Offline Requirements

Must work offline:

- app shell
- Library browsing
- approved-data search
- detail pages
- processed local images
- review cards
- unfinished staged batches
- Rule Center content
- backup export

## Phase 1 Performance Baseline

- chunked import processing
- progress updates between chunks
- no large base64 blobs in React state
- lazy image and relation loading
- pagination or incremental list rendering
- local performance metrics for import/search/backup timing

## Storage Discipline

- default image policy: thumbnail + standard
- original images off by default
- remove temp artifacts after success
- surface storage usage in Settings
