# ORYBIT

> **The software layer for physical objects.**

ORYBIT explores a simple idea:

**Every physical object should be able to have a persistent digital identity, memory, ownership, capabilities, permissions, and an API.**

## Vision

Today:

- websites have URLs
- people have digital accounts
- software has APIs

ORYBIT asks:

> **Why shouldn't physical objects have a universal software interface too?**

A physical object may be discovered through QR, NFC, barcode, BLE, UWB, or future discovery technologies. The discovery carrier does **not** define the object.

```text
Physical Object
      |
      v
QR / NFC / BLE / Barcode
      |
      v
Persistent ORYBIT Identity
      |
      +---- Identity
      +---- Memory
      +---- Ownership
      +---- Capabilities
      +---- Manifest
      +---- Developer API
      +---- Permissions
      +---- Actions
      +---- API
```

## The Problem

Physical objects are mostly invisible to software.

A product may already have a serial number, barcode, NFC tag, QR code, warranty, manual, maintenance records, ownership records, and manufacturer data, but these systems are normally disconnected.

ORYBIT is an attempt to create a common software layer that can answer:

- What is this exact object?
- What happened to it?
- Who currently controls it?
- How did ownership change over time?
- What can it do?
- How can software discover its public contract?
- Which software integration is calling ORYBIT?
- Who is allowed to interact with it?
- How can software interact with it?

## Core Principles

1. Carrier-independent identity
2. Web-first access
3. Open protocols
4. Privacy by design
5. Portable object data
6. Capability-based interactions
7. Human-controlled permissions
8. Simple architecture before scale
9. Zero-cost development wherever practical
10. Interoperability over vendor lock-in

## Protocol v0.1

ORYBIT Protocol v0.1 currently defines:

### Object

A physical object's persistent digital identity.

### Event

Something that happened during the object's lifecycle.

### Capability

A structured definition of an ability exposed by an ORYBIT object. Objects continue to reference capability names so protocol v0.1 remains compact and backward compatible.

### Object Manifest

A public machine-readable contract that combines public-safe object identity, lifecycle state, structured public capabilities, and canonical discovery links in one document.

Ownership is implemented as a runtime domain layered on top of persistent object identity and append-only lifecycle events. It is intentionally separate from the object identity itself.

## Current Architecture

```text
Physical Object
      ↓
QR / future NFC
      ↓
Public ORYBIT Profile
      ↓
Object Manifest
      ↓
Persistent Object Identity
      ↓
Cloudflare Worker API
      ↓
Developer API + SDK
      ↓
Cloudflare D1
      ├── objects
      ├── object_events
      ├── owners
      ├── ownership_records
      ├── ownership_transfers
      ├── capability_definitions
      └── developer_api_keys
```

The React dashboard, public object page, public ownership-transfer acceptance page, Capability Engine console, Developer Platform console, manifest endpoint, and APIs are deployed from the same Cloudflare Worker origin.

## Current Features

### Object Registry

- register objects
- list/search objects
- update object metadata and lifecycle status
- Cloudflare D1 persistence
- admin bearer-token protection

### Physical Bridge

- public-safe object projection
- locally generated QR codes
- mobile object profile
- carrier-independent public object URL

### Object Memory

- append-only lifecycle events
- maintenance, repair, inspection, note, and system events
- persisted object timeline
- automatic registration events

### Ownership

- separate owner identities
- initial owner assignment
- one active owner per object
- ownership history
- pending transfer creation and cancellation
- secret capability-link acceptance
- domain-separated, versioned SHA-512 transfer-token verifier
- transfer expiry
- automatic ownership lifecycle events
- no ownership data on normal public QR profiles
- PQC-ready design direction documented for ML-DSA-87 and ML-KEM-1024

### Capability Engine

- persistent structured capability definition registry
- capability category and read/write/execute operation semantics
- public / owner / authorized access hints
- approval hints
- per-object capability enable/disable
- structured capability resolution
- unresolved legacy capability detection
- object creation/update enforcement for registered capability names
- public profiles expose only capabilities whose definitions are marked public
- dedicated Capability Engine admin console

Capability access classifications are descriptive hints. They are **not** a replacement for PermissionOS authorization.

### Object Manifest

- public machine-readable object contract
- `GET /manifest/:publicId`
- public-safe identity only
- structured public capability definitions
- canonical manifest/profile/API/schema links
- JSON Schema and executable runtime validation
- public-ID-only resolution
- human profile links to the manifest
- public object API advertises the manifest with an HTTP `Link` header
- computed from source registries instead of stored as duplicate state

### Developer Platform

Step 012 introduces a separate application-authentication boundary for software integrations:

- scoped developer API keys
- `ory_dev_` credential namespace
- 256-bit random key secrets
- raw API key shown only once
- domain-separated, versioned SHA-512 verifier storage
- per-key revocation
- last-used timestamps
- `objects:read`, `manifests:read`, and `capabilities:read` scopes
- read-only `/developer/v1` API
- public-safe developer projections
- dedicated Developer Platform admin console
- TypeScript SDK under `sdk/`
- reference integration under `examples/developer-sdk/`

Developer API keys identify software integrations. They do **not** grant ownership, private Object Memory access, or permission to execute physical-object actions. PermissionOS remains a separate future authorization layer.

## API

Core admin routes include:

```text
POST  /v1/objects
GET   /v1/objects
GET   /v1/objects/:identifier
PATCH /v1/objects/:identifier

GET   /v1/objects/:identifier/events
POST  /v1/objects/:identifier/events

GET   /v1/owners
POST  /v1/owners
GET   /v1/objects/:identifier/ownership
POST  /v1/objects/:identifier/ownership/assign
POST  /v1/objects/:identifier/ownership/transfers
POST  /v1/ownership-transfers/:transferId/cancel

GET   /v1/capabilities
POST  /v1/capabilities
GET   /v1/capabilities/:name
PATCH /v1/capabilities/:name
GET   /v1/objects/:identifier/capabilities
PUT   /v1/objects/:identifier/capabilities/:name
DELETE /v1/objects/:identifier/capabilities/:name

GET   /v1/developer-keys
POST  /v1/developer-keys
POST  /v1/developer-keys/:id/revoke
```

Public routes include:

```text
GET   /health
GET   /public/objects/:publicId
GET   /manifest/:publicId
POST  /public/ownership-transfers/preview
POST  /public/ownership-transfers/accept
```

Developer routes use scoped `ory_dev_...` bearer credentials:

```text
GET /developer/v1/me
GET /developer/v1/objects/:publicId
GET /developer/v1/manifests/:publicId
GET /developer/v1/objects/:publicId/capabilities
```

## TypeScript SDK

Build and test the SDK:

```bash
npm run build:sdk
npm run test:sdk
```

Example client:

```ts
import {
  OrybitClient
} from "@orybit/sdk";

const orybit = new OrybitClient({
  baseUrl: process.env.ORYBIT_BASE_URL!,
  apiKey: process.env.ORYBIT_API_KEY!
});

const manifest = await orybit.manifests.get(
  "coffee-demo-001"
);
```

A runnable local-source example lives at:

```text
examples/developer-sdk/read-object.mjs
```

## Repository Structure

```text
orybit/
├── apps/
│   └── web/
├── workers/
│   └── api/
├── packages/
│   └── protocol/
├── sdk/
├── migrations/
├── specs/
│   └── v0.1/
├── examples/
│   ├── coffee-machine/
│   └── developer-sdk/
├── docs/
│   └── adr/
├── scripts/
├── wrangler.jsonc
├── package.json
└── README.md
```

## Development

Requirements:

- Node.js 22+
- npm
- Git

Install and validate:

```bash
npm install
npm run check
```

Local Cloudflare runtime:

```bash
npm run cf:d1:migrate:local
npm run cf:dev
```

Production migration/deployment:

```bash
npm run cf:d1:migrate:remote
npm run cf:deploy
```

Step 012 adds migration `0005_developer_platform.sql` for the developer API-key registry.

Secrets belong in `.dev.vars` locally or secure environment variables at runtime. Never commit `ORYBIT_ADMIN_TOKEN`, ownership-transfer secrets, or raw developer API keys.

## Project Status

Completed milestones:

```text
Foundation                    ✓
Protocol SDK v0.1             ✓
Object Registry               ✓
Cloudflare Worker + D1        ✓
Admin Dashboard               ✓
Public Object Profile         ✓
QR Physical Bridge            ✓
Object Memory                 ✓
Ownership                     ✓
Capability Engine             ✓
Object Manifest               ✓
Developer Platform            IN PROGRESS
```

See:

- [`docs/OBJECT-REGISTRY.md`](docs/OBJECT-REGISTRY.md)
- [`docs/OBJECT-MEMORY.md`](docs/OBJECT-MEMORY.md)
- [`docs/OWNERSHIP.md`](docs/OWNERSHIP.md)
- [`docs/CAPABILITY-ENGINE.md`](docs/CAPABILITY-ENGINE.md)
- [`docs/OBJECT-MANIFEST.md`](docs/OBJECT-MANIFEST.md)
- [`docs/DEVELOPER-PLATFORM.md`](docs/DEVELOPER-PLATFORM.md)
- [`docs/adr/`](docs/adr/)

## Direction

```text
Identity
   ↓
Memory
   ↓
Ownership
   ↓
Capability Engine
   ↓
Object Manifest
   ↓
Developer Platform
   ↓
PermissionOS
   ↓
Reality API
```

ORYBIT is currently an experimental engineering and open-protocol project.
