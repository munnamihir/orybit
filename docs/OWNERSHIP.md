# ORYBIT Ownership

ORYBIT ownership answers a question that object identity alone cannot:

> Who currently controls this physical object, and how did that control change over time?

## Core rule

Object identity and owner identity are separate.

An ORYBIT object keeps the same persistent object ID when it is sold, gifted, reassigned, or otherwise transferred. Ownership changes create new ownership records; they do not create a new object.

## Data model

### Owner

An owner is an administrative identity record with:

- owner ID
- display name
- type: `person` or `organization`
- optional private reference
- creation time

The optional reference is administrative metadata and is never included in public transfer previews or public QR profiles.

### Ownership record

An ownership record connects one object to one owner over a time interval.

- object ID
- owner ID
- start time
- optional end time
- source: `assigned` or `transfer`
- optional note

Only one ownership record may be active for an object at a time.

### Transfer

A transfer describes a proposed change from the current owner to another registered owner.

Statuses:

- `pending`
- `accepted`
- `cancelled`
- `expired`

Only one pending transfer may exist for an object at a time.

## Transfer capability link

Step 009 does not yet have end-user accounts or verified identities. Instead, transfer acceptance uses a temporary capability secret.

1. An administrator initiates a transfer.
2. ORYBIT generates a cryptographically random transfer token.
3. ORYBIT stores only the SHA-256 hash of that token.
4. The raw token is returned once to the administrator.
5. The dashboard creates an acceptance URL using the URL fragment:

   `/ownership/accept#<secret>`

6. URL fragments are not sent in the initial HTTP request.
7. The acceptance page reads the fragment in the browser and sends the token only to the dedicated transfer API.
8. After acceptance, the prior ownership record is closed and a new record begins.

The capability link proves possession of the invitation. It does **not** prove a recipient's legal identity. Verified user accounts and stronger ownership proof are future work.

## API

Admin routes:

- `GET /v1/owners`
- `POST /v1/owners`
- `GET /v1/objects/{identifier}/ownership`
- `POST /v1/objects/{identifier}/ownership/assign`
- `POST /v1/objects/{identifier}/ownership/transfers`
- `POST /v1/ownership-transfers/{transferId}/cancel`

Capability-link routes:

- `POST /public/ownership-transfers/preview`
- `POST /public/ownership-transfers/accept`

The public transfer endpoints accept the secret in the JSON request body. They do not require the ORYBIT admin token.

## Privacy boundary

Regular public object pages and QR codes do not expose:

- current owner
- prior owners
- owner IDs
- private owner references
- transfer state
- transfer secrets

A person who possesses a valid transfer capability link can see the minimum information necessary to evaluate that specific transfer: object public identity, source owner display label, destination owner display label, status, and expiry.

## Object Memory integration

D1 triggers create lifecycle events automatically for:

- `ownership.assigned`
- `ownership.transferred`
- `ownership.transfer.requested`
- `ownership.transfer.cancelled`
- `ownership.transfer.expired`

This means ownership changes become part of the object's append-only memory without requiring the client to duplicate audit writes.

## Database invariants

Migration `0003_ownership.sql` enforces:

- one active ownership record per object
- one pending transfer per object
- no transfer from an owner to the same owner
- foreign-key links to objects and owners
- unique transfer-token hashes

Transfer acceptance uses a D1 batch so closing the previous record, creating the new ownership record, and accepting the transfer succeed or fail together.

## Current limitations

Step 009 intentionally does not yet provide:

- end-user login/accounts
- email delivery
- verified legal identity
- cryptographic proof of possession of the physical object
- disputed-transfer resolution
- public ownership visibility
- delegated/shared ownership

Those concerns belong to later permission and identity phases rather than being faked in the prototype.
