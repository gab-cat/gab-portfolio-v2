import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { PostboxController } from "../lib/clay/postbox";
import { EMAIL } from "../data";
import { Link } from "../lib/router";
import { Reveal } from "./Reveal";

const TOPICS = ["A project", "A role", "A collaboration", "Something else"];

export function Contact() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "sending" | "sent" | "error">("loading");
  const [error, setError] = useState("");
  const [messageLength, setMessageLength] = useState(0);
  const busy = useRef(false);
  const request = useRef<AbortController | null>(null);
  const success = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const column = useRef<HTMLDivElement>(null);
  const postbox = useRef<PostboxController | null>(null);
  const noteState = useRef({ progress: 0, topic: 0 });
  const [stageReady, setStageReady] = useState(false);
  const [noteProgress, setNoteProgress] = useState(0);
  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setStatus("loading");
    setError("");
    setToken("");
    try {
      const res = await fetch("/api/contact", { signal: controller.signal, cache: "no-store" });
      const data = await res.json();
      if (!res.ok || typeof data.token !== "string") throw new Error(data.error || "The form is unavailable. You can still email me directly.");
      setToken(data.token);
      setStatus("ready");
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Couldn’t connect. Please try again.");
      setStatus("error");
    }
  }, []);
  useEffect(() => { void refresh(); return () => request.current?.abort(); }, [refresh]);
  useEffect(() => { if (status === "sent") success.current?.focus(); }, [status]);
  useEffect(() => {
    let cancelled = false;
    import("../lib/clay/postbox")
      .then(({ createPostbox }) => {
        if (cancelled || !stage.current) return;
        postbox.current = createPostbox(stage.current, { onReady: () => setStageReady(true), column: column.current });
        postbox.current?.setTopic(noteState.current.topic);
        postbox.current?.setProgress(noteState.current.progress);
      })
      .catch(() => setStageReady(false));
    return () => {
      cancelled = true;
      postbox.current?.dispose();
      postbox.current = null;
    };
  }, []);
  useEffect(() => {
    if (status === "sent") postbox.current?.send();
    if (status === "error") postbox.current?.shake();
  }, [status]);
  // The 3D note mirrors the form: each valid field writes another line.
  const trackNote = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const topic = Math.max(0, TOPICS.indexOf(String(data.get("topic") ?? "")));
    const progress =
      (name.length >= 2 ? 0.2 : name.length * 0.08) +
      (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 0.2 : Math.min(email.length, 6) * 0.02) +
      Math.min(message.length, 20) / 20 * 0.6;
    const value = Math.min(1, progress);
    noteState.current = { progress: value, topic };
    setNoteProgress(value);
    postbox.current?.setProgress(value);
    postbox.current?.setTopic(topic);
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || !token) return;
    busy.current = true;
    setStatus("sending");
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const controller = new AbortController();
    request.current = controller;
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, token }), signal: controller.signal });
      const data = await res.json();
      if (!res.ok || data.ok !== true) {
        if (res.status === 400 || res.status === 409) setToken("");
        throw new Error(data.error || "Your message couldn’t be sent. Please try again.");
      }
      setStatus("sent");
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Couldn’t connect. Please try again.");
      setStatus("error");
    } finally { busy.current = false; }
  }
  return (
    <section className={`contact-world-page ${stageReady ? "is-live" : ""}`} aria-labelledby="contact-title">
      <div className="contact-world" aria-hidden="true">
        <div className="contact-sky" />
        <div className="contact-world-fallback"><span /><i /></div>
        <div ref={stage} className="contact-world-canvas" />
      </div>
      <div className="contact-hud" aria-hidden="true">
        <div className="contact-hud-top">
          <span className="stage-chip"><i /> Your note, live</span>
          <span className="stage-hint">Drag the sky to spin the island · poke the mailbox</span>
        </div>
        <div className="contact-stage-meter">
          <span>{status === "sent" ? "Delivered. Planes away!" : noteProgress >= 1 ? "Sealed and ready" : noteProgress > 0 ? "Writing…" : "Blank page"}</span>
          <b><i style={{ width: `${Math.round((status === "sent" ? 1 : noteProgress) * 100)}%` }} /></b>
        </div>
      </div>
      <Link className="contact-back" href="/">← Back to the story</Link>
      <div ref={column} className="contact-column">
      <Reveal className="contact-paper">
        <header className="contact-head">
          <p className="chapter-label">A good thing starts with a hello.</p>
          <h1 id="contact-title">What’s on <em>your mind?</em></h1>
          <p className="contact-premise">A rough idea is a perfectly good place to start. Tell me what you’re thinking. We’ll take it from there.</p>
          <p className="contact-links"><a className="contact-direct" href={`mailto:${EMAIL}`}>{EMAIL} ↗</a><span className="contact-location">From Naga City, wherever your idea takes us.</span></p>
        </header>
        {status === "sent" ? (
          <div className="contact-success" ref={success} tabIndex={-1} role="status"><span aria-hidden="true">↗</span><h2>It’s in<br /><em>my inbox.</em></h2><p>Thanks for reaching out. I’ll reply to the email address you shared.</p><Link className="contact-send" href="/">Back to the story <span aria-hidden="true">↗</span></Link></div>
        ) : (
          <form onSubmit={submit} aria-busy={status === "sending"} onInput={event => trackNote(event.currentTarget)} onChange={event => trackNote(event.currentTarget)}>
            <fieldset disabled={status === "sending"} className="contact-fields">
              <legend className="sr-only">Your message</legend>
              <label htmlFor="contact-name">Your name<input id="contact-name" name="name" placeholder="What should I call you?" autoComplete="name" required minLength={2} maxLength={80} /></label>
              <label htmlFor="contact-email">Your email<input id="contact-email" name="email" type="email" placeholder="Where I can write back" autoComplete="email" required maxLength={254} /></label>
              <fieldset className="contact-topics"><legend>What brings you here?</legend><div>{TOPICS.map((topic, i) => <label key={topic}><input type="radio" name="topic" value={topic} defaultChecked={i === 0} required /><span>{topic}</span></label>)}</div></fieldset>
              <label htmlFor="contact-message">Tell me a little about it<textarea id="contact-message" name="message" placeholder="The idea, the challenge, the thing you can’t stop thinking about…" required minLength={20} maxLength={5000} rows={5} aria-describedby="message-hint" onChange={event => setMessageLength(event.target.value.length)} /></label>
              <div id="message-hint" className="message-hint"><span>A few sentences is plenty. At least 20 characters.</span><span>{messageLength.toLocaleString()} / 5,000</span></div>
              <div className="contact-trap" aria-hidden="true"><label htmlFor="contact-website">Leave this empty<input id="contact-website" name="website" tabIndex={-1} autoComplete="off" /></label></div>
            </fieldset>
            {error && <div className="contact-error" role="alert"><p>{error}</p>{!token && <button type="button" onClick={() => void refresh()}>Refresh form ↻</button>}</div>}
            <button className="contact-send" type="submit" disabled={!token || status === "sending" || status === "loading"}><span>{status === "sending" ? "Sending your note…" : status === "loading" ? "Getting things ready…" : "Send my note"}</span><span aria-hidden="true">↗</span></button>
            <p className="contact-privacy">Just between us. Your details are used to reply to this message, never added to a mailing list.</p>
          </form>
        )}
      </Reveal>
      </div>
    </section>
  );
}
