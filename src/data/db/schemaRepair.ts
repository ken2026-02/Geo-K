import type { Database } from "sql.js";

export function tableExists(db: Database, tableName: string): boolean {
  const result = db.exec(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${tableName.replace(/'/g, "''")}'`
  );
  return result.length > 0 && result[0]?.values.length > 0;
}

export function columnExists(db: Database, tableName: string, columnName: string): boolean {
  if (!tableExists(db, tableName)) {
    return false;
  }

  const result = db.exec(`PRAGMA table_info(${tableName})`);
  const values = result[0]?.values ?? [];
  return values.some((row) => String(row[1] ?? "") === columnName);
}

function ensureColumn(db: Database, tableName: string, columnName: string, columnDefinition: string): boolean {
  if (columnExists(db, tableName, columnName)) {
    return false;
  }

  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  return true;
}

export function repairKnownSchemaDrift(db: Database): string[] {
  const repaired: string[] = [];

  if (tableExists(db, "reports")) {
    const reportColumns: Array<{ name: string; definition: string }> = [
      { name: "document_type", definition: "TEXT" },
      { name: "document_number", definition: "TEXT" },
      { name: "edition", definition: "TEXT" },
      { name: "jurisdiction", definition: "TEXT" },
      { name: "authority_level", definition: "TEXT" },
      { name: "document_status", definition: "TEXT" },
      { name: "publisher", definition: "TEXT" },
      { name: "source_url", definition: "TEXT" },
      { name: "effective_date", definition: "TEXT" },
      { name: "keywords_json", definition: "TEXT" },
      { name: "reviewed_at", definition: "TEXT" }
    ];

    for (const column of reportColumns) {
      if (ensureColumn(db, "reports", column.name, column.definition)) {
        repaired.push(`reports.${column.name}`);
      }
    }

    db.exec("CREATE INDEX IF NOT EXISTS idx_reports_document_type ON reports(document_type)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_reports_document_number ON reports(document_number)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_reports_jurisdiction ON reports(jurisdiction)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_reports_authority_level ON reports(authority_level)");
    db.exec("CREATE INDEX IF NOT EXISTS idx_reports_document_status ON reports(document_status)");
  }

  const hadRequirements = tableExists(db, "requirements");
  const hadMethods = tableExists(db, "methods");

  db.exec(`
    CREATE TABLE IF NOT EXISTS requirements (
      id TEXT PRIMARY KEY,
      source_document_id TEXT,
      canonical_name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      requirement_category TEXT,
      jurisdiction TEXT,
      authority_level TEXT,
      clause_reference TEXT,
      requirement_text TEXT,
      plain_language_summary TEXT,
      why_it_matters TEXT,
      trigger_conditions TEXT,
      verification_method TEXT,
      tags_json TEXT,
      provenance_type TEXT NOT NULL,
      first_added_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_starred INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (source_document_id) REFERENCES reports(id)
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS methods (
      id TEXT PRIMARY KEY,
      source_document_id TEXT,
      canonical_name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      method_category TEXT,
      jurisdiction TEXT,
      authority_level TEXT,
      purpose TEXT,
      procedure_summary TEXT,
      inputs_or_prerequisites TEXT,
      outputs_or_results TEXT,
      limitations TEXT,
      tags_json TEXT,
      provenance_type TEXT NOT NULL,
      first_added_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_starred INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (source_document_id) REFERENCES reports(id)
    )
  `);
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_requirements_normalized_name_unique ON requirements(normalized_name)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_requirements_category ON requirements(requirement_category)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_requirements_source_document_id ON requirements(source_document_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_requirements_authority_level ON requirements(authority_level)");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_methods_normalized_name_unique ON methods(normalized_name)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_methods_category ON methods(method_category)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_methods_source_document_id ON methods(source_document_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_methods_authority_level ON methods(authority_level)");

  if (!hadRequirements && tableExists(db, "requirements")) {
    repaired.push("requirements");
  }
  if (!hadMethods && tableExists(db, "methods")) {
    repaired.push("methods");
  }

  return repaired;
}
