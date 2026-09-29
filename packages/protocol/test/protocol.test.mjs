import assert from "node:assert/strict";
import {
  readFile
} from "node:fs/promises";
import test from "node:test";

import {
  ORYBIT_PROTOCOL_VERSION,
  generateEventId,
  generateObjectId,
  isEventId,
  isObjectId,
  validateOrybitCapability,
  validateOrybitEvent,
  validateOrybitManifest,
  validateOrybitObject
} from "../dist/index.js";

async function readJson(path) {
  const value = await readFile(
    new URL(path, import.meta.url),
    "utf8"
  );

  return JSON.parse(value);
}

test(
  "exports ORYBIT protocol version",
  () => {
    assert.equal(
      ORYBIT_PROTOCOL_VERSION,
      "0.1"
    );
  }
);

test(
  "generates valid object and event IDs",
  () => {
    const objectId = generateObjectId();
    const eventId = generateEventId();

    assert.equal(
      isObjectId(objectId),
      true
    );

    assert.equal(
      isEventId(eventId),
      true
    );
  }
);

test(
  "validates the reference coffee machine",
  async () => {
    const object = await readJson(
      "../../../examples/coffee-machine/object.json"
    );

    const validation =
      validateOrybitObject(object);

    assert.deepEqual(
      validation,
      {
        valid: true,
        errors: []
      }
    );
  }
);

test(
  "validates the reference lifecycle event",
  async () => {
    const events = await readJson(
      "../../../examples/coffee-machine/events.json"
    );

    const validation =
      validateOrybitEvent(events[0]);

    assert.deepEqual(
      validation,
      {
        valid: true,
        errors: []
      }
    );
  }
);

test(
  "validates every reference capability",
  async () => {
    const capabilities = await readJson(
      "../../../examples/coffee-machine/capabilities.json"
    );

    for (const capability of capabilities) {
      const validation =
        validateOrybitCapability(capability);

      assert.deepEqual(
        validation,
        {
          valid: true,
          errors: []
        }
      );
    }
  }
);

test(
  "validates the reference public manifest",
  async () => {
    const manifest = await readJson(
      "../../../examples/coffee-machine/manifest.json"
    );

    assert.deepEqual(
      validateOrybitManifest(manifest),
      {
        valid: true,
        errors: []
      }
    );
  }
);

test(
  "rejects private capabilities in a public manifest",
  async () => {
    const manifest = await readJson(
      "../../../examples/coffee-machine/manifest.json"
    );

    manifest.capabilities[0].access = "owner";

    const validation =
      validateOrybitManifest(manifest);

    assert.equal(validation.valid, false);
    assert.ok(
      validation.errors.some(
        (message) =>
          message.includes("must be public")
      )
    );
  }
);

test(
  "rejects malformed objects",
  () => {
    const validation =
      validateOrybitObject({
        protocolVersion: "0.1",
        id: "wrong",
        publicId: "x"
      });

    assert.equal(
      validation.valid,
      false
    );

    assert.ok(
      validation.errors.length > 0
    );
  }
);
