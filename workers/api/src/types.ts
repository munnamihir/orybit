import type {
  EventActor,
  LifecycleStatus,
  ObjectCarrier,
  ObjectIdentity,
  OrybitEvent,
  OrybitObject
} from "@orybit/protocol";

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

export type OwnershipSource =
  | "assigned"
  | "transfer";

export interface OwnershipRecord {
  id: string;
  objectId: string;
  owner: OrybitOwner;
  startedAt: string;
  endedAt?: string;
  source: OwnershipSource;
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

export interface ObjectRepository {
  create(object: OrybitObject): Promise<OrybitObject>;
  list(): Promise<OrybitObject[]>;
  findByIdentifier(
    identifier: string
  ): Promise<OrybitObject | null>;
  update(
    id: string,
    object: OrybitObject
  ): Promise<OrybitObject | null>;
}

export interface EventRepository {
  append(event: OrybitEvent): Promise<OrybitEvent>;
  listForObject(
    objectId: string
  ): Promise<OrybitEvent[]>;
}

export interface OwnershipRepository {
  createOwner(
    owner: OrybitOwner
  ): Promise<OrybitOwner>;
  listOwners(): Promise<OrybitOwner[]>;
  getSnapshot(
    objectId: string,
    now?: string
  ): Promise<OwnershipSnapshot>;
  assignInitial(
    objectId: string,
    ownerId: string,
    startedAt: string,
    note?: string
  ): Promise<OwnershipRecord>;
  createTransfer(
    objectId: string,
    toOwnerId: string,
    tokenHash: string,
    requestedAt: string,
    expiresAt: string,
    note?: string
  ): Promise<OwnershipTransfer>;
  resolveTransfer(
    tokenHash: string,
    now?: string
  ): Promise<OwnershipTransfer | null>;
  acceptTransfer(
    tokenHash: string,
    acceptedAt: string
  ): Promise<OwnershipTransfer>;
  cancelTransfer(
    transferId: string,
    cancelledAt: string
  ): Promise<OwnershipTransfer>;
}

export interface D1ResultLike<T = unknown> {
  success: boolean;
  results?: T[];
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1ResultLike<T>>;
  run(): Promise<D1ResultLike>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch(
    statements: D1PreparedStatementLike[]
  ): Promise<D1ResultLike[]>;
}

export interface RequestRuntimeOptions {
  adminToken?: string;
}

export interface Env {
  DB: D1DatabaseLike;
  ORYBIT_ADMIN_TOKEN?: string;
}
