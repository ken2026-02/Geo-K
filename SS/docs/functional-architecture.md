# Functional Architecture

## Source of Truth

This document captures the Step 2 functional architecture for Engineering Knowledge Vault. It is the implementation source of truth for phase-1 module boundaries and delivery order.

## Top-Level Modules

- Rule Center
- Inbox / Import Review
- Library
- Review / Learning
- Backup / Restore / Settings

## Cross-Module Guarantees

- Related item viewer across language, materials, features, and strategies
- Source traceability for report, sentence, excerpt, and image origin
- User enhancement layer with notes, favorites, tags, user-added images, and custom links
- Offline access to approved data and processed images

## Phase 1 Delivery Order

1. database foundation
2. Rule Center basic viewer
3. import pipeline
4. Inbox review workflow
5. approved library core sections
6. image pipeline
7. detail pages with related items
8. backup/restore
9. basic review module

## Phase 1 Out of Scope

- in-app prompt editing UI
- advanced rule editor and rule branching workflows
- OCR inside app
- online AI processing inside app
- advanced visual annotation editor
- advanced spaced repetition algorithm
- adaptive AI tutor
- auto-generated quizzes from online services
