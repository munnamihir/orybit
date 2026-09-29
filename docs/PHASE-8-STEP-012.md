# Phase 8 — Step 012: Developer Authentication + TypeScript SDK

## Objective

Make ORYBIT consumable by external software without sharing the platform administrator credential.

## Built

- D1-backed developer API key registry
- 256-bit random API key secrets
- `ory_dev_` credential namespace
- domain-separated, versioned SHA-512 key verifiers
- one-time raw-key disclosure
- three explicit read scopes
- key last-use tracking
- immediate revocation
- admin Developer Console
- read-only `/developer/v1` API
- public-safe object projection
- developer manifest access
- structured public-capability access
- TypeScript SDK
- structured SDK errors
- example SDK integration
- regression tests for privacy, scopes, revocation, and admin separation

## Security boundary

Developer application authentication is not object authorization.

```text
Developer key
    -> identifies integration
    -> limits API surface by scope

PermissionOS
    -> later decides whether an action is authorized
```

A Step 012 developer key cannot access private memory, ownership data, transfer secrets, admin endpoints, owner-only capabilities, authorized capabilities, or physical actions.

## Persistence

Migration:

```text
0005_developer_platform.sql
```

Table:

```text
developer_api_keys
```

## Developer scopes

```text
objects:read
manifests:read
capabilities:read
```

## Developer routes

```text
GET /developer/v1/me
GET /developer/v1/objects/:publicId
GET /developer/v1/manifests/:publicId
GET /developer/v1/objects/:publicId/capabilities
```

## Admin routes

```text
GET  /v1/developer-keys
POST /v1/developer-keys
POST /v1/developer-keys/:id/revoke
```

## SDK

```text
sdk/
```

First client surface:

```text
developer.me()
objects.get(publicId)
manifests.get(publicId)
capabilities.list(publicId)
```

## Success criteria

Step 012 is ready to merge when production proves:

1. migration `0005_developer_platform.sql` applies;
2. the Developer Console creates a key;
3. the raw key is visible only in the create result;
4. `/developer/v1/me` accepts the key;
5. each selected scope allows its matching endpoint;
6. an omitted scope returns HTTP 403;
7. a developer key fails against `/v1/objects` with HTTP 401;
8. developer object/manifest/capability responses contain no private data;
9. the TypeScript SDK can read the real object's manifest;
10. revoking the key makes the next developer request return HTTP 401.

## Next

After Step 012, the Developer Platform can grow with API versioning, application identity, rate limits, usage/audit telemetry, webhooks, and eventually PermissionOS-authorized action invocation.
