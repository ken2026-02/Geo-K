PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS import_batches (
  id TEXT PRIMARY KEY,
  batch_name TEXT NOT NULL,
  source_file_name TEXT,
  source_file_type TEXT,
  schema_version TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  import_status TEXT NOT NULL,
  validation_status TEXT NOT NULL,
  total_items INTEGER NOT NULL DEFAULT 0,
  pending_items INTEGER NOT NULL DEFAULT 0,
  approved_items INTEGER NOT NULL DEFAULT 0,
  rejected_items INTEGER NOT NULL DEFAULT 0,
  source_report_id TEXT,
  source_report_title TEXT,
  source_report_project TEXT,
  source_report_discipline TEXT,
  source_report_author TEXT,
  source_report_organization TEXT,
  source_report_date TEXT,
  source_report_file_name TEXT,
  warnings_json TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS pending_words (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  source_report_id TEXT,
  raw_word TEXT NOT NULL,
  normalized_word TEXT NOT NULL,
  lemma TEXT,
  part_of_speech TEXT,
  language_category TEXT,
  chinese_meaning TEXT,
  english_definition TEXT,
  example_sentence TEXT,
  confidence_score REAL,
  confidence_band TEXT,
  duplicate_status TEXT NOT NULL DEFAULT 'none',
  review_status TEXT NOT NULL DEFAULT 'unreviewed',
  reviewer_note TEXT,
  source_section TEXT,
  source_sentence TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (batch_id) REFERENCES import_batches(id)
);

CREATE TABLE IF NOT EXISTS pending_phrases (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  source_report_id TEXT,
  raw_phrase TEXT NOT NULL,
  normalized_phrase TEXT NOT NULL,
  phrase_type TEXT,
  function_type TEXT,
  scenario_type TEXT,
  chinese_meaning TEXT,
  explanation TEXT,
  example_sentence TEXT,
  confidence_score REAL,
  confidence_band TEXT,
  duplicate_status TEXT NOT NULL DEFAULT 'none',
  review_status TEXT NOT NULL DEFAULT 'unreviewed',
  reviewer_note TEXT,
  source_section TEXT,
  source_sentence TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (batch_id) REFERENCES import_batches(id)
);

CREATE TABLE IF NOT EXISTS pending_sentences (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  source_report_id TEXT,
  raw_sentence TEXT NOT NULL,
  normalized_sentence TEXT NOT NULL,
  sentence_type TEXT,
  function_type TEXT,
  scenario_type TEXT,
  chinese_literal TEXT,
  chinese_natural TEXT,
  section_name TEXT,
  reusable_score REAL,
  confidence_score REAL,
  confidence_band TEXT,
  duplicate_status TEXT NOT NULL DEFAULT 'none',
  review_status TEXT NOT NULL DEFAULT 'unreviewed',
  reviewer_note TEXT,
  source_section TEXT,
  source_sentence TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (batch_id) REFERENCES import_batches(id)
);

CREATE TABLE IF NOT EXISTS pending_geo_materials (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  source_report_id TEXT,
  raw_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  chinese_name TEXT,
  geo_material_category TEXT,
  geo_material_subtype TEXT,
  description TEXT,
  identification_method TEXT,
  distinguishing_points TEXT,
  common_misidentifications TEXT,
  engineering_significance TEXT,
  common_risks TEXT,
  common_treatments TEXT,
  australia_context TEXT,
  confidence_score REAL,
  confidence_band TEXT,
  duplicate_status TEXT NOT NULL DEFAULT 'none',
  review_status TEXT NOT NULL DEFAULT 'unreviewed',
  reviewer_note TEXT,
  source_section TEXT,
  source_sentence TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (batch_id) REFERENCES import_batches(id)
);

CREATE TABLE IF NOT EXISTS pending_geo_features (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  source_report_id TEXT,
  raw_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  chinese_name TEXT,
  geo_feature_category TEXT,
  geo_feature_subtype TEXT,
  description TEXT,
  identification_method TEXT,
  distinguishing_points TEXT,
  common_causes TEXT,
  risk_implications TEXT,
  treatment_or_mitigation TEXT,
  reporting_expressions TEXT,
  inspection_points TEXT,
  confidence_score REAL,
  confidence_band TEXT,
  duplicate_status TEXT NOT NULL DEFAULT 'none',
  review_status TEXT NOT NULL DEFAULT 'unreviewed',
  reviewer_note TEXT,
  source_section TEXT,
  source_sentence TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (batch_id) REFERENCES import_batches(id)
);

CREATE TABLE IF NOT EXISTS pending_strategies (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  source_report_id TEXT,
  raw_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  chinese_name TEXT,
  strategy_category TEXT,
  description TEXT,
  steps_or_method TEXT,
  application_conditions TEXT,
  limitations TEXT,
  linked_reporting_expression TEXT,
  monitoring_notes TEXT,
  confidence_score REAL,
  confidence_band TEXT,
  duplicate_status TEXT NOT NULL DEFAULT 'none',
  review_status TEXT NOT NULL DEFAULT 'unreviewed',
  reviewer_note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (batch_id) REFERENCES import_batches(id)
);

CREATE TABLE IF NOT EXISTS pending_images (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  asset_group_id TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  original_width INTEGER,
  original_height INTEGER,
  original_size_bytes INTEGER,
  hash TEXT,
  caption TEXT,
  description TEXT,
  tags_json TEXT,
  temp_storage_path TEXT,
  processing_status TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'unreviewed',
  reviewer_note TEXT,
  source_type TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (batch_id) REFERENCES import_batches(id)
);

CREATE TABLE IF NOT EXISTS pending_item_image_links (
  id TEXT PRIMARY KEY,
  pending_item_type TEXT NOT NULL,
  pending_item_id TEXT NOT NULL,
  pending_image_id TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  link_role TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (pending_image_id) REFERENCES pending_images(id)
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  source_report_id TEXT,
  title TEXT NOT NULL,
  document_type TEXT,
  document_number TEXT,
  edition TEXT,
  jurisdiction TEXT,
  authority_level TEXT,
  document_status TEXT,
  publisher TEXT,
  source_url TEXT,
  project TEXT,
  discipline TEXT,
  report_date TEXT,
  effective_date TEXT,
  source_type TEXT,
  author TEXT,
  organization TEXT,
  tags_json TEXT,
  keywords_json TEXT,
  summary TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  canonical_word TEXT NOT NULL,
  normalized_word TEXT NOT NULL,
  lemma TEXT,
  part_of_speech TEXT,
  language_category TEXT,
  chinese_meaning TEXT,
  english_definition TEXT,
  difficulty_level TEXT,
  mastery_level TEXT,
  frequency_score REAL,
  provenance_type TEXT NOT NULL,
  first_added_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_starred INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS phrases (
  id TEXT PRIMARY KEY,
  canonical_phrase TEXT NOT NULL,
  normalized_phrase TEXT NOT NULL,
  phrase_type TEXT,
  function_type TEXT,
  scenario_type TEXT,
  chinese_meaning TEXT,
  explanation TEXT,
  difficulty_level TEXT,
  mastery_level TEXT,
  reusable_score REAL,
  provenance_type TEXT NOT NULL,
  first_added_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_starred INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sentences (
  id TEXT PRIMARY KEY,
  canonical_sentence TEXT NOT NULL,
  normalized_sentence TEXT NOT NULL,
  sentence_type TEXT,
  function_type TEXT,
  scenario_type TEXT,
  chinese_literal TEXT,
  chinese_natural TEXT,
  section_name TEXT,
  reusable_flag INTEGER NOT NULL DEFAULT 0,
  reusable_score REAL,
  difficulty_level TEXT,
  mastery_level TEXT,
  provenance_type TEXT NOT NULL,
  first_added_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_starred INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS geo_materials (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  chinese_name TEXT,
  geo_material_category TEXT,
  geo_material_subtype TEXT,
  description TEXT,
  identification_method TEXT,
  distinguishing_points TEXT,
  common_misidentifications TEXT,
  engineering_significance TEXT,
  common_risks TEXT,
  common_treatments TEXT,
  australia_context TEXT,
  difficulty_level TEXT,
  mastery_level TEXT,
  provenance_type TEXT NOT NULL,
  first_added_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_starred INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS geo_features (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  chinese_name TEXT,
  geo_feature_category TEXT,
  geo_feature_subtype TEXT,
  description TEXT,
  identification_method TEXT,
  distinguishing_points TEXT,
  common_causes TEXT,
  risk_implications TEXT,
  treatment_or_mitigation TEXT,
  reporting_expressions TEXT,
  inspection_points TEXT,
  difficulty_level TEXT,
  mastery_level TEXT,
  provenance_type TEXT NOT NULL,
  first_added_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_starred INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS strategies (
  id TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  chinese_name TEXT,
  strategy_category TEXT,
  description TEXT,
  steps_or_method TEXT,
  application_conditions TEXT,
  limitations TEXT,
  linked_reporting_expression TEXT,
  monitoring_notes TEXT,
  difficulty_level TEXT,
  provenance_type TEXT NOT NULL,
  first_added_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_starred INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0
);

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

CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  asset_group_id TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  original_width INTEGER,
  original_height INTEGER,
  original_size_bytes INTEGER,
  hash TEXT,
  variant_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT,
  description TEXT,
  tags_json TEXT,
  source_type TEXT,
  provenance_type TEXT NOT NULL,
  added_by_user INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS item_sources (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  report_id TEXT,
  source_section TEXT,
  source_sentence TEXT,
  source_excerpt TEXT,
  source_page_ref TEXT,
  source_paragraph_ref TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (report_id) REFERENCES reports(id)
);

CREATE TABLE IF NOT EXISTS item_relations (
  id TEXT PRIMARY KEY,
  from_item_type TEXT NOT NULL,
  from_item_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  to_item_type TEXT NOT NULL,
  to_item_id TEXT NOT NULL,
  confidence_score REAL,
  created_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS item_image_links (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  image_asset_id TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  link_role TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (image_asset_id) REFERENCES images(id)
);

CREATE TABLE IF NOT EXISTS user_notes (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  note_text TEXT NOT NULL,
  note_type TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS personal_notes (
  id TEXT PRIMARY KEY,
  note_type TEXT NOT NULL CHECK (note_type IN ('observation', 'risk', 'action', 'reminder', 'lesson')),
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')),
  target_item_type TEXT NOT NULL CHECK (target_item_type IN ('geo_material', 'geo_feature')),
  target_item_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  folder_name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS custom_tags (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_logs (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  review_mode TEXT,
  review_result TEXT,
  response_time_ms INTEGER,
  reviewed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_entry_metadata (
  id TEXT PRIMARY KEY,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  created_by_user INTEGER NOT NULL DEFAULT 0,
  manually_edited INTEGER NOT NULL DEFAULT 0,
  user_provenance_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rulesets (
  id TEXT PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  version TEXT NOT NULL,
  rule_content TEXT NOT NULL,
  schema_version TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS backup_snapshots (
  id TEXT PRIMARY KEY,
  snapshot_name TEXT NOT NULL,
  snapshot_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  includes_images INTEGER NOT NULL DEFAULT 1,
  includes_pending INTEGER NOT NULL DEFAULT 1,
  includes_user_data INTEGER NOT NULL DEFAULT 1,
  backup_path TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS storage_meta (
  id TEXT PRIMARY KEY,
  meta_key TEXT NOT NULL,
  meta_value TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS migration_log (
  id TEXT PRIMARY KEY,
  migration_name TEXT NOT NULL,
  from_version TEXT,
  to_version TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  success INTEGER NOT NULL DEFAULT 1,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_import_batches_imported_at ON import_batches(imported_at);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON import_batches(import_status);
CREATE INDEX IF NOT EXISTS idx_import_batches_validation_status ON import_batches(validation_status);
CREATE INDEX IF NOT EXISTS idx_pending_words_batch_id ON pending_words(batch_id);
CREATE INDEX IF NOT EXISTS idx_pending_words_normalized_word ON pending_words(normalized_word);
CREATE INDEX IF NOT EXISTS idx_pending_words_review_status ON pending_words(review_status);
CREATE INDEX IF NOT EXISTS idx_pending_words_duplicate_status ON pending_words(duplicate_status);
CREATE INDEX IF NOT EXISTS idx_pending_words_confidence_band ON pending_words(confidence_band);
CREATE INDEX IF NOT EXISTS idx_pending_phrases_batch_id ON pending_phrases(batch_id);
CREATE INDEX IF NOT EXISTS idx_pending_phrases_normalized_phrase ON pending_phrases(normalized_phrase);
CREATE INDEX IF NOT EXISTS idx_pending_phrases_function_type ON pending_phrases(function_type);
CREATE INDEX IF NOT EXISTS idx_pending_phrases_scenario_type ON pending_phrases(scenario_type);
CREATE INDEX IF NOT EXISTS idx_pending_phrases_review_status ON pending_phrases(review_status);
CREATE INDEX IF NOT EXISTS idx_pending_phrases_duplicate_status ON pending_phrases(duplicate_status);
CREATE INDEX IF NOT EXISTS idx_pending_sentences_batch_id ON pending_sentences(batch_id);
CREATE INDEX IF NOT EXISTS idx_pending_sentences_normalized_sentence ON pending_sentences(normalized_sentence);
CREATE INDEX IF NOT EXISTS idx_pending_sentences_sentence_type ON pending_sentences(sentence_type);
CREATE INDEX IF NOT EXISTS idx_pending_sentences_function_type ON pending_sentences(function_type);
CREATE INDEX IF NOT EXISTS idx_pending_sentences_scenario_type ON pending_sentences(scenario_type);
CREATE INDEX IF NOT EXISTS idx_pending_sentences_review_status ON pending_sentences(review_status);
CREATE INDEX IF NOT EXISTS idx_pending_sentences_duplicate_status ON pending_sentences(duplicate_status);
CREATE INDEX IF NOT EXISTS idx_pending_geo_materials_batch_id ON pending_geo_materials(batch_id);
CREATE INDEX IF NOT EXISTS idx_pending_geo_materials_normalized_name ON pending_geo_materials(normalized_name);
CREATE INDEX IF NOT EXISTS idx_pending_geo_materials_category ON pending_geo_materials(geo_material_category);
CREATE INDEX IF NOT EXISTS idx_pending_geo_materials_subtype ON pending_geo_materials(geo_material_subtype);
CREATE INDEX IF NOT EXISTS idx_pending_geo_materials_review_status ON pending_geo_materials(review_status);
CREATE INDEX IF NOT EXISTS idx_pending_geo_materials_duplicate_status ON pending_geo_materials(duplicate_status);
CREATE INDEX IF NOT EXISTS idx_pending_geo_features_batch_id ON pending_geo_features(batch_id);
CREATE INDEX IF NOT EXISTS idx_pending_geo_features_normalized_name ON pending_geo_features(normalized_name);
CREATE INDEX IF NOT EXISTS idx_pending_geo_features_category ON pending_geo_features(geo_feature_category);
CREATE INDEX IF NOT EXISTS idx_pending_geo_features_subtype ON pending_geo_features(geo_feature_subtype);
CREATE INDEX IF NOT EXISTS idx_pending_geo_features_review_status ON pending_geo_features(review_status);
CREATE INDEX IF NOT EXISTS idx_pending_geo_features_duplicate_status ON pending_geo_features(duplicate_status);
CREATE INDEX IF NOT EXISTS idx_pending_strategies_batch_id ON pending_strategies(batch_id);
CREATE INDEX IF NOT EXISTS idx_pending_strategies_normalized_name ON pending_strategies(normalized_name);
CREATE INDEX IF NOT EXISTS idx_pending_strategies_category ON pending_strategies(strategy_category);
CREATE INDEX IF NOT EXISTS idx_pending_strategies_review_status ON pending_strategies(review_status);
CREATE INDEX IF NOT EXISTS idx_pending_strategies_duplicate_status ON pending_strategies(duplicate_status);
CREATE INDEX IF NOT EXISTS idx_pending_images_batch_id ON pending_images(batch_id);
CREATE INDEX IF NOT EXISTS idx_pending_images_hash ON pending_images(hash);
CREATE INDEX IF NOT EXISTS idx_pending_images_processing_status ON pending_images(processing_status);
CREATE INDEX IF NOT EXISTS idx_pending_images_review_status ON pending_images(review_status);
CREATE INDEX IF NOT EXISTS idx_pending_item_image_links_item ON pending_item_image_links(pending_item_type, pending_item_id);
CREATE INDEX IF NOT EXISTS idx_pending_item_image_links_image ON pending_item_image_links(pending_image_id);
CREATE INDEX IF NOT EXISTS idx_reports_title ON reports(title);
CREATE INDEX IF NOT EXISTS idx_reports_project ON reports(project);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date);
CREATE INDEX IF NOT EXISTS idx_reports_document_type ON reports(document_type);
CREATE INDEX IF NOT EXISTS idx_reports_document_number ON reports(document_number);
CREATE INDEX IF NOT EXISTS idx_reports_jurisdiction ON reports(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_reports_authority_level ON reports(authority_level);
CREATE INDEX IF NOT EXISTS idx_reports_document_status ON reports(document_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_words_normalized_word_unique ON words(normalized_word);
CREATE INDEX IF NOT EXISTS idx_words_language_category ON words(language_category);
CREATE INDEX IF NOT EXISTS idx_words_mastery_level ON words(mastery_level);
CREATE INDEX IF NOT EXISTS idx_words_is_starred ON words(is_starred);
CREATE UNIQUE INDEX IF NOT EXISTS idx_phrases_normalized_phrase_unique ON phrases(normalized_phrase);
CREATE INDEX IF NOT EXISTS idx_phrases_phrase_type ON phrases(phrase_type);
CREATE INDEX IF NOT EXISTS idx_phrases_function_type ON phrases(function_type);
CREATE INDEX IF NOT EXISTS idx_phrases_scenario_type ON phrases(scenario_type);
CREATE INDEX IF NOT EXISTS idx_phrases_mastery_level ON phrases(mastery_level);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sentences_normalized_sentence_unique ON sentences(normalized_sentence);
CREATE INDEX IF NOT EXISTS idx_sentences_sentence_type ON sentences(sentence_type);
CREATE INDEX IF NOT EXISTS idx_sentences_function_type ON sentences(function_type);
CREATE INDEX IF NOT EXISTS idx_sentences_scenario_type ON sentences(scenario_type);
CREATE INDEX IF NOT EXISTS idx_sentences_reusable_flag ON sentences(reusable_flag);
CREATE INDEX IF NOT EXISTS idx_sentences_mastery_level ON sentences(mastery_level);
CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_materials_normalized_name_unique ON geo_materials(normalized_name);
CREATE INDEX IF NOT EXISTS idx_geo_materials_category ON geo_materials(geo_material_category);
CREATE INDEX IF NOT EXISTS idx_geo_materials_subtype ON geo_materials(geo_material_subtype);
CREATE INDEX IF NOT EXISTS idx_geo_materials_mastery_level ON geo_materials(mastery_level);
CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_features_normalized_name_unique ON geo_features(normalized_name);
CREATE INDEX IF NOT EXISTS idx_geo_features_category ON geo_features(geo_feature_category);
CREATE INDEX IF NOT EXISTS idx_geo_features_subtype ON geo_features(geo_feature_subtype);
CREATE INDEX IF NOT EXISTS idx_geo_features_mastery_level ON geo_features(mastery_level);
CREATE UNIQUE INDEX IF NOT EXISTS idx_strategies_normalized_name_unique ON strategies(normalized_name);
CREATE INDEX IF NOT EXISTS idx_strategies_category ON strategies(strategy_category);
CREATE INDEX IF NOT EXISTS idx_strategies_is_starred ON strategies(is_starred);
CREATE UNIQUE INDEX IF NOT EXISTS idx_requirements_normalized_name_unique ON requirements(normalized_name);
CREATE INDEX IF NOT EXISTS idx_requirements_category ON requirements(requirement_category);
CREATE INDEX IF NOT EXISTS idx_requirements_source_document_id ON requirements(source_document_id);
CREATE INDEX IF NOT EXISTS idx_requirements_authority_level ON requirements(authority_level);
CREATE UNIQUE INDEX IF NOT EXISTS idx_methods_normalized_name_unique ON methods(normalized_name);
CREATE INDEX IF NOT EXISTS idx_methods_category ON methods(method_category);
CREATE INDEX IF NOT EXISTS idx_methods_source_document_id ON methods(source_document_id);
CREATE INDEX IF NOT EXISTS idx_methods_authority_level ON methods(authority_level);
CREATE INDEX IF NOT EXISTS idx_images_asset_group_id ON images(asset_group_id);
CREATE INDEX IF NOT EXISTS idx_images_hash ON images(hash);
CREATE INDEX IF NOT EXISTS idx_images_variant_type ON images(variant_type);
CREATE INDEX IF NOT EXISTS idx_images_source_type ON images(source_type);
CREATE INDEX IF NOT EXISTS idx_item_sources_item ON item_sources(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_item_sources_report_id ON item_sources(report_id);
CREATE INDEX IF NOT EXISTS idx_item_relations_from_item ON item_relations(from_item_type, from_item_id);
CREATE INDEX IF NOT EXISTS idx_item_relations_to_item ON item_relations(to_item_type, to_item_id);
CREATE INDEX IF NOT EXISTS idx_item_relations_relation_type ON item_relations(relation_type);
CREATE INDEX IF NOT EXISTS idx_item_image_links_item ON item_image_links(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_item_image_links_image ON item_image_links(image_asset_id);
CREATE INDEX IF NOT EXISTS idx_item_image_links_role ON item_image_links(link_role);
CREATE INDEX IF NOT EXISTS idx_user_notes_item ON user_notes(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_note_type ON user_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_personal_notes_target ON personal_notes(target_item_type, target_item_id);
CREATE INDEX IF NOT EXISTS idx_personal_notes_status ON personal_notes(status);
CREATE INDEX IF NOT EXISTS idx_personal_notes_note_type ON personal_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_personal_notes_updated_at ON personal_notes(updated_at);
CREATE INDEX IF NOT EXISTS idx_favorites_item ON favorites(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_favorites_folder_name ON favorites(folder_name);
CREATE INDEX IF NOT EXISTS idx_custom_tags_item ON custom_tags(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_custom_tags_tag_name ON custom_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_review_logs_item ON review_logs(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed_at ON review_logs(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_review_logs_review_result ON review_logs(review_result);
CREATE INDEX IF NOT EXISTS idx_user_entry_metadata_item ON user_entry_metadata(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_user_entry_metadata_created_by_user ON user_entry_metadata(created_by_user);
CREATE INDEX IF NOT EXISTS idx_user_entry_metadata_manually_edited ON user_entry_metadata(manually_edited);
CREATE INDEX IF NOT EXISTS idx_rulesets_rule_type ON rulesets(rule_type);
CREATE INDEX IF NOT EXISTS idx_rulesets_version ON rulesets(version);
CREATE INDEX IF NOT EXISTS idx_rulesets_is_active ON rulesets(is_active);
CREATE INDEX IF NOT EXISTS idx_backup_snapshots_snapshot_type ON backup_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_backup_snapshots_created_at ON backup_snapshots(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_storage_meta_meta_key_unique ON storage_meta(meta_key);
CREATE INDEX IF NOT EXISTS idx_migration_log_to_version ON migration_log(to_version);
CREATE INDEX IF NOT EXISTS idx_migration_log_applied_at ON migration_log(applied_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_settings_setting_key_unique ON app_settings(setting_key);


