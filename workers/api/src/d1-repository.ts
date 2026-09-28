import type {
  OrybitObject
} from "@orybit/protocol";

import type {
  D1DatabaseLike,
  ObjectRepository
} from "./types.js";

interface ObjectRow {
  id: string;
  public_id: string;
  protocol_version: string;
  kind: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serial: string | null;
  description: string | null;
  lifecycle_status: string;
  created_at: string;
  updated_at: string;
  carriers_json: string;
  capabilities_json: string;
  metadata_json: string;
}

function rowToObject(
  row: ObjectRow
): OrybitObject {
  return {
    protocolVersion: "0.1",
    id: row.id,
    publicId: row.public_id,
    kind: row.kind,
    identity: {
      name: row.name,
      ...(row.manufacturer
        ? { manufacturer: row.manufacturer }
        : {}),
      ...(row.model
        ? { model: row.model }
        : {}),
      ...(row.serial
        ? { serial: row.serial }
        : {}),
      ...(row.description
        ? { description: row.description }
        : {})
    },
    lifecycle: {
      status:
        row.lifecycle_status as
          OrybitObject["lifecycle"]["status"],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    },
    carriers:
      JSON.parse(row.carriers_json),
    capabilities:
      JSON.parse(row.capabilities_json),
    metadata:
      JSON.parse(row.metadata_json)
  };
}

const selectColumns = `
  id,
  public_id,
  protocol_version,
  kind,
  name,
  manufacturer,
  model,
  serial,
  description,
  lifecycle_status,
  created_at,
  updated_at,
  carriers_json,
  capabilities_json,
  metadata_json
`;

export class D1ObjectRepository
implements ObjectRepository {
  constructor(
    private readonly db: D1DatabaseLike
  ) {}

  async create(
    object: OrybitObject
  ): Promise<OrybitObject> {
    const query = `
      INSERT INTO objects (
        id,
        public_id,
        protocol_version,
        kind,
        name,
        manufacturer,
        model,
        serial,
        description,
        lifecycle_status,
        created_at,
        updated_at,
        carriers_json,
        capabilities_json,
        metadata_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await this.db
      .prepare(query)
      .bind(
        object.id,
        object.publicId,
        object.protocolVersion,
        object.kind,
        object.identity.name,
        object.identity.manufacturer ?? null,
        object.identity.model ?? null,
        object.identity.serial ?? null,
        object.identity.description ?? null,
        object.lifecycle.status,
        object.lifecycle.createdAt,
        object.lifecycle.updatedAt,
        JSON.stringify(object.carriers),
        JSON.stringify(object.capabilities),
        JSON.stringify(object.metadata ?? {})
      )
      .run();

    if (!result.success) {
      throw new Error(
        "OBJECT_CREATE_FAILED"
      );
    }

    return object;
  }

  async list(): Promise<OrybitObject[]> {
    const result = await this.db
      .prepare(`
        SELECT ${selectColumns}
        FROM objects
        ORDER BY created_at DESC
      `)
      .all<ObjectRow>();

    return (result.results ?? [])
      .map(rowToObject);
  }

  async findByIdentifier(
    identifier: string
  ): Promise<OrybitObject | null> {
    const row = await this.db
      .prepare(`
        SELECT ${selectColumns}
        FROM objects
        WHERE id = ? OR public_id = ?
        LIMIT 1
      `)
      .bind(identifier, identifier)
      .first<ObjectRow>();

    return row
      ? rowToObject(row)
      : null;
  }

  async update(
    id: string,
    object: OrybitObject
  ): Promise<OrybitObject | null> {
    const result = await this.db
      .prepare(`
        UPDATE objects
        SET
          kind = ?,
          name = ?,
          manufacturer = ?,
          model = ?,
          serial = ?,
          description = ?,
          lifecycle_status = ?,
          updated_at = ?,
          carriers_json = ?,
          capabilities_json = ?,
          metadata_json = ?
        WHERE id = ?
      `)
      .bind(
        object.kind,
        object.identity.name,
        object.identity.manufacturer ?? null,
        object.identity.model ?? null,
        object.identity.serial ?? null,
        object.identity.description ?? null,
        object.lifecycle.status,
        object.lifecycle.updatedAt,
        JSON.stringify(object.carriers),
        JSON.stringify(object.capabilities),
        JSON.stringify(object.metadata ?? {}),
        id
      )
      .run();

    if (!result.success) {
      throw new Error(
        "OBJECT_UPDATE_FAILED"
      );
    }

    return this.findByIdentifier(id);
  }
}
