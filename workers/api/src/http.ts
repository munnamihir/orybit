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
  acceptTransferToken,
  buildOwner,
  createTransferSecret,
  resolveTransferToken
} from "./ownership-service.js";

import {
  toPublicObjectProfile
} from "./public-object.js";

import type {
  AssignOwnershipInput,
  CreateEventInput,
  CreateOwnerInput,
  CreateOwnershipTransferInput,
  EventRepository,
  ObjectRepository,
  OwnershipRepository,
  OwnershipTransfer,
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

function toOwnerInput(
  value: unknown
): CreateOwnerInput {
  if (!isRecord(value)) {
    throw new TypeError(
      "Request body must be a JSON object."
    );
  }

  if (
    typeof value.displayName !== "string" ||
    value.displayName.trim().length === 0
  ) {
    throw new TypeError(
      "displayName is required."
    );
  }

  return value as unknown as CreateOwnerInput;
}

function toAssignOwnershipInput(
  value: unknown
): AssignOwnershipInput {
  if (!isRecord(value)) {
    throw new TypeError(
      "Request body must be a JSON object."
    );
  }

  if (
    typeof value.ownerId !== "string" ||
    value.ownerId.trim().length === 0
  ) {
    throw new TypeError(
      "ownerId is required."
    );
  }

  return value as unknown as AssignOwnershipInput;
}

function toTransferInput(
  value: unknown
): CreateOwnershipTransferInput {
  if (!isRecord(value)) {
    throw new TypeError(
      "Request body must be a JSON object."
    );
  }

  if (
    typeof value.toOwnerId !== "string" ||
    value.toOwnerId.trim().length === 0
  ) {
    throw new TypeError(
      "toOwnerId is required."
    );
  }

  return value as unknown as
    CreateOwnershipTransferInput;
}

function transferTokenFromBody(
  value: unknown
): string {
  if (
    !isRecord(value) ||
    typeof value.token !== "string" ||
    value.token.trim().length === 0
  ) {
    throw new TypeError(
      "token is required."
    );
  }

  return value.token.trim();
}

function routeIdentifier(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/v1\/objects\/([^/]+)$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function eventRouteIdentifier(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/v1\/objects\/([^/]+)\/events$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function ownershipRouteIdentifier(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/v1\/objects\/([^/]+)\/ownership$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function ownershipAssignIdentifier(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/v1\/objects\/([^/]+)\/ownership\/assign$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function ownershipTransferIdentifier(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/v1\/objects\/([^/]+)\/ownership\/transfers$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function transferCancelIdentifier(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/v1\/ownership-transfers\/([^/]+)\/cancel$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function publicRouteIdentifier(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/public\/objects\/([^/]+)$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function publicTransfer(
  transfer: OwnershipTransfer
) {
  return {
    id: transfer.id,
    status: transfer.status,
    requestedAt: transfer.requestedAt,
    expiresAt: transfer.expiresAt,
    ...(transfer.acceptedAt
      ? { acceptedAt: transfer.acceptedAt }
      : {}),
    fromOwner: {
      displayName:
        transfer.fromOwner.displayName,
      type: transfer.fromOwner.type
    },
    toOwner: {
      displayName:
        transfer.toOwner.displayName,
      type: transfer.toOwner.type
    },
    ...(transfer.note
      ? { note: transfer.note }
      : {})
  };
}

function ownershipFailure(
  cause: unknown
): Response {
  const message =
    cause instanceof Error
      ? cause.message
      : "Ownership operation failed.";

  const definitions: Record<
    string,
    { status: number; message: string }
  > = {
    OWNER_NOT_FOUND: {
      status: 404,
      message: "The requested owner was not found."
    },
    OBJECT_ALREADY_OWNED: {
      status: 409,
      message: "The object already has an active owner."
    },
    OBJECT_HAS_NO_OWNER: {
      status: 409,
      message: "Assign an owner before creating a transfer."
    },
    TRANSFER_TO_CURRENT_OWNER: {
      status: 409,
      message: "The destination owner is already the current owner."
    },
    PENDING_TRANSFER_EXISTS: {
      status: 409,
      message: "The object already has a pending ownership transfer."
    },
    TRANSFER_NOT_FOUND: {
      status: 404,
      message: "The ownership transfer was not found."
    },
    TRANSFER_NOT_PENDING: {
      status: 409,
      message: "The ownership transfer is no longer pending."
    },
    OWNERSHIP_CHANGED: {
      status: 409,
      message: "Ownership changed after this transfer was created."
    }
  };

  const definition = definitions[message];

  if (definition) {
    return error(
      definition.status,
      {
        code: message,
        message: definition.message
      }
    );
  }

  return error(
    400,
    {
      code: "INVALID_OWNERSHIP_OPERATION",
      message: "The ownership operation is invalid.",
      details: [message]
    }
  );
}

export async function handleRequest(
  request: Request,
  repository: ObjectRepository,
  options: RequestRuntimeOptions = {},
  eventRepository?: EventRepository,
  ownershipRepository?: OwnershipRepository
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

  if (
    request.method === "POST" &&
    (
      url.pathname ===
        "/public/ownership-transfers/preview" ||
      url.pathname ===
        "/public/ownership-transfers/accept"
    )
  ) {
    if (!ownershipRepository) {
      return error(
        503,
        {
          code: "OWNERSHIP_STORE_NOT_CONFIGURED",
          message:
            "ORYBIT Ownership is not configured."
        }
      );
    }

    try {
      const token = transferTokenFromBody(
        await parseJson(request)
      );

      const transfer =
        url.pathname.endsWith("/accept")
          ? await acceptTransferToken(
              ownershipRepository,
              token
            )
          : await resolveTransferToken(
              ownershipRepository,
              token
            );

      if (!transfer) {
        return error(
          404,
          {
            code: "TRANSFER_NOT_FOUND",
            message:
              "The ownership transfer invite was not found."
          }
        );
      }

      const object = await repository
        .findByIdentifier(transfer.objectId);

      if (!object) {
        return error(
          404,
          {
            code: "OBJECT_NOT_FOUND",
            message:
              "The object for this ownership transfer was not found."
          }
        );
      }

      return json({
        data: {
          transfer:
            publicTransfer(transfer),
          object:
            toPublicObjectProfile(object)
        }
      });
    } catch (cause) {
      return ownershipFailure(cause);
    }
  }

  const eventIdentifier =
    eventRouteIdentifier(url.pathname);
  const ownershipIdentifier =
    ownershipRouteIdentifier(url.pathname);
  const assignmentIdentifier =
    ownershipAssignIdentifier(url.pathname);
  const ownershipTransferObjectIdentifier =
    ownershipTransferIdentifier(url.pathname);
  const cancelTransferId =
    transferCancelIdentifier(url.pathname);

  const requiresAdmin =
    url.pathname === "/v1/objects" ||
    url.pathname === "/v1/owners" ||
    Boolean(routeIdentifier(url.pathname)) ||
    Boolean(eventIdentifier) ||
    Boolean(ownershipIdentifier) ||
    Boolean(assignmentIdentifier) ||
    Boolean(ownershipTransferObjectIdentifier) ||
    Boolean(cancelTransferId);

  if (requiresAdmin) {
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
      const input = toCreateInput(
        await parseJson(request)
      );
      const object = buildNewObject(input);
      const created =
        await repository.create(object);

      return json({ data: created }, 201);
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
    const objects = await repository.list();

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

    const object = await repository
      .findByIdentifier(eventIdentifier);

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
        const input = toCreateEventInput(
          await parseJson(request)
        );
        const event = buildNewEvent(
          object.id,
          input
        );
        const created =
          await eventRepository.append(event);

        return json({ data: created }, 201);
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

  if (url.pathname === "/v1/owners") {
    if (!ownershipRepository) {
      return error(
        503,
        {
          code: "OWNERSHIP_STORE_NOT_CONFIGURED",
          message:
            "ORYBIT Ownership is not configured."
        }
      );
    }

    if (request.method === "GET") {
      const owners =
        await ownershipRepository.listOwners();

      return json({
        data: owners,
        count: owners.length
      });
    }

    if (request.method === "POST") {
      try {
        const input = toOwnerInput(
          await parseJson(request)
        );
        const owner = buildOwner(input);
        const created =
          await ownershipRepository
            .createOwner(owner);

        return json({ data: created }, 201);
      } catch (cause) {
        return ownershipFailure(cause);
      }
    }
  }

  if (
    ownershipIdentifier &&
    request.method === "GET"
  ) {
    if (!ownershipRepository) {
      return error(
        503,
        {
          code: "OWNERSHIP_STORE_NOT_CONFIGURED",
          message:
            "ORYBIT Ownership is not configured."
        }
      );
    }

    const object = await repository
      .findByIdentifier(ownershipIdentifier);

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
      data: await ownershipRepository
        .getSnapshot(object.id)
    });
  }

  if (
    assignmentIdentifier &&
    request.method === "POST"
  ) {
    if (!ownershipRepository) {
      return error(
        503,
        {
          code: "OWNERSHIP_STORE_NOT_CONFIGURED",
          message:
            "ORYBIT Ownership is not configured."
        }
      );
    }

    const object = await repository
      .findByIdentifier(assignmentIdentifier);

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

    try {
      const input = toAssignOwnershipInput(
        await parseJson(request)
      );
      const startedAt = input.startedAt ??
        new Date().toISOString();

      if (!Number.isFinite(Date.parse(startedAt))) {
        throw new TypeError(
          "startedAt must be a valid date-time."
        );
      }

      const record = await ownershipRepository
        .assignInitial(
          object.id,
          input.ownerId.trim(),
          startedAt,
          input.note?.trim() || undefined
        );

      return json({ data: record }, 201);
    } catch (cause) {
      return ownershipFailure(cause);
    }
  }

  if (
    ownershipTransferObjectIdentifier &&
    request.method === "POST"
  ) {
    if (!ownershipRepository) {
      return error(
        503,
        {
          code: "OWNERSHIP_STORE_NOT_CONFIGURED",
          message:
            "ORYBIT Ownership is not configured."
        }
      );
    }

    const object = await repository
      .findByIdentifier(
        ownershipTransferObjectIdentifier
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

    try {
      const input = toTransferInput(
        await parseJson(request)
      );
      const secret = await createTransferSecret(
        ownershipRepository,
        object.id,
        input
      );

      return json({ data: secret }, 201);
    } catch (cause) {
      return ownershipFailure(cause);
    }
  }

  if (
    cancelTransferId &&
    request.method === "POST"
  ) {
    if (!ownershipRepository) {
      return error(
        503,
        {
          code: "OWNERSHIP_STORE_NOT_CONFIGURED",
          message:
            "ORYBIT Ownership is not configured."
        }
      );
    }

    try {
      const transfer = await ownershipRepository
        .cancelTransfer(
          cancelTransferId,
          new Date().toISOString()
        );

      return json({ data: transfer });
    } catch (cause) {
      return ownershipFailure(cause);
    }
  }

  const identifier =
    routeIdentifier(url.pathname);

  if (
    request.method === "GET" &&
    identifier
  ) {
    const object = await repository
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

    return json({ data: object });
  }

  if (
    request.method === "PATCH" &&
    identifier
  ) {
    const current = await repository
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
      const patch = toUpdateInput(
        await parseJson(request)
      );
      const updated = applyObjectPatch(
        current,
        patch
      );
      const saved = await repository.update(
        current.id,
        updated
      );

      return json({ data: saved });
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
