import type {
  LifecycleStatus,
  ObjectCarrier,
  ObjectIdentity,
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
}

export interface RequestRuntimeOptions {
  adminToken?: string;
}

export interface Env {
  DB: D1DatabaseLike;
  ORYBIT_ADMIN_TOKEN?: string;
}
