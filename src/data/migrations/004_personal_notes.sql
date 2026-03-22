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

CREATE INDEX IF NOT EXISTS idx_personal_notes_target ON personal_notes(target_item_type, target_item_id);
CREATE INDEX IF NOT EXISTS idx_personal_notes_status ON personal_notes(status);
CREATE INDEX IF NOT EXISTS idx_personal_notes_note_type ON personal_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_personal_notes_updated_at ON personal_notes(updated_at);