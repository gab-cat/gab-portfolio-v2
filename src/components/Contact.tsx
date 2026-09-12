import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { EMAIL } from "../data";
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
    <section className="contact-page studio-container" aria-labelledby="contact-title">
      <div className="contact-intro">
        <Reveal><a className="contact-back" href="/">← Back to the story</a><p className="chapter-label">A good thing starts with a hello.</p><h1 id="contact-title">What’s<br />on your<br /><em>mind?</em></h1></Reveal>
        <Reveal delay={.15}><p className="contact-premise">A rough idea is a perfectly good place to start. Tell me what you’re thinking. We’ll take it from there.</p><a className="contact-direct" href={`mailto:${EMAIL}`}>{EMAIL} ↗</a><p className="contact-location"><span aria-hidden="true">↗</span> From Naga City.<br />Wherever your idea takes us.</p></Reveal>
      </div>
      <Reveal className="contact-paper" delay={.18}>
        <div className="note-top"><span>A note to Gab</span><span className="note-stamp" aria-hidden="true">HELLO<br /><b>↗</b></span></div>
        {status === "sent" ? (
          <div className="contact-success" ref={success} tabIndex={-1} role="status"><span aria-hidden="true">↗</span><h2>It’s in<br /><em>my inbox.</em></h2><p>Thanks for reaching out. I’ll reply to the email address you shared.</p><a className="contact-send" href="/">Back to the story <span aria-hidden="true">↗</span></a></div>
        ) : (
          <form onSubmit={submit} aria-busy={status === "sending"}>
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
    </section>
  );
}
