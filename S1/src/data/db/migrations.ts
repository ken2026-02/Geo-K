import phase1cPendingSourceContextSql from "../migrations/002_pending_source_context.sql?raw";
import phase1cImportBatchSourceReportSql from "../migrations/003_import_batch_source_report.sql?raw";
import phase2aPersonalNotesSql from "../migrations/004_personal_notes.sql?raw";
import phase2bSystemLibraryExpansionSql from "../migrations/005_system_library_expansion.sql?raw";

export interface MigrationDefinition {
  id: string;
  fromVersion: string;
  toVersion: string;
  sql: string;
}

export const migrations: MigrationDefinition[] = [
  {
    id: "002_pending_source_context",
    fromVersion: "1.0.0",
    toVersion: "1.1.0",
    sql: phase1cPendingSourceContextSql
  },
  {
    id: "003_import_batch_source_report",
    fromVersion: "1.1.0",
    toVersion: "1.2.0",
    sql: phase1cImportBatchSourceReportSql
  },
  {
    id: "004_personal_notes",
    fromVersion: "1.2.0",
    toVersion: "1.3.0",
    sql: phase2aPersonalNotesSql
  },
  {
    id: "005_system_library_expansion",
    fromVersion: "1.3.0",
    toVersion: "1.4.0",
    sql: phase2bSystemLibraryExpansionSql
  }
];
