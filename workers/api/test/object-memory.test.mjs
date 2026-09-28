import assert from "node:assert/strict";
import test from "node:test";

import {
  handleRequest,
  MemoryEventRepository,
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

async function createObject(
  objectRepository,
  eventRepository
) {
  const response = await handleRequest(
    adminRequest(
      "/v1/objects",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json"
        },
        body: JSON.stringify({
          publicId: "memory-demo-001",
          kind: "electronics",
          identity: {
            name: "Memory Demo Object"
          }
        })
      }
    ),
    objectRepository,
    runtimeOptions,
    eventRepository
  );

  assert.equal(response.status, 201);

  return (await json(response)).data;
}

test(
  "appends and lists lifecycle events",
  async () => {
    const objectRepository =
      new MemoryObjectRepository();
    const eventRepository =
      new MemoryEventRepository();

    const object =
      await createObject(
        objectRepository,
        eventRepository
      );

    const response = await handleRequest(
      adminRequest(
        `/v1/objects/${object.publicId}/events`,
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json"
          },
          body: JSON.stringify({
            type: "maintenance.completed",
            occurredAt:
              "2026-09-28T20:00:00Z",
            actor: {
              type: "user"
            },
            data: {
              note: "Battery inspected"
            }
          })
        }
      ),
      objectRepository,
      runtimeOptions,
      eventRepository
    );

    assert.equal(response.status, 201);

    const created =
      (await json(response)).data;

    assert.match(created.id, /^evt_/);
    assert.equal(created.objectId, object.id);
    assert.equal(
      created.type,
      "maintenance.completed"
    );

    const listResponse =
      await handleRequest(
        adminRequest(
          `/v1/objects/${object.publicId}/events`
        ),
        objectRepository,
        runtimeOptions,
        eventRepository
      );

    const body = await json(listResponse);

    assert.equal(listResponse.status, 200);
    assert.equal(body.count, 1);
    assert.equal(
      body.data[0].data.note,
      "Battery inspected"
    );
  }
);

test(
  "returns events newest first",
  async () => {
    const objectRepository =
      new MemoryObjectRepository();
    const eventRepository =
      new MemoryEventRepository();

    const object =
      await createObject(
        objectRepository,
        eventRepository
      );

    for (const event of [
      {
        type: "maintenance.completed",
        occurredAt:
          "2026-09-28T10:00:00Z"
      },
      {
        type: "repair.completed",
        occurredAt:
          "2026-09-29T10:00:00Z"
      }
    ]) {
      await handleRequest(
        adminRequest(
          `/v1/objects/${object.id}/events`,
          {
            method: "POST",
            headers: {
              "content-type":
                "application/json"
            },
            body: JSON.stringify(event)
          }
        ),
        objectRepository,
        runtimeOptions,
        eventRepository
      );
    }

    const response = await handleRequest(
      adminRequest(
        `/v1/objects/${object.id}/events`
      ),
      objectRepository,
      runtimeOptions,
      eventRepository
    );

    const body = await json(response);

    assert.deepEqual(
      body.data.map((event) => event.type),
      [
        "repair.completed",
        "maintenance.completed"
      ]
    );
  }
);

test(
  "rejects invalid lifecycle event types",
  async () => {
    const objectRepository =
      new MemoryObjectRepository();
    const eventRepository =
      new MemoryEventRepository();

    const object =
      await createObject(
        objectRepository,
        eventRepository
      );

    const response = await handleRequest(
      adminRequest(
        `/v1/objects/${object.id}/events`,
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json"
          },
          body: JSON.stringify({
            type: "Maintenance Completed!"
          })
        }
      ),
      objectRepository,
      runtimeOptions,
      eventRepository
    );

    assert.equal(response.status, 400);

    const body = await json(response);

    assert.equal(
      body.error.code,
      "INVALID_EVENT"
    );
  }
);

test(
  "returns 404 when recording memory for an unknown object",
  async () => {
    const objectRepository =
      new MemoryObjectRepository();
    const eventRepository =
      new MemoryEventRepository();

    const response = await handleRequest(
      adminRequest(
        "/v1/objects/missing-object/events",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json"
          },
          body: JSON.stringify({
            type: "maintenance.completed"
          })
        }
      ),
      objectRepository,
      runtimeOptions,
      eventRepository
    );

    assert.equal(response.status, 404);

    const body = await json(response);

    assert.equal(
      body.error.code,
      "OBJECT_NOT_FOUND"
    );
  }
);

test(
  "event routes remain protected by admin auth",
  async () => {
    const objectRepository =
      new MemoryObjectRepository();
    const eventRepository =
      new MemoryEventRepository();

    const response = await handleRequest(
      request(
        "/v1/objects/anything/events"
      ),
      objectRepository,
      runtimeOptions,
      eventRepository
    );

    assert.equal(response.status, 401);

    const body = await json(response);

    assert.equal(
      body.error.code,
      "UNAUTHORIZED"
    );
  }
);
