# Implementation Checklist & Handoff Package

## Source of Truth

This document captures Step 18 for Engineering Knowledge Vault.

## Required Input Order

Use Steps 1 through 17 as the ordered source-of-truth inputs.

## First Outputs

Codex should produce first:

- project folder tree
- TypeScript domain model definitions
- SQLite schema + migrations
- import validator module
- repository interfaces
- initial app shell pages

## Early Non-Goals

Do not prioritize:

- server APIs
- cloud sync
- advanced analytics
- in-app AI calls
- premature abstraction beyond the core vertical slice

## Final Handoff Rule

When ambiguous:

- choose stability over cleverness
- choose explicit structure over generic abstraction
- choose migration-friendly schema over convenience
- choose offline-first behavior over online dependency
- never bypass the pending review layer
- never bypass snapshot/restore safety
