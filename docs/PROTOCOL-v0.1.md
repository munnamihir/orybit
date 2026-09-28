# ORYBIT Protocol v0.1

Status: Experimental

## Purpose

ORYBIT Protocol v0.1 defines the first executable model for representing physical objects in software.

The protocol currently contains three primitives:

1. Object
2. Event
3. Capability

## Object

An Object represents a persistent digital representation of a specific physical thing.

Key fields:

- `protocolVersion`
- `id`
- `publicId`
- `kind`
- `identity`
- `lifecycle`
- `carriers`
- `capabilities`

## Event

An Event records something that happened to an object.

Naming uses dotted identifiers such as:

```text
object.created
maintenance.completed
part.replaced
object.retired
```

## Capability

A Capability describes an ability associated with an object.

Naming uses dotted identifiers such as:

```text
manual.view
maintenance.record
warranty.view
ownership.transfer
```

Capabilities also carry an access classification:

- `public`
- `owner`
- `authorized`

## IDs

Internal object IDs begin with:

```text
obj_
```

Event IDs begin with:

```text
evt_
```

These identifiers are intentionally separate from user-facing public IDs.

## Runtime Package

The `@orybit/protocol` package provides:

- TypeScript types
- ID helpers
- runtime validators
- assertion helpers

The package is the executable counterpart to the JSON Schemas in `specs/v0.1`.
