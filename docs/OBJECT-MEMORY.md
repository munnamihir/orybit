# ORYBIT Object Memory

Status: Phase 4 / Step 008

## Purpose

Object Memory gives a physical object an append-only lifecycle history.

ORYBIT already answers:

> What is this object?

Object Memory adds:

> What happened to this object?

## Event Model

Every memory entry is an ORYBIT Protocol v0.1 event.

```json
{
  "protocolVersion": "0.1",
  "id": "evt_...",
  "objectId": "obj_...",
  "type": "maintenance.completed",
  "occurredAt": "2026-09-28T20:00:00Z",
  "actor": {
    "type": "user"
  },
  "data": {
    "note": "Battery inspected"
  }
}
```

## API

Admin authentication is required.

### List Object Memory

```http
GET /v1/objects/{identifier}/events
```

`identifier` may be the internal ID or public ID.

### Append Object Memory

```http
POST /v1/objects/{identifier}/events
Content-Type: application/json
```

Example:

```json
{
  "type": "repair.completed",
  "actor": {
    "type": "user"
  },
  "data": {
    "note": "USB-C connector replaced"
  }
}
```

The server generates the event ID and uses the current time when `occurredAt` is omitted.

## Append-Only Rule

Step 008 intentionally provides no event update or delete endpoint.

Corrections should eventually be represented as additional events rather than destructive history edits.

## Registration Events

Migration `0002_object_memory.sql`:

- backfills an `object.registered` event for existing objects
- creates a database trigger that records `object.registered` for future object inserts

This keeps registration history close to the persistence boundary.

## Privacy

Object Memory is admin-only in Step 008.

The public QR profile does not automatically expose maintenance, repair, purchase, or other lifecycle history.

A later protocol version can introduce explicit event visibility rules before any event becomes public.

## Dashboard

The admin dashboard adds an **Object memory** console with:

- object selection
- lifecycle event type selection
- optional occurrence time
- event notes
- chronological history
- actor information

## Initial Event Vocabulary

The UI currently offers:

- `maintenance.completed`
- `inspection.completed`
- `repair.completed`
- `part.replaced`
- `purchase.recorded`
- `activation.completed`
- `note.added`

The protocol remains open to other valid dotted event names.
