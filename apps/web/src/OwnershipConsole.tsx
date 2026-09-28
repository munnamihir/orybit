import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  OrybitApi
} from "./api";

import {
  ownershipAcceptanceUrl
} from "./ownership-link";

import {
  readSessionToken,
  SESSION_CHANGE_EVENT
} from "./session";

import type {
  OrybitObject,
  OrybitOwner,
  OwnershipSnapshot,
  OwnerType
} from "./types";

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short"
    }
  ).format(date);
}

function emptySnapshot(): OwnershipSnapshot {
  return {
    current: null,
    history: [],
    transfers: []
  };
}

export default function OwnershipConsole() {
  const [token, setToken] =
    useState(() => readSessionToken());
  const [open, setOpen] =
    useState(false);
  const [objects, setObjects] =
    useState<OrybitObject[]>([]);
  const [owners, setOwners] =
    useState<OrybitOwner[]>([]);
  const [selectedId, setSelectedId] =
    useState("");
  const [snapshot, setSnapshot] =
    useState<OwnershipSnapshot>(
      emptySnapshot()
    );
  const [loading, setLoading] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [ownerName, setOwnerName] =
    useState("");
  const [ownerType, setOwnerType] =
    useState<OwnerType>("person");
  const [ownerReference, setOwnerReference] =
    useState("");
  const [assignOwnerId, setAssignOwnerId] =
    useState("");
  const [assignNote, setAssignNote] =
    useState("");
  const [transferOwnerId, setTransferOwnerId] =
    useState("");
  const [transferNote, setTransferNote] =
    useState("");
  const [inviteUrl, setInviteUrl] =
    useState("");
  const [copied, setCopied] =
    useState(false);

  useEffect(() => {
    const sync = () => {
      const next = readSessionToken();
      setToken(next);

      if (!next) {
        setOpen(false);
        setObjects([]);
        setOwners([]);
        setSnapshot(emptySnapshot());
      }
    };

    window.addEventListener(
      SESSION_CHANGE_EVENT,
      sync
    );

    return () => {
      window.removeEventListener(
        SESSION_CHANGE_EVENT,
        sync
      );
    };
  }, []);

  const selected = useMemo(
    () => objects.find(
      (object) => object.id === selectedId
    ) ?? null,
    [objects, selectedId]
  );

  async function loadBase() {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const api = new OrybitApi(token);
      const [nextObjects, nextOwners] =
        await Promise.all([
          api.listObjects(),
          api.listOwners()
        ]);

      setObjects(nextObjects);
      setOwners(nextOwners);
      setSelectedId((current) =>
        current && nextObjects.some(
          (object) => object.id === current
        )
          ? current
          : nextObjects[0]?.id ?? ""
      );
      setAssignOwnerId((current) =>
        current && nextOwners.some(
          (owner) => owner.id === current
        )
          ? current
          : nextOwners[0]?.id ?? ""
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load ownership data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSnapshot(
    identifier: string
  ) {
    if (!token || !identifier) {
      setSnapshot(emptySnapshot());
      return;
    }

    setLoading(true);
    setError("");

    try {
      const next = await new OrybitApi(token)
        .getOwnership(identifier);

      setSnapshot(next);
      setTransferOwnerId((current) => {
        const candidates = owners.filter(
          (owner) =>
            owner.id !== next.current?.owner.id
        );

        return current && candidates.some(
          (owner) => owner.id === current
        )
          ? current
          : candidates[0]?.id ?? "";
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load ownership history."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && token) {
      void loadBase();
    }
  }, [open, token]);

  useEffect(() => {
    if (open && selected) {
      void loadSnapshot(selected.publicId);
      setInviteUrl("");
    }
  }, [open, selectedId, owners.length]);

  async function createOwner() {
    if (!token || !ownerName.trim()) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const created = await new OrybitApi(token)
        .createOwner({
          displayName: ownerName.trim(),
          type: ownerType,
          ...(ownerReference.trim()
            ? {
                reference:
                  ownerReference.trim()
              }
            : {})
        });

      setOwnerName("");
      setOwnerReference("");
      await loadBase();
      setAssignOwnerId(created.id);
      setTransferOwnerId(created.id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to create owner."
      );
    } finally {
      setSaving(false);
    }
  }

  async function assignOwner() {
    if (
      !token ||
      !selected ||
      !assignOwnerId
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await new OrybitApi(token)
        .assignOwnership(
          selected.publicId,
          {
            ownerId: assignOwnerId,
            ...(assignNote.trim()
              ? { note: assignNote.trim() }
              : {})
          }
        );

      setAssignNote("");
      await loadSnapshot(selected.publicId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to assign owner."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createTransfer() {
    if (
      !token ||
      !selected ||
      !transferOwnerId
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setInviteUrl("");

    try {
      const secret = await new OrybitApi(token)
        .createOwnershipTransfer(
          selected.publicId,
          {
            toOwnerId: transferOwnerId,
            ...(transferNote.trim()
              ? { note: transferNote.trim() }
              : {})
          }
        );

      setInviteUrl(
        ownershipAcceptanceUrl(
          window.location.origin,
          secret.acceptanceToken
        )
      );
      setTransferNote("");
      await loadSnapshot(selected.publicId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to create transfer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function cancelTransfer(
    transferId: string
  ) {
    if (!token || !selected) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await new OrybitApi(token)
        .cancelOwnershipTransfer(
          transferId
        );
      setInviteUrl("");
      await loadSnapshot(selected.publicId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to cancel transfer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyInvite() {
    if (!inviteUrl) {
      return;
    }

    await navigator.clipboard.writeText(
      inviteUrl
    );
    setCopied(true);
    window.setTimeout(
      () => setCopied(false),
      1600
    );
  }

  if (!token) {
    return null;
  }

  const transferCandidates = owners.filter(
    (owner) =>
      owner.id !== snapshot.current?.owner.id
  );

  const pendingTransfer =
    snapshot.transfers.find(
      (transfer) =>
        transfer.status === "pending"
    );

  return (
    <>
      <button
        className="ownership-launcher"
        type="button"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">◇</span>
        Ownership
      </button>

      {open && (
        <div
          className="ownership-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setOpen(false);
            }
          }}
        >
          <section
            className="ownership-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ownership-title"
          >
            <div className="ownership-header">
              <div>
                <p className="ownership-eyebrow">
                  ORYBIT OWNERSHIP
                </p>
                <h2 id="ownership-title">
                  Who controls this object?
                </h2>
              </div>

              <button
                className="ownership-close"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close ownership console"
              >
                ×
              </button>
            </div>

            <p className="ownership-intro">
              Object identity stays permanent while ownership
              can change over time. Transfers use a secret
              capability link and preserve the full history.
            </p>

            {error && (
              <div
                className="ownership-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {objects.length > 0 && (
              <div className="ownership-toolbar">
                <label className="ownership-field grow">
                  <span>Physical object</span>
                  <select
                    value={selectedId}
                    onChange={(event) =>
                      setSelectedId(event.target.value)
                    }
                  >
                    {objects.map((object) => (
                      <option
                        key={object.id}
                        value={object.id}
                      >
                        {object.identity.name} · {object.publicId}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="ownership-secondary"
                  type="button"
                  onClick={() => {
                    if (selected) {
                      void loadSnapshot(
                        selected.publicId
                      );
                    }
                  }}
                  disabled={loading}
                >
                  Refresh
                </button>
              </div>
            )}

            <div className="ownership-grid">
              <section className="ownership-card">
                <p className="ownership-card-label">
                  Owner registry
                </p>

                <label className="ownership-field">
                  <span>Display name</span>
                  <input
                    value={ownerName}
                    onChange={(event) =>
                      setOwnerName(event.target.value)
                    }
                    placeholder="Person or organization"
                  />
                </label>

                <label className="ownership-field">
                  <span>Owner type</span>
                  <select
                    value={ownerType}
                    onChange={(event) =>
                      setOwnerType(
                        event.target.value as OwnerType
                      )
                    }
                  >
                    <option value="person">
                      Person
                    </option>
                    <option value="organization">
                      Organization
                    </option>
                  </select>
                </label>

                <label className="ownership-field">
                  <span>Private reference</span>
                  <input
                    value={ownerReference}
                    onChange={(event) =>
                      setOwnerReference(
                        event.target.value
                      )
                    }
                    placeholder="Optional internal label"
                  />
                </label>

                <button
                  className="ownership-primary"
                  type="button"
                  disabled={
                    saving ||
                    !ownerName.trim()
                  }
                  onClick={createOwner}
                >
                  Add owner
                </button>

                <div className="owner-list">
                  {owners.map((owner) => (
                    <div
                      key={owner.id}
                      className="owner-row"
                    >
                      <div>
                        <strong>
                          {owner.displayName}
                        </strong>
                        <span>
                          {owner.type}
                        </span>
                      </div>
                      <code>
                        {owner.id.slice(0, 18)}…
                      </code>
                    </div>
                  ))}
                </div>
              </section>

              <section className="ownership-card ownership-main-card">
                <div className="ownership-current">
                  <p className="ownership-card-label">
                    Current owner
                  </p>

                  {snapshot.current ? (
                    <>
                      <strong>
                        {snapshot.current.owner.displayName}
                      </strong>
                      <span>
                        Since {formatDateTime(
                          snapshot.current.startedAt
                        )}
                      </span>
                    </>
                  ) : (
                    <span>
                      No owner assigned yet.
                    </span>
                  )}
                </div>

                {!snapshot.current && owners.length > 0 && selected && (
                  <div className="ownership-action-block">
                    <h3>Assign first owner</h3>
                    <label className="ownership-field">
                      <span>Owner</span>
                      <select
                        value={assignOwnerId}
                        onChange={(event) =>
                          setAssignOwnerId(
                            event.target.value
                          )
                        }
                      >
                        {owners.map((owner) => (
                          <option
                            key={owner.id}
                            value={owner.id}
                          >
                            {owner.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="ownership-field">
                      <span>Note</span>
                      <textarea
                        rows={2}
                        value={assignNote}
                        onChange={(event) =>
                          setAssignNote(
                            event.target.value
                          )
                        }
                        placeholder="Optional assignment context"
                      />
                    </label>
                    <button
                      className="ownership-primary"
                      type="button"
                      disabled={
                        saving ||
                        !assignOwnerId
                      }
                      onClick={assignOwner}
                    >
                      Assign owner
                    </button>
                  </div>
                )}

                {snapshot.current && selected && (
                  <div className="ownership-action-block">
                    <h3>Transfer ownership</h3>

                    {pendingTransfer ? (
                      <div className="pending-transfer">
                        <strong>
                          Pending → {pendingTransfer.toOwner.displayName}
                        </strong>
                        <span>
                          Expires {formatDateTime(
                            pendingTransfer.expiresAt
                          )}
                        </span>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            cancelTransfer(
                              pendingTransfer.id
                            )
                          }
                        >
                          Cancel transfer
                        </button>
                      </div>
                    ) : transferCandidates.length > 0 ? (
                      <>
                        <label className="ownership-field">
                          <span>New owner</span>
                          <select
                            value={transferOwnerId}
                            onChange={(event) =>
                              setTransferOwnerId(
                                event.target.value
                              )
                            }
                          >
                            {transferCandidates.map(
                              (owner) => (
                                <option
                                  key={owner.id}
                                  value={owner.id}
                                >
                                  {owner.displayName}
                                </option>
                              )
                            )}
                          </select>
                        </label>

                        <label className="ownership-field">
                          <span>Transfer note</span>
                          <textarea
                            rows={2}
                            value={transferNote}
                            onChange={(event) =>
                              setTransferNote(
                                event.target.value
                              )
                            }
                            placeholder="Optional handoff context"
                          />
                        </label>

                        <button
                          className="ownership-primary"
                          type="button"
                          disabled={
                            saving ||
                            !transferOwnerId
                          }
                          onClick={createTransfer}
                        >
                          Create transfer invite
                        </button>
                      </>
                    ) : (
                      <p className="ownership-muted">
                        Add another owner before creating a transfer.
                      </p>
                    )}

                    {inviteUrl && (
                      <div className="ownership-invite">
                        <strong>
                          One-time transfer invite
                        </strong>
                        <p>{inviteUrl}</p>
                        <div>
                          <button
                            type="button"
                            onClick={copyInvite}
                          >
                            {copied
                              ? "Copied"
                              : "Copy invite"}
                          </button>
                          <a
                            href={inviteUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open invite
                          </a>
                        </div>
                        <small>
                          The raw secret is returned only when
                          the transfer is created. ORYBIT stores
                          only its SHA-256 hash.
                        </small>
                      </div>
                    )}
                  </div>
                )}

                <div className="ownership-history">
                  <div className="ownership-history-heading">
                    <h3>Ownership history</h3>
                    <span>
                      {snapshot.history.length} records
                    </span>
                  </div>

                  {snapshot.history.length === 0 ? (
                    <p className="ownership-muted">
                      No ownership history yet.
                    </p>
                  ) : (
                    snapshot.history.map((record) => (
                      <article
                        key={record.id}
                        className="ownership-history-row"
                      >
                        <div className="ownership-history-dot" />
                        <div>
                          <strong>
                            {record.owner.displayName}
                          </strong>
                          <span>
                            {formatDateTime(record.startedAt)}
                            {record.endedAt
                              ? ` → ${formatDateTime(record.endedAt)}`
                              : " → current"}
                          </span>
                          <small>
                            Source: {record.source}
                            {record.note
                              ? ` · ${record.note}`
                              : ""}
                          </small>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>

            {!loading && objects.length === 0 && (
              <p className="ownership-muted">
                Register an ORYBIT object first.
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
