# ORYBIT Engineering Principles

## 1. Identity Is Independent of Carrier

QR, NFC, BLE, barcodes, and future discovery technologies point to an object.

They are not the object's identity.

## 2. Web First

A physical object should be accessible without requiring installation of an ORYBIT application.

## 3. Open Before Proprietary

ORYBIT should prefer interoperable data formats and documented protocols.

## 4. Privacy by Design

Public information and private information must remain separate.

The minimum information necessary should be exposed.

## 5. Explicit Permissions

Sensitive actions must never rely only on possession of an object URL.

## 6. Objects Have Lifecycles

An object changes over time.

ORYBIT must represent events rather than treating an object as a static webpage.

## 7. Capabilities Over Device-Specific APIs

Software should be able to reason about what an object can do without depending entirely on manufacturer-specific terminology.

## 8. Portable Data

An object's useful history should not be permanently trapped inside one ORYBIT deployment.

## 9. Simple Before Distributed

We will not introduce microservices, Kubernetes, queues, caches, or other infrastructure before the problem requires them.

## 10. Zero-Cost Development First

During the prototype stage, prefer:

- open-source tools
- local development
- free hosting tiers
- simulation
- QR instead of purchased NFC hardware
- deterministic logic instead of paid AI APIs

## 11. Every Phase Must Produce Evidence

Every development phase should produce at least one of:

- working software
- automated tests
- a protocol specification
- a live demonstration
- measurable technical evidence

## 12. Document Important Decisions

Important architectural decisions belong in ADRs.
