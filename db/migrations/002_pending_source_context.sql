ALTER TABLE pending_words ADD COLUMN source_section TEXT;
ALTER TABLE pending_words ADD COLUMN source_sentence TEXT;

ALTER TABLE pending_phrases ADD COLUMN source_section TEXT;
ALTER TABLE pending_phrases ADD COLUMN source_sentence TEXT;

ALTER TABLE pending_sentences ADD COLUMN source_section TEXT;
ALTER TABLE pending_sentences ADD COLUMN source_sentence TEXT;

ALTER TABLE pending_geo_materials ADD COLUMN source_section TEXT;
ALTER TABLE pending_geo_materials ADD COLUMN source_sentence TEXT;

ALTER TABLE pending_geo_features ADD COLUMN source_section TEXT;
ALTER TABLE pending_geo_features ADD COLUMN source_sentence TEXT;
