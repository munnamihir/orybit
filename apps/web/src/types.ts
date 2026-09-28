import type {
  EventActor,
  LifecycleStatus,
  ObjectCarrier,
  ObjectIdentity,
  OrybitEvent,
  OrybitObject
} from "@orybit/protocol";

export type {
  LifecycleStatus,
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

export interface DashboardSummary {
  total: number;
  active: number;
  attention: number;
  capabilities: number;
}
