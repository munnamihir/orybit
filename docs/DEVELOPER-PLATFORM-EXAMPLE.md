# ORYBIT Developer SDK Example

Build the SDK first:

```bash
npm run build:sdk
```

Set runtime values without committing them:

```bash
export ORYBIT_BASE_URL="https://YOUR-ORYBIT-DOMAIN"
export ORYBIT_API_KEY="ory_dev_..."
export ORYBIT_PUBLIC_ID="YOUR_PUBLIC_ID"
```

Run:

```bash
node examples/developer-sdk/read-object.mjs
```

The example reads:

- the developer integration identity;
- the public-safe object projection;
- the object manifest;
- structured public capabilities.

It intentionally does not read ownership, private Object Memory, serial numbers, arbitrary metadata, transfer secrets, or private capabilities.

When finished testing, remove the raw key from the shell:

```bash
unset ORYBIT_API_KEY
```

Then revoke the integration key through the ORYBIT Developer Console or admin API if it was only created for testing.
