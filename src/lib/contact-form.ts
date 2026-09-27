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

export function useContactForm() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<FormStatus>("loading");
  const [error, setError] = useState("");
  const busy = useRef(false);
  const request = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setStatus("loading");
    setError("");
    setToken("");
    try {
      const res = await fetch("/api/contact", { signal: controller.signal, cache: "no-store" });
      const data = await readJson(res);
      if (!res.ok || typeof data.token !== "string") throw new Error(data.error || "The form is unavailable. You can still email me directly.");
      setToken(data.token);
      setStatus("ready");
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Couldn’t connect. Please try again.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => request.current?.abort();
  }, [refresh]);

  const submit = useCallback(
    async (form: HTMLFormElement) => {
      if (busy.current || !token) return;
      busy.current = true;
      setStatus("sending");
      setError("");
      const values = Object.fromEntries(new FormData(form));
      const controller = new AbortController();
      request.current = controller;
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, token }),
          signal: controller.signal,
        });
        const data = await readJson(res);
        if (!res.ok || data.ok !== true) {
          if (res.status === 400 || res.status === 409) setToken("");
          throw new Error(data.error || "Your message couldn’t be sent. Please try again.");
        }
        setStatus("sent");
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "Couldn’t connect. Please try again.");
        setStatus("error");
      } finally {
        busy.current = false;
      }
    },
    [token],
  );

  return { token, status, error, refresh, submit };
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
