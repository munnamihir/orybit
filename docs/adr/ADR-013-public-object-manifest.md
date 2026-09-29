# ADR-013 — Computed Public Object Manifest

Status: Accepted

Date: 2026-09-28

## Context

ORYBIT now has separate runtime domains for object identity, object memory, ownership, and capabilities.

External software needs one stable machine-readable description of the public object surface, but persisting another assembled document would duplicate existing state and create synchronization risk.

The manifest must also preserve the public/private boundary already established for QR discovery.

## Decision

ORYBIT will expose a public Object Manifest at:

```text
GET /manifest/:publicId
```

The manifest is computed at request time from the object registry and capability definition registry.

It is **not stored as a separate database record**.

The manifest contains:

- manifest and protocol versions
- public object ID
- public-safe identity fields
- public lifecycle status and update time
- structured capability definitions whose access classification is `public`
- canonical discovery links

The manifest does not contain:

- internal object IDs
- serial numbers
- arbitrary metadata
- ownership data
- lifecycle-event history
- transfer secrets
- admin endpoints
- owner/authorized capabilities
- unresolved capability references

The manifest route resolves public IDs only.

## Rationale

### Avoid duplicate state

Computing the manifest from source records prevents a stored document from drifting after object or capability updates.

### Preserve privacy

A dedicated projection makes the public contract explicit instead of serializing internal runtime objects and attempting to remove sensitive fields afterward.

### Support interoperability

A JSON Schema, protocol type, runtime validator, canonical links, and a stable public endpoint give external software a concrete contract to target.

### Separate discovery from authorization

The manifest advertises what an object publicly exposes. It does not grant permission to invoke owner or authorized capabilities.

## Consequences

Positive:

- one machine-readable entry point per physical object
- no new D1 table or migration
- no manifest synchronization job
- public/private rules remain explicit
- easier SDK and agent integration in later phases

Tradeoffs:

- manifest generation performs capability resolution at request time
- naive long-lived caching is avoided because capability definitions can change independently of the object row
- private/authenticated manifests may require a separate contract later

## Follow-up

Phase 8 can build SDKs and developer tooling around the manifest.

Phase 9 can add authenticated permission-aware views rather than expanding this public document with private data.
