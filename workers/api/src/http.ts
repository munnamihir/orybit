import {
  ORYBIT_PROTOCOL_VERSION
} from "@orybit/protocol";

import {
  buildNewEvent
} from "./event-factory.js";

import {
  applyObjectPatch,
  buildNewObject
} from "./object-factory.js";

import {
  toPublicObjectProfile
} from "./public-object.js";

import type {
  CreateEventInput,
  EventRepository,
  ObjectRepository,
  RequestRuntimeOptions,
  UpdateObjectInput
} from "./types.js";

interface ApiError {
  code: string;
  message: string;
  details?: string[];
}

function json(
  body: unknown,
  status = 200
): Response {
  return new Response(
    JSON.stringify(body, null, 2),
    {
      status,
      headers: {
        "content-type":
          "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    }
  );
}

function error(
  status: number,
  value: ApiError
): Response {
  return json(
    {
      error: value
    },
    status
  );
}

function requireAdmin(
  request: Request,
  options: RequestRuntimeOptions
): Response | null {
  if (!options.adminToken) {
    return error(
      503,
      {
        code: "ADMIN_AUTH_NOT_CONFIGURED",
        message:
          "ORYBIT admin authentication is not configured."
      }
    );
  }

  const authorization =
    request.headers.get("authorization");

  if (
    authorization !==
    `Bearer ${options.adminToken}`
  ) {
    return error(
      401,
      {
        code: "UNAUTHORIZED",
        message:
          "A valid ORYBIT admin bearer token is required."
      }
    );
  }

  return null;
}

async function parseJson(
  request: Request
): Promise<unknown> {
  const contentType =
    request.headers.get("content-type") ?? "";

  if (
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    throw new TypeError(
      "Content-Type must be application/json."
    );
  }

  return request.json();
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
}

function toCreateInput(
  value: unknown
) {
  if (!isRecord(value)) {
    throw new TypeError(
      "Request body must be a JSON object."
    );
  }

  if (
    typeof value.kind !== "string" ||
    value.kind.trim().length === 0
  ) {
    throw new TypeError(
      "kind is required."
    );
  }

  if (
    !isRecord(value.identity) ||
    typeof value.identity.name !== "string" ||
    value.identity.name.trim().length === 0
  ) {
    throw new TypeError(
      "identity.name is required."
    );
  }

  return value as unknown as
    import("./types.js").CreateObjectInput;
}

function toUpdateInput(
  value: unknown
): UpdateObjectInput {
  if (!isRecord(value)) {
    throw new TypeError(
      "Request body must be a JSON object."
    );
  }

  const forbidden = [
    "id",
    "publicId",
    "protocolVersion"
  ].filter(
    (key) => key in value
  );

  if (forbidden.length > 0) {
    throw new TypeError(
      `${forbidden.join(", ")} cannot be changed.`
    );
  }

  return value as UpdateObjectInput;
}

function toCreateEventInput(
  value: unknown
): CreateEventInput {
  if (!isRecord(value)) {
    throw new TypeError(
      "Request body must be a JSON object."
    );
  }

  if (
    typeof value.type !== "string" ||
    value.type.trim().length === 0
  ) {
    throw new TypeError(
      "type is required."
    );
  }

  return value as unknown as CreateEventInput;
}

function routeIdentifier(
  pathname: string
): string | null {
  const match =
    pathname.match(
      /^\/v1\/objects\/([^/]+)$/
    );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function eventRouteIdentifier(
  pathname: string
): string | null {
  const match =
    pathname.match(
      /^\/v1\/objects\/([^/]+)\/events$/
    );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function publicRouteIdentifier(
  pathname: string
): string | null {
  const match =
    pathname.match(
      /^\/public\/objects\/([^/]+)$/
    );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

export async function handleRequest(
  request: Request,
  repository: ObjectRepository,
  options: RequestRuntimeOptions = {},
  eventRepository?: EventRepository
): Promise<Response> {
  const url = new URL(request.url);

  if (
    request.method === "GET" &&
    url.pathname === "/health"
  ) {
    return json({
      status: "ok",
      service: "orybit-object-registry",
      protocolVersion:
        ORYBIT_PROTOCOL_VERSION
    });
  }

  const publicIdentifier =
    publicRouteIdentifier(url.pathname);

  if (
    request.method === "GET" &&
    publicIdentifier
  ) {
    const object =
      await repository.findByIdentifier(
        publicIdentifier
      );

    if (
      !object ||
      object.publicId !== publicIdentifier
    ) {
      return error(
        404,
        {
          code: "PUBLIC_OBJECT_NOT_FOUND",
          message:
            "The requested public ORYBIT profile was not found."
        }
      );
    }

    return json({
      data: toPublicObjectProfile(object)
    });
  }

  const eventIdentifier =
    eventRouteIdentifier(url.pathname);

  if (
    url.pathname === "/v1/objects" ||
    routeIdentifier(url.pathname) ||
    eventIdentifier
  ) {
    const authFailure =
      requireAdmin(request, options);

    if (authFailure) {
      return authFailure;
    }
  }

  if (
    request.method === "POST" &&
    url.pathname === "/v1/objects"
  ) {
    try {
      const body =
        await parseJson(request);

      const input =
        toCreateInput(body);

      const object =
        buildNewObject(input);

      const created =
        await repository.create(object);

      return json(
        {
          data: created
        },
        201
      );
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Object creation failed.";

      if (
        message ===
        "PUBLIC_ID_ALREADY_EXISTS"
      ) {
        return error(
          409,
          {
            code:
              "PUBLIC_ID_ALREADY_EXISTS",
            message:
              "An object with this publicId already exists."
          }
        );
      }

      return error(
        400,
        {
          code: "INVALID_OBJECT",
          message: "Object is invalid.",
          details: [message]
        }
      );
    }
  }

  if (
    request.method === "GET" &&
    url.pathname === "/v1/objects"
  ) {
    const objects =
      await repository.list();

    return json({
      data: objects,
      count: objects.length
    });
  }

  if (eventIdentifier) {
    if (!eventRepository) {
      return error(
        503,
        {
          code: "EVENT_STORE_NOT_CONFIGURED",
          message:
            "ORYBIT Object Memory is not configured."
        }
      );
    }

    const object =
      await repository.findByIdentifier(
        eventIdentifier
      );

    if (!object) {
      return error(
        404,
        {
          code: "OBJECT_NOT_FOUND",
          message:
            "The requested ORYBIT object was not found."
        }
      );
    }

    if (request.method === "GET") {
      const events =
        await eventRepository.listForObject(
          object.id
        );

      return json({
        data: events,
        count: events.length
      });
    }

    if (request.method === "POST") {
      try {
        const body =
          await parseJson(request);

        const input =
          toCreateEventInput(body);

        const event =
          buildNewEvent(
            object.id,
            input
          );

        const created =
          await eventRepository.append(event);

        return json(
          {
            data: created
          },
          201
        );
      } catch (cause) {
        const message =
          cause instanceof Error
            ? cause.message
            : "Event creation failed.";

        return error(
          400,
          {
            code: "INVALID_EVENT",
            message:
              "The lifecycle event is invalid.",
            details: [message]
          }
        );
      }
    }
  }

  const identifier =
    routeIdentifier(url.pathname);

  if (
    request.method === "GET" &&
    identifier
  ) {
    const object =
      await repository
        .findByIdentifier(identifier);

    if (!object) {
      return error(
        404,
        {
          code: "OBJECT_NOT_FOUND",
          message:
            "The requested ORYBIT object was not found."
        }
      );
    }

    return json({
      data: object
    });
  }

  if (
    request.method === "PATCH" &&
    identifier
  ) {
    const current =
      await repository
        .findByIdentifier(identifier);

    if (!current) {
      return error(
        404,
        {
          code: "OBJECT_NOT_FOUND",
          message:
            "The requested ORYBIT object was not found."
        }
      );
    }

    try {
      const body =
        await parseJson(request);

      const patch =
        toUpdateInput(body);

      const updated =
        applyObjectPatch(
          current,
          patch
        );

      const saved =
        await repository.update(
          current.id,
          updated
        );

      return json({
        data: saved
      });
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Object update failed.";

      return error(
        400,
        {
          code: "INVALID_UPDATE",
          message:
            "The object update is invalid.",
          details: [message]
        }
      );
    }
  }

  return error(
    404,
    {
      code: "ROUTE_NOT_FOUND",
      message:
        "The requested ORYBIT API route does not exist."
    }
  );
}
