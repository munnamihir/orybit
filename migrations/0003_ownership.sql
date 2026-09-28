PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS owners (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  owner_type TEXT NOT NULL
    CHECK (owner_type IN ('person', 'organization')),
  reference TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ownership_records (
  id TEXT PRIMARY KEY NOT NULL,
  object_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  source TEXT NOT NULL
    CHECK (source IN ('assigned', 'transfer')),
  note TEXT,
  created_at TEXT NOT NULL
    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (object_id)
    REFERENCES objects(id)
    ON DELETE RESTRICT,
  FOREIGN KEY (owner_id)
    REFERENCES owners(id)
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS
  idx_ownership_one_active_per_object
ON ownership_records(object_id)
WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS
  idx_ownership_history
ON ownership_records(object_id, started_at DESC);

CREATE INDEX IF NOT EXISTS
  idx_ownership_owner
ON ownership_records(owner_id, started_at DESC);

CREATE TABLE IF NOT EXISTS ownership_transfers (
  id TEXT PRIMARY KEY NOT NULL,
  object_id TEXT NOT NULL,
  from_owner_id TEXT NOT NULL,
  to_owner_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL
    CHECK (
      status IN (
        'pending',
        'accepted',
        'cancelled',
        'expired'
      )
    ),
  requested_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  cancelled_at TEXT,
  note TEXT,
  created_at TEXT NOT NULL
    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (object_id)
    REFERENCES objects(id)
    ON DELETE RESTRICT,
  FOREIGN KEY (from_owner_id)
    REFERENCES owners(id)
    ON DELETE RESTRICT,
  FOREIGN KEY (to_owner_id)
    REFERENCES owners(id)
    ON DELETE RESTRICT,
  CHECK (from_owner_id <> to_owner_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS
  idx_transfer_one_pending_per_object
ON ownership_transfers(object_id)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS
  idx_transfer_object_history
ON ownership_transfers(object_id, requested_at DESC);

CREATE INDEX IF NOT EXISTS
  idx_transfer_token_hash
ON ownership_transfers(token_hash);

CREATE TRIGGER IF NOT EXISTS
  trg_ownership_record_event
AFTER INSERT ON ownership_records
BEGIN
  INSERT INTO object_events (
    id,
    object_id,
    protocol_version,
    type,
    occurred_at,
    actor_type,
    data_json
  ) VALUES (
    'evt_' || lower(hex(randomblob(16))),
    NEW.object_id,
    '0.1',
    CASE
      WHEN NEW.source = 'transfer'
        THEN 'ownership.transferred'
      ELSE 'ownership.assigned'
    END,
    NEW.started_at,
    'system',
    json_object(
      'ownershipId', NEW.id,
      'ownerId', NEW.owner_id,
      'source', NEW.source
    )
  );
END;

CREATE TRIGGER IF NOT EXISTS
  trg_ownership_transfer_requested_event
AFTER INSERT ON ownership_transfers
BEGIN
  INSERT INTO object_events (
    id,
    object_id,
    protocol_version,
    type,
    occurred_at,
    actor_type,
    data_json
  ) VALUES (
    'evt_' || lower(hex(randomblob(16))),
    NEW.object_id,
    '0.1',
    'ownership.transfer.requested',
    NEW.requested_at,
    'system',
    json_object(
      'transferId', NEW.id,
      'fromOwnerId', NEW.from_owner_id,
      'toOwnerId', NEW.to_owner_id,
      'expiresAt', NEW.expires_at
    )
  );
END;

CREATE TRIGGER IF NOT EXISTS
  trg_ownership_transfer_cancelled_event
AFTER UPDATE OF status ON ownership_transfers
WHEN OLD.status = 'pending'
  AND NEW.status = 'cancelled'
BEGIN
  INSERT INTO object_events (
    id,
    object_id,
    protocol_version,
    type,
    occurred_at,
    actor_type,
    data_json
  ) VALUES (
    'evt_' || lower(hex(randomblob(16))),
    NEW.object_id,
    '0.1',
    'ownership.transfer.cancelled',
    COALESCE(NEW.cancelled_at, CURRENT_TIMESTAMP),
    'system',
    json_object(
      'transferId', NEW.id,
      'fromOwnerId', NEW.from_owner_id,
      'toOwnerId', NEW.to_owner_id
    )
  );
END;

CREATE TRIGGER IF NOT EXISTS
  trg_ownership_transfer_expired_event
AFTER UPDATE OF status ON ownership_transfers
WHEN OLD.status = 'pending'
  AND NEW.status = 'expired'
BEGIN
  INSERT INTO object_events (
    id,
    object_id,
    protocol_version,
    type,
    occurred_at,
    actor_type,
    data_json
  ) VALUES (
    'evt_' || lower(hex(randomblob(16))),
    NEW.object_id,
    '0.1',
    'ownership.transfer.expired',
    NEW.expires_at,
    'system',
    json_object(
      'transferId', NEW.id,
      'fromOwnerId', NEW.from_owner_id,
      'toOwnerId', NEW.to_owner_id
    )
  );
END;
