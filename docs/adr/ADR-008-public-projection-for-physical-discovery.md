# ADR-008: Public Projection for Physical Discovery

Date: 2026-09-28

Status: Accepted

## Context

ORYBIT physical discovery through QR or NFC must work without administrator credentials.

The internal registry contains fields that should not automatically become public merely because an object is scannable.

Examples include:

- internal object identifiers
- serial numbers
- metadata
- administrator-only controls

## Decision

Physical discovery will resolve to a dedicated public projection identified only by the object's `publicId`.

The public projection is served through:

```http
GET /public/objects/{publicId}
```

The public web profile is served through:

```text
/o/{publicId}
```

The projection explicitly selects publishable fields instead of serializing the complete registry object.

## Consequences

Positive:

- QR/NFC links do not contain administrator credentials
- internal object IDs remain private
- serial numbers and metadata remain private by default
- the public schema can evolve independently from the administrator schema
- the same public URL can be reused across QR, NFC, and future carriers

Tradeoff:

ORYBIT now maintains two views of an object:

1. administrator registry representation
2. public physical-discovery projection

This duplication is intentional because the two surfaces have different trust boundaries.
