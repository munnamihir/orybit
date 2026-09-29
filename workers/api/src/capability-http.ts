import type {
  CapabilityDefinitionInput,
  CapabilityRepository
} from "./capability-types.js";

import {
  buildCapabilityDefinition,
  resolveObjectCapabilities,
  setObjectCapability
} from "./capability-service.js";

import type {
  ObjectRepository,
  RequestRuntimeOptions
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
  return json({ error: value }, status);
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

  if (
    request.headers.get("authorization") !==
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

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
}

async function parseJson(
  request: Request
): Promise<unknown> {
  const contentType =
    request.headers.get("content-type") ?? "";

  if (
    !contentType.toLowerCase()
      .includes("application/json")
  ) {
    throw new TypeError(
      "Content-Type must be application/json."
    );
  }

  return request.json();
}

function toDefinitionInput(
  value: unknown,
  currentName?: string
): CapabilityDefinitionInput {
  if (!isRecord(value)) {
    throw new TypeError(
      "Request body must be a JSON object."
    );
  }

  const name = currentName ?? value.name;

  if (
    typeof name !== "string" ||
    name.trim().length === 0
  ) {
    throw new TypeError(
      "name is required."
    );
  }

  if (
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    typeof value.access !== "string"
  ) {
    throw new TypeError(
      "title, description, and access are required."
    );
  }

  return {
    name,
    title: value.title,
    description: value.description,
    access:
      value.access as CapabilityDefinitionInput["access"],
    ...(typeof value.requiresApproval === "boolean"
      ? { requiresApproval: value.requiresApproval }
      : {}),
    ...(typeof value.category === "string"
      ? { category: value.category }
      : {}),
    ...(typeof value.operation === "string"
      ? {
          operation:
            value.operation as CapabilityDefinitionInput["operation"]
        }
      : {})
  };
}

function definitionIdentifier(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/v1\/capabilities\/([^/]+)$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function objectCapabilityCollection(
  pathname: string
): string | null {
  const match = pathname.match(
    /^\/v1\/objects\/([^/]+)\/capabilities$/
  );

  return match
    ? decodeURIComponent(match[1])
    : null;
}

function objectCapabilityItem(
  pathname: string
): { objectId: string; name: string } | null {
  const match = pathname.match(
    /^\/v1\/objects\/([^/]+)\/capabilities\/([^/]+)$/
  );

  return match
    ? {
        objectId:
          decodeURIComponent(match[1]),
        name:
          decodeURIComponent(match[2])
      }
    : null;
}

function capabilityFailure(
  cause: unknown
): Response {
  const message =
    cause instanceof Error
      ? cause.message
      : "Capability operation failed.";

  const known: Record<
    string,
    { status: number; message: string }
  > = {
    CAPABILITY_ALREADY_EXISTS: {
      status: 409,
      message:
        "A capability definition with this name already exists."
    },
    CAPABILITY_NOT_DEFINED: {
      status: 404,
      message:
        "The capability definition was not found."
    },
    CAPABILITY_NAME_IMMUTABLE: {
      status: 409,
      message:
        "Capability names cannot be changed in place."
    },
    OBJECT_NOT_FOUND: {
      status: 404,
      message:
        "The requested ORYBIT object was not found."
    }
  };

  const definition = known[message];

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
      code: "INVALID_CAPABILITY_OPERATION",
      message:
        "The capability operation is invalid.",
      details: [message]
    }
  );
}

export async function handleCapabilityRequest(
  request: Request,
  objects: ObjectRepository,
  capabilities: CapabilityRepository,
  options: RequestRuntimeOptions = {}
): Promise<Response | null> {
  const url = new URL(request.url);
  const definitionName =
    definitionIdentifier(url.pathname);
  const objectIdentifier =
    objectCapabilityCollection(url.pathname);
  const objectItem =
    objectCapabilityItem(url.pathname);

  const isCapabilityRoute =
    url.pathname === "/v1/capabilities" ||
    Boolean(definitionName) ||
    Boolean(objectIdentifier) ||
    Boolean(objectItem);

  if (!isCapabilityRoute) {
    return null;
  }

  const authFailure =
    requireAdmin(request, options);

  if (authFailure) {
    return authFailure;
  }

  try {
    if (
      request.method === "GET" &&
      url.pathname === "/v1/capabilities"
    ) {
      const definitions =
        await capabilities.list();

      return json({
        data: definitions,
        count: definitions.length
      });
    }

    if (
      request.method === "POST" &&
      url.pathname === "/v1/capabilities"
    ) {
      const definition =
        buildCapabilityDefinition(
          toDefinitionInput(
            await parseJson(request)
          )
        );

      const created =
        await capabilities.create(definition);

      return json({ data: created }, 201);
    }

    if (definitionName) {
      if (request.method === "GET") {
        const definition =
          await capabilities.find(definitionName);

        if (!definition) {
          throw new Error(
            "CAPABILITY_NOT_DEFINED"
          );
        }

        return json({ data: definition });
      }

      if (request.method === "PATCH") {
        const current =
          await capabilities.find(definitionName);

        if (!current) {
          throw new Error(
            "CAPABILITY_NOT_DEFINED"
          );
        }

        const value = await parseJson(request);

        if (!isRecord(value)) {
          throw new TypeError(
            "Request body must be a JSON object."
          );
        }

        const next = buildCapabilityDefinition({
          name: definitionName,
          title:
            typeof value.title === "string"
              ? value.title
              : current.title,
          description:
            typeof value.description === "string"
              ? value.description
              : current.description,
          access:
            typeof value.access === "string"
              ? value.access as CapabilityDefinitionInput["access"]
              : current.access,
          requiresApproval:
            typeof value.requiresApproval === "boolean"
              ? value.requiresApproval
              : current.requiresApproval,
          category:
            typeof value.category === "string"
              ? value.category
              : current.category,
          operation:
            typeof value.operation === "string"
              ? value.operation as CapabilityDefinitionInput["operation"]
              : current.operation
        });

        const updated =
          await capabilities.update(
            definitionName,
            next
          );

        return json({ data: updated });
      }
    }

    if (
      objectIdentifier &&
      request.method === "GET"
    ) {
      const object =
        await objects.findByIdentifier(
          objectIdentifier
        );

      if (!object) {
        throw new Error("OBJECT_NOT_FOUND");
      }

      const resolved =
        await resolveObjectCapabilities(
          object,
          capabilities
        );

      return json({
        data: resolved,
        count: resolved.length
      });
    }

    if (
      objectItem &&
      (
        request.method === "PUT" ||
        request.method === "DELETE"
      )
    ) {
      const object = await setObjectCapability(
        objects,
        capabilities,
        objectItem.objectId,
        objectItem.name,
        request.method === "PUT"
      );

      const resolved =
        await resolveObjectCapabilities(
          object,
          capabilities
        );

      return json({
        data: {
          object,
          capabilities: resolved
        }
      });
    }

    return error(
      405,
      {
        code: "METHOD_NOT_ALLOWED",
        message:
          "This capability route does not support that method."
      }
    );
  } catch (cause) {
    return capabilityFailure(cause);
  }
}
