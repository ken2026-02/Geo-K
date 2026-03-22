import type { Database } from "sql.js";

import type { ImportBatchRecord, ImportBatchRepository } from "../interfaces";
import { escapeSqlString, readFirstRow, readRows } from "./sqliteHelpers";

export class SqliteImportBatchRepository implements ImportBatchRepository {
  constructor(private readonly db: Database) {}

  async getById(id: string): Promise<ImportBatchRecord | undefined> {
    const row = readFirstRow(this.db, `SELECT * FROM import_batches WHERE id = '${escapeSqlString(id)}'`);
    return row ? this.map(row) : undefined;
  }

  async listAll(): Promise<ImportBatchRecord[]> {
    return readRows(this.db, "SELECT * FROM import_batches ORDER BY imported_at DESC").map((row) => this.map(row));
  }

  async listByStatus(status: string): Promise<ImportBatchRecord[]> {
    return readRows(this.db, `SELECT * FROM import_batches WHERE import_status = '${escapeSqlString(status)}' ORDER BY imported_at DESC`).map((row) => this.map(row));
  }

  async insert(record: ImportBatchRecord): Promise<void> {
    this.db.run(`
      INSERT INTO import_batches (
        id, batch_name, source_file_name, source_file_type, schema_version, imported_at, import_status, validation_status,
        total_items, pending_items, approved_items, rejected_items,
        source_report_id, source_report_title, source_report_project, source_report_discipline, source_report_author,
        source_report_organization, source_report_date, source_report_file_name,
        warnings_json, notes
      )
      VALUES (
        '${escapeSqlString(record.id)}',
        '${escapeSqlString(record.batchName)}',
        ${record.sourceFileName ? `'${escapeSqlString(record.sourceFileName)}'` : "NULL"},
        ${record.sourceFileType ? `'${escapeSqlString(record.sourceFileType)}'` : "NULL"},
        '${escapeSqlString(record.schemaVersion)}',
        '${escapeSqlString(record.importedAt)}',
        '${escapeSqlString(record.importStatus)}',
        '${escapeSqlString(record.validationStatus)}',
        ${record.totalItems},
        ${record.pendingItems},
        ${record.approvedItems},
        ${record.rejectedItems},
        ${record.sourceReportId ? `'${escapeSqlString(record.sourceReportId)}'` : "NULL"},
        ${record.sourceReportTitle ? `'${escapeSqlString(record.sourceReportTitle)}'` : "NULL"},
        ${record.sourceReportProject ? `'${escapeSqlString(record.sourceReportProject)}'` : "NULL"},
        ${record.sourceReportDiscipline ? `'${escapeSqlString(record.sourceReportDiscipline)}'` : "NULL"},
        ${record.sourceReportAuthor ? `'${escapeSqlString(record.sourceReportAuthor)}'` : "NULL"},
        ${record.sourceReportOrganization ? `'${escapeSqlString(record.sourceReportOrganization)}'` : "NULL"},
        ${record.sourceReportDate ? `'${escapeSqlString(record.sourceReportDate)}'` : "NULL"},
        ${record.sourceReportFileName ? `'${escapeSqlString(record.sourceReportFileName)}'` : "NULL"},
        ${record.warningsJson ? `'${escapeSqlString(record.warningsJson)}'` : "NULL"},
        ${record.notes ? `'${escapeSqlString(record.notes)}'` : "NULL"}
      )
    `);
  }

  async update(record: ImportBatchRecord): Promise<void> {
    this.db.run(`
      UPDATE import_batches
      SET batch_name = '${escapeSqlString(record.batchName)}',
          source_file_name = ${record.sourceFileName ? `'${escapeSqlString(record.sourceFileName)}'` : "NULL"},
          source_file_type = ${record.sourceFileType ? `'${escapeSqlString(record.sourceFileType)}'` : "NULL"},
          schema_version = '${escapeSqlString(record.schemaVersion)}',
          imported_at = '${escapeSqlString(record.importedAt)}',
          import_status = '${escapeSqlString(record.importStatus)}',
          validation_status = '${escapeSqlString(record.validationStatus)}',
          total_items = ${record.totalItems},
          pending_items = ${record.pendingItems},
          approved_items = ${record.approvedItems},
          rejected_items = ${record.rejectedItems},
          source_report_id = ${record.sourceReportId ? `'${escapeSqlString(record.sourceReportId)}'` : "NULL"},
          source_report_title = ${record.sourceReportTitle ? `'${escapeSqlString(record.sourceReportTitle)}'` : "NULL"},
          source_report_project = ${record.sourceReportProject ? `'${escapeSqlString(record.sourceReportProject)}'` : "NULL"},
          source_report_discipline = ${record.sourceReportDiscipline ? `'${escapeSqlString(record.sourceReportDiscipline)}'` : "NULL"},
          source_report_author = ${record.sourceReportAuthor ? `'${escapeSqlString(record.sourceReportAuthor)}'` : "NULL"},
          source_report_organization = ${record.sourceReportOrganization ? `'${escapeSqlString(record.sourceReportOrganization)}'` : "NULL"},
          source_report_date = ${record.sourceReportDate ? `'${escapeSqlString(record.sourceReportDate)}'` : "NULL"},
          source_report_file_name = ${record.sourceReportFileName ? `'${escapeSqlString(record.sourceReportFileName)}'` : "NULL"},
          warnings_json = ${record.warningsJson ? `'${escapeSqlString(record.warningsJson)}'` : "NULL"},
          notes = ${record.notes ? `'${escapeSqlString(record.notes)}'` : "NULL"}
      WHERE id = '${escapeSqlString(record.id)}'
    `);
  }

  async delete(id: string): Promise<void> {
    this.db.run(`DELETE FROM import_batches WHERE id = '${escapeSqlString(id)}'`);
  }

  private map(row: Record<string, unknown>): ImportBatchRecord {
    return {
      id: String(row.id),
      batchName: String(row.batch_name),
      sourceFileName: row.source_file_name == null ? undefined : String(row.source_file_name),
      sourceFileType: row.source_file_type == null ? undefined : String(row.source_file_type),
      schemaVersion: String(row.schema_version),
      importedAt: String(row.imported_at),
      importStatus: String(row.import_status),
      validationStatus: String(row.validation_status),
      totalItems: Number(row.total_items),
      pendingItems: Number(row.pending_items),
      approvedItems: Number(row.approved_items),
      rejectedItems: Number(row.rejected_items),
      sourceReportId: row.source_report_id == null ? undefined : String(row.source_report_id),
      sourceReportTitle: row.source_report_title == null ? undefined : String(row.source_report_title),
      sourceReportProject: row.source_report_project == null ? undefined : String(row.source_report_project),
      sourceReportDiscipline: row.source_report_discipline == null ? undefined : String(row.source_report_discipline),
      sourceReportAuthor: row.source_report_author == null ? undefined : String(row.source_report_author),
      sourceReportOrganization: row.source_report_organization == null ? undefined : String(row.source_report_organization),
      sourceReportDate: row.source_report_date == null ? undefined : String(row.source_report_date),
      sourceReportFileName: row.source_report_file_name == null ? undefined : String(row.source_report_file_name),
      warningsJson: row.warnings_json == null ? undefined : String(row.warnings_json),
      notes: row.notes == null ? undefined : String(row.notes)
    };
  }
}
