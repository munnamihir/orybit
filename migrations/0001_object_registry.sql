CREATE TABLE IF NOT EXISTS objects (
  id TEXT PRIMARY KEY NOT NULL,
  public_id TEXT UNIQUE NOT NULL,
  protocol_version TEXT NOT NULL,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  serial TEXT,
  description TEXT,
  lifecycle_status TEXT NOT NULL
    CHECK (
      lifecycle_status IN (
        'active',
        'inactive',
        'lost',
        'retired'
      )
    ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  carriers_json TEXT NOT NULL
    DEFAULT '[]',
  capabilities_json TEXT NOT NULL
    DEFAULT '[]',
  metadata_json TEXT NOT NULL
    DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS
  idx_objects_public_id
ON objects(public_id);

CREATE INDEX IF NOT EXISTS
  idx_objects_kind
ON objects(kind);

CREATE INDEX IF NOT EXISTS
  idx_objects_status
ON objects(lifecycle_status);

CREATE INDEX IF NOT EXISTS
  idx_objects_created_at
ON objects(created_at);
