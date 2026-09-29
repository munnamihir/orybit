import type {
  CapabilityAccess,
  CapabilityOperation,
  OrybitCapability
} from "@orybit/protocol";

export interface CapabilityDefinitionInput {
  name: string;
  title: string;
  description: string;
  access: CapabilityAccess;
  requiresApproval?: boolean;
  category?: string;
  operation?: CapabilityOperation;
}

export type CapabilityResolutionStatus =
  | "defined"
  | "unresolved";

export interface ResolvedObjectCapability {
  name: string;
  enabled: true;
  status: CapabilityResolutionStatus;
  definition?: OrybitCapability;
}

export interface CapabilityRepository {
  create(
    capability: OrybitCapability
  ): Promise<OrybitCapability>;
  list(): Promise<OrybitCapability[]>;
  find(
    name: string
  ): Promise<OrybitCapability | null>;
  update(
    name: string,
    capability: OrybitCapability
  ): Promise<OrybitCapability | null>;
}
