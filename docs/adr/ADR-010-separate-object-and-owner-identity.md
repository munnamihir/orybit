# ADR-010: Separate object identity from owner identity

- Status: Accepted
- Date: 2026-09-28

## Context

ORYBIT gives a physical object a persistent identity. Physical objects can be sold, gifted, reassigned, leased, inherited, or transferred while remaining the same object.

If owner identity were embedded directly into the object identity, every transfer would either mutate identity history destructively or require creation of a new ORYBIT object. Both outcomes conflict with the goal of persistent physical-object identity.

## Decision

ORYBIT will model owner identity separately from object identity.

An ownership record links an object to an owner for a bounded or ongoing time interval. A transfer closes the prior ownership interval and begins a new one while preserving the object's ORYBIT ID and public ID.

Step 009 uses temporary capability links for transfer acceptance because ORYBIT does not yet have verified end-user accounts. Transfer secrets are random 256-bit bearer tokens. ORYBIT stores only a domain-separated, versioned SHA-512 verifier (`sha512-v1:<digest>`); the raw token is returned once and carried in the browser URL fragment until acceptance.

The transfer verifier is intentionally a hash construction rather than a post-quantum public-key primitive. Actual PQC signatures and recipient-bound key establishment are specified separately in ADR-011.

Regular public object profiles do not expose ownership data.

## Consequences

### Positive

- physical objects retain stable identity across resale and reassignment
- ownership history can be preserved without rewriting prior records
- future permissions can reference the active owner independently from object identity
- transfer logic can evolve without changing the object protocol
- public object discovery remains separate from private ownership information
- transfer-token verification has algorithm versioning and a quantum-hardened 512-bit hash output

### Tradeoffs

- Step 009 owner records are administrative identities, not verified legal identities
- possession of a transfer capability link is not equivalent to legal proof of ownership
- the system needs additional tables and lifecycle rules
- future user-account integration will need to bind authenticated principals to owner records
- PQC signing keys introduce a separate key-lifecycle problem and are not faked by calling a hash function "PQC"

## Alternatives considered

### Store current owner directly on the object row

Rejected because it erases history and couples persistent identity to mutable ownership.

### Create a new ORYBIT object after each sale

Rejected because the physical object has not changed identity merely because control changed.

### Make ownership public by default

Rejected because physical discovery through QR/NFC should not automatically reveal personal or organizational ownership information.
