PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS capability_definitions (
  name TEXT PRIMARY KEY,
  protocol_version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  access TEXT NOT NULL CHECK (
    access IN ('public', 'owner', 'authorized')
  ),
  requires_approval INTEGER NOT NULL DEFAULT 0 CHECK (
    requires_approval IN (0, 1)
  ),
  category TEXT,
  operation_type TEXT CHECK (
    operation_type IS NULL OR
    operation_type IN ('read', 'write', 'execute')
  ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO capability_definitions (
  name, protocol_version, title, description,
  access, requires_approval, category,
  operation_type, created_at, updated_at
) VALUES
(
  'manual.view', '0.1', 'View manual',
  'View operating or service documentation for the object.',
  'public', 0, 'documentation', 'read',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
  'warranty.view', '0.1', 'View warranty',
  'View warranty information associated with the object.',
  'public', 0, 'warranty', 'read',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
  'parts.find', '0.1', 'Find parts',
  'Discover compatible or replacement parts for the object.',
  'public', 0, 'parts', 'read',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
  'maintenance.record', '0.1', 'Record maintenance',
  'Append a maintenance record to the object lifecycle.',
  'owner', 0, 'maintenance', 'write',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
  'ownership.transfer', '0.1', 'Transfer ownership',
  'Initiate a change of control while preserving object identity.',
  'owner', 1, 'ownership', 'execute',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
  'status.read', '0.1', 'Read status',
  'Read the current reported state of a connected object.',
  'owner', 0, 'telemetry', 'read',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
  'battery.read', '0.1', 'Read battery',
  'Read battery information reported by a connected object.',
  'owner', 0, 'telemetry', 'read',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
  'door.lock', '0.1', 'Lock object',
  'Execute the connected-object lock action.',
  'authorized', 1, 'control', 'execute',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
  'door.unlock', '0.1', 'Unlock object',
  'Execute the connected-object unlock action.',
  'authorized', 1, 'control', 'execute',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
