# Backup, Restore & Disaster Recovery Architecture

## Source of Truth

This document captures Step 14 for Engineering Knowledge Vault.

## Required Backup Types

- full backup
- library-only backup
- user-only backup
- pre-action snapshot

## Backup Package

Preferred ZIP contents:

- `manifest.json`
- database export file
- `images/`
- optional `metadata/`

## Restore Safety

- validate manifest before restore
- validate schema compatibility
- require pre-restore snapshot
- support restore preview before confirmation
- failed restore must remain recoverable using the snapshot

## Disaster Recovery Baseline

Phase 1 must support manual recovery using:

- full backup
- snapshots
- explicit restore validation
