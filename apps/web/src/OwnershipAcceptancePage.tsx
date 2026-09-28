import {
  useEffect,
  useState
} from "react";

import {
  OrybitApi
} from "./api";

import {
  ownershipTokenFromHash
} from "./ownership-link";

import type {
  PublicTransferPreview
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

export default function OwnershipAcceptancePage() {
  const [token] = useState(() =>
    ownershipTokenFromHash(
      window.location.hash
    )
  );
  const [preview, setPreview] =
    useState<PublicTransferPreview | null>(
      null
    );
  const [loading, setLoading] =
    useState(true);
  const [accepting, setAccepting] =
    useState(false);
  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!token) {
      setError(
        "This transfer link is missing its secret token."
      );
      setLoading(false);
      return;
    }

    let active = true;

    new OrybitApi("")
      .previewOwnershipTransfer(token)
      .then((value) => {
        if (active) {
          setPreview(value);
        }
      })
      .catch((cause) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load this ownership transfer."
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
  }, [token]);

  async function acceptTransfer() {
    if (!token) {
      return;
    }

    setAccepting(true);
    setError("");

    try {
      const accepted = await new OrybitApi("")
        .acceptOwnershipTransfer(token);

      setPreview(accepted);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to accept ownership transfer."
      );
    } finally {
      setAccepting(false);
    }
  }

  return (
    <main className="ownership-accept-shell">
      <header className="ownership-accept-brand">
        <div className="ownership-accept-mark">
          <span />
        </div>
        <div>
          <strong>ORYBIT</strong>
          <span>Ownership transfer</span>
        </div>
      </header>

      <section className="ownership-accept-card">
        {loading ? (
          <div className="ownership-accept-state">
            <span className="ownership-accept-spinner" />
            <p>Resolving secure transfer…</p>
          </div>
        ) : error ? (
          <div
            className="ownership-accept-error"
            role="alert"
          >
            <strong>
              Transfer unavailable
            </strong>
            <p>{error}</p>
          </div>
        ) : preview ? (
          <>
            <p className="ownership-accept-eyebrow">
              PHYSICAL OBJECT OWNERSHIP
            </p>
            <h1>
              {preview.object.identity.name}
            </h1>
            <code>
              {preview.object.publicId}
            </code>

            <div className="ownership-accept-flow">
              <div>
                <span>From</span>
                <strong>
                  {preview.transfer.fromOwner.displayName}
                </strong>
              </div>
              <span aria-hidden="true">→</span>
              <div>
                <span>To</span>
                <strong>
                  {preview.transfer.toOwner.displayName}
                </strong>
              </div>
            </div>

            <dl className="ownership-accept-meta">
              <div>
                <dt>Status</dt>
                <dd>
                  {preview.transfer.status}
                </dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd>
                  {formatDateTime(
                    preview.transfer.expiresAt
                  )}
                </dd>
              </div>
              <div>
                <dt>Object kind</dt>
                <dd>
                  {preview.object.kind}
                </dd>
              </div>
            </dl>

            {preview.transfer.note && (
              <div className="ownership-accept-note">
                <span>Transfer note</span>
                <p>{preview.transfer.note}</p>
              </div>
            )}

            {preview.transfer.status === "pending" ? (
              <button
                className="ownership-accept-button"
                type="button"
                disabled={accepting}
                onClick={acceptTransfer}
              >
                {accepting
                  ? "Accepting…"
                  : "Accept ownership"}
              </button>
            ) : preview.transfer.status === "accepted" ? (
              <div className="ownership-accept-success">
                <strong>
                  Ownership accepted
                </strong>
                <span>
                  This ORYBIT identity now belongs to the new owner.
                </span>
              </div>
            ) : (
              <div className="ownership-accept-error">
                <strong>
                  Transfer {preview.transfer.status}
                </strong>
                <p>
                  This invite can no longer change ownership.
                </p>
              </div>
            )}

            <p className="ownership-accept-security">
              The secret in this link is a temporary capability
              used only for this transfer. The regular ORYBIT QR
              profile does not reveal ownership information.
            </p>
          </>
        ) : null}
      </section>
    </main>
  );
}
