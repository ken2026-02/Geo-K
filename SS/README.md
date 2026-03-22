# Geo K

个人工程知识系统基线仓库。

当前仓库已经完成 Phase 1 的本地优先实现：Inbox 导入与审核、Approved Library 提交与浏览、本地搜索、图片导入与预览、备份恢复、学习复习、完整性检查、诊断面板和轻量性能日志。架构文档仍然是 source of truth，代码实现以 `src/` 下的 phase-1 模块为准。

## 文档入口

- `docs/architecture.md`: 稳定版总体架构
- `docs/functional-architecture.md`: Step 2 功能架构
- `docs/data-model.md`: 数据模型基线
- `docs/data-object-architecture.md`: Step 3 数据对象架构
- `docs/classification-architecture.md`: Step 4 分类规则架构
- `docs/knowledge-pack-schema.md`: Step 5 knowledge pack schema 架构
- `docs/knowledge-pack.schema.json`: Step 5 JSON Schema 草案
- `docs/import-pipeline-architecture.md`: Step 6 import pipeline 架构
- `docs/database-schema-blueprint.md`: Step 7 数据库 schema 蓝图
- `docs/system-architecture-steps-8-12.md`: Steps 8-12 系统架构规范
- `docs/performance-offline-stability.md`: Step 13 性能与离线稳定性
- `docs/backup-restore-disaster-recovery.md`: Step 14 备份恢复与灾备
- `docs/security-data-integrity-validation.md`: Step 15 安全、完整性与校验
- `docs/testing-qa.md`: Step 16 测试与 QA
- `docs/development-phasing-and-coding-rules.md`: Step 17 开发分期与编码规则
- `docs/implementation-checklist-and-handoff.md`: Step 18 实施清单与交接
- `docs/handoff-package/`: 标准化 handoff 文档包

## Phase 1 实现入口

- App bootstrap: `src/main.tsx`, `src/app/providers/AppProviders.tsx`, `src/hooks/useAppInitialization.ts`
- Database foundation: `src/data/db/initializeDatabase.ts`, `src/data/db/database.ts`, `src/data/repositories/sqlite/`
- Inbox import + review: `src/services/import/jsonKnowledgePackImportService.ts`, `src/services/review/inboxService.ts`, `src/pages/inbox/`
- Approved commit + library: `src/services/import/approvedCommitService.ts`, `src/services/library/libraryService.ts`, `src/pages/library/`
- Search: `src/services/search/approvedSearchService.ts`, `src/pages/library/LibrarySearchPage.tsx`
- Image flow: `src/features/images/imagePipeline.ts`, `src/services/images/imageVariantStorageService.ts`
- Backup / restore: `src/services/backup/backupOrchestrationService.ts`, `src/pages/settings/SettingsPage.tsx`
- Review / learning: `src/services/review/reviewWorkflowService.ts`, `src/pages/review/ReviewPage.tsx`
- Diagnostics / integrity / performance: `src/services/maintenance/`, `src/services/performance/`

## Validation Commands

- Typecheck: `npx tsc --noEmit`
- Production build: `npm run build`
- Engineering flow baseline: `npm run validate:engineering`

## 技术基线

- React
- TypeScript
- PWA
- SQLite (`sql.js` / WASM)
- IndexedDB
- Local-first
