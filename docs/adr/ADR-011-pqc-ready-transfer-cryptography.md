# ADR-011: PQC-ready ownership transfer cryptography

- Status: Accepted
- Date: 2026-09-28

## Context

ORYBIT ownership transfers use bearer capability links today and are expected to evolve toward authenticated owners, signed transfer records, and recipient-bound cryptographic handoffs.

Post-quantum cryptography does not replace every existing cryptographic primitive. Hash functions, digital signatures, and key-establishment mechanisms solve different problems and should be selected independently.

NIST has standardized:

- FIPS 203: ML-KEM for post-quantum key establishment
- FIPS 204: ML-DSA for post-quantum digital signatures
- FIPS 205: SLH-DSA for stateless hash-based post-quantum digital signatures

## Decision

ORYBIT will use a layered cryptographic design rather than replacing a hash with an unrelated PQC primitive.

### Capability-token verifier

Step 009 transfer links use a random 256-bit bearer token.

The server stores only:

`sha512-v1:SHA-512("ORYBIT_TRANSFER_TOKEN_V1" || 0x00 || token)`

Reasons:

- SHA-512 is natively supported by the Cloudflare Workers Web Crypto runtime
- no additional cryptographic dependency is required
- domain separation prevents accidental cross-protocol reuse
- an explicit algorithm prefix provides migration agility
- generic quantum preimage search against a 512-bit hash remains approximately 256-bit work under Grover's algorithm

This token verifier is quantum-hardened symmetric cryptography, but ORYBIT will not label it a post-quantum public-key algorithm.

### Transfer authenticity

When ORYBIT introduces cryptographically signed transfer receipts, the preferred maximum-security profile is:

- ML-DSA-87
- NIST FIPS 204
- NIST security category 5

The signature should cover a canonical transfer envelope including at least:

- transfer ID
- object ID
- source owner ID
- destination owner ID
- verifier identifier
- requested time
- expiry time
- resulting ownership record ID after acceptance where applicable

The signing key must be lifecycle-managed independently from database contents. An implementation is not considered complete merely because an ML-DSA library is imported; key generation, storage, rotation, verification, recovery, and compromise handling must also be defined.

### Recipient-bound secret establishment

If ORYBIT later replaces bearer capability links with recipient public-key handoff, the preferred maximum-security KEM profile is:

- ML-KEM-1024
- NIST FIPS 203
- NIST security category 5

ML-KEM should be used only where two parties need to establish a shared secret. It is not a hash function and is not a digital-signature algorithm.

### Algorithm diversity

SLH-DSA from FIPS 205 may be evaluated for high-assurance or long-lived signatures where its much larger signatures are acceptable. It provides a mathematically different, hash-based PQC signature family from ML-DSA.

## Consequences

### Positive

- ORYBIT uses each cryptographic primitive for the problem it is designed to solve
- current bearer-token verification is stronger against generic quantum search without adding a dependency
- future transfer receipts can gain actual NIST-standardized post-quantum signatures
- future recipient-bound transfers can use NIST-standardized post-quantum key establishment
- algorithm identifiers allow future migration without silently changing semantics

### Tradeoffs

- real PQC signatures require signing-key lifecycle management
- ML-DSA-87 signatures and keys are materially larger than classical signatures
- ML-KEM-1024 is unnecessary overhead for today's bearer-link transfer model
- JavaScript PQC libraries must be evaluated separately from the underlying standardized algorithms; implementing a FIPS-defined algorithm does not automatically make the deployment FIPS-validated

## Rejected alternatives

### Replace SHA-256 directly with ML-KEM

Rejected because a KEM performs key establishment and is not a token-verification hash.

### Replace SHA-256 directly with ML-DSA

Rejected because a signature algorithm proves authenticity and is not a one-way token verifier.

### Call SHA-512 itself PQC

Rejected because that description would blur the distinction between symmetric/hash quantum resistance and post-quantum public-key cryptography.
