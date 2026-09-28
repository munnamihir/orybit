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

Something that can be done with or through an object.

Ownership is currently implemented as a runtime domain layered on top of persistent object identity and append-only lifecycle events. It is intentionally separate from the object identity itself.

## Current Architecture

```text
Physical Object
      ↓
QR / future NFC
      ↓
Public ORYBIT Profile
      ↓
Persistent Object Identity
      ↓
Cloudflare Worker API
      ↓
Cloudflare D1
      ├── objects
      ├── object_events
      ├── owners
      ├── ownership_records
      └── ownership_transfers
```

The React dashboard, public object page, public ownership-transfer acceptance page, and API are deployed from the same Cloudflare Worker origin.

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
- SHA-256 transfer-token storage
- transfer expiry
- automatic ownership lifecycle events
- no ownership data on normal public QR profiles

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
```

Public routes include:

```text
GET   /health
GET   /public/objects/:publicId
POST  /public/ownership-transfers/preview
POST  /public/ownership-transfers/accept
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
├── migrations/
├── specs/
│   └── v0.1/
├── examples/
│   └── coffee-machine/
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

Secrets belong in `.dev.vars` locally and Cloudflare Worker secrets remotely. Never commit `ORYBIT_ADMIN_TOKEN` or ownership-transfer secrets.

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
Ownership                     IN PROGRESS
```

See:

- [`docs/OBJECT-REGISTRY.md`](docs/OBJECT-REGISTRY.md)
- [`docs/OBJECT-MEMORY.md`](docs/OBJECT-MEMORY.md)
- [`docs/OWNERSHIP.md`](docs/OWNERSHIP.md)
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
Developer API
   ↓
PermissionOS
   ↓
Reality API
```

ORYBIT is currently an experimental engineering and open-protocol project.
