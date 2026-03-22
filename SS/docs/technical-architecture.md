# Engineering Knowledge Vault Technical Architecture

## Product Goal

Engineering Knowledge Vault is a local-first PWA for importing AI-preprocessed engineering knowledge packs, reviewing them efficiently in an inbox, approving stable knowledge into a long-term library, and supporting offline search and review.

## Architecture Summary

- Frontend: React + TypeScript + Vite
- Installability: PWA via `vite-plugin-pwa`
- Database: SQLite in browser via `sql.js`
- Persistence: IndexedDB for database binary and resource blobs
- Import contract: external AI-generated knowledge pack JSON
- Asset strategy: images stored separately from relational records

## Phase 1 Modules

### Rule Center

Stores versioned extraction rules, classification rules, prompt templates, and JSON schema definitions.

### Import / Inbox

Imports knowledge packs, stores pending items, runs duplicate checks, applies rules, and prepares high-efficiency mobile review workflows.

### Approved Library

Provides offline browsing and search across language items, geo materials, geo features, strategies, and favorites.

### Image Pipeline

Processes imported images into `thumbnail`, `standard`, and optional `original` variants with WebP preference.

### Review

Handles fast batch approve, reject, and reclassification operations.

### Backup / Restore

Supports snapshots before import/restore and full backup/restore compatibility checks.

## Database Strategy

The schema is split into three logical areas:

- Pending review tables
- Approved library tables
- System tables

This keeps review workflows fast while preserving long-term schema stability.

## Extension Strategy

Future expansion should happen by adding:

- new object tables or subtype metadata
- new ruleset types
- new page-level views
- new detail templates

Core system tables and relation structures should remain stable.
