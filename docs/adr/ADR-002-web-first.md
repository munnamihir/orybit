# ADR-002: Web-First Object Access

Date: 2026-09-28

Status: Accepted

## Context

Requiring a dedicated mobile application would increase friction when someone encounters an ORYBIT-enabled physical object.

## Decision

The primary ORYBIT interaction will initially use ordinary HTTPS URLs.

```text
Physical Object
      |
      v
QR / NFC URL
      |
      v
Browser
      |
      v
ORYBIT
```

## Consequences

Positive:

- no mandatory app installation
- broad device compatibility
- QR can be used during zero-cost development
- NFC can later resolve to the same URLs

Tradeoff:

Some advanced hardware capabilities may eventually require native integrations.
