# ADR-003: Zero-Cost Prototype Infrastructure

Date: 2026-09-28

Status: Accepted

## Context

ORYBIT must validate its architecture and usefulness before infrastructure spending is justified.

## Decision

Prototype development will prefer zero-cost and open-source technologies.

Initial direction:

```text
Frontend:
Next.js + TypeScript

Backend:
Cloudflare Workers

Database:
Cloudflare D1

Object storage:
Cloudflare R2 when needed

Source control:
Git

Physical discovery:
QR first
NFC-compatible URLs later
```

## Consequences

Positive:

- no required development budget
- architecture must remain efficient
- unnecessary infrastructure is discouraged

Tradeoff:

Free service limits may require changes if adoption becomes significant.
