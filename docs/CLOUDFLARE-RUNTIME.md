# ORYBIT Cloudflare Runtime

Status: Phase 1 / Step 005

## Goal

Run the ORYBIT Object Registry in a real Cloudflare Worker backed by Cloudflare D1.

```text
Internet
   |
   v
Cloudflare Worker
   |
   v
ORYBIT API
   |
   v
Cloudflare D1
```

## Security Boundary

Only the health endpoint is public during this phase:

```http
GET /health
```

All `/v1/objects` routes require an admin bearer token.

If `ORYBIT_ADMIN_TOKEN` is missing, the API fails closed with `503 ADMIN_AUTH_NOT_CONFIGURED`.

If the token is incorrect, the API returns `401 UNAUTHORIZED`.

The admin token must never be committed to Git.

## Local Secret

Copy the example file:

```bash
cp .dev.vars.example .dev.vars
```

Replace the example value with a random token.

`.dev.vars` is ignored by Git.

## Cloudflare Provisioning

Authenticate Wrangler:

```bash
npx wrangler@4 login
npm run cf:whoami
```

Create the production D1 database and automatically add the `DB` binding to `wrangler.jsonc`:

```bash
npm run cf:d1:create
```

The generated D1 `database_id` is configuration, not the admin secret, and the updated `wrangler.jsonc` should be committed.

## Migrations

Apply the schema locally:

```bash
npm run cf:d1:migrate:local
```

Apply the schema to the remote D1 database:

```bash
npm run cf:d1:migrate:remote
```

## Local Runtime

```bash
npm run cf:dev
```

Then test:

```bash
curl http://localhost:8787/health
```

Protected request:

```bash
curl \
  -H "Authorization: Bearer $ORYBIT_ADMIN_TOKEN" \
  http://localhost:8787/v1/objects
```

## Remote Secret

Generate a strong token locally. Do not paste it into chat, GitHub, documentation, or the notebook.

Store it as a Cloudflare Worker secret:

```bash
npx wrangler@4 secret put ORYBIT_ADMIN_TOKEN --config wrangler.jsonc
```

## Deploy

```bash
npm run cf:deploy
```

Wrangler will print the deployed `workers.dev` URL.

## Live Verification

Public health check:

```bash
curl https://<worker>.workers.dev/health
```

Authenticated object creation:

```bash
curl \
  -X POST \
  -H "Authorization: Bearer $ORYBIT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "appliance",
    "identity": {
      "name": "ORYBIT Live Demo Object"
    },
    "capabilities": [
      "manual.view",
      "maintenance.record"
    ]
  }' \
  https://<worker>.workers.dev/v1/objects
```

Then retrieve the object using the returned public ID:

```bash
curl \
  -H "Authorization: Bearer $ORYBIT_ADMIN_TOKEN" \
  https://<worker>.workers.dev/v1/objects/<publicId>
```

## Important

The current admin token is a deployment safety mechanism for the prototype. It is not the long-term ORYBIT permissions architecture.

Public object projections, ownership, scoped authorization, and PermissionOS come later in the roadmap.
