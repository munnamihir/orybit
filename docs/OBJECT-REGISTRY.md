# ORYBIT Object Registry

Status: Phase 1 / Step 004

## Purpose

The Object Registry is the first executable backend built on top of ORYBIT Protocol v0.1.

It provides a canonical place to:

- create physical-object identities
- store object state
- list registered objects
- resolve an object by internal or public ID
- update mutable object state

## API

### Health

```http
GET /health
```

### Create Object

```http
POST /v1/objects
Content-Type: application/json
```

Example:

```json
{
  "kind": "appliance",
  "identity": {
    "name": "Coffee Machine",
    "manufacturer": "Demo Appliances"
  },
  "capabilities": [
    "manual.view",
    "maintenance.record"
  ]
}
```

ORYBIT generates:

- internal object ID
- public object ID when omitted
- protocol version
- lifecycle timestamps
- initial `active` state

### List Objects

```http
GET /v1/objects
```

### Get Object

Both identifiers are supported:

```http
GET /v1/objects/{internalId}
GET /v1/objects/{publicId}
```

### Update Object

```http
PATCH /v1/objects/{internalId-or-publicId}
Content-Type: application/json
```

Object IDs, public IDs, and protocol version are immutable through this endpoint.

## Persistence

The production adapter targets Cloudflare D1.

A separate in-memory repository exists for automated tests.

```text
HTTP API
   |
   v
ObjectRepository
   |
   +-------- MemoryObjectRepository
   |              |
   |              +-- tests
   |
   +-------- D1ObjectRepository
                  |
                  +-- Cloudflare D1
```

This keeps HTTP/domain behavior independent from the storage implementation.

## Current Scope

Included:

- create
- list
- read
- update
- protocol validation
- D1 migration
- automated tests

Not yet included:

- authentication
- ownership
- lifecycle event persistence
- delete
- permissions
- QR generation
- public object UI

Those are intentionally deferred to later roadmap stages.
