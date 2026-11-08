import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The contact form's conversation with /api/contact, for any design to draw:
 * fetch a one-time token, then post the fields with it. Mirrors the rules in
 * server/contact.ts.
 */

export type FormStatus = "loading" | "ready" | "sending" | "sent" | "error";

export const TOPICS = ["A project", "A role", "A collaboration", "Something else"] as const;

export const LIMITS = { name: [2, 80], email: [3, 254], message: [20, 5000] } as const;

/** An outage page instead of JSON should read as "unavailable", not as a parser error. */
async function readJson(res: Response): Promise<{ token?: unknown; ok?: unknown; error?: string }> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

/** The server turns away a token younger than this (a bot fills a form instantly) or older than TOKEN_LIFE. */
const TOKEN_MIN_AGE = 3200;
const TOKEN_LIFE = 29 * 60 * 1000;

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

/**
 * The send button is live from the first paint: a token is fetched quietly on
 * load, and if it is missing, spent or stale when the visitor sends, a fresh
 * one is fetched and allowed to age before the note goes. Nothing on the page
 * waits on it.
 */
export function useContactForm() {
  const [status, setStatus] = useState<FormStatus>("loading");
  const [error, setError] = useState("");
  const token = useRef<{ value: string; at: number } | null>(null);
  const fetching = useRef<Promise<{ value: string; at: number }> | null>(null);
  const busy = useRef(false);
  const request = useRef<AbortController | null>(null);

  /** The token for the next send: the one held, the one on its way, or a new one. */
  const ensureToken = useCallback(() => {
    const held = token.current;
    if (held && Date.now() - held.at < TOKEN_LIFE) return Promise.resolve(held);
    token.current = null;
    fetching.current ??= (async () => {
      try {
        const res = await fetch("/api/contact", { cache: "no-store" });
        const data = await readJson(res);
        if (!res.ok || typeof data.token !== "string") throw new Error(data.error || "The form is unavailable right now. You can still email me directly.");
        token.current = { value: data.token, at: Date.now() };
        return token.current;
      } catch (cause) {
        throw cause instanceof Error && cause.message !== "Failed to fetch" ? cause : new Error("Couldn’t reach the server. Check your connection and try again.");
      } finally {
        fetching.current = null;
      }
    })();
    return fetching.current;
  }, []);

  useEffect(() => {
    let live = true;
    // A failure here stays quiet: sending tries again, and says so if it fails then.
    const settle = () => live && setStatus((now) => (now === "loading" ? "ready" : now));
    ensureToken().then(settle, settle);
    return () => {
      live = false;
      request.current?.abort();
    };
  }, [ensureToken]);

  const submit = useCallback(
    async (form: HTMLFormElement) => {
      if (busy.current) return;
      busy.current = true;
      setStatus("sending");
      setError("");
      const values = Object.fromEntries(new FormData(form));
      const controller = new AbortController();
      request.current = controller;
      try {
        const pass = await ensureToken();
        const young = TOKEN_MIN_AGE - (Date.now() - pass.at);
        if (young > 0) await wait(young);
        if (controller.signal.aborted) return;
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, token: pass.value }),
          signal: controller.signal,
        });
        const data = await readJson(res);
        // A token is good for one note; a refused one is dropped so the next try fetches a fresh one.
        if (res.ok || res.status === 400 || res.status === 409) token.current = null;
        if (!res.ok || data.ok !== true) throw new Error(data.error || "Your message couldn’t be sent. Please try again.");
        setStatus("sent");
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Couldn’t connect. Please try again.");
        setStatus("error");
      } finally {
        busy.current = false;
      }
    },
    [ensureToken],
  );

  return { status, error, submit };
}

/** How complete the note is, 0 to 1: a fifth for the name, a fifth for the email, the rest for the message. */
export function noteProgress(form: HTMLFormElement): number {
  const data = new FormData(form);
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const message = String(data.get("message") ?? "").trim();
  const progress =
    (name.length >= LIMITS.name[0] ? 0.2 : name.length * 0.08) +
    (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 0.2 : Math.min(email.length, 6) * 0.02) +
    (Math.min(message.length, LIMITS.message[0]) / LIMITS.message[0]) * 0.6;
  return Math.min(1, progress);
}

export type NoteField = "name" | "email" | "message";

/** The server's email rule (server/contact.ts), so a note it would turn away is caught before it goes. */
const EMAIL_RULE = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,63}$/i;

/** What one field still needs, in plain words, or "" when it is good to go. */
export function checkField(field: NoteField, raw: string): string {
  const value = raw.trim();
  if (field === "name") {
    if (!value) return "Write your name, so I know who to reply to.";
    return value.length < LIMITS.name[0] ? "Write your name, at least two letters." : "";
  }
  if (field === "email") {
    if (!value) return "Write your email address, so I can reply.";
    return EMAIL_RULE.test(value) && !value.includes("..") ? "" : "Write a full email address, with an @ and a domain after it.";
  }
  const short = LIMITS.message[0] - value.length;
  if (!value) return "Tell me a little about it. A few sentences is plenty.";
  return short > 0 ? `A little more, please: ${short} more character${short === 1 ? "" : "s"}.` : "";
}

/** Every field that still needs something, in the order they appear. */
export function checkNote(form: HTMLFormElement): Partial<Record<NoteField, string>> {
  const data = new FormData(form);
  const found: Partial<Record<NoteField, string>> = {};
  for (const field of ["name", "email", "message"] as const) {
    const problem = checkField(field, String(data.get(field) ?? ""));
    if (problem) found[field] = problem;
  }
  return found;
}
