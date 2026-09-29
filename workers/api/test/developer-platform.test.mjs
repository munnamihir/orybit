import assert from "node:assert/strict";
import test from "node:test";

import {
  handleRuntimeRequest,
  MemoryCapabilityRepository,
  MemoryDeveloperApiKeyRepository,
  MemoryEventRepository,
  MemoryObjectRepository,
  MemoryOwnershipRepository
} from "../dist/index.js";

const adminToken = "test-admin-token";
const options = { adminToken };

function request(
  path,
  init = {}
) {
  return new Request(
    `https://api.orybit.test${path}`,
    init
  );
}

function adminRequest(
  path,
  init = {}
) {
  return request(path, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      authorization:
        `Bearer ${adminToken}`
    }
  });
}

function developerRequest(
  path,
  apiKey,
  init = {}
) {
  return request(path, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      authorization:
        `Bearer ${apiKey}`
    }
  });
}

function jsonRequest(
  path,
  body,
  authenticated = true
) {
  const factory = authenticated
    ? adminRequest
    : request;

  return factory(path, {
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
      new MemoryCapabilityRepository(),
    developerKeys:
      new MemoryDeveloperApiKeyRepository()
  };
}

async function call(state, req) {
  return handleRuntimeRequest(
    req,
    state.objects,
    options,
    state.events,
    state.ownership,
    state.capabilities,
    state.developerKeys
  );
}

async function payload(response) {
  return response.json();
}

async function seedObject(state) {
  await call(
    state,
    jsonRequest(
      "/v1/capabilities",
      {
        name: "manual.view",
        title: "View manual",
        description: "View documentation.",
        access: "public",
        category: "documentation",
        operation: "read"
      }
    )
  );

  await call(
    state,
    jsonRequest(
      "/v1/capabilities",
      {
        name: "maintenance.record",
        title: "Record maintenance",
        description: "Record maintenance history.",
        access: "owner",
        category: "maintenance",
        operation: "write"
      }
    )
  );

  const created = await call(
    state,
    jsonRequest(
      "/v1/objects",
      {
        publicId: "developer-demo-001",
        kind: "tool",
        identity: {
          name: "Developer Demo Tool",
          serial: "PRIVATE-SERIAL"
        },
        capabilities: [
          "manual.view",
          "maintenance.record"
        ],
        metadata: {
          privateNote: "do not expose"
        }
      }
    )
  );

  assert.equal(created.status, 201);
}

async function createKey(
  state,
  scopes = [
    "objects:read",
    "manifests:read",
    "capabilities:read"
  ]
) {
  const response = await call(
    state,
    jsonRequest(
      "/v1/developer-keys",
      {
        name: "Test integration",
        scopes
      }
    )
  );

  assert.equal(response.status, 201);
  return (await payload(response)).data;
}

test(
  "creates a developer key once and never lists its raw secret or verifier",
  async () => {
    const state = setup();
    const secret = await createKey(state);

    assert.match(
      secret.apiKey,
      /^ory_dev_devkey_[a-f0-9]{32}\.[A-Za-z0-9_-]{43}$/
    );

    const listed = await call(
      state,
      adminRequest("/v1/developer-keys")
    );
    const body = await payload(listed);

    assert.equal(listed.status, 200);
    assert.equal(body.count, 1);
    assert.equal(body.data[0].id, secret.key.id);
    assert.equal("apiKey" in body.data[0], false);
    assert.equal("tokenHash" in body.data[0], false);
  }
);

test(
  "developer reads expose only the public object and public structured capabilities",
  async () => {
    const state = setup();
    await seedObject(state);
    const secret = await createKey(state);

    const objectResponse = await call(
      state,
      developerRequest(
        "/developer/v1/objects/developer-demo-001",
        secret.apiKey
      )
    );
    const object = (await payload(objectResponse)).data;

    assert.equal(objectResponse.status, 200);
    assert.deepEqual(
      object.capabilities,
      ["manual.view"]
    );
    assert.equal("id" in object, false);
    assert.equal("serial" in object.identity, false);
    assert.equal("metadata" in object, false);

    const manifestResponse = await call(
      state,
      developerRequest(
        "/developer/v1/manifests/developer-demo-001",
        secret.apiKey
      )
    );
    const manifest =
      (await payload(manifestResponse)).data;

    assert.equal(manifestResponse.status, 200);
    assert.deepEqual(
      manifest.capabilities.map(
        (item) => item.name
      ),
      ["manual.view"]
    );

    const capabilityResponse = await call(
      state,
      developerRequest(
        "/developer/v1/objects/developer-demo-001/capabilities",
        secret.apiKey
      )
    );
    const capabilities =
      await payload(capabilityResponse);

    assert.equal(capabilityResponse.status, 200);
    assert.equal(capabilities.count, 1);
    assert.equal(
      capabilities.data[0].access,
      "public"
    );
  }
);

test(
  "enforces developer scopes and does not accept a developer key as an admin token",
  async () => {
    const state = setup();
    await seedObject(state);
    const secret = await createKey(
      state,
      ["objects:read"]
    );

    const denied = await call(
      state,
      developerRequest(
        "/developer/v1/manifests/developer-demo-001",
        secret.apiKey
      )
    );

    assert.equal(denied.status, 403);
    assert.equal(
      (await payload(denied)).error.code,
      "DEVELOPER_SCOPE_REQUIRED"
    );

    const adminRoute = await call(
      state,
      developerRequest(
        "/v1/objects",
        secret.apiKey
      )
    );

    assert.equal(adminRoute.status, 401);
  }
);

test(
  "revocation immediately disables developer API access",
  async () => {
    const state = setup();
    await seedObject(state);
    const secret = await createKey(state);

    const me = await call(
      state,
      developerRequest(
        "/developer/v1/me",
        secret.apiKey
      )
    );

    assert.equal(me.status, 200);
    assert.ok((await payload(me)).data.lastUsedAt);

    const revoked = await call(
      state,
      adminRequest(
        `/v1/developer-keys/${secret.key.id}/revoke`,
        { method: "POST" }
      )
    );

    assert.equal(revoked.status, 200);
    assert.ok((await payload(revoked)).data.revokedAt);

    const denied = await call(
      state,
      developerRequest(
        "/developer/v1/me",
        secret.apiKey
      )
    );

    assert.equal(denied.status, 401);
  }
);
