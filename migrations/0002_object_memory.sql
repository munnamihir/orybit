CREATE TABLE IF NOT EXISTS object_events (
  id TEXT PRIMARY KEY NOT NULL,
  object_id TEXT NOT NULL,
  protocol_version TEXT NOT NULL,
  type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  actor_type TEXT NOT NULL
    CHECK (
      actor_type IN (
        'system',
        'user',
        'manufacturer',
        'service-provider',
        'device'
      )
    ),
  actor_id TEXT,
  data_json TEXT NOT NULL
    DEFAULT '{}',
  created_at TEXT NOT NULL
    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (object_id)
    REFERENCES objects(id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS
  idx_object_events_object_id
ON object_events(object_id);

CREATE INDEX IF NOT EXISTS
  idx_object_events_object_time
ON object_events(object_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS
  idx_object_events_type
ON object_events(type);
