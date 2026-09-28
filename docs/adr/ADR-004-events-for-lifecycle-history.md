# ADR-004: Events for Lifecycle History

Date: 2026-09-28

Status: Accepted

## Context

Physical objects change during their lifetime.

Examples include:

- creation
- maintenance
- repair
- component replacement
- ownership transfer
- loss
- recovery
- retirement

If ORYBIT stores only the latest object state, important historical context can be lost.

## Decision

Important lifecycle changes will be represented as ORYBIT events.

An event records:

- event identity
- object identity
- event type
- occurrence time
- actor
- event-specific data

The current object state may be updated for efficient reads, but lifecycle history remains represented as events.

## Consequences

Positive:

- object history is explainable
- maintenance and repair records can be reconstructed
- auditing becomes possible
- future ownership history can use the same mechanism

Tradeoff:

Applications must distinguish current state from historical events.
