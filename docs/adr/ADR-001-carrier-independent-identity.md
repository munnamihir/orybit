# ADR-001: Carrier-Independent Object Identity

Date: 2026-09-28

Status: Accepted

## Context

Physical objects may be discovered through technologies such as NFC, QR codes, barcodes, BLE, or future mechanisms.

Tying ORYBIT identity directly to one carrier would make the platform dependent on that technology.

## Decision

An ORYBIT object has its own persistent identity.

Discovery carriers reference that identity.

```text
Object Identity
    |
    +--- QR
    +--- NFC
    +--- Barcode
    +--- BLE
    +--- Future carriers
```

## Consequences

Positive:

- carriers can change without changing object identity
- multiple carriers can reference one object
- ORYBIT is not dependent on NFC support
- new discovery mechanisms can be introduced later

Tradeoff:

A resolution layer must map carriers to ORYBIT objects.
