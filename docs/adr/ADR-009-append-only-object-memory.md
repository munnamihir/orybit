# ADR-009: Append-Only Object Memory

Date: 2026-09-28

Status: Accepted

## Context

ORYBIT objects need lifecycle history for maintenance, repair, inspection, activation, purchase, part replacement, and future ownership or service events.

Overwriting fields such as `lastServiceDate` loses historical context and makes provenance difficult to reason about.

## Decision

Important lifecycle history is stored as append-only ORYBIT events.

Step 008 provides:

- append event
- list events for an object

It does not provide:

- update event
- delete event

Each event contains a persistent event ID, object ID, event type, occurrence timestamp, actor, and structured data.

Object registration events are generated at the database boundary so newly inserted objects immediately gain a first lifecycle record.

## Privacy

Lifecycle events remain administrator-only until ORYBIT defines explicit event visibility semantics.

Public QR discovery does not imply public lifecycle history.

## Consequences

Positive:

- preserves chronology
- supports provenance
- enables future audit/history features
- supports machine-readable lifecycle analysis
- avoids destructive edits to historical facts

Tradeoffs:

- corrections require compensating events
- event volume grows over time
- future retention and visibility policy will be required
