ALTER TABLE reports ADD COLUMN document_type TEXT;
ALTER TABLE reports ADD COLUMN document_number TEXT;
ALTER TABLE reports ADD COLUMN edition TEXT;
ALTER TABLE reports ADD COLUMN jurisdiction TEXT;
ALTER TABLE reports ADD COLUMN authority_level TEXT;
ALTER TABLE reports ADD COLUMN document_status TEXT;
ALTER TABLE reports ADD COLUMN publisher TEXT;
ALTER TABLE reports ADD COLUMN source_url TEXT;
ALTER TABLE reports ADD COLUMN effective_date TEXT;
ALTER TABLE reports ADD COLUMN keywords_json TEXT;
ALTER TABLE reports ADD COLUMN reviewed_at TEXT;

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
);

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
);

CREATE INDEX IF NOT EXISTS idx_reports_document_type ON reports(document_type);
CREATE INDEX IF NOT EXISTS idx_reports_document_number ON reports(document_number);
CREATE INDEX IF NOT EXISTS idx_reports_jurisdiction ON reports(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_reports_authority_level ON reports(authority_level);
CREATE INDEX IF NOT EXISTS idx_reports_document_status ON reports(document_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_requirements_normalized_name_unique ON requirements(normalized_name);
CREATE INDEX IF NOT EXISTS idx_requirements_category ON requirements(requirement_category);
CREATE INDEX IF NOT EXISTS idx_requirements_source_document_id ON requirements(source_document_id);
CREATE INDEX IF NOT EXISTS idx_requirements_authority_level ON requirements(authority_level);
CREATE UNIQUE INDEX IF NOT EXISTS idx_methods_normalized_name_unique ON methods(normalized_name);
CREATE INDEX IF NOT EXISTS idx_methods_category ON methods(method_category);
CREATE INDEX IF NOT EXISTS idx_methods_source_document_id ON methods(source_document_id);
CREATE INDEX IF NOT EXISTS idx_methods_authority_level ON methods(authority_level);
