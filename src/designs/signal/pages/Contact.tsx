import { useEffect, useRef, useState } from "react";
import { TOPICS, noteProgress, useContactForm } from "../../../lib/contact-form";
import { Link } from "../../../lib/router";
import { EMAIL } from "../content";
import { Lines, Rise } from "../reveal";
import { FIGURE, only, signal, smoothstep } from "../scene/stage";

const READOUT = ["No signal yet", "Picking you up", "Coming through", "Almost clear", "Loud and clear"];

/**
 * The waveform listens while you write: flat when the form is empty, taller
 * as each field comes good, with a ripple on every keystroke. Sending bursts
 * it into noise and re-forms the globe around Naga City.
 */
export default function Contact() {
  const { token, status, error, refresh, submit } = useContactForm();
  const [progress, setProgress] = useState(0);
  const [length, setLength] = useState(0);
  const copy = useRef<HTMLDivElement>(null);
  const sent = useRef<HTMLDivElement>(null);
  const figure = status === "sent" ? FIGURE.globe : FIGURE.wave;

  // Hold the figure; on phones it sits above the form, so fade it back as the form scrolls up.
  useEffect(() => {
    let raf = 0;
    // Measured when the layout changes, not every frame.
    let copyTop = 0;
    const measure = () => {
      copyTop = (copy.current?.getBoundingClientRect().top ?? 0) + window.scrollY;
    };
    measure();
    const resized = new ResizeObserver(measure);
    resized.observe(document.body);
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const vh = window.innerHeight;
      const top = copyTop - window.scrollY;
      const narrow = window.innerWidth < 820;
      const dim = narrow ? 0.1 + 0.9 * smoothstep(vh * 0.14, vh * 0.5, top) : 1;
      // The form is wider than a chapter's copy, so the figure steps back and to the right.
      signal.show({ ...only(figure, 0, dim), zoom: narrow ? 1 : 0.84, shift: narrow ? 0 : 0.3, layout: "contact" });
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      resized.disconnect();
    };
  }, [figure]);

  useEffect(() => {
    signal.level(status === "sent" ? 1 : 0.16 + 0.84 * progress);
  }, [progress, status]);

  // Give the waveform its natural shape back for the rest of the site.
  useEffect(() => () => signal.level(1), []);

  useEffect(() => {
    if (status === "sent") {
      signal.kick(1.1);
      sent.current?.focus();
    }
    if (status === "error") signal.kick(0.45);
  }, [status]);

  const bars = status === "sent" ? 4 : progress >= 1 ? 4 : progress >= 0.6 ? 3 : progress >= 0.3 ? 2 : progress > 0 ? 1 : 0;
  const readout = status === "sending" ? "Transmitting" : status === "error" ? "Lost the signal" : READOUT[bars];

  return (
    <main id="main" tabIndex={-1}>
      <section className="sg-sec sg-contact" aria-labelledby="contact-title">
        <div className="sg-copy" ref={copy}>
          <Rise as="p" className="sg-label">
            Contact
          </Rise>
          <Lines as="h1" id="contact-title" className="sg-h1" lines={["Send a", "signal."]} delay={0.05} />
          <Rise as="p" className="sg-lede" delay={0.25}>
            A rough idea is a perfectly good place to start. Tell me what you’re thinking, and we’ll take it from
            there.
          </Rise>
          <Rise as="p" className="sg-direct" delay={0.3}>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <span>Naga City, PH</span>
          </Rise>

          {status === "sent" ? (
            <div className="sg-sent" ref={sent} tabIndex={-1} role="status">
              <h2>It’s in my inbox.</h2>
              <p>Thanks for reaching out. I’ll reply to the email address you shared.</p>
              <div className="sg-actions">
                <Link className="sg-btn" href="/">
                  Back home
                </Link>
              </div>
            </div>
          ) : (
            <Rise delay={0.4}>
              <form
                className="sg-form"
                aria-busy={status === "sending"}
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit(event.currentTarget);
                }}
                onInput={(event) => {
                  setProgress(noteProgress(event.currentTarget));
                  signal.beat(0.35);
                }}
              >
                <fieldset className="sg-fields" disabled={status === "sending"}>
                  <legend className="sg-sr">Your message</legend>
                  <label className="sg-field" htmlFor="contact-name">
                    <span>Your name</span>
                    <input
                      id="contact-name"
                      name="name"
                      placeholder="What should I call you?"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={80}
                    />
                  </label>
                  <label className="sg-field" htmlFor="contact-email">
                    <span>Your email</span>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      placeholder="Where I can write back"
                      autoComplete="email"
                      required
                      maxLength={254}
                    />
                  </label>
                  <fieldset className="sg-topics">
                    <legend>What brings you here?</legend>
                    <div>
                      {TOPICS.map((topic, i) => (
                        <label key={topic}>
                          <input type="radio" name="topic" value={topic} defaultChecked={i === 0} required />
                          <span>{topic}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className="sg-field is-full" htmlFor="contact-message">
                    <span>Tell me a little about it</span>
                    <textarea
                      id="contact-message"
                      name="message"
                      placeholder="The idea, the challenge, the thing you can’t stop thinking about"
                      required
                      minLength={20}
                      maxLength={5000}
                      rows={5}
                      aria-describedby="contact-hint"
                      data-lenis-prevent
                      onChange={(event) => setLength(event.target.value.length)}
                    />
                  </label>
                  <p id="contact-hint" className="sg-hint">
                    <span>A few sentences is plenty. At least 20 characters.</span>
                    <span>{length.toLocaleString()} / 5,000</span>
                  </p>
                  <div className="sg-trap" aria-hidden="true">
                    <label htmlFor="contact-website">
                      Leave this empty
                      <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>
                </fieldset>

                {error && (
                  <div className="sg-error" role="alert">
                    <p>{error}</p>
                    {!token && (
                      <button type="button" onClick={() => void refresh()}>
                        Refresh the form
                      </button>
                    )}
                  </div>
                )}

                <div className="sg-send">
                  <button
                    className="sg-btn is-solid is-big"
                    type="submit"
                    disabled={!token || status === "sending" || status === "loading"}
                  >
                    {status === "sending" ? "Sending…" : status === "loading" ? "Getting ready…" : "Send my note"}
                  </button>
                  <span className="sg-meter">
                    <span className="sg-bars" aria-hidden="true">
                      {[0, 1, 2, 3].map((i) => (
                        <i key={i} className={i < bars ? "is-on" : undefined} />
                      ))}
                    </span>
                    {readout}
                  </span>
                </div>
                <p className="sg-privacy">
                  Just between us. Your details are used to reply to this message, never added to a mailing list.
                </p>
              </form>
            </Rise>
          )}
        </div>
      </section>
    </main>
  );
}
