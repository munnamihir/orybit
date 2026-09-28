import type {
  OrybitObject
} from "@orybit/protocol";

export interface PublicObjectProfile {
  protocolVersion: "0.1";
  publicId: string;
  kind: string;
  identity: {
    name: string;
    manufacturer?: string;
    model?: string;
    description?: string;
  };
  lifecycle: {
    status: OrybitObject["lifecycle"]["status"];
    updatedAt: string;
  };
  capabilities: string[];
}

export function toPublicObjectProfile(
  object: OrybitObject
): PublicObjectProfile {
  return {
    protocolVersion: object.protocolVersion,
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
            model: object.identity.model
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
    },
    capabilities: [...object.capabilities]
  };
}
