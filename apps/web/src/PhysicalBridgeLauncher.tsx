import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  OrybitApi
} from "./api";

import {
  publicObjectQrDataUrl,
  publicObjectUrl
} from "./public-object";

import {
  readSessionToken,
  SESSION_CHANGE_EVENT
} from "./session";

import type {
  OrybitObject
} from "./types";

export default function PhysicalBridgeLauncher() {
  const [token, setToken] =
    useState(() => readSessionToken());
  const [open, setOpen] =
    useState(false);
  const [objects, setObjects] =
    useState<OrybitObject[]>([]);
  const [selectedId, setSelectedId] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
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
        setSelectedId("");
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

  useEffect(() => {
    if (!open || !token) {
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    new OrybitApi(token)
      .listObjects()
      .then((items) => {
        if (!active) {
          return;
        }

        setObjects(items);
        setSelectedId((current) =>
          current && items.some(
            (item) => item.id === current
          )
            ? current
            : items[0]?.id ?? ""
        );
      })
      .catch((cause) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load ORYBIT objects."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, token]);

  const selected = useMemo(
    () => objects.find(
      (object) => object.id === selectedId
    ) ?? null,
    [objects, selectedId]
  );

  const publicUrl = selected
    ? publicObjectUrl(
        window.location.origin,
        selected.publicId
      )
    : "";

  const qrDataUrl = selected
    ? publicObjectQrDataUrl(
        window.location.origin,
        selected.publicId
      )
    : "";

  if (!token) {
    return null;
  }

  async function copyUrl() {
    if (!publicUrl) {
      return;
    }

    await navigator.clipboard.writeText(
      publicUrl
    );
    setCopied(true);
    window.setTimeout(
      () => setCopied(false),
      1600
    );
  }

  return (
    <>
      <button
        className="physical-bridge-launcher"
        type="button"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">⌁</span>
        Physical bridge
      </button>

      {open && (
        <div
          className="bridge-backdrop"
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
            className="bridge-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bridge-title"
          >
            <div className="bridge-header">
              <div>
                <p className="public-eyebrow">
                  ORYBIT PHYSICAL BRIDGE
                </p>
                <h2 id="bridge-title">
                  Give an object a scannable identity
                </h2>
              </div>

              <button
                className="bridge-close"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close physical bridge"
              >
                ×
              </button>
            </div>

            <p className="bridge-intro">
              Choose a registered object. ORYBIT creates
              a QR that resolves to its public-safe profile.
              The admin token is never encoded in the QR.
            </p>

            {loading ? (
              <p className="bridge-state">
                Loading registry…
              </p>
            ) : error ? (
              <div className="bridge-error" role="alert">
                {error}
              </div>
            ) : objects.length === 0 ? (
              <p className="bridge-state">
                Register an object first, then return here.
              </p>
            ) : (
              <>
                <label className="bridge-field">
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

                {selected && (
                  <div className="bridge-content">
                    <div className="bridge-qr-card">
                      <img
                        src={qrDataUrl}
                        alt={`QR for ${selected.identity.name}`}
                      />
                      <strong>
                        {selected.identity.name}
                      </strong>
                      <code>{selected.publicId}</code>
                    </div>

                    <div className="bridge-actions-card">
                      <p className="bridge-label">
                        Public profile URL
                      </p>
                      <div className="bridge-url">
                        {publicUrl}
                      </div>

                      <div className="bridge-actions">
                        <button
                          type="button"
                          onClick={copyUrl}
                        >
                          {copied
                            ? "Copied"
                            : "Copy URL"}
                        </button>

                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open profile
                        </a>

                        <a
                          href={qrDataUrl}
                          download={`orybit-${selected.publicId}.gif`}
                        >
                          Download QR
                        </a>
                      </div>

                      <div className="bridge-safety">
                        <strong>
                          Safe to attach to a physical object
                        </strong>
                        <span>
                          QR payload contains only the public
                          ORYBIT URL. Internal ID, serial number,
                          metadata, and admin credentials stay private.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
