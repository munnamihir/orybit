import {
  ORYBIT_PROTOCOL_VERSION,
  assertOrybitManifest
} from "@orybit/protocol";

import type {
  OrybitManifest,
  OrybitManifestCapability,
  OrybitObject
} from "@orybit/protocol";

import {
  resolveObjectCapabilities
} from "./capability-service.js";

import type {
  CapabilityRepository
} from "./capability-types.js";

const MANIFEST_SCHEMA_URL =
  "https://orybit.dev/specs/v0.1/manifest.schema.json";

function absoluteUrl(
  origin: string,
  pathname: string
): string {
  return new URL(pathname, origin).toString();
}

export async function buildPublicObjectManifest(
  object: OrybitObject,
  capabilities: CapabilityRepository,
  origin: string
): Promise<OrybitManifest> {
  const resolved =
    await resolveObjectCapabilities(
      object,
      capabilities
    );

  const publicCapabilities = resolved
    .flatMap<OrybitManifestCapability>(
      (item) => {
        if (
          !item.definition ||
          item.definition.access !== "public"
        ) {
          return [];
        }

        return [
          {
            ...item.definition,
            access: "public"
          }
        ];
      }
    )
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    );

  const encodedId =
    encodeURIComponent(object.publicId);

  const manifest: OrybitManifest = {
    manifestVersion: "0.1",
    protocolVersion:
      ORYBIT_PROTOCOL_VERSION,
    object: {
      publicId: object.publicId,
      kind: object.kind,
      identity: {
        name: object.identity.name,
        ...(object.identity.manufacturer
          ? {
              manufacturer:
                object.identity.manufacturer
            }
          : {}),
        ...(object.identity.model
          ? {
              model:
                object.identity.model
            }
          : {}),
        ...(object.identity.description
          ? {
              description:
                object.identity.description
            }
          : {})
      },
      lifecycle: {
        status: object.lifecycle.status,
        updatedAt: object.lifecycle.updatedAt
      }
    },
    capabilities: publicCapabilities,
    links: {
      self: absoluteUrl(
        origin,
        `/manifest/${encodedId}`
      ),
      profile: absoluteUrl(
        origin,
        `/o/${encodedId}`
      ),
      publicApi: absoluteUrl(
        origin,
        `/public/objects/${encodedId}`
      ),
      schema: MANIFEST_SCHEMA_URL
    }
  };

  assertOrybitManifest(manifest);

  return manifest;
}

export {
  MANIFEST_SCHEMA_URL
};
