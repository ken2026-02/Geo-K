# Development Phasing, Delivery Plan & Coding Rules

## Source of Truth

This document captures Step 17 for Engineering Knowledge Vault.

## Phase Order

- 1A Foundation
- 1B Import Foundation
- 1C Image Pipeline
- 1D Inbox Review
- 1E Approved Library
- 1F Backup & Restore
- 1G Review System

## Coding Rules

- prefer small modules
- use explicit types
- keep domain layer framework-light
- keep data layer isolated
- avoid hidden global state
- prefer deterministic utilities
- write migrations for schema changes
- do not introduce server dependency

## Definition of Done

A feature is only done when:

- data flow works
- state transitions are valid
- failure behavior is handled
- minimal tests exist
- approved-library corruption risk is controlled
- mobile usage remains acceptable
