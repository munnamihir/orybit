# ORYBIT Physical Object Bridge

Status: Step 007

## Goal

Connect a real physical object to its ORYBIT digital identity through a carrier that works with an ordinary phone camera.

```text
Physical Object
      |
      v
     QR
      |
      v
/o/{publicId}
      |
      v
Public ORYBIT Profile
```

## Important Boundary

The QR code does not contain:

- the ORYBIT admin token
- the internal object ID
- the serial number
- metadata
- private administrator controls

The QR contains only an HTTPS URL to the object's public ORYBIT profile.

## Public API

```http
GET /public/objects/{publicId}
```

This endpoint intentionally returns a reduced public projection.

Published fields:

- protocol version
- public ID
- kind
- object name
- manufacturer when present
- model when present
- description when present
- lifecycle status
- last-updated time
- capability names

Not published:

- internal object ID
- serial number
- metadata
- carrier internals
- administrator credentials

## Public Profile

A physical QR resolves to:

```text
https://<orybit-worker>/o/{publicId}
```

The web application detects `/o/:publicId` and renders a mobile-first public profile without requiring administrator authentication.

## QR Generation

The administrator dashboard includes a Physical Bridge panel.

The panel:

1. loads registered ORYBIT objects
2. lets the operator select one object
3. creates the public profile URL
4. generates the QR locally in the browser
5. lets the operator open, copy, or download it

ORYBIT does not send the object URL to a third-party QR-generation service.

## First Physical Demo

Use a personal physical object that you own and can safely label.

Recommended examples:

- water bottle
- power bank
- personal tool
- coffee machine
- bicycle accessory
- desk device

Avoid employer-owned equipment or confidential/proprietary assets.

Register the object in the admin dashboard, open **Physical bridge**, choose the object, download the QR, and attach or temporarily place the printed QR on the object.

Then scan it with a phone camera.

Success condition:

```text
Physical Object
      -> QR scan
      -> HTTPS
      -> ORYBIT public profile
      -> correct object identity
```

## NFC Compatibility

The public URL is carrier-independent.

The exact same HTTPS URL can later be written into an NFC NDEF URL record, so QR is the zero-cost development carrier rather than a protocol dependency.
