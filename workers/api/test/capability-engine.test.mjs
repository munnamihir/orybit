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

function jsonRequest(
  path,
  body,
  method = "POST",
  authenticated = true
) {
  const factory = authenticated
    ? adminRequest
    : request;

  return factory(path, {
    method,
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

async function json(response) {
  return response.json();
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

async function defineCapability(
  state,
  input = {}
) {
  const response = await call(
    state,
    jsonRequest(
      "/v1/capabilities",
      {
        name: "manual.view",
        title: "View manual",
        description: "View object documentation.",
        access: "public",
        category: "documentation",
        operation: "read",
        ...input
      }
    )
  );

  assert.equal(response.status, 201);
  return (await json(response)).data;
}

test(
  "requires registered capability definitions for new object assignments",
  async () => {
    const state = setup();

    const rejected = await call(
      state,
      jsonRequest(
        "/v1/objects",
        {
          publicId: "cap-demo-001",
          kind: "tool",
          identity: {
            name: "Capability Demo Tool"
          },
          capabilities: ["manual.view"]
        }
      )
    );

    assert.equal(rejected.status, 400);
    assert.equal(
      (await json(rejected)).error.code,
      "CAPABILITY_NOT_DEFINED"
    );

    await defineCapability(state);

    const accepted = await call(
      state,
      jsonRequest(
        "/v1/objects",
        {
          publicId: "cap-demo-001",
          kind: "tool",
          identity: {
            name: "Capability Demo Tool"
          },
          capabilities: ["manual.view"]
        }
      )
    );

    assert.equal(accepted.status, 201);
  }
);

test(
  "resolves object capability names into structured definitions",
  async () => {
    const state = setup();
    await defineCapability(state);

    const created = await call(
      state,
      jsonRequest(
        "/v1/objects",
        {
          publicId: "cap-demo-002",
          kind: "tool",
          identity: {
            name: "Structured Capability Tool"
          },
          capabilities: ["manual.view"]
        }
      )
    );

    const object = (await json(created)).data;

    const response = await call(
      state,
      adminRequest(
        `/v1/objects/${object.id}/capabilities`
      )
    );

    const payload = await json(response);

    assert.equal(response.status, 200);
    assert.equal(payload.count, 1);
    assert.equal(payload.data[0].status, "defined");
    assert.equal(
      payload.data[0].definition.operation,
      "read"
    );
    assert.equal(
      payload.data[0].definition.category,
      "documentation"
    );
  }
);

test(
  "enables and disables a registered capability idempotently",
  async () => {
    const state = setup();
    await defineCapability(state);

    const created = await call(
      state,
      jsonRequest(
        "/v1/objects",
        {
          publicId: "cap-demo-003",
          kind: "tool",
          identity: {
            name: "Toggle Capability Tool"
          }
        }
      )
    );

    const object = (await json(created)).data;
    const path =
      `/v1/objects/${object.id}/capabilities/manual.view`;

    const enabled = await call(
      state,
      adminRequest(path, { method: "PUT" })
    );

    assert.equal(enabled.status, 200);
    assert.deepEqual(
      (await json(enabled)).data.object.capabilities,
      ["manual.view"]
    );

    const disabled = await call(
      state,
      adminRequest(path, { method: "DELETE" })
    );

    assert.equal(disabled.status, 200);
    assert.deepEqual(
      (await json(disabled)).data.object.capabilities,
      []
    );
  }
);

test(
  "public object profiles expose only public capability definitions",
  async () => {
    const state = setup();
    await defineCapability(state);
    await defineCapability(
      state,
      {
        name: "maintenance.record",
        title: "Record maintenance",
        description: "Record private maintenance.",
        access: "owner",
        category: "maintenance",
        operation: "write"
      }
    );

    const created = await call(
      state,
      jsonRequest(
        "/v1/objects",
        {
          publicId: "cap-demo-public",
          kind: "tool",
          identity: {
            name: "Public Capability Tool"
          },
          capabilities: [
            "manual.view",
            "maintenance.record"
          ]
        }
      )
    );

    assert.equal(created.status, 201);

    const response = await call(
      state,
      request(
        "/public/objects/cap-demo-public"
      )
    );

    assert.equal(response.status, 200);
    assert.deepEqual(
      (await json(response)).data.capabilities,
      ["manual.view"]
    );
  }
);

test(
  "rejects malformed capability definitions",
  async () => {
    const state = setup();

    const response = await call(
      state,
      jsonRequest(
        "/v1/capabilities",
        {
          name: "invalid",
          title: "Invalid",
          description: "Missing dotted name.",
          access: "public",
          operation: "read"
        }
      )
    );

    assert.equal(response.status, 400);
    assert.equal(
      (await json(response)).error.code,
      "INVALID_CAPABILITY_OPERATION"
    );
  }
);
