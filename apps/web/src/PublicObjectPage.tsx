import {
  useEffect,
  useState
} from "react";

import {
  fetchPublicObject
} from "./public-object";

import type {
  PublicObjectProfile
} from "./public-object";

function statusLabel(
  status: PublicObjectProfile["lifecycle"]["status"]
): string {
  return status.charAt(0).toUpperCase() +
    status.slice(1);
}

function manifestHref(publicId: string): string {
  return `/manifest/${encodeURIComponent(publicId)}`;
}

export default function PublicObjectPage({
  publicId
}: {
  publicId: string;
}) {
  const [object, setObject] =
    useState<PublicObjectProfile | null>(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    fetchPublicObject(publicId)
      .then((value) => {
        if (active) {
          setObject(value);
          setError("");
        }
      })
      .catch((cause) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load this ORYBIT object."
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
  }, [publicId]);

  if (loading) {
    return (
      <main className="public-object-shell centered-state">
        <div className="public-brand-mark" aria-hidden="true">
          <span />
        </div>
        <p className="public-eyebrow">ORYBIT</p>
        <h1>Resolving physical object…</h1>
      </main>
    );
  }

  if (!object || error) {
    return (
      <main className="public-object-shell centered-state">
        <div className="public-brand-mark" aria-hidden="true">
          <span />
        </div>
        <p className="public-eyebrow">ORYBIT</p>
        <h1>Object not found</h1>
        <p className="public-lead">
          {error ||
            "This public ORYBIT identity is unavailable."}
        </p>
      </main>
    );
  }

  return (
    <main className="public-object-shell">
      <header className="public-object-header">
        <div className="public-brand">
          <div className="public-brand-mark" aria-hidden="true">
            <span />
          </div>
          <div>
            <p className="public-eyebrow">ORYBIT</p>
            <p className="public-brand-copy">
              Physical object identity
            </p>
          </div>
        </div>

        <div
          className={`public-status ${object.lifecycle.status}`}
        >
          <span />
          {statusLabel(object.lifecycle.status)}
        </div>
      </header>

      <section className="public-object-hero">
        <p className="public-kind">
          {object.kind}
        </p>
        <h1>{object.identity.name}</h1>
        <p className="public-id">
          {object.publicId}
        </p>

        {object.identity.description && (
          <p className="public-lead">
            {object.identity.description}
          </p>
        )}

        <a
          className="public-manifest-link"
          href={manifestHref(object.publicId)}
        >
          View machine-readable manifest
          <span aria-hidden="true">↗</span>
        </a>
      </section>

      <section className="public-object-grid">
        <article className="public-card">
          <p className="public-card-label">
            Identity
          </p>

          <dl className="public-detail-list">
            <div>
              <dt>Manufacturer</dt>
              <dd>
                {object.identity.manufacturer ||
                  "Not published"}
              </dd>
            </div>
            <div>
              <dt>Model</dt>
              <dd>
                {object.identity.model ||
                  "Not published"}
              </dd>
            </div>
            <div>
              <dt>Protocol</dt>
              <dd>ORYBIT {object.protocolVersion}</dd>
            </div>
          </dl>
        </article>

        <article className="public-card">
          <p className="public-card-label">
            Capabilities
          </p>

          {object.capabilities.length > 0 ? (
            <div className="public-capabilities">
              {object.capabilities.map(
                (capability) => (
                  <span key={capability}>
                    {capability}
                  </span>
                )
              )}
            </div>
          ) : (
            <p className="public-muted">
              No public capabilities declared.
            </p>
          )}
        </article>
      </section>

      <section className="public-trust-card">
        <div className="public-trust-icon" aria-hidden="true">
          ✓
        </div>
        <div>
          <p className="public-card-label">
            Public-safe projection
          </p>
          <h2>
            This page exposes only the object’s
            public ORYBIT identity.
          </h2>
          <p>
            Internal database IDs, serial numbers,
            metadata, ownership records, private memory,
            and administrator credentials are intentionally
            excluded from both this page and its manifest.
          </p>
        </div>
      </section>

      <footer className="public-object-footer">
        <span>
          Last updated {new Date(
            object.lifecycle.updatedAt
          ).toLocaleString()}
        </span>
        <span>
          Give every physical object an identity,
          memory, and API.
        </span>
      </footer>
    </main>
  );
}
