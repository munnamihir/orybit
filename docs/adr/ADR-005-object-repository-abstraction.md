# ADR-005: Object Repository Abstraction

Date: 2026-09-28

Status: Accepted

## Context

ORYBIT needs persistent object storage, but domain and HTTP behavior should not become coupled to one database implementation.

Automated tests also need fast, deterministic storage without depending on cloud infrastructure.

## Decision

The Object Registry will depend on an `ObjectRepository` interface.

Initial implementations:

- `MemoryObjectRepository`
- `D1ObjectRepository`

The HTTP layer receives a repository rather than constructing storage behavior itself.

## Consequences

Positive:

- domain behavior is testable without cloud services
- D1 can be replaced or supplemented later
- API logic does not contain SQL
- tests remain $0 and fast

Tradeoff:

Repository interfaces and adapters add a small amount of structure to the codebase.
