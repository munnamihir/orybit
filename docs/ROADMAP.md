# ORYBIT Roadmap

## Phase 0 — Foundation — COMPLETE

Defined:

- product vision
- engineering principles
- architecture
- object schema
- event schema
- capability schema
- ADRs
- protocol SDK
- runtime validation

## Phase 1 — Object Registry — COMPLETE

Built:

- object creation
- object persistence
- object lookup
- management dashboard
- REST object API
- D1 persistence adapter
- automated registry tests

## Phase 2 — Universal Object Page — COMPLETE

Built:

- mobile-first public object view
- public/private field boundaries
- object status
- public-safe projection

## Phase 3 — Physical-to-Digital Bridge — COMPLETE

Built:

- QR generation
- QR resolution
- NFC-compatible HTTPS URI strategy
- public object identity route
- real physical-object phone scan demo

## Phase 4 — Object Memory — COMPLETE

Built:

- event timeline
- maintenance events
- lifecycle events
- append-only historical records
- D1 event persistence
- system registration events
- admin Object Memory console

## Phase 5 — Ownership — COMPLETE

Built:

- separate owner identities
- initial owner association
- one-active-owner invariant
- ownership history
- secret ownership transfer invites
- transfer acceptance and cancellation
- transfer expiry
- domain-separated SHA-512 transfer-token verifier
- automatic ownership events in Object Memory
- private ownership administration
- PQC-ready cryptographic roadmap for ML-DSA / ML-KEM

Future ownership work may include:

- authenticated user-to-owner binding
- stronger proof of physical possession
- shared/delegated ownership
- disputed transfer handling
- configurable ownership visibility
- ML-DSA signed transfer records
- ML-KEM recipient-bound handoff

## Phase 6 — Capability Engine — COMPLETE

Built:

- persistent capability definition registry
- structured capability metadata
- category semantics
- read/write/execute operation semantics
- public / owner / authorized access hints
- approval hints
- per-object capability enable/disable
- structured capability resolution
- unresolved legacy capability detection
- capability assignment enforcement
- public capability filtering
- Capability Engine management console

The Capability Engine describes **what an object can do**. PermissionOS will later decide **who may invoke those capabilities and under which policy**.

## Phase 7 — Object Manifest — IN PROGRESS

Step 011 builds:

- public machine-readable object manifest
- `GET /manifest/:publicId`
- manifest JSON Schema
- executable manifest TypeScript model and validator
- public-safe identity projection
- structured public capability definitions
- canonical profile/API/schema links
- HTTP discovery links
- human-readable profile link to manifest
- public-ID-only resolution
- reference coffee-machine manifest
- no duplicate D1 manifest storage

The Object Manifest answers **how software can discover the public contract of a physical object in one document**.

## Phase 8 — Developer Platform

Build:

- REST API
- SDK
- API authentication
- developer documentation
- example integrations

## Phase 9 — PermissionOS

Build:

- scoped authorization
- temporary access
- action approval
- audit history

## Phase 10 — Reality API

Research and prototype:

- standardized physical capabilities
- manufacturer adapters
- device abstractions
- common action semantics

## Phase 11 — Intelligence Layer

Explore:

- local/open AI models
- diagnostics
- natural-language object interaction
- contextual assistance

## Phase 12 — Ecosystem

Explore:

- manufacturer tooling
- developer ecosystem
- additional carriers
- interoperability
- standards participation
