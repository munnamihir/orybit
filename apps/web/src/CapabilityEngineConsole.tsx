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
  assignedCapabilityNames,
  sortCapabilityDefinitions,
  unresolvedCapabilities
} from "./capability-domain";

import {
  readSessionToken,
  SESSION_CHANGE_EVENT
} from "./session";

import type {
  CapabilityAccess,
  CapabilityDefinitionInput,
  CapabilityOperation,
  OrybitCapability,
  OrybitObject,
  ResolvedObjectCapability
} from "./types";

function errorMessage(error: unknown): string {
  if (error instanceof OrybitApiError) {
    const details =
      error.details.length > 0
        ? ` ${error.details.join(", ")}`
        : "";

    return `${error.message}${details}`;
  }

  return error instanceof Error
    ? error.message
    : "Capability Engine operation failed.";
}

function operationLabel(
  value?: CapabilityOperation
): string {
  return value
    ? value.charAt(0).toUpperCase() +
      value.slice(1)
    : "Unspecified";
}

export default function CapabilityEngineConsole() {
  const [token, setToken] =
    useState(() => readSessionToken());
  const [open, setOpen] =
    useState(false);
  const [objects, setObjects] =
    useState<OrybitObject[]>([]);
  const [definitions, setDefinitions] =
    useState<OrybitCapability[]>([]);
  const [resolved, setResolved] =
    useState<ResolvedObjectCapability[]>([]);
  const [selectedId, setSelectedId] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [busyName, setBusyName] =
    useState("");
  const [error, setError] =
    useState("");
  const [showCreate, setShowCreate] =
    useState(false);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [access, setAccess] =
    useState<CapabilityAccess>("owner");
  const [category, setCategory] =
    useState("");
  const [operation, setOperation] =
    useState<CapabilityOperation>("read");
  const [requiresApproval, setRequiresApproval] =
    useState(false);

  const api = useMemo(
    () => new OrybitApi(token),
    [token]
  );

  const selected = useMemo(
    () => objects.find(
      (object) => object.id === selectedId
    ) ?? null,
    [objects, selectedId]
  );

  const assigned = useMemo(
    () => assignedCapabilityNames(resolved),
    [resolved]
  );

  const unresolved = useMemo(
    () => unresolvedCapabilities(resolved),
    [resolved]
  );

  const sortedDefinitions = useMemo(
    () => sortCapabilityDefinitions(definitions),
    [definitions]
  );

  useEffect(() => {
    const sync = () => {
      const next = readSessionToken();
      setToken(next);

      if (!next) {
        setOpen(false);
      }
    };

    window.addEventListener(
      SESSION_CHANGE_EVENT,
      sync
    );

    return () =>
      window.removeEventListener(
        SESSION_CHANGE_EVENT,
        sync
      );
  }, []);

  const loadResolved = useCallback(
    async (identifier: string) => {
      if (!identifier || !token) {
        setResolved([]);
        return;
      }

      try {
        setResolved(
          await api.listObjectCapabilities(
            identifier
          )
        );
      } catch (cause) {
        setError(errorMessage(cause));
      }
    },
    [api, token]
  );

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [nextObjects, nextDefinitions] =
        await Promise.all([
          api.listObjects(),
          api.listCapabilityDefinitions()
        ]);

      setObjects(nextObjects);
      setDefinitions(nextDefinitions);

      const nextSelected =
        selectedId && nextObjects.some(
          (object) => object.id === selectedId
        )
          ? selectedId
          : nextObjects[0]?.id ?? "";

      setSelectedId(nextSelected);

      if (nextSelected) {
        setResolved(
          await api.listObjectCapabilities(
            nextSelected
          )
        );
      } else {
        setResolved([]);
      }
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [api, selectedId, token]);

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [open]);

  useEffect(() => {
    if (open && selectedId) {
      void loadResolved(selectedId);
    }
  }, [open, selectedId, loadResolved]);

  async function toggleCapability(
    definition: OrybitCapability
  ) {
    if (!selected) {
      return;
    }

    setBusyName(definition.name);
    setError("");

    try {
      const response = assigned.has(definition.name)
        ? await api.disableObjectCapability(
            selected.id,
            definition.name
          )
        : await api.enableObjectCapability(
            selected.id,
            definition.name
          );

      setResolved(response.capabilities);
      setObjects((current) =>
        current.map((object) =>
          object.id === response.object.id
            ? response.object
            : object
        )
      );
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyName("");
    }
  }

  async function createDefinition(
    event: FormEvent
  ) {
    event.preventDefault();
    setBusyName("__create__");
    setError("");

    const input: CapabilityDefinitionInput = {
      name,
      title,
      description,
      access,
      category,
      operation,
      requiresApproval
    };

    try {
      const created =
        await api.createCapabilityDefinition(
          input
        );

      setDefinitions((current) => [
        ...current,
        created
      ]);
      setName("");
      setTitle("");
      setDescription("");
      setCategory("");
      setOperation("read");
      setAccess("owner");
      setRequiresApproval(false);
      setShowCreate(false);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyName("");
    }
  }

  if (!token) {
    return null;
  }

  return (
    <>
      <button
        className="capability-launcher"
        type="button"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">◇</span>
        Capabilities
      </button>

      {open && (
        <div
          className="capability-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <section
            className="capability-panel"
            role="dialog"
            aria-modal="true"
            aria-label="ORYBIT Capability Engine"
          >
            <header className="capability-header">
              <div>
                <p className="capability-eyebrow">
                  Phase 6 · Capability Engine
                </p>
                <h2>What can this object do?</h2>
                <p>
                  Definitions describe abilities. Assignment
                  enables an ability on a specific object.
                  PermissionOS comes later.
                </p>
              </div>

              <button
                className="capability-close"
                type="button"
                aria-label="Close Capability Engine"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>

            {error && (
              <div
                className="capability-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="capability-toolbar">
              <label>
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

              <div className="capability-toolbar-actions">
                <button
                  className="capability-button ghost"
                  type="button"
                  onClick={() => void load()}
                  disabled={loading}
                >
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
                <button
                  className="capability-button primary"
                  type="button"
                  onClick={() =>
                    setShowCreate((current) => !current)
                  }
                >
                  + Define capability
                </button>
              </div>
            </div>

            {showCreate && (
              <form
                className="capability-create-card"
                onSubmit={createDefinition}
              >
                <div className="capability-card-heading">
                  <div>
                    <p className="capability-card-label">
                      New definition
                    </p>
                    <strong>
                      Add a reusable object ability
                    </strong>
                  </div>
                  <span>
                    Dotted names are immutable
                  </span>
                </div>

                <div className="capability-form-grid">
                  <label>
                    <span>Name</span>
                    <input
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      placeholder="diagnostics.run"
                      required
                    />
                  </label>
                  <label>
                    <span>Title</span>
                    <input
                      value={title}
                      onChange={(event) =>
                        setTitle(event.target.value)
                      }
                      placeholder="Run diagnostics"
                      required
                    />
                  </label>
                  <label>
                    <span>Category</span>
                    <input
                      value={category}
                      onChange={(event) =>
                        setCategory(event.target.value)
                      }
                      placeholder="diagnostics"
                    />
                  </label>
                  <label>
                    <span>Operation</span>
                    <select
                      value={operation}
                      onChange={(event) =>
                        setOperation(
                          event.target.value as CapabilityOperation
                        )
                      }
                    >
                      <option value="read">Read</option>
                      <option value="write">Write</option>
                      <option value="execute">Execute</option>
                    </select>
                  </label>
                  <label>
                    <span>Access hint</span>
                    <select
                      value={access}
                      onChange={(event) =>
                        setAccess(
                          event.target.value as CapabilityAccess
                        )
                      }
                    >
                      <option value="public">Public</option>
                      <option value="owner">Owner</option>
                      <option value="authorized">Authorized</option>
                    </select>
                  </label>
                  <label className="capability-check">
                    <input
                      type="checkbox"
                      checked={requiresApproval}
                      onChange={(event) =>
                        setRequiresApproval(
                          event.target.checked
                        )
                      }
                    />
                    <span>Requires approval hint</span>
                  </label>
                  <label className="full">
                    <span>Description</span>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(event) =>
                        setDescription(event.target.value)
                      }
                      placeholder="Describe the object ability and its effect."
                      required
                    />
                  </label>
                </div>

                <button
                  className="capability-button primary"
                  type="submit"
                  disabled={busyName === "__create__"}
                >
                  {busyName === "__create__"
                    ? "Defining…"
                    : "Create definition"}
                </button>
              </form>
            )}

            {!selected ? (
              <p className="capability-empty">
                Register an ORYBIT object first.
              </p>
            ) : (
              <div className="capability-layout">
                <section className="capability-object-card">
                  <p className="capability-card-label">
                    Object capability state
                  </p>
                  <h3>{selected.identity.name}</h3>
                  <code>{selected.publicId}</code>

                  <div className="capability-object-stats">
                    <div>
                      <strong>{resolved.length}</strong>
                      <span>Enabled</span>
                    </div>
                    <div>
                      <strong>{unresolved.length}</strong>
                      <span>Unresolved</span>
                    </div>
                  </div>

                  {resolved.length === 0 ? (
                    <p className="capability-empty compact">
                      No capabilities enabled on this object.
                    </p>
                  ) : (
                    <div className="capability-assigned-list">
                      {resolved.map((item) => (
                        <article
                          key={item.name}
                          className={
                            item.status === "unresolved"
                              ? "unresolved"
                              : ""
                          }
                        >
                          <div>
                            <strong>
                              {item.definition?.title ?? item.name}
                            </strong>
                            <code>{item.name}</code>
                          </div>
                          <span>
                            {item.status === "defined"
                              ? "Defined"
                              : "Needs definition"}
                          </span>
                        </article>
                      ))}
                    </div>
                  )}

                  {unresolved.length > 0 && (
                    <div className="capability-warning">
                      Legacy references stay visible but cannot
                      be newly assigned until a matching
                      definition is registered.
                    </div>
                  )}
                </section>

                <section className="capability-catalog-card">
                  <div className="capability-card-heading">
                    <div>
                      <p className="capability-card-label">
                        Definition registry
                      </p>
                      <h3>Capability catalog</h3>
                    </div>
                    <span>
                      {definitions.length} definitions
                    </span>
                  </div>

                  <div className="capability-catalog">
                    {sortedDefinitions.map((definition) => {
                      const isAssigned =
                        assigned.has(definition.name);

                      return (
                        <article
                          className="capability-definition"
                          key={definition.name}
                        >
                          <div className="capability-definition-top">
                            <div>
                              <strong>{definition.title}</strong>
                              <code>{definition.name}</code>
                            </div>
                            <span
                              className={`capability-access ${definition.access}`}
                            >
                              {definition.access}
                            </span>
                          </div>

                          <p>{definition.description}</p>

                          <div className="capability-meta-row">
                            <span>
                              {definition.category ?? "uncategorized"}
                            </span>
                            <span>
                              {operationLabel(definition.operation)}
                            </span>
                            {definition.requiresApproval && (
                              <span>approval hint</span>
                            )}
                          </div>

                          <button
                            className={
                              isAssigned
                                ? "capability-button danger"
                                : "capability-button primary"
                            }
                            type="button"
                            disabled={busyName === definition.name}
                            onClick={() =>
                              void toggleCapability(definition)
                            }
                          >
                            {busyName === definition.name
                              ? "Saving…"
                              : isAssigned
                                ? "Disable for object"
                                : "Enable for object"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
