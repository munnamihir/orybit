# ORYBIT Architecture

## Current Architecture

ORYBIT begins as a deliberately small system.

```text
                  Browser
                     |
                     v
                ORYBIT Web
                     |
                     v
                  API Layer
                     |
       +-------------+-------------+
       |             |             |
       v             v             v
    Objects        Events      Capabilities
       |             |             |
       +-------------+-------------+
                     |
                     v
                  Database
```

## Object Identity

ORYBIT maintains a persistent object identifier independent of discovery mechanisms.

```text
                    ORYBIT Object
                         |
            +------------+------------+
            |            |            |
            v            v            v
            QR           NFC        Future
```

## Initial Domain Model

```text
Object
 |
 +--- Identity
 |
 +--- Carriers
 |
 +--- Lifecycle State
 |
 +--- Capabilities
 |
 +--- Events
```

Ownership, permissions, actions, device communication, and AI integration will be introduced in later phases.

## Repository Boundaries

### apps/web
Human-facing ORYBIT web application.

### workers/api
HTTP API and backend logic.

### packages/protocol
Shared ORYBIT protocol types, validators, and utilities.

### specs
Versioned public protocol specifications.

### database
Database schema and migrations.

### examples
Reference implementations and example objects.

### docs
Architecture documents, roadmap, threat model, and ADRs.

## Architecture Rule

No new infrastructure component should be introduced without a documented problem that requires it.
