# @orybit/protocol

Shared protocol primitives for ORYBIT.

The package currently provides:

- ORYBIT Protocol version constants
- physical object TypeScript types
- lifecycle event types
- capability types
- object/event ID generators
- runtime validation helpers

## Build

From the ORYBIT repository root:

```bash
npm run build:protocol
```

## Test

```bash
npm run test:protocol
```

## Example

```ts
import {
  ORYBIT_PROTOCOL_VERSION,
  validateOrybitObject
} from "@orybit/protocol";

console.log(ORYBIT_PROTOCOL_VERSION);

const result = validateOrybitObject(candidate);

if (!result.valid) {
  console.error(result.errors);
}
```

Protocol version: **0.1**
