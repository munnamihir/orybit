import type {
  OrybitProtocolVersion
} from "./protocol-version.js";

export type CarrierType =
  | "qr"
  | "nfc"
  | "barcode"
  | "ble"
  | "other";

export type LifecycleStatus =
  | "active"
  | "inactive"
  | "lost"
  | "retired";

export interface ObjectIdentity {
  name: string;
  manufacturer?: string;
  model?: string;
  serial?: string;
  description?: string;
}

export interface ObjectLifecycle {
  status: LifecycleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectCarrier {
  type: CarrierType;
  uri: string;
  value?: string;
}

export interface OrybitObject {
  protocolVersion: OrybitProtocolVersion;
  id: string;
  publicId: string;
  kind: string;
  identity: ObjectIdentity;
  lifecycle: ObjectLifecycle;
  carriers: ObjectCarrier[];
  capabilities: string[];
  metadata?: Record<string, unknown>;
}

export type ActorType =
  | "system"
  | "user"
  | "manufacturer"
  | "service-provider"
  | "device";

export interface EventActor {
  type: ActorType;
  id?: string;
}

export interface OrybitEvent {
  protocolVersion: OrybitProtocolVersion;
  id: string;
  objectId: string;
  type: string;
  occurredAt: string;
  actor: EventActor;
  data: Record<string, unknown>;
}

export type CapabilityAccess =
  | "public"
  | "owner"
  | "authorized";

export interface OrybitCapability {
  protocolVersion: OrybitProtocolVersion;
  name: string;
  title: string;
  description: string;
  access: CapabilityAccess;
  requiresApproval?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
