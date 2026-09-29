import type {
  CapabilityAccess,
  CapabilityOperation,
  EventActor,
  LifecycleStatus,
  ObjectCarrier,
  ObjectIdentity,
  OrybitCapability,
  OrybitEvent,
  OrybitObject
} from "@orybit/protocol";

export type {
  CapabilityAccess,
  CapabilityOperation,
  LifecycleStatus,
  OrybitCapability,
  OrybitEvent,
  OrybitObject
};

export interface HealthResponse {
  status: "ok";
  service: string;
  protocolVersion: string;
}

export interface CreateObjectInput {
  publicId?: string;
  kind: string;
  identity: ObjectIdentity;
  carriers?: ObjectCarrier[];
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateObjectInput {
  kind?: string;
  identity?: Partial<ObjectIdentity>;
  lifecycle?: {
    status?: LifecycleStatus;
  };
  carriers?: ObjectCarrier[];
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateEventInput {
  type: string;
  occurredAt?: string;
  actor?: EventActor;
  data?: Record<string, unknown>;
}

export interface CapabilityDefinitionInput {
  name: string;
  title: string;
  description: string;
  access: CapabilityAccess;
  requiresApproval?: boolean;
  category?: string;
  operation?: CapabilityOperation;
}

export interface ResolvedObjectCapability {
  name: string;
  enabled: true;
  status: "defined" | "unresolved";
  definition?: OrybitCapability;
}

export type OwnerType =
  | "person"
  | "organization";

export interface OrybitOwner {
  id: string;
  displayName: string;
  type: OwnerType;
  reference?: string;
  createdAt: string;
}

export interface CreateOwnerInput {
  displayName: string;
  type?: OwnerType;
  reference?: string;
}

export interface OwnershipRecord {
  id: string;
  objectId: string;
  owner: OrybitOwner;
  startedAt: string;
  endedAt?: string;
  source: "assigned" | "transfer";
  note?: string;
}

export type OwnershipTransferStatus =
  | "pending"
  | "accepted"
  | "cancelled"
  | "expired";

export interface OwnershipTransfer {
  id: string;
  objectId: string;
  fromOwner: OrybitOwner;
  toOwner: OrybitOwner;
  status: OwnershipTransferStatus;
  requestedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  cancelledAt?: string;
  note?: string;
}

export interface OwnershipSnapshot {
  current: OwnershipRecord | null;
  history: OwnershipRecord[];
  transfers: OwnershipTransfer[];
}

export interface AssignOwnershipInput {
  ownerId: string;
  startedAt?: string;
  note?: string;
}

export interface CreateOwnershipTransferInput {
  toOwnerId: string;
  expiresAt?: string;
  note?: string;
}

export interface OwnershipTransferSecret {
  transfer: OwnershipTransfer;
  acceptanceToken: string;
}

export interface PublicTransferParty {
  displayName: string;
  type: OwnerType;
}

export interface PublicOwnershipTransfer {
  id: string;
  status: OwnershipTransferStatus;
  requestedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  fromOwner: PublicTransferParty;
  toOwner: PublicTransferParty;
  note?: string;
}

export interface PublicObjectProfile {
  protocolVersion: string;
  publicId: string;
  kind: string;
  identity: {
    name: string;
    manufacturer?: string;
    model?: string;
    description?: string;
  };
  lifecycle: {
    status: LifecycleStatus;
    updatedAt: string;
  };
  capabilities: string[];
}

export interface PublicTransferPreview {
  transfer: PublicOwnershipTransfer;
  object: PublicObjectProfile;
}

export interface DashboardSummary {
  total: number;
  active: number;
  attention: number;
  capabilities: number;
}
