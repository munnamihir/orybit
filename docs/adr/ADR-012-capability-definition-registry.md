# ADR-012: Resolve object capability names through a definition registry

- Status: Accepted
- Date: 2026-09-28

## Context

ORYBIT Protocol v0.1 represents object capabilities as dotted string names such as `manual.view` and `maintenance.record`.

String references are compact, portable, and stable, but by themselves they do not explain semantics such as display title, description, operation type, category, public visibility hint, or approval hint.

Replacing the object's capability array with embedded structured objects would duplicate definitions across every object and would break the existing v0.1 object shape.

## Decision

ORYBIT will preserve capability names on objects and introduce a persistent capability definition registry.

An object capability name resolves to one `OrybitCapability` definition.

Definitions may include:

- title
- description
- access hint
- approval hint
- category
- operation type (`read`, `write`, `execute`)

The capability definition name is immutable after creation.

An object enables a capability by containing its name in the existing object capability array. Removing the name disables it for that object.

The Worker runtime validates newly supplied capability arrays against the registry, while existing unknown references are surfaced as `unresolved` rather than deleted.

Public object projection includes only definitions marked with the `public` access hint.

## Capability versus permission

The Capability Engine describes what an object exposes. It does not decide whether a specific principal is authorized to invoke that ability.

The `access` and `requiresApproval` fields are descriptive/default policy hints only.

Final runtime authorization belongs to PermissionOS.

## Consequences

### Positive

- Protocol v0.1 object compatibility is preserved.
- Capability semantics are defined once instead of duplicated per object.
- Existing object references remain compact and portable.
- New assignments can be validated against known definitions.
- Legacy unknown references remain observable.
- Public capability projection can be driven by definition metadata.
- PermissionOS can later consume capability metadata without being coupled to object storage.

### Tradeoffs

- Two reads may be needed to fully resolve an object's capabilities.
- Existing legacy references may remain unresolved until definitions are registered.
- Access hints are not sufficient authorization and must not be treated as such.
- Capability definition changes can affect how many objects present the same referenced ability.

## Alternatives considered

### Embed complete capability objects on every object

Rejected because it duplicates definitions and makes global semantic changes difficult.

### Keep capability strings with no registry

Rejected because software cannot reliably discover capability semantics or enforce definition existence.

### Build PermissionOS at the same time

Rejected because capability discovery and authorization are separate concerns and should remain independently testable.
