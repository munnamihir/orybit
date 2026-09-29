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
  readSessionToken,
  SESSION_CHANGE_EVENT
} from "./session";

import type {
  DeveloperApiKey,
  DeveloperApiKeySecret,
  DeveloperScope
} from "./types";

const scopeOptions: Array<{
  value: DeveloperScope;
  label: string;
  description: string;
}> = [
  {
    value: "objects:read",
    label: "Objects",
    description:
      "Read the public-safe object projection."
  },
  {
    value: "manifests:read",
    label: "Manifests",
    description:
      "Read machine-readable object manifests."
  },
  {
    value: "capabilities:read",
    label: "Capabilities",
    description:
      "Read structured public capabilities."
  }
];

function errorMessage(error: unknown): string {
  if (error instanceof OrybitApiError) {
    return error.message;
  }

  return error instanceof Error
    ? error.message
    : "Developer Platform operation failed.";
}

function formatDate(value?: string): string {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleString();
}

export default function DeveloperConsole() {
  const [token, setToken] =
    useState(() => readSessionToken());
  const [open, setOpen] = useState(false);
  const [keys, setKeys] =
    useState<DeveloperApiKey[]>([]);
  const [name, setName] =
    useState("Local SDK demo");
  const [scopes, setScopes] =
    useState<DeveloperScope[]>(
      scopeOptions.map((item) => item.value)
    );
  const [secret, setSecret] =
    useState<DeveloperApiKeySecret | null>(null);
  const [loading, setLoading] =
    useState(false);
  const [busy, setBusy] =
    useState(false);
  const [copied, setCopied] =
    useState(false);
  const [error, setError] =
    useState("");

  const api = useMemo(
    () => new OrybitApi(token),
    [token]
  );

  useEffect(() => {
    const sync = () => {
      const next = readSessionToken();
      setToken(next);

      if (!next) {
        setOpen(false);
        setSecret(null);
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

  const load = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      setKeys(
        await api.listDeveloperApiKeys()
      );
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [api, token]);

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [load, open]);

  function toggleScope(scope: DeveloperScope) {
    setScopes((current) =>
      current.includes(scope)
        ? current.filter(
            (item) => item !== scope
          )
        : [...current, scope]
    );
  }

  async function create(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Give the integration a name.");
      return;
    }

    if (scopes.length === 0) {
      setError("Select at least one read scope.");
      return;
    }

    setBusy(true);
    setError("");
    setCopied(false);

    try {
      const created =
        await api.createDeveloperApiKey({
          name: name.trim(),
          scopes
        });

      setSecret(created);
      await load();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function copySecret() {
    if (!secret) {
      return;
    }

    await navigator.clipboard.writeText(
      secret.apiKey
    );
    setCopied(true);
  }

  async function revoke(key: DeveloperApiKey) {
    if (
      key.revokedAt ||
      !window.confirm(
        `Revoke developer key “${key.name}”? Existing integrations using it will stop immediately.`
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await api.revokeDeveloperApiKey(key.id);
      await load();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return null;
  }

  return (
    <>
      <button
        className="developer-launcher"
        type="button"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">⌘</span>
        Developers
      </button>

      {open && (
        <div
          className="developer-backdrop"
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
            className="developer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="developer-title"
          >
            <header className="developer-header">
              <div>
                <p className="developer-eyebrow">
                  Phase 8 · Developer Platform
                </p>
                <h2 id="developer-title">
                  API keys & SDK access
                </h2>
                <p>
                  Identify external software with scoped,
                  revocable keys. These keys do not grant
                  ownership, private memory access, or
                  physical-control permission.
                </p>
              </div>

              <button
                className="developer-close"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close Developer Platform"
              >
                ×
              </button>
            </header>

            {error && (
              <div className="developer-error" role="alert">
                {error}
              </div>
            )}

            {secret && (
              <section className="developer-secret">
                <div>
                  <p className="developer-card-label">
                    Copy now · shown once
                  </p>
                  <strong>{secret.key.name}</strong>
                </div>
                <code>{secret.apiKey}</code>
                <div className="developer-secret-actions">
                  <button
                    type="button"
                    onClick={() => void copySecret()}
                  >
                    {copied ? "Copied" : "Copy API key"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSecret(null);
                      setCopied(false);
                    }}
                  >
                    I saved it
                  </button>
                </div>
                <p>
                  ORYBIT stores only a domain-separated
                  SHA-512 verifier. This raw key cannot be
                  recovered later.
                </p>
              </section>
            )}

            <div className="developer-grid">
              <form
                className="developer-card developer-create"
                onSubmit={create}
              >
                <p className="developer-card-label">
                  Create integration key
                </p>

                <label>
                  <span>Integration name</span>
                  <input
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    maxLength={80}
                  />
                </label>

                <fieldset>
                  <legend>Read scopes</legend>
                  {scopeOptions.map((scope) => (
                    <label
                      className="developer-scope"
                      key={scope.value}
                    >
                      <input
                        type="checkbox"
                        checked={scopes.includes(
                          scope.value
                        )}
                        onChange={() =>
                          toggleScope(scope.value)
                        }
                      />
                      <span>
                        <strong>{scope.label}</strong>
                        <small>{scope.value}</small>
                        <em>{scope.description}</em>
                      </span>
                    </label>
                  ))}
                </fieldset>

                <button
                  className="developer-primary"
                  type="submit"
                  disabled={busy}
                >
                  {busy
                    ? "Creating…"
                    : "Create developer key"}
                </button>
              </form>

              <section className="developer-card developer-keys">
                <div className="developer-list-heading">
                  <div>
                    <p className="developer-card-label">
                      Existing keys
                    </p>
                    <strong>
                      {keys.length} integration{
                        keys.length === 1 ? "" : "s"
                      }
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => void load()}
                    disabled={loading}
                  >
                    {loading ? "Loading…" : "Refresh"}
                  </button>
                </div>

                <div className="developer-key-list">
                  {keys.length === 0 && !loading ? (
                    <p className="developer-empty">
                      No developer keys yet.
                    </p>
                  ) : (
                    keys.map((key) => (
                      <article
                        className="developer-key"
                        key={key.id}
                      >
                        <div className="developer-key-top">
                          <div>
                            <strong>{key.name}</strong>
                            <code>{key.keyPrefix}</code>
                          </div>
                          <span
                            className={
                              key.revokedAt
                                ? "revoked"
                                : "active"
                            }
                          >
                            {key.revokedAt
                              ? "Revoked"
                              : "Active"}
                          </span>
                        </div>

                        <div className="developer-scope-chips">
                          {key.scopes.map((scope) => (
                            <span key={scope}>{scope}</span>
                          ))}
                        </div>

                        <dl>
                          <div>
                            <dt>Created</dt>
                            <dd>{formatDate(key.createdAt)}</dd>
                          </div>
                          <div>
                            <dt>Last used</dt>
                            <dd>{formatDate(key.lastUsedAt)}</dd>
                          </div>
                        </dl>

                        {!key.revokedAt && (
                          <button
                            className="developer-revoke"
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              void revoke(key)
                            }
                          >
                            Revoke key
                          </button>
                        )}
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>

            <footer className="developer-footer">
              <span>
                Developer API: /developer/v1
              </span>
              <span>
                SDK: sdk/ · read-only Step 012
              </span>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
