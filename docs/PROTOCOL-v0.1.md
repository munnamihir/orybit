# ORYBIT Protocol v0.1

Status: Experimental

## Purpose

ORYBIT Protocol v0.1 defines the first executable model for representing physical objects in software.

The protocol currently contains four public contract primitives:

1. Object
2. Event
3. Capability
4. Object Manifest

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

Capabilities carry an access classification:

- `public`
- `owner`
- `authorized`

They may also describe:

- category
- operation (`read`, `write`, or `execute`)
- approval hint

These access fields describe the capability contract. They do not replace PermissionOS authorization.

## Object Manifest

The Object Manifest is the public machine-readable contract for a physical object.

It combines:

- public-safe object identity
- lifecycle status
- structured public capability definitions
- canonical discovery links

The manifest intentionally excludes internal object IDs, serial numbers, arbitrary metadata, ownership records, private events, transfer secrets, and non-public capabilities.

The public endpoint is:

```text
GET /manifest/:publicId
```

The manifest has a separate `manifestVersion` and `protocolVersion`, both `0.1` in this phase.

Its JSON Schema is:

```text
specs/v0.1/manifest.schema.json
```

A reference instance is:

```text
examples/coffee-machine/manifest.json
```

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

Public manifests resolve public IDs only.

## Runtime Package

The `@orybit/protocol` package provides:

- TypeScript types
- ID helpers
- runtime validators
- assertion helpers
- Object Manifest types and validation

The package is the executable counterpart to the JSON Schemas in `specs/v0.1`.
