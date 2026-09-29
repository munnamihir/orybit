# ORYBIT Object Manifest

Phase 7, Step 011 introduces a public machine-readable contract for an ORYBIT physical object.

## Goal

A developer, agent, manufacturer integration, or other software system should be able to discover the public software description of a physical object without reconstructing it from several unrelated endpoints.

The manifest answers:

- Which ORYBIT object is this?
- What public identity is published?
- What is its current public lifecycle status?
- Which capabilities are safe for public discovery?
- Where are the human profile, public API projection, schema, and manifest itself?

## Endpoint

```text
GET /manifest/:publicId
```

The route is public and resolves **public IDs only**. Internal `obj_...` identifiers are intentionally rejected.

The response body is the manifest document itself rather than an API envelope.

## Example

```json
{
  "manifestVersion": "0.1",
  "protocolVersion": "0.1",
  "object": {
    "publicId": "coffee-demo-001",
    "kind": "appliance",
    "identity": {
      "name": "ORYBIT Demo Coffee Machine"
    },
    "lifecycle": {
      "status": "active",
      "updatedAt": "2026-09-28T00:00:00Z"
    }
  },
  "capabilities": [
    {
      "protocolVersion": "0.1",
      "name": "manual.view",
      "title": "View Manual",
      "description": "View documentation associated with this object.",
      "access": "public",
      "operation": "read"
    }
  ],
  "links": {
    "self": "https://example.test/manifest/coffee-demo-001",
    "profile": "https://example.test/o/coffee-demo-001",
    "publicApi": "https://example.test/public/objects/coffee-demo-001",
    "schema": "https://orybit.dev/specs/v0.1/manifest.schema.json"
  }
}
```

## Privacy Boundary

The public manifest intentionally excludes:

- internal object IDs
- serial numbers
- raw carrier records
- arbitrary metadata
- owner identities
- ownership history
- ownership transfer records or secrets
- private lifecycle events
- admin routes
- owner-only capabilities
- authorized capabilities
- unresolved capability references

Only registered capability definitions with `access: public` may appear in the manifest.

## Source of Truth

The manifest is **computed at request time** from the existing object registry and capability registry.

ORYBIT does not persist a separate manifest copy in D1.

This avoids divergence such as:

```text
object changed
    ↓
stored manifest did not change
    ↓
stale contract
```

Instead:

```text
objects + capability_definitions
             ↓
      manifest builder
             ↓
   public manifest
```

## Discovery

The public object API advertises the manifest through an HTTP `Link` header using `rel="describedby"`.

The public human-readable object page also links directly to the manifest.

The manifest response includes `Link` headers for:

- the JSON Schema (`describedby`)
- the human profile (`alternate`)

## Schema and Runtime Validation

The contract is defined in:

```text
specs/v0.1/manifest.schema.json
```

The executable TypeScript counterpart is exported by `@orybit/protocol`:

```text
OrybitManifest
validateOrybitManifest
assertOrybitManifest
```

The runtime builder asserts the produced manifest before returning it.

## Versioning

The manifest has two explicit version fields:

- `manifestVersion` — version of the manifest contract
- `protocolVersion` — ORYBIT protocol version used by the object/capabilities

Both are `0.1` in Step 011.

Keeping them separate allows the manifest envelope to evolve without automatically forcing a new object protocol version.

## Caching

Step 011 uses `Cache-Control: no-store`.

A later phase may introduce deterministic ETags or signed immutable snapshots. Capability definition changes can affect a manifest even when the object record itself has not changed, so naive object-only caching is intentionally avoided.

## Relationship to Later Phases

The Object Manifest is discovery, not authorization and not action execution.

```text
Object Manifest
      ↓
Discover identity + public capabilities
      ↓
Developer Platform
      ↓
PermissionOS
      ↓
Reality API
```

PermissionOS will determine whether a principal may invoke a capability. Reality API will define how supported capabilities map to real physical actions and telemetry.
