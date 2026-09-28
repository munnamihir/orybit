import assert from "node:assert/strict";
import test from "node:test";

import {
  handleRequest,
  MemoryObjectRepository
} from "../dist/index.js";

function request(path) {
  return new Request(
    `https://api.orybit.test${path}`
  );
}

async function seed(repository) {
  await repository.create({
    protocolVersion: "0.1",
    id: "obj_public_demo_001",
    publicId: "public-demo-001",
    kind: "tool",
    identity: {
      name: "Workshop Drill",
      manufacturer: "Demo Tools",
      model: "D1",
      serial: "PRIVATE-SERIAL-123",
      description: "A real-world demo object."
    },
    lifecycle: {
      status: "active",
      createdAt: "2026-09-28T19:00:00Z",
      updatedAt: "2026-09-28T19:10:00Z"
    },
    carriers: [
      {
        type: "qr",
        uri: "https://example.test/o/public-demo-001"
      }
    ],
    capabilities: [
      "manual.view",
      "maintenance.record"
    ],
    metadata: {
      privateNote: "do not expose"
    }
  });
}

test(
  "public object profile is available without admin auth",
  async () => {
    const repository =
      new MemoryObjectRepository();

    await seed(repository);

    const response =
      await handleRequest(
        request(
          "/public/objects/public-demo-001"
        ),
        repository
      );

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(
      body.data.publicId,
      "public-demo-001"
    );
    assert.equal(
      body.data.identity.name,
      "Workshop Drill"
    );
    assert.equal(
      body.data.identity.manufacturer,
      "Demo Tools"
    );
    assert.equal(
      body.data.lifecycle.status,
      "active"
    );
  }
);

test(
  "public projection excludes private registry fields",
  async () => {
    const repository =
      new MemoryObjectRepository();

    await seed(repository);

    const response =
      await handleRequest(
        request(
          "/public/objects/public-demo-001"
        ),
        repository
      );

    const body = await response.json();
    const publicObject = body.data;

    assert.equal(
      "id" in publicObject,
      false
    );
    assert.equal(
      "serial" in publicObject.identity,
      false
    );
    assert.equal(
      "metadata" in publicObject,
      false
    );
    assert.equal(
      "carriers" in publicObject,
      false
    );
  }
);

test(
  "public route does not resolve internal object IDs",
  async () => {
    const repository =
      new MemoryObjectRepository();

    await seed(repository);

    const response =
      await handleRequest(
        request(
          "/public/objects/obj_public_demo_001"
        ),
        repository
      );

    assert.equal(response.status, 404);

    const body = await response.json();

    assert.equal(
      body.error.code,
      "PUBLIC_OBJECT_NOT_FOUND"
    );
  }
);
