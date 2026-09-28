# ORYBIT Web Dashboard

Status: Phase 1 / Step 006

## Goal

Give the ORYBIT Object Registry a usable product interface without separating the UI from the live Worker runtime.

```text
Browser
   |
   v
ORYBIT Dashboard
   |
   v
Same-Origin Worker API
   |
   v
Cloudflare D1
```

## Technology

- React 19.3
- Vite 8
- TypeScript
- Cloudflare Workers Static Assets
- ORYBIT Protocol v0.1

The dashboard is built into `apps/web/dist` and deployed as static assets with the same Worker that serves `/health` and `/v1/*`.

## Why Same Origin

The dashboard and API share the same `workers.dev` origin.

Benefits:

- no CORS configuration
- one deployment
- one runtime URL
- simpler local development
- static assets remain edge cached
- API requests remain explicit Worker routes

Cloudflare's static asset routing is configured so `/health` and `/v1/*` invoke the Worker while all other application routes are handled by the SPA.

## Prototype Admin Access

The long-term ORYBIT permissions model does not exist yet.

For this phase:

1. The browser asks the operator for `ORYBIT_ADMIN_TOKEN`.
2. The token is kept in `sessionStorage`.
3. The token is attached as a Bearer token only to protected registry requests.
4. The token is never bundled into the JavaScript build.
5. Closing the browser session removes it.

This is a prototype administration mechanism, not end-user authentication.

## Dashboard Features

- live Worker connectivity state
- total object count
- active-object count
- attention-state count
- unique capability count
- object search
- lifecycle status filtering
- object registration
- object details
- lifecycle metadata
- capability display
- object editing
- responsive mobile layout

## Local Development

Terminal 1:

```bash
npm run cf:dev
```

This builds the dashboard and starts the Worker on port 8787.

For front-end hot reload, keep the Worker running and start Vite in Terminal 2:

```bash
npm run web:dev
```

Vite proxies `/health` and `/v1/*` to the Worker on `127.0.0.1:8787`.

## Validation

```bash
npm run check:web
```

Full repository validation:

```bash
npm run check
```

## Deployment

```bash
npm run cf:deploy
```

The command builds the protocol package, dashboard, and static assets before Wrangler deploys the Worker.

## Security Notes

- Never place `ORYBIT_ADMIN_TOKEN` in `VITE_*` variables.
- Never commit the token.
- Never store the token in the repository.
- Do not use localStorage for the prototype token.
- The public object experience will use a separate safe projection rather than exposing this admin dashboard.
