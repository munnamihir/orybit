import {
  D1EventRepository
} from "./d1-event-repository.js";

import {
  D1ObjectRepository
} from "./d1-repository.js";

import {
  D1OwnershipRepository
} from "./d1-ownership-repository.js";

import {
  handleRequest
} from "./http.js";

import type {
  Env
} from "./types.js";

export default {
  async fetch(
    request: Request,
    env: Env
  ): Promise<Response> {
    const repository =
      new D1ObjectRepository(env.DB);

    const eventRepository =
      new D1EventRepository(env.DB);

    const ownershipRepository =
      new D1OwnershipRepository(env.DB);

    return handleRequest(
      request,
      repository,
      {
        adminToken:
          env.ORYBIT_ADMIN_TOKEN
      },
      eventRepository,
      ownershipRepository
    );
  }
};
