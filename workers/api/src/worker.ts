import {
  D1ObjectRepository
} from "./d1-repository.js";

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

    return handleRequest(
      request,
      repository
    );
  }
};
