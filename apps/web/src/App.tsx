import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import type {
  FormEvent
} from "react";

import {
  OrybitApi,
  OrybitApiError
} from "./api";

import {
  filterObjects,
  formatDateTime,
  parseCapabilities,
  summarizeObjects
} from "./domain";

import {
  clearSessionToken,
  readSessionToken,
  writeSessionToken
} from "./session";

import type {
  CreateObjectInput,
  LifecycleStatus,
  OrybitObject,
  UpdateObjectInput
} from "./types";

type ModalMode =
  | "create"
  | "edit"
  | null;

const statusOptions:
Array<"all" | LifecycleStatus> = [
  "all",
  "active",
  "inactive",
  "lost",
  "retired"
];

function statusLabel(
  value: LifecycleStatus
): string {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function errorMessage(
  error: unknown
): string {
  if (error instanceof OrybitApiError) {
    const detail =
      error.details.length > 0
        ? ` ${error.details.join(" ")}`
        : "";

    return `${error.message}${detail}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something unexpected happened.";
}

function AccessGate({
  onAuthorized
}: {
  onAuthorized: (
    token: string,
    objects: OrybitObject[]
  ) => void;
}) {
  const [token, setToken] =
    useState("");
  const [error, setError] =
    useState("");
  const [checking, setChecking] =
    useState(false);
  const [health, setHealth] =
    useState<
      "checking" | "online" | "offline"
    >("checking");

  useEffect(() => {
    const api =
      new OrybitApi("");

    api.health()
      .then(() =>
        setHealth("online")
      )
      .catch(() =>
        setHealth("offline")
      );
  }, []);

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    const trimmed =
      token.trim();

    if (!trimmed) {
      setError(
        "Enter the ORYBIT admin token."
      );
      return;
    }

    setChecking(true);
    setError("");

    try {
      const api =
        new OrybitApi(trimmed);

      const objects =
        await api.listObjects();

      writeSessionToken(trimmed);
      onAuthorized(
        trimmed,
        objects
      );
    } catch (cause) {
      setError(
        cause instanceof OrybitApiError &&
        cause.status === 401
          ? "That admin token was not accepted."
          : errorMessage(cause)
      );
    } finally {
      setChecking(false);
    }
  }

  return (
    <main className="access-shell">
      <section className="access-hero">
        <div className="brand-lockup">
          <div
            className="brand-orbit"
            aria-hidden="true"
          >
            <span />
          </div>
          <div>
            <p className="eyebrow">
              ORYBIT
            </p>
            <h1>
              Physical objects,
              now addressable.
            </h1>
          </div>
        </div>

        <p className="access-copy">
          Enter the private admin token
          to open the live Object Registry.
          The token is kept only for this
          browser session and is never
          written into ORYBIT source code.
        </p>

        <div className="access-proof">
          <div>
            <span className="proof-kicker">
              Runtime
            </span>
            <strong>
              Cloudflare Worker
            </strong>
          </div>
          <div>
            <span className="proof-kicker">
              Persistence
            </span>
            <strong>
              D1 Registry
            </strong>
          </div>
          <div>
            <span className="proof-kicker">
              Protocol
            </span>
            <strong>
              ORYBIT v0.1
            </strong>
          </div>
        </div>
      </section>

      <section className="access-card">
        <div className="access-card-header">
          <div>
            <p className="eyebrow">
              Admin Console
            </p>
            <h2>
              Unlock registry
            </h2>
          </div>

          <span
            className={`health-pill ${health}`}
          >
            <span />
            {health === "checking"
              ? "Checking API"
              : health === "online"
                ? "API online"
                : "API unavailable"}
          </span>
        </div>

        <form
          onSubmit={submit}
          className="access-form"
        >
          <label
            htmlFor="admin-token"
          >
            Admin token
          </label>

          <input
            id="admin-token"
            type="password"
            autoComplete="off"
            spellCheck="false"
            value={token}
            onChange={(event) =>
              setToken(
                event.target.value
              )
            }
            placeholder="Paste ORYBIT_ADMIN_TOKEN"
          />

          {error && (
            <div
              className="form-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            className="button primary wide"
            type="submit"
            disabled={checking}
          >
            {checking
              ? "Verifying…"
              : "Open ORYBIT"}
          </button>
        </form>

        <p className="security-note">
          ORYBIT uses session storage for
          this prototype admin console.
          Closing the browser session
          clears the token.
        </p>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tone
}: {
  label: string;
  value: number | string;
  hint: string;
  tone: string;
}) {
  return (
    <article
      className={`summary-card ${tone}`}
    >
      <div className="summary-icon">
        <span />
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span className="summary-hint">
        {hint}
      </span>
    </article>
  );
}

function RegisterModal({
  onClose,
  onSubmit,
  busy
}: {
  onClose: () => void;
  onSubmit: (
    input: CreateObjectInput
  ) => Promise<void>;
  busy: boolean;
}) {
  const [name, setName] =
    useState("");
  const [kind, setKind] =
    useState("appliance");
  const [manufacturer, setManufacturer] =
    useState("");
  const [model, setModel] =
    useState("");
  const [serial, setSerial] =
    useState("");
  const [description, setDescription] =
    useState("");
  const [capabilities, setCapabilities] =
    useState(
      "manual.view, maintenance.record"
    );
  const [error, setError] =
    useState("");

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Object name is required."
      );
      return;
    }

    setError("");

    try {
      await onSubmit({
        kind: kind.trim() || "object",
        identity: {
          name: name.trim(),
          ...(manufacturer.trim()
            ? {
                manufacturer:
                  manufacturer.trim()
              }
            : {}),
          ...(model.trim()
            ? { model: model.trim() }
            : {}),
          ...(serial.trim()
            ? { serial: serial.trim() }
            : {}),
          ...(description.trim()
            ? {
                description:
                  description.trim()
              }
            : {})
        },
        capabilities:
          parseCapabilities(
            capabilities
          )
      });
    } catch (cause) {
      setError(
        errorMessage(cause)
      );
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">
              New Identity
            </p>
            <h2 id="register-title">
              Register object
            </h2>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Close registration dialog"
          >
            ×
          </button>
        </div>

        <form
          className="object-form"
          onSubmit={submit}
        >
          <div className="field-grid">
            <label className="field full">
              <span>
                Object name
              </span>
              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="e.g. Workshop Drill"
                autoFocus
              />
            </label>

            <label className="field">
              <span>
                Kind
              </span>
              <input
                value={kind}
                onChange={(event) =>
                  setKind(
                    event.target.value
                  )
                }
                placeholder="tool"
              />
            </label>

            <label className="field">
              <span>
                Manufacturer
              </span>
              <input
                value={manufacturer}
                onChange={(event) =>
                  setManufacturer(
                    event.target.value
                  )
                }
                placeholder="Optional"
              />
            </label>

            <label className="field">
              <span>
                Model
              </span>
              <input
                value={model}
                onChange={(event) =>
                  setModel(
                    event.target.value
                  )
                }
                placeholder="Optional"
              />
            </label>

            <label className="field">
              <span>
                Serial
              </span>
              <input
                value={serial}
                onChange={(event) =>
                  setSerial(
                    event.target.value
                  )
                }
                placeholder="Optional"
              />
            </label>

            <label className="field full">
              <span>
                Description
              </span>
              <textarea
                rows={3}
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="What is this physical object?"
              />
            </label>

            <label className="field full">
              <span>
                Capabilities
              </span>
              <textarea
                rows={3}
                value={capabilities}
                onChange={(event) =>
                  setCapabilities(
                    event.target.value
                  )
                }
                placeholder="manual.view, maintenance.record"
              />
              <small>
                Separate capabilities
                with commas or new lines.
              </small>
            </label>
          </div>

          {error && (
            <div
              className="form-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              className="button ghost"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="button primary"
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Registering…"
                : "Register object"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ObjectDrawer({
  object,
  onClose,
  onSave,
  busy
}: {
  object: OrybitObject;
  onClose: () => void;
  onSave: (
    patch: UpdateObjectInput
  ) => Promise<void>;
  busy: boolean;
}) {
  const [editing, setEditing] =
    useState(false);
  const [status, setStatus] =
    useState<LifecycleStatus>(
      object.lifecycle.status
    );
  const [manufacturer, setManufacturer] =
    useState(
      object.identity.manufacturer ?? ""
    );
  const [model, setModel] =
    useState(
      object.identity.model ?? ""
    );
  const [description, setDescription] =
    useState(
      object.identity.description ?? ""
    );
  const [capabilities, setCapabilities] =
    useState(
      object.capabilities.join(", ")
    );

  useEffect(() => {
    setStatus(
      object.lifecycle.status
    );
    setManufacturer(
      object.identity.manufacturer ?? ""
    );
    setModel(
      object.identity.model ?? ""
    );
    setDescription(
      object.identity.description ?? ""
    );
    setCapabilities(
      object.capabilities.join(", ")
    );
    setEditing(false);
  }, [object]);

  async function save() {
    try {
      await onSave({
        lifecycle: {
          status
        },
        identity: {
          manufacturer:
            manufacturer.trim(),
          model: model.trim(),
          description:
            description.trim()
        },
        capabilities:
          parseCapabilities(
            capabilities
          )
      });

      setEditing(false);
    } catch {
      // The parent dashboard surfaces
      // the structured API error.
    }
  }

  return (
    <aside className="drawer">
      <div className="drawer-header">
        <div>
          <div className="drawer-kicker">
            <span
              className={`status-dot ${object.lifecycle.status}`}
            />
            {statusLabel(
              object.lifecycle.status
            )}
          </div>
          <h2>
            {object.identity.name}
          </h2>
          <code>
            {object.publicId}
          </code>
        </div>

        <button
          className="icon-button"
          type="button"
          onClick={onClose}
          aria-label="Close object details"
        >
          ×
        </button>
      </div>

      <div className="drawer-body">
        <section className="detail-section">
          <div className="section-heading">
            <h3>
              Identity
            </h3>
            <span>
              {object.kind}
            </span>
          </div>

          <dl className="detail-grid">
            <div>
              <dt>
                Internal ID
              </dt>
              <dd>
                <code>
                  {object.id}
                </code>
              </dd>
            </div>
            <div>
              <dt>
                Manufacturer
              </dt>
              <dd>
                {object.identity
                  .manufacturer ||
                  "Not set"}
              </dd>
            </div>
            <div>
              <dt>
                Model
              </dt>
              <dd>
                {object.identity.model ||
                  "Not set"}
              </dd>
            </div>
            <div>
              <dt>
                Serial
              </dt>
              <dd>
                {object.identity.serial ||
                  "Not set"}
              </dd>
            </div>
          </dl>

          {object.identity
            .description && (
            <p className="object-description">
              {
                object.identity
                  .description
              }
            </p>
          )}
        </section>

        <section className="detail-section">
          <div className="section-heading">
            <h3>
              Lifecycle
            </h3>
            <span>
              Protocol {
                object.protocolVersion
              }
            </span>
          </div>

          <div className="timeline">
            <div>
              <span />
              <div>
                <strong>
                  Updated
                </strong>
                <p>
                  {formatDateTime(
                    object.lifecycle
                      .updatedAt
                  )}
                </p>
              </div>
            </div>
            <div>
              <span />
              <div>
                <strong>
                  Created
                </strong>
                <p>
                  {formatDateTime(
                    object.lifecycle
                      .createdAt
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <div className="section-heading">
            <h3>
              Capabilities
            </h3>
            <span>
              {
                object.capabilities
                  .length
              } enabled
            </span>
          </div>

          <div className="capability-list">
            {object.capabilities.length >
            0 ? (
              object.capabilities.map(
                (capability) => (
                  <span
                    key={capability}
                  >
                    {capability}
                  </span>
                )
              )
            ) : (
              <p className="muted">
                No capabilities defined.
              </p>
            )}
          </div>
        </section>

        {editing && (
          <section className="detail-section editor-panel">
            <div className="section-heading">
              <h3>
                Edit object
              </h3>
              <span>
                Mutable fields
              </span>
            </div>

            <div className="field-grid">
              <label className="field">
                <span>Status</span>
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target
                        .value as LifecycleStatus
                    )
                  }
                >
                  {statusOptions
                    .filter(
                      (value) =>
                        value !== "all"
                    )
                    .map((value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {statusLabel(
                          value as LifecycleStatus
                        )}
                      </option>
                    ))}
                </select>
              </label>

              <label className="field">
                <span>
                  Manufacturer
                </span>
                <input
                  value={manufacturer}
                  onChange={(event) =>
                    setManufacturer(
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="field full">
                <span>Model</span>
                <input
                  value={model}
                  onChange={(event) =>
                    setModel(
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="field full">
                <span>
                  Description
                </span>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="field full">
                <span>
                  Capabilities
                </span>
                <textarea
                  rows={4}
                  value={capabilities}
                  onChange={(event) =>
                    setCapabilities(
                      event.target.value
                    )
                  }
                />
              </label>
            </div>
          </section>
        )}
      </div>

      <div className="drawer-footer">
        {editing ? (
          <>
            <button
              className="button ghost"
              type="button"
              onClick={() =>
                setEditing(false)
              }
            >
              Cancel
            </button>
            <button
              className="button primary"
              type="button"
              disabled={busy}
              onClick={save}
            >
              {busy
                ? "Saving…"
                : "Save changes"}
            </button>
          </>
        ) : (
          <button
            className="button primary wide"
            type="button"
            onClick={() =>
              setEditing(true)
            }
          >
            Edit object
          </button>
        )}
      </div>
    </aside>
  );
}

function RegistryTable({
  objects,
  selectedId,
  onSelect
}: {
  objects: OrybitObject[];
  selectedId?: string;
  onSelect: (
    object: OrybitObject
  ) => void;
}) {
  if (objects.length === 0) {
    return (
      <div className="empty-state">
        <div
          className="empty-orbit"
          aria-hidden="true"
        >
          <span />
        </div>
        <h3>
          No objects match
        </h3>
        <p>
          Adjust the filter or register
          a new physical object.
        </p>
      </div>
    );
  }

  return (
    <div className="registry-table-wrap">
      <table className="registry-table">
        <thead>
          <tr>
            <th>Object</th>
            <th>Kind</th>
            <th>Status</th>
            <th>Capabilities</th>
            <th>Updated</th>
          </tr>
        </thead>

        <tbody>
          {objects.map((object) => (
            <tr
              key={object.id}
              className={
                selectedId ===
                object.id
                  ? "selected"
                  : ""
              }
              onClick={() =>
                onSelect(object)
              }
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  event.key ===
                    "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();
                  onSelect(object);
                }
              }}
            >
              <td>
                <div className="object-cell">
                  <div className="object-glyph">
                    <span />
                  </div>
                  <div>
                    <strong>
                      {
                        object.identity
                          .name
                      }
                    </strong>
                    <code>
                      {object.publicId}
                    </code>
                  </div>
                </div>
              </td>
              <td>
                <span className="kind-chip">
                  {object.kind}
                </span>
              </td>
              <td>
                <span className="status-chip">
                  <span
                    className={`status-dot ${object.lifecycle.status}`}
                  />
                  {statusLabel(
                    object.lifecycle
                      .status
                  )}
                </span>
              </td>
              <td>
                <span className="capability-count">
                  {
                    object.capabilities
                      .length
                  }
                </span>
              </td>
              <td>
                {formatDateTime(
                  object.lifecycle
                    .updatedAt
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [token, setToken] =
    useState(
      readSessionToken()
    );
  const [objects, setObjects] =
    useState<OrybitObject[]>([]);
  const [selected, setSelected] =
    useState<OrybitObject | null>(
      null
    );
  const [query, setQuery] =
    useState("");
  const [status, setStatus] =
    useState<
      "all" | LifecycleStatus
    >("all");
  const [loading, setLoading] =
    useState(Boolean(token));
  const [busy, setBusy] =
    useState(false);
  const [error, setError] =
    useState("");
  const [apiOnline, setApiOnline] =
    useState(true);
  const [modal, setModal] =
    useState<ModalMode>(null);

  const api = useMemo(
    () =>
      new OrybitApi(token),
    [token]
  );

  const refresh =
    useCallback(async () => {
      if (!token) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [nextObjects] =
          await Promise.all([
            api.listObjects(),
            api.health()
          ]);

        setObjects(nextObjects);
        setApiOnline(true);

        setSelected(
          (current) =>
            current
              ? nextObjects.find(
                  (object) =>
                    object.id ===
                    current.id
                ) ?? null
              : null
        );
      } catch (cause) {
        if (
          cause instanceof
            OrybitApiError &&
          cause.status === 401
        ) {
          clearSessionToken();
          setToken("");
          setObjects([]);
          setSelected(null);
          setError("");
          return;
        }

        setApiOnline(false);
        setError(
          errorMessage(cause)
        );
      } finally {
        setLoading(false);
      }
    }, [api, token]);

  useEffect(() => {
    if (token) {
      void refresh();
    }
  }, [refresh, token]);

  const summary =
    useMemo(
      () =>
        summarizeObjects(objects),
      [objects]
    );

  const filtered =
    useMemo(
      () =>
        filterObjects(
          objects,
          query,
          status
        ),
      [objects, query, status]
    );

  function authorize(
    nextToken: string,
    nextObjects: OrybitObject[]
  ) {
    setToken(nextToken);
    setObjects(nextObjects);
    setError("");
  }

  function signOut() {
    clearSessionToken();
    setToken("");
    setObjects([]);
    setSelected(null);
    setQuery("");
    setStatus("all");
  }

  async function createObject(
    input: CreateObjectInput
  ) {
    setBusy(true);
    setError("");

    try {
      const created =
        await api.createObject(
          input
        );

      setObjects(
        (current) => [
          created,
          ...current
        ]
      );
      setSelected(created);
      setModal(null);
    } catch (cause) {
      setError(
        errorMessage(cause)
      );
      throw cause;
    } finally {
      setBusy(false);
    }
  }

  async function updateObject(
    patch: UpdateObjectInput
  ) {
    if (!selected) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const updated =
        await api.updateObject(
          selected.id,
          patch
        );

      setObjects(
        (current) =>
          current.map((object) =>
            object.id === updated.id
              ? updated
              : object
          )
      );

      setSelected(updated);
    } catch (cause) {
      setError(
        errorMessage(cause)
      );
      throw cause;
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <AccessGate
        onAuthorized={authorize}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup compact">
          <div
            className="brand-orbit"
            aria-hidden="true"
          >
            <span />
          </div>
          <div>
            <p className="eyebrow">
              ORYBIT
            </p>
            <strong>
              Object Registry
            </strong>
          </div>
        </div>

        <div className="topbar-actions">
          <span
            className={`health-pill ${
              apiOnline
                ? "online"
                : "offline"
            }`}
          >
            <span />
            {apiOnline
              ? "Live runtime"
              : "Runtime issue"}
          </span>

          <button
            className="button ghost"
            type="button"
            onClick={signOut}
          >
            Lock console
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="hero-row">
          <div>
            <p className="eyebrow">
              Phase 1 / Registry
            </p>
            <h1>
              Your physical world,
              indexed.
            </h1>
            <p>
              Create and manage persistent
              digital identities for real
              objects from one live
              registry.
            </p>
          </div>

          <div className="hero-actions">
            <button
              className="button ghost"
              type="button"
              onClick={() =>
                void refresh()
              }
              disabled={loading}
            >
              {loading
                ? "Refreshing…"
                : "Refresh"}
            </button>

            <button
              className="button primary"
              type="button"
              onClick={() =>
                setModal("create")
              }
            >
              + Register object
            </button>
          </div>
        </section>

        {error && (
          <div
            className="global-error"
            role="alert"
          >
            <div>
              <strong>
                ORYBIT needs attention
              </strong>
              <span>
                {error}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setError("")
              }
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <section
          className="summary-grid"
          aria-label="Registry summary"
        >
          <SummaryCard
            label="Registered"
            value={summary.total}
            hint="Persistent identities"
            tone="violet"
          />
          <SummaryCard
            label="Active"
            value={summary.active}
            hint="Objects in service"
            tone="mint"
          />
          <SummaryCard
            label="Attention"
            value={summary.attention}
            hint="Inactive or lost"
            tone="amber"
          />
          <SummaryCard
            label="Capabilities"
            value={summary.capabilities}
            hint="Unique abilities"
            tone="blue"
          />
        </section>

        <section className="registry-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">
                Live D1 Registry
              </p>
              <h2>
                Objects
              </h2>
            </div>

            <div className="registry-tools">
              <label className="search-box">
                <span
                  className="search-icon"
                  aria-hidden="true"
                >
                  ⌕
                </span>
                <input
                  aria-label="Search objects"
                  value={query}
                  onChange={(event) =>
                    setQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search name, ID, kind, capability…"
                />
              </label>

              <label className="filter-select">
                <span className="sr-only">
                  Filter by status
                </span>
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target
                        .value as
                        "all" |
                        LifecycleStatus
                    )
                  }
                >
                  {statusOptions.map(
                    (value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value === "all"
                          ? "All statuses"
                          : statusLabel(
                              value
                            )}
                      </option>
                    )
                  )}
                </select>
              </label>
            </div>
          </div>

          <div className="panel-meta">
            <span>
              {filtered.length} of {
                objects.length
              } objects
            </span>
            <span>
              Protocol v0.1
            </span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <span>
                Reading live registry…
              </span>
            </div>
          ) : (
            <RegistryTable
              objects={filtered}
              selectedId={
                selected?.id
              }
              onSelect={setSelected}
            />
          )}
        </section>

        <footer className="dashboard-footer">
          <span>
            ORYBIT · The software layer
            for physical objects.
          </span>
          <span>
            Worker + D1 · $0 prototype
          </span>
        </footer>
      </main>

      {modal === "create" && (
        <RegisterModal
          onClose={() =>
            setModal(null)
          }
          onSubmit={createObject}
          busy={busy}
        />
      )}

      {selected && (
        <div
          className="drawer-backdrop"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelected(null);
            }
          }}
        >
          <ObjectDrawer
            object={selected}
            onClose={() =>
              setSelected(null)
            }
            onSave={updateObject}
            busy={busy}
          />
        </div>
      )}
    </div>
  );
}
