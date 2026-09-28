# ORYBIT Vision

## Problem

Physical objects exist largely outside the software world.

A product may have:

- a barcode
- a serial number
- an NFC tag
- a QR code
- a warranty
- a manual
- a service history
- manufacturer records

These systems are usually disconnected.

There is no general software abstraction that answers:

- What is this exact object?
- What has happened to it?
- Who is authorized to interact with it?
- What capabilities does it provide?
- What actions can software perform?
- How can those actions be accessed consistently?

## Vision

ORYBIT gives physical objects a persistent digital representation.

An ORYBIT object may contain:

1. Identity
2. Lifecycle history
3. Capabilities
4. Permissions
5. Actions
6. Machine-readable interfaces

## Core Model

```text
Physical Object
      |
      v
Discovery Carrier
      |
      v
ORYBIT Identity
      |
      +------ Identity
      +------ Events
      +------ Capabilities
      +------ Permissions
      +------ Actions
```

## Carrier Independence

ORYBIT does not depend on one discovery technology.

Possible carriers include:

- QR
- NFC
- Barcode
- BLE
- UWB
- Future mechanisms

Multiple carriers may resolve to one persistent ORYBIT identity.

## Long-Term Direction

```text
Humans / Apps / AI
        |
        v
Permission Layer
        |
        v
ORYBIT Capability Layer
        |
        v
Physical Objects
```

## North Star

A developer should eventually be able to discover a physical object and ask:

```text
What are you?
What happened to you?
What can you do?
What am I allowed to do?
How do I perform that action?
```

without requiring custom knowledge of every manufacturer.
