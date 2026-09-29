import assert from "node:assert/strict";
import test from "node:test";

import {
  handleRuntimeRequest,
  MemoryCapabilityRepository,
  MemoryEventRepository,
  MemoryObjectRepository,
  MemoryOwnershipRepository
} from "../dist/index.js";

const adminToken = "test-admin-token";
const runtimeOptions = { adminToken };

function request(path, init = {}) {
  return new Request(
    `https://api.orybit.test${path}`,
    init
  );
}

function adminRequest(path, init = {}) {
  return request(path, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      authorization:
        `Bearer ${adminToken}`
    }
  });
}

function jsonRequest(path, body) {
  return adminRequest(path, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

function setup() {
  return {
    objects: new MemoryObjectRepository(),
    events: new MemoryEventRepository(),
    ownership: new MemoryOwnershipRepository(),
    capabilities:
      new MemoryCapabilityRepository()
  };
}

async function call(state, req) {
  return handleRuntimeRequest(
    req,
    state.objects,
    runtimeOptions,
    state.events,
    state.ownership,
    state.capabilities
  );
}

async function define(
  state,
  name,
  access
) {
  const response = await call(
    state,
    jsonRequest(
      "/v1/capabilities",
      {
        name,
        title: name,
        description: `${name} capability`,
        access,
        category: "demo",
        operation: "read"
      }
    )
  );

  assert.equal(response.status, 201);
}

async function createObject(state) {
  await define(
    state,
    "manual.view",
    "public"
  );
  await define(
    state,
    "maintenance.record",
    "owner"
  );

  const response = await call(
    state,
    jsonRequest(
      "/v1/objects",
      {
        publicId: "manifest-demo-001",
        kind: "appliance",
        identity: {
          name: "Manifest Demo",
          manufacturer: "ORYBIT Labs",
          model: "M1",
          serial: "SECRET-SERIAL"
        },
        capabilities: [
          "manual.view",
          "maintenance.record"
        ],
        metadata: {
          secret: true
        }
      }
    )
  );

  assert.equal(response.status, 201);
  return (await response.json()).data;
}

test(
  "publishes a machine-readable public manifest without admin auth",
  async () => {
    const state = setup();
    await createObject(state);

    const response = await call(
      state,
      request(
        "/manifest/manifest-demo-001"
      )
    );

    const manifest = await response.json();

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("content-type"),
      "application/json; charset=utf-8"
    );
    assert.equal(manifest.manifestVersion, "0.1");
    assert.equal(manifest.protocolVersion, "0.1");
    assert.equal(
      manifest.object.publicId,
      "manifest-demo-001"
    );
    assert.equal(
      manifest.links.self,
      "https://api.orybit.test/manifest/manifest-demo-001"
    );
    assert.match(
      response.headers.get("link") ?? "",
      /describedby/
    );
  }
);

test(
  "manifest includes structured public capabilities and excludes private data",
  async () => {
    const state = setup();
    await createObject(state);

    const response = await call(
      state,
      request(
        "/manifest/manifest-demo-001"
      )
    );

    const manifest = await response.json();
    const serialized = JSON.stringify(manifest);

    assert.deepEqual(
      manifest.capabilities.map(
        (capability) => capability.name
      ),
      ["manual.view"]
    );
    assert.equal(
      manifest.capabilities[0].access,
      "public"
    );
    assert.equal(
      "serial" in manifest.object.identity,
      false
    );
    assert.equal(
      serialized.includes("SECRET-SERIAL"),
      false
    );
    assert.equal(
      serialized.includes("maintenance.record"),
      false
    );
    assert.equal(
      serialized.includes("metadata"),
      false
    );
    assert.equal(
      serialized.includes("owner"),
      false
    );
  }
);

test(
  "manifest route only resolves public IDs",
  async () => {
    const state = setup();
    const object = await createObject(state);

    const response = await call(
      state,
      request(`/manifest/${object.id}`)
    );

    assert.equal(response.status, 404);
    assert.equal(
      (await response.json()).error.code,
      "MANIFEST_NOT_FOUND"
    );
  }
);
