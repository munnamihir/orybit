# ADR-006: Fail-Closed Admin Runtime

Date: 2026-09-28

Status: Accepted

## Context

Phase 1 deploys the ORYBIT Object Registry to a public Worker URL before the long-term ownership and PermissionOS models exist.

Exposing object creation, listing, lookup, or update routes without authorization would allow arbitrary internet users to read or mutate registry data.

## Decision

During the prototype runtime phase:

- `GET /health` remains public.
- All `/v1/objects` routes require an `Authorization: Bearer <token>` header.
- The token is stored in the Worker secret `ORYBIT_ADMIN_TOKEN`.
- If the secret is not configured, protected routes fail closed.
- Secrets are never committed to Git.

## Consequences

Positive:

- a deployed prototype is not an unauthenticated write API
- deployment mistakes fail closed
- the security boundary is explicit and testable
- no paid identity provider is required for the prototype

Tradeoff:

- this is an administrative prototype guard, not end-user authorization
- public object access must wait for a safe public projection model
- ownership and scoped permissions remain future work
