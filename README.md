# ORYBIT

> **The software layer for physical objects.**

ORYBIT explores a simple idea:

**Every physical object should be able to have a persistent digital identity, memory, capabilities, permissions, and an API.**

## Vision

Today:

- Websites have URLs
- People have digital accounts
- Software has APIs

ORYBIT asks:

> **Why shouldn't physical objects have a universal software interface too?**

A physical object may be discovered through QR, NFC, barcode, BLE, UWB, or future discovery technologies.

The discovery method does **not** define the object.

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
      +---- Lifecycle
      +---- Capabilities
      +---- Permissions
      +---- Actions
      +---- API
```

## The Problem

Physical objects are mostly invisible to software.

A product may already have a serial number, barcode, NFC tag, QR code, warranty, manual, maintenance records, and manufacturer data, but these systems are normally disconnected.

ORYBIT is an attempt to create a common software layer that can answer:

- What is this exact object?
- What happened to it?
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

## Initial Protocol

ORYBIT Protocol v0.1 begins with three concepts:

### Object

Represents a physical object and its persistent digital identity.

### Event

Represents something that happened during the object's lifecycle.

### Capability

Represents something that can be done with or through an object.

## Example

The first reference object is a fictional coffee machine.

```text
ORYBIT Demo Coffee Machine
Object ID: obj_demo_coffee_001
Public ID: coffee-demo-001

Capabilities:
- manual.view
- maintenance.record
- warranty.view
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
│       └── src/
├── database/
│   └── migrations/
├── specs/
│   └── v0.1/
├── examples/
│   └── coffee-machine/
├── docs/
│   └── adr/
├── scripts/
├── package.json
├── README.md
└── .gitignore
```

## Development

Requirements:

- Node.js 20+
- npm
- Git

Run:

```bash
npm run check
```

A successful result ends with:

```text
ORYBIT foundation check PASSED.

Physical object model -> READY
Next milestone -> Object Registry
```

## Current Status

Phase 0 — Foundation

Protocol version: 0.1

Immediate objective:

```text
Physical Object
      ↓
Persistent Digital Identity
      ↓
QR / NFC Resolution
      ↓
Object Lifecycle
      ↓
Capabilities
      ↓
API
```

ORYBIT is currently an experimental engineering and open-protocol project.
