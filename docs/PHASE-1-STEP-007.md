# Phase 1 — Step 007 Validation

## Objective

Prove ORYBIT can connect a real physical object to a public digital identity through a QR carrier.

## Validation Checklist

### Build

```bash
npm install
npm run check
```

### Local runtime

```bash
npm run cf:dev
```

Open the dashboard, unlock it, and open **Physical bridge**.

### Physical object

Use a personal object you own and can safely label. Do not use employer-owned equipment or confidential/proprietary assets.

Register it with at least:

- object name
- kind
- manufacturer when useful
- model when useful
- description
- one or more capabilities

### QR

In **Physical bridge**:

1. choose the object
2. open its public profile
3. verify no admin token appears in the URL
4. download the QR
5. scan the QR from a second device or phone camera

### Public profile checks

The public profile should show:

- object name
- public ID
- kind
- lifecycle status
- manufacturer/model when published
- description when published
- public capability names

The public profile must not show:

- internal object ID
- serial number
- metadata
- admin token

### Production deployment

```bash
npm run cf:deploy
```

Then repeat the QR scan using the deployed `workers.dev` URL.

## Success Condition

```text
Real physical object
      ↓
ORYBIT registration
      ↓
QR generated locally
      ↓
QR attached to object
      ↓
Phone scan
      ↓
Public ORYBIT profile
```
