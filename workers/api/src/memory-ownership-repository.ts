import {
  generateOwnershipId,
  generateTransferId
} from "./ownership-ids.js";

import type {
  OrybitOwner,
  OwnershipRecord,
  OwnershipRepository,
  OwnershipSnapshot,
  OwnershipTransfer
} from "./types.js";

interface StoredTransfer {
  transfer: OwnershipTransfer;
  tokenHash: string;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryOwnershipRepository
implements OwnershipRepository {
  private readonly owners =
    new Map<string, OrybitOwner>();

  private readonly records =
    new Map<string, OwnershipRecord>();

  private readonly transfers =
    new Map<string, StoredTransfer>();

  async createOwner(
    owner: OrybitOwner
  ): Promise<OrybitOwner> {
    this.owners.set(owner.id, clone(owner));
    return clone(owner);
  }

  async listOwners(): Promise<OrybitOwner[]> {
    return [...this.owners.values()]
      .sort((a, b) =>
        a.displayName.localeCompare(
          b.displayName
        )
      )
      .map(clone);
  }

  async getSnapshot(
    objectId: string,
    now = new Date().toISOString()
  ): Promise<OwnershipSnapshot> {
    await this.expireTransfers(objectId, now);

    const history = [...this.records.values()]
      .filter((record) =>
        record.objectId === objectId
      )
      .sort((a, b) =>
        b.startedAt.localeCompare(
          a.startedAt
        )
      )
      .map(clone);

    const transfers = [...this.transfers.values()]
      .map((value) => value.transfer)
      .filter((transfer) =>
        transfer.objectId === objectId
      )
      .sort((a, b) =>
        b.requestedAt.localeCompare(
          a.requestedAt
        )
      )
      .map(clone);

    return {
      current:
        history.find(
          (record) => !record.endedAt
        ) ?? null,
      history,
      transfers
    };
  }

  async assignInitial(
    objectId: string,
    ownerId: string,
    startedAt: string,
    note?: string
  ): Promise<OwnershipRecord> {
    const owner = this.owners.get(ownerId);

    if (!owner) {
      throw new Error("OWNER_NOT_FOUND");
    }

    const current = [...this.records.values()]
      .find((record) =>
        record.objectId === objectId &&
        !record.endedAt
      );

    if (current) {
      throw new Error("OBJECT_ALREADY_OWNED");
    }

    const record: OwnershipRecord = {
      id: generateOwnershipId(),
      objectId,
      owner: clone(owner),
      startedAt,
      source: "assigned",
      ...(note ? { note } : {})
    };

    this.records.set(record.id, clone(record));

    return clone(record);
  }

  async createTransfer(
    objectId: string,
    toOwnerId: string,
    tokenHash: string,
    requestedAt: string,
    expiresAt: string,
    note?: string
  ): Promise<OwnershipTransfer> {
    await this.expireTransfers(
      objectId,
      requestedAt
    );

    const current = [...this.records.values()]
      .find((record) =>
        record.objectId === objectId &&
        !record.endedAt
      );

    if (!current) {
      throw new Error("OBJECT_HAS_NO_OWNER");
    }

    const toOwner = this.owners.get(toOwnerId);

    if (!toOwner) {
      throw new Error("OWNER_NOT_FOUND");
    }

    if (current.owner.id === toOwnerId) {
      throw new Error("TRANSFER_TO_CURRENT_OWNER");
    }

    const pending = [...this.transfers.values()]
      .some(({ transfer }) =>
        transfer.objectId === objectId &&
        transfer.status === "pending"
      );

    if (pending) {
      throw new Error("PENDING_TRANSFER_EXISTS");
    }

    const transfer: OwnershipTransfer = {
      id: generateTransferId(),
      objectId,
      fromOwner: clone(current.owner),
      toOwner: clone(toOwner),
      status: "pending",
      requestedAt,
      expiresAt,
      ...(note ? { note } : {})
    };

    this.transfers.set(
      transfer.id,
      {
        transfer: clone(transfer),
        tokenHash
      }
    );

    return clone(transfer);
  }

  async resolveTransfer(
    tokenHash: string,
    now = new Date().toISOString()
  ): Promise<OwnershipTransfer | null> {
    const stored = [...this.transfers.values()]
      .find((value) =>
        value.tokenHash === tokenHash
      );

    if (!stored) {
      return null;
    }

    if (
      stored.transfer.status === "pending" &&
      stored.transfer.expiresAt <= now
    ) {
      stored.transfer.status = "expired";
    }

    return clone(stored.transfer);
  }

  async acceptTransfer(
    tokenHash: string,
    acceptedAt: string
  ): Promise<OwnershipTransfer> {
    const stored = [...this.transfers.values()]
      .find((value) =>
        value.tokenHash === tokenHash
      );

    if (!stored) {
      throw new Error("TRANSFER_NOT_FOUND");
    }

    if (
      stored.transfer.status === "pending" &&
      stored.transfer.expiresAt <= acceptedAt
    ) {
      stored.transfer.status = "expired";
    }

    if (stored.transfer.status !== "pending") {
      throw new Error("TRANSFER_NOT_PENDING");
    }

    const current = [...this.records.values()]
      .find((record) =>
        record.objectId === stored.transfer.objectId &&
        !record.endedAt
      );

    if (
      !current ||
      current.owner.id !==
        stored.transfer.fromOwner.id
    ) {
      throw new Error("OWNERSHIP_CHANGED");
    }

    current.endedAt = acceptedAt;

    const next: OwnershipRecord = {
      id: generateOwnershipId(),
      objectId: stored.transfer.objectId,
      owner: clone(stored.transfer.toOwner),
      startedAt: acceptedAt,
      source: "transfer",
      ...(stored.transfer.note
        ? { note: stored.transfer.note }
        : {})
    };

    this.records.set(next.id, next);

    stored.transfer.status = "accepted";
    stored.transfer.acceptedAt = acceptedAt;

    return clone(stored.transfer);
  }

  async cancelTransfer(
    transferId: string,
    cancelledAt: string
  ): Promise<OwnershipTransfer> {
    const stored =
      this.transfers.get(transferId);

    if (!stored) {
      throw new Error("TRANSFER_NOT_FOUND");
    }

    if (stored.transfer.status !== "pending") {
      throw new Error("TRANSFER_NOT_PENDING");
    }

    stored.transfer.status = "cancelled";
    stored.transfer.cancelledAt = cancelledAt;

    return clone(stored.transfer);
  }

  private async expireTransfers(
    objectId: string,
    now: string
  ): Promise<void> {
    for (const stored of this.transfers.values()) {
      if (
        stored.transfer.objectId === objectId &&
        stored.transfer.status === "pending" &&
        stored.transfer.expiresAt <= now
      ) {
        stored.transfer.status = "expired";
      }
    }
  }
}
