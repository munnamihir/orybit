import assert from "node:assert/strict";
import test from "node:test";

import {
  handleRequest,
  MemoryEventRepository,
  MemoryObjectRepository,
  MemoryOwnershipRepository
} from "../dist/index.js";

const adminToken = "test-admin-token";
const runtimeOptions = {
  adminToken
};

function request(path, init = {}) {
  return new Request(
    `https://api.orybit.test${path}`,
    init
  );
}

function adminRequest(path, init = {}) {
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

function jsonRequest(
  path,
  body,
  authenticated = true
) {
  const factory = authenticated
    ? adminRequest
    : request;

  return factory(
    path,
    {
      method: "POST",
      headers: {
        "content-type":
          "application/json"
      },
      body: JSON.stringify(body)
    }
  );
}

async function json(response) {
  return response.json();
}

function setup() {
  return {
    objects: new MemoryObjectRepository(),
    events: new MemoryEventRepository(),
    ownership:
      new MemoryOwnershipRepository()
  };
}

async function call(
  state,
  req
) {
  return handleRequest(
    req,
    state.objects,
    runtimeOptions,
    state.events,
    state.ownership
  );
}

async function createObject(state) {
  const response = await call(
    state,
    jsonRequest(
      "/v1/objects",
      {
        publicId: "ownership-demo-001",
        kind: "tool",
        identity: {
          name: "Ownership Demo Tool"
        }
      }
    )
  );

  assert.equal(response.status, 201);
  return (await json(response)).data;
}

async function createOwner(
  state,
  displayName,
  reference
) {
  const response = await call(
    state,
    jsonRequest(
      "/v1/owners",
      {
        displayName,
        type: "person",
        reference
      }
    )
  );

  assert.equal(response.status, 201);
  return (await json(response)).data;
}

test(
  "assigns an initial owner and preserves ownership history",
  async () => {
    const state = setup();
    const object = await createObject(state);
    const owner = await createOwner(
      state,
      "First Owner",
      "private-reference"
    );

    const assign = await call(
      state,
      jsonRequest(
        `/v1/objects/${object.publicId}/ownership/assign`,
        {
          ownerId: owner.id,
          startedAt:
            "2026-09-28T20:00:00Z",
          note: "Initial assignment"
        }
      )
    );

    assert.equal(assign.status, 201);

    const snapshotResponse = await call(
      state,
      adminRequest(
        `/v1/objects/${object.publicId}/ownership`
      )
    );

    const snapshot =
      (await json(snapshotResponse)).data;

    assert.equal(
      snapshot.current.owner.displayName,
      "First Owner"
    );
    assert.equal(snapshot.history.length, 1);
    assert.equal(
      snapshot.history[0].source,
      "assigned"
    );
  }
);

test(
  "creates a secret transfer and accepts it through the public capability link",
  async () => {
    const state = setup();
    const object = await createObject(state);
    const first = await createOwner(
      state,
      "First Owner"
    );
    const second = await createOwner(
      state,
      "Second Owner"
    );

    await call(
      state,
      jsonRequest(
        `/v1/objects/${object.id}/ownership/assign`,
        { ownerId: first.id }
      )
    );

    const transferResponse = await call(
      state,
      jsonRequest(
        `/v1/objects/${object.id}/ownership/transfers`,
        {
          toOwnerId: second.id,
          expiresAt:
            "2099-09-28T20:00:00Z",
          note: "Demo handoff"
        }
      )
    );

    assert.equal(transferResponse.status, 201);

    const secret =
      (await json(transferResponse)).data;

    assert.equal(
      secret.transfer.status,
      "pending"
    );
    assert.ok(secret.acceptanceToken.length > 20);

    const previewResponse = await call(
      state,
      jsonRequest(
        "/public/ownership-transfers/preview",
        { token: secret.acceptanceToken },
        false
      )
    );

    assert.equal(previewResponse.status, 200);

    const preview =
      (await json(previewResponse)).data;

    assert.equal(
      preview.object.publicId,
      object.publicId
    );
    assert.equal(
      preview.transfer.toOwner.displayName,
      "Second Owner"
    );
    assert.equal(
      "id" in preview.transfer.toOwner,
      false
    );
    assert.equal(
      "reference" in preview.transfer.fromOwner,
      false
    );

    const acceptResponse = await call(
      state,
      jsonRequest(
        "/public/ownership-transfers/accept",
        { token: secret.acceptanceToken },
        false
      )
    );

    assert.equal(acceptResponse.status, 200);

    const snapshotResponse = await call(
      state,
      adminRequest(
        `/v1/objects/${object.id}/ownership`
      )
    );

    const snapshot =
      (await json(snapshotResponse)).data;

    assert.equal(
      snapshot.current.owner.displayName,
      "Second Owner"
    );
    assert.equal(snapshot.history.length, 2);
    assert.equal(
      snapshot.history[0].source,
      "transfer"
    );
    assert.ok(snapshot.history[1].endedAt);
  }
);

test(
  "prevents a second pending transfer for the same object",
  async () => {
    const state = setup();
    const object = await createObject(state);
    const first = await createOwner(
      state,
      "First Owner"
    );
    const second = await createOwner(
      state,
      "Second Owner"
    );
    const third = await createOwner(
      state,
      "Third Owner"
    );

    await call(
      state,
      jsonRequest(
        `/v1/objects/${object.id}/ownership/assign`,
        { ownerId: first.id }
      )
    );

    await call(
      state,
      jsonRequest(
        `/v1/objects/${object.id}/ownership/transfers`,
        {
          toOwnerId: second.id,
          expiresAt:
            "2099-09-28T20:00:00Z"
        }
      )
    );

    const response = await call(
      state,
      jsonRequest(
        `/v1/objects/${object.id}/ownership/transfers`,
        {
          toOwnerId: third.id,
          expiresAt:
            "2099-09-28T20:00:00Z"
        }
      )
    );

    assert.equal(response.status, 409);
    assert.equal(
      (await json(response)).error.code,
      "PENDING_TRANSFER_EXISTS"
    );
  }
);

test(
  "can cancel a pending transfer",
  async () => {
    const state = setup();
    const object = await createObject(state);
    const first = await createOwner(
      state,
      "First Owner"
    );
    const second = await createOwner(
      state,
      "Second Owner"
    );

    await call(
      state,
      jsonRequest(
        `/v1/objects/${object.id}/ownership/assign`,
        { ownerId: first.id }
      )
    );

    const created = await call(
      state,
      jsonRequest(
        `/v1/objects/${object.id}/ownership/transfers`,
        {
          toOwnerId: second.id,
          expiresAt:
            "2099-09-28T20:00:00Z"
        }
      )
    );

    const transfer =
      (await json(created)).data.transfer;

    const cancelled = await call(
      state,
      adminRequest(
        `/v1/ownership-transfers/${transfer.id}/cancel`,
        { method: "POST" }
      )
    );

    assert.equal(cancelled.status, 200);
    assert.equal(
      (await json(cancelled)).data.status,
      "cancelled"
    );
  }
);

test(
  "ownership administration remains protected",
  async () => {
    const state = setup();

    const response = await handleRequest(
      request("/v1/owners"),
      state.objects,
      runtimeOptions,
      state.events,
      state.ownership
    );

    assert.equal(response.status, 401);
    assert.equal(
      (await json(response)).error.code,
      "UNAUTHORIZED"
    );
  }
);
