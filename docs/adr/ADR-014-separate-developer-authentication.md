# ADR-014 — Separate Developer Authentication from Administration and PermissionOS

Status: Accepted

Date: 2026-09-29

## Context

ORYBIT already has three different trust concerns:

1. the private prototype admin token used to operate the ORYBIT management console;
2. external software that needs a stable way to identify itself to ORYBIT;
3. future PermissionOS decisions about whether a principal may invoke a sensitive physical-object capability.

Treating those as the same credential would collapse distinct security boundaries. In particular, giving an integration the administrator token would expose internal object, ownership, and lifecycle data, while treating a developer API key as object authorization would incorrectly imply ownership or physical-control permission.

## Decision

ORYBIT introduces a separate Developer Platform credential family.

Developer API keys:

- use the `ory_dev_` credential namespace;
- contain 256 bits of cryptographically random secret material;
- are returned in raw form only when created;
- are stored only through a domain-separated, versioned SHA-512 verifier;
- have explicit read scopes;
- can be revoked independently;
- track the last successful use time;
- are never accepted as the ORYBIT admin token;
- do not imply ownership, delegation, or PermissionOS authorization.

Step 012 scopes are intentionally read-only:

- `objects:read`
- `manifests:read`
- `capabilities:read`

The Step 012 developer API exposes only the same public-safe object surface ORYBIT is already willing to publish. Developer authentication identifies the calling integration and gives ORYBIT a revocable/scoped application boundary; it does not unlock private ownership, Object Memory, serial numbers, metadata, transfer secrets, or private capabilities.

## API key verifier

The stored verifier is conceptually:

```text
sha512-v1:
SHA-512(
  "ORYBIT_DEVELOPER_API_KEY_V1"
  || 0x00
  || raw_api_key
)
```

The database does not store the raw API key.

The `sha512-v1` prefix provides algorithm agility for future migration.

## Consequences

### Positive

- external software no longer needs the administrator token;
- developer integrations can be individually named, scoped, audited, and revoked;
- a leaked developer key has a deliberately smaller authority surface;
- future PermissionOS policy can evolve independently from application authentication;
- SDK clients have a stable credential model.

### Tradeoffs

- ORYBIT now has multiple credential families that must remain clearly documented;
- key rotation is manual in Step 012;
- Step 012 does not yet implement rate limits, organizations, user accounts, billing, or action-level authorization;
- public-safe data is still available through public endpoints, so the developer key is primarily an application identity/scoping boundary at this phase rather than a confidentiality boundary.

## Explicit non-goals

Step 012 developer keys do not grant:

- admin access;
- private Object Memory access;
- ownership data access;
- ownership transfer authority;
- owner-only or authorized capability visibility;
- capability execution;
- device control;
- PermissionOS rights.

Those concerns require their own authorization policies in later phases.
