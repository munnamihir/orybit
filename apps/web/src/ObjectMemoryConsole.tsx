import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  OrybitApi
} from "./api";

import {
  readSessionToken,
  SESSION_CHANGE_EVENT
} from "./session";

import type {
  OrybitEvent,
  OrybitObject
} from "./types";

const eventTypes = [
  "maintenance.completed",
  "inspection.completed",
  "repair.completed",
  "part.replaced",
  "purchase.recorded",
  "activation.completed",
  "note.added"
];

function eventTitle(type: string): string {
  return type
    .split(".")
    .map((part) =>
      part.charAt(0).toUpperCase() +
      part.slice(1)
    )
    .join(" · ");
}

function eventNote(
  event: OrybitEvent
): string {
  const note = event.data.note;

  return typeof note === "string"
    ? note
    : "";
}

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

export default function ObjectMemoryConsole() {
  const [token, setToken] =
    useState(() => readSessionToken());
  const [open, setOpen] =
    useState(false);
  const [objects, setObjects] =
    useState<OrybitObject[]>([]);
  const [selectedId, setSelectedId] =
    useState("");
  const [events, setEvents] =
    useState<OrybitEvent[]>([]);
  const [eventType, setEventType] =
    useState(eventTypes[0]);
  const [note, setNote] =
    useState("");
  const [occurredAt, setOccurredAt] =
    useState("");
  const [loading, setLoading] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");

  useEffect(() => {
    const sync = () => {
      const next = readSessionToken();
      setToken(next);

      if (!next) {
        setOpen(false);
        setObjects([]);
        setEvents([]);
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

  async function loadEvents(
    identifier: string
  ) {
    if (!token || !identifier) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const next = await new OrybitApi(token)
        .listObjectEvents(identifier);

      setEvents(next);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load object history."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open || !selected) {
      return;
    }

    void loadEvents(selected.publicId);
  }, [open, selectedId]);

  async function recordEvent() {
    if (!token || !selected) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await new OrybitApi(token)
        .createObjectEvent(
          selected.publicId,
          {
            type: eventType,
            ...(occurredAt
              ? {
                  occurredAt:
                    new Date(
                      occurredAt
                    ).toISOString()
                }
              : {}),
            actor: {
              type: "user"
            },
            data: {
              ...(note.trim()
                ? { note: note.trim() }
                : {})
            }
          }
        );

      setNote("");
      setOccurredAt("");
      await loadEvents(selected.publicId);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to record object memory."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return null;
  }

  return (
    <>
      <button
        className="memory-launcher"
        type="button"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">◷</span>
        Object memory
      </button>

      {open && (
        <div
          className="memory-backdrop"
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
            className="memory-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="memory-title"
          >
            <div className="memory-header">
              <div>
                <p className="memory-eyebrow">
                  ORYBIT OBJECT MEMORY
                </p>
                <h2 id="memory-title">
                  What happened to this object?
                </h2>
              </div>

              <button
                className="memory-close"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close object memory"
              >
                ×
              </button>
            </div>

            <p className="memory-intro">
              Lifecycle history is append-only. New events
              add context without rewriting earlier records.
            </p>

            {error && (
              <div
                className="memory-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {objects.length > 0 && (
              <label className="memory-field">
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
            )}

            {selected && (
              <div className="memory-layout">
                <section className="memory-record-card">
                  <p className="memory-card-label">
                    Record lifecycle event
                  </p>

                  <label className="memory-field">
                    <span>Event type</span>
                    <select
                      value={eventType}
                      onChange={(event) =>
                        setEventType(event.target.value)
                      }
                    >
                      {eventTypes.map((type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {eventTitle(type)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="memory-field">
                    <span>When</span>
                    <input
                      type="datetime-local"
                      value={occurredAt}
                      onChange={(event) =>
                        setOccurredAt(event.target.value)
                      }
                    />
                    <small>
                      Leave blank to use the current time.
                    </small>
                  </label>

                  <label className="memory-field">
                    <span>Note</span>
                    <textarea
                      rows={4}
                      value={note}
                      onChange={(event) =>
                        setNote(event.target.value)
                      }
                      placeholder="What happened?"
                    />
                  </label>

                  <button
                    className="memory-primary"
                    type="button"
                    disabled={saving}
                    onClick={recordEvent}
                  >
                    {saving
                      ? "Recording…"
                      : "Record memory"}
                  </button>
                </section>

                <section className="memory-timeline-card">
                  <div className="memory-timeline-heading">
                    <div>
                      <p className="memory-card-label">
                        Object history
                      </p>
                      <strong>
                        {selected.identity.name}
                      </strong>
                    </div>
                    <span>
                      {events.length} events
                    </span>
                  </div>

                  {loading ? (
                    <p className="memory-state">
                      Loading history…
                    </p>
                  ) : events.length === 0 ? (
                    <p className="memory-state">
                      No lifecycle events recorded yet.
                    </p>
                  ) : (
                    <div className="memory-timeline">
                      {events.map((event) => (
                        <article
                          className="memory-event"
                          key={event.id}
                        >
                          <div
                            className="memory-event-dot"
                            aria-hidden="true"
                          />
                          <div>
                            <div className="memory-event-topline">
                              <strong>
                                {eventTitle(event.type)}
                              </strong>
                              <time>
                                {formatDateTime(
                                  event.occurredAt
                                )}
                              </time>
                            </div>

                            {eventNote(event) && (
                              <p>
                                {eventNote(event)}
                              </p>
                            )}

                            <span className="memory-actor">
                              Actor: {event.actor.type}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {!loading && objects.length === 0 && (
              <p className="memory-state">
                Register an ORYBIT object first.
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
