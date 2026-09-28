import assert from "node:assert/strict";
import test from "node:test";

import {
  handleRequest,
  MemoryObjectRepository
} from "../dist/index.js";

const adminToken = "test-admin-token";
const runtimeOptions = {
  adminToken
};

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
  return request(
    path,
    {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        authorization:
          `Bearer ${adminToken}`
      }
    }
  );
}

async function json(response) {
  return response.json();
}

test(
  "health endpoint remains public",
  async () => {
    const repository =
      new MemoryObjectRepository();

    const response =
      await handleRequest(
        request("/health"),
        repository
      );

    assert.equal(response.status, 200);

    assert.deepEqual(
      await json(response),
      {
        status: "ok",
        service:
          "orybit-object-registry",
        protocolVersion: "0.1"
      }
    );
  }
);

test(
  "fails closed when admin auth is not configured",
  async () => {
    const repository =
      new MemoryObjectRepository();

    const response =
      await handleRequest(
        request("/v1/objects"),
        repository
      );

    assert.equal(response.status, 503);

    const body = await json(response);

    assert.equal(
      body.error.code,
      "ADMIN_AUTH_NOT_CONFIGURED"
    );
  }
);

test(
  "rejects an invalid admin token",
  async () => {
    const repository =
      new MemoryObjectRepository();

    const response =
      await handleRequest(
        request(
          "/v1/objects",
          {
            headers: {
              authorization:
                "Bearer wrong-token"
            }
          }
        ),
        repository,
        runtimeOptions
      );

    assert.equal(response.status, 401);

    const body = await json(response);

    assert.equal(
      body.error.code,
      "UNAUTHORIZED"
    );
  }
);

test(
  "creates an ORYBIT object with admin auth",
  async () => {
    const repository =
      new MemoryObjectRepository();

    const response =
      await handleRequest(
        adminRequest(
          "/v1/objects",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json"
            },
            body: JSON.stringify({
              kind: "appliance",
              identity: {
                name:
                  "Test Coffee Machine",
                manufacturer:
                  "Demo Appliances"
              },
              capabilities: [
                "manual.view"
              ]
            })
          }
        ),
        repository,
        runtimeOptions
      );

    assert.equal(response.status, 201);

    const body = await json(response);

    assert.equal(
      body.data.protocolVersion,
      "0.1"
    );

    assert.match(
      body.data.id,
      /^obj_/
    );

    assert.match(
      body.data.publicId,
      /^o-/
    );

    assert.equal(
      body.data.lifecycle.status,
      "active"
    );
  }
);

test(
  "rejects invalid object creation",
  async () => {
    const repository =
      new MemoryObjectRepository();

    const response =
      await handleRequest(
        adminRequest(
          "/v1/objects",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json"
            },
            body:
              JSON.stringify({
                kind: ""
              })
          }
        ),
        repository,
        runtimeOptions
      );

    assert.equal(response.status, 400);

    const body = await json(response);

    assert.equal(
      body.error.code,
      "INVALID_OBJECT"
    );
  }
);

test(
  "lists registered objects",
  async () => {
    const repository =
      new MemoryObjectRepository();

    for (const name of [
      "Object A",
      "Object B"
    ]) {
      await handleRequest(
        adminRequest(
          "/v1/objects",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json"
            },
            body:
              JSON.stringify({
                kind: "tool",
                identity: {
                  name
                }
              })
          }
        ),
        repository,
        runtimeOptions
      );
    }

    const response =
      await handleRequest(
        adminRequest("/v1/objects"),
        repository,
        runtimeOptions
      );

    const body = await json(response);

    assert.equal(response.status, 200);
    assert.equal(body.count, 2);
  }
);

test(
  "retrieves an object by public ID",
  async () => {
    const repository =
      new MemoryObjectRepository();

    const createResponse =
      await handleRequest(
        adminRequest(
          "/v1/objects",
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json"
            },
            body:
              JSON.stringify({
                publicId:
                  "demo-tool-001",
                kind: "tool",
                identity: {
                  name:
                    "Demo Tool"
                }
              })
          }
        ),
        repository,
        runtimeOptions
      );

    assert.equal(
      createResponse.status,
      201
    );

    const response =
      await handleRequest(
        adminRequest(
          "/v1/objects/demo-tool-001"
        ),
        repository,
        runtimeOptions
      );

    const body = await json(response);

    assert.equal(response.status, 200);
    assert.equal(
      body.data.publicId,
      "demo-tool-001"
    );
  }
);

test(
  "updates an existing object",
  async () => {
    const repository =
      new MemoryObjectRepository();

    await handleRequest(
      adminRequest(
        "/v1/objects",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json"
          },
          body:
            JSON.stringify({
              publicId:
                "bike-demo-001",
              kind: "bicycle",
              identity: {
                name:
                  "Demo Bicycle"
              }
            })
        }
      ),
      repository,
      runtimeOptions
    );

    const response =
      await handleRequest(
        adminRequest(
          "/v1/objects/bike-demo-001",
          {
            method: "PATCH",
            headers: {
              "content-type":
                "application/json"
            },
            body:
              JSON.stringify({
                identity: {
                  model: "Road X1"
                },
                capabilities: [
                  "manual.view",
                  "maintenance.record"
                ]
              })
          }
        ),
        repository,
        runtimeOptions
      );

    const body = await json(response);

    assert.equal(response.status, 200);
    assert.equal(
      body.data.identity.model,
      "Road X1"
    );

    assert.deepEqual(
      body.data.capabilities,
      [
        "manual.view",
        "maintenance.record"
      ]
    );
  }
);

test(
  "returns 404 for unknown objects after auth",
  async () => {
    const repository =
      new MemoryObjectRepository();

    const response =
      await handleRequest(
        adminRequest(
          "/v1/objects/missing-object"
        ),
        repository,
        runtimeOptions
      );

    assert.equal(response.status, 404);

    const body = await json(response);

    assert.equal(
      body.error.code,
      "OBJECT_NOT_FOUND"
    );
  }
);
