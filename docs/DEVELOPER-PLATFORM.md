# ORYBIT Developer Platform

Phase 8 / Step 012 introduces the first authenticated integration surface for software that wants to build on ORYBIT.

## Trust boundary

ORYBIT now distinguishes three concepts:

```text
ADMIN TOKEN
  -> operate ORYBIT itself

DEVELOPER API KEY
  -> identify a software integration

PERMISSIONOS (future)
  -> decide whether a principal may perform an object action
```

A developer key is never ownership proof and never grants physical-control authority.

## Developer API key format

Raw keys use the form:

```text
ory_dev_devkey_<32 hex chars>.<43 base64url chars>
```

The secret portion contains 256 bits of random material.

The raw key is shown only in the create response. ORYBIT stores only:

```text
sha512-v1:<SHA-512 digest>
```

using the domain `ORYBIT_DEVELOPER_API_KEY_V1`.

## Scopes

Step 012 supports:

| Scope | Purpose |
| --- | --- |
| `objects:read` | Read the public-safe object projection |
| `manifests:read` | Read the machine-readable object manifest |
| `capabilities:read` | Read structured public capabilities |

All Step 012 developer routes are read-only.

## Admin key-management API

These routes require `ORYBIT_ADMIN_TOKEN`:

```text
GET  /v1/developer-keys
POST /v1/developer-keys
POST /v1/developer-keys/:id/revoke
```

Create request:

```json
{
  "name": "My demo integration",
  "scopes": [
    "objects:read",
    "manifests:read",
    "capabilities:read"
  ]
}
```

The create response includes `apiKey` exactly once.

Subsequent list responses include only safe metadata such as the key ID, display name, key prefix, scopes, creation time, last-used time, and revocation time.

## Developer API

Developer routes accept:

```http
Authorization: Bearer ory_dev_...
```

Routes:

```text
GET /developer/v1/me
GET /developer/v1/objects/:publicId
GET /developer/v1/manifests/:publicId
GET /developer/v1/objects/:publicId/capabilities
```

The developer routes resolve only public IDs. Internal `obj_...` IDs do not become a developer discovery mechanism.

### Privacy projection

Developer object responses exclude:

- internal object IDs;
- serial numbers;
- arbitrary metadata;
- raw carriers;
- owners and ownership history;
- transfer records and secrets;
- private lifecycle events;
- owner-only capabilities;
- authorized capabilities;
- unresolved capability references.

The Developer Platform deliberately reuses ORYBIT's public-safe projections rather than creating a second definition of what is safe to disclose.

## TypeScript SDK

The Step 012 SDK source lives in `sdk/` and is validated by the root `npm run check` command.

Build it with:

```bash
npm run build:sdk
```

Run its tests with:

```bash
npm run test:sdk
```

Example:

```ts
import {
  OrybitClient
} from "@orybit/sdk";

const orybit = new OrybitClient({
  baseUrl: process.env.ORYBIT_BASE_URL!,
  apiKey: process.env.ORYBIT_API_KEY!
});

const identity = await orybit.developer.me();
const object = await orybit.objects.get(
  "coffee-demo-001"
);
const manifest = await orybit.manifests.get(
  "coffee-demo-001"
);
const capabilities =
  await orybit.capabilities.list(
    "coffee-demo-001"
  );
```

## Developer Console

The authenticated ORYBIT admin dashboard includes a **Developers** console that can:

- list developer keys;
- create a key with selected read scopes;
- show the raw key exactly once;
- copy it to the clipboard;
- display last-use information;
- revoke a key immediately.

## Database

Migration `0005_developer_platform.sql` adds:

```text
developer_api_keys
```

Columns:

```text
id
name
key_prefix
token_hash
scopes_json
created_at
last_used_at
revoked_at
```

No raw developer credential is stored.

## What Step 012 intentionally does not do

This phase does not add:

- developer write APIs;
- object action invocation;
- ownership access;
- user authentication;
- organizations or teams;
- OAuth;
- rate limiting;
- usage billing;
- capability execution;
- PermissionOS policies.

Those should be layered on after the application-authentication boundary is stable.
