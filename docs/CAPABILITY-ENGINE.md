# ORYBIT Capability Engine

The Capability Engine answers:

> What can this physical object do?

Step 010 converts ORYBIT capability names from isolated strings into references to persistent, structured definitions while preserving the Protocol v0.1 object shape.

## Core model

ORYBIT intentionally separates three concepts:

1. **Capability definition** — what an ability means.
2. **Object assignment** — whether the object exposes that ability.
3. **Permission policy** — who may invoke it.

Step 010 implements the first two. Permission policy belongs to PermissionOS.

## Backward-compatible object references

Protocol v0.1 objects continue to store:

```json
{
  "capabilities": [
    "manual.view",
    "maintenance.record"
  ]
}
```

Those strings are stable references into the capability definition registry.

A definition can resolve `manual.view` into:

```json
{
  "protocolVersion": "0.1",
  "name": "manual.view",
  "title": "View manual",
  "description": "View operating or service documentation for the object.",
  "access": "public",
  "requiresApproval": false,
  "category": "documentation",
  "operation": "read"
}
```

## Definition fields

Required protocol fields:

- `protocolVersion`
- `name`
- `title`
- `description`
- `access`

Step 010 adds optional structured semantics:

- `category`
- `operation`: `read`, `write`, or `execute`
- `requiresApproval`

`access` and `requiresApproval` are policy **hints**. They are not final authorization decisions.

## Persistence

Migration `0004_capability_engine.sql` creates:

```text
capability_definitions
```

The migration seeds common ORYBIT definitions including:

- `manual.view`
- `warranty.view`
- `parts.find`
- `maintenance.record`
- `ownership.transfer`
- `status.read`
- `battery.read`
- `door.lock`
- `door.unlock`

Objects remain the canonical store for which capability names are enabled on each object. A second assignment table is deliberately avoided in v0.1 to prevent duplicated state.

## Resolution

The engine resolves an object's capability-name list against the registry.

Each reference becomes either:

- `defined`
- `unresolved`

Unresolved references are retained and visible to administrators so legacy data is never silently discarded.

## Assignment enforcement

New object create/update requests that explicitly include a capability list are checked against the definition registry by the Worker runtime.

The dedicated assignment API also refuses to enable an undefined capability.

This means a new capability cannot be attached accidentally without first receiving a structured definition.

## Public projection

The normal public QR profile now exposes only capability names whose definitions have:

```text
access = public
```

Owner and authorized capability names are not included in ordinary physical-discovery responses.

This is a projection rule, not PermissionOS.

## API

Definition registry:

```text
GET   /v1/capabilities
POST  /v1/capabilities
GET   /v1/capabilities/:name
PATCH /v1/capabilities/:name
```

Object capability resolution and assignment:

```text
GET    /v1/objects/:identifier/capabilities
PUT    /v1/objects/:identifier/capabilities/:name
DELETE /v1/objects/:identifier/capabilities/:name
```

All Step 010 capability administration routes use the existing admin authentication boundary.

## Capability Engine console

The admin dashboard adds a dedicated Capability Engine surface with:

- object selection
- enabled capability state
- unresolved legacy detection
- structured capability catalog
- category and operation display
- access/approval hints
- enable/disable controls
- custom capability definition creation

## Boundary with PermissionOS

The Capability Engine must not answer:

> Is this specific principal authorized right now?

That belongs to PermissionOS, where policy can consider:

- principal identity
- current owner
- delegated access
- scopes
- time windows
- approvals
- audit context

Capability Engine output is an input to that later authorization layer.
