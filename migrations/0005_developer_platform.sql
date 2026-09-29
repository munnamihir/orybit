PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS developer_api_keys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  scopes_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_developer_api_keys_revoked
ON developer_api_keys(revoked_at);

CREATE INDEX IF NOT EXISTS idx_developer_api_keys_created
ON developer_api_keys(created_at DESC);
