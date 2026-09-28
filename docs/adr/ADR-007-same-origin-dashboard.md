# ADR-007: Same-Origin Dashboard and API

Date: 2026-09-28

Status: Accepted

## Context

ORYBIT now has a live Worker API and D1 registry, but no human-friendly product interface.

Hosting the dashboard separately would introduce another deployment target, another origin, CORS configuration, and additional secret-handling complexity.

Cloudflare Workers can deploy static assets and Worker code together.

## Decision

The Phase 1 dashboard will be a React + Vite single-page application deployed as static assets in the same Cloudflare Worker as the ORYBIT API.

Routing:

```text
/health       -> Worker
/v1/*         -> Worker
everything else -> SPA static assets
```

The dashboard will use relative API URLs.

The prototype admin token is entered at runtime and stored only in browser `sessionStorage`.

## Consequences

Positive:

- one deployment
- no CORS
- no frontend API base URL configuration
- edge-cached static assets
- simpler development and demos
- token is not compiled into the client bundle

Tradeoffs:

- the admin dashboard itself is publicly downloadable even though registry data is protected
- the browser temporarily possesses the prototype admin token
- a stronger user identity and permissions layer is still required before multi-user use

The future public object page will use a separate public-data projection rather than the admin API.
