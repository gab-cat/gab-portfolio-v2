import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LIMITS, TOPICS, noteProgress, useContactForm, type FormStatus } from "../../../lib/contact-form";
import { Link } from "../../../lib/router";
import { scrollToTop } from "../../../lib/scroll";
import { EMAIL } from "../content";
import { Lines, Rise } from "../reveal";
import { FIGURE, only, signal, smoothstep } from "../scene/stage";

const READOUT = ["No signal yet", "Picking you up", "Coming through", "Almost clear", "Loud and clear"];
const EASING = "cubic-bezier(0.19, 1, 0.22, 1)";
const [MIN_MESSAGE, MAX_MESSAGE] = LIMITS.message;

/** Only for `bun run dev`: lets the send sequence be replayed without posting anything. */
const SAMPLE = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "I have an idea for an engine that could weave algebraic patterns the way a loom weaves flowers and leaves. Could we talk?",
};

/**
 * A Lissajous curve tunes in while you write: a loose, noisy cloud when the
 * form is empty, pulling into a crisp knot as each field comes good, with a
 * ripple on every keystroke. Sending lifts the words off the page towards the
 * figure, which bursts into noise and re-forms the globe around Naga City.
 */
export default function Contact() {
  const form = useContactForm();
  const [demo, setDemo] = useState<FormStatus | null>(null);
  const status = demo ?? form.status;
  const { token, error, refresh, submit } = form;
  // "leaving" holds the form on screen while its words fly off; "sent" swaps in the reply.
  const [stage, setStage] = useState<"form" | "leaving" | "sent">("form");
  const [progress, setProgress] = useState(0);
  const [length, setLength] = useState(0);
  const [sentAt, setSentAt] = useState("");
  const copy = useRef<HTMLDivElement>(null);
  const exchange = useRef<HTMLDivElement>(null);
  const formEl = useRef<HTMLFormElement>(null);
  const sent = useRef<HTMLDivElement>(null);
  const before = useRef(0);
  const demoTimer = useRef(0);
  const figure = stage === "form" ? FIGURE.lissajous : FIGURE.globe;

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
    signal.level(stage !== "form" ? 1 : 0.16 + 0.84 * progress);
  }, [progress, stage]);

  // Give the waveform its natural shape back for the rest of the site.
  useEffect(
    () => () => {
      signal.level(1);
      window.clearTimeout(demoTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (status === "sent") setStage((now) => (now === "form" ? "leaving" : now));
    else setStage("form");
    if (status === "error") signal.kick(0.45);
  }, [status]);

  // The words lift off, then the space they took eases down to the reply.
  useEffect(() => {
    const el = formEl.current;
    if (stage !== "leaving" || !el) return;
    let live = true;
    signal.kick(1.1);
    void transmit(el).then(() => {
      if (!live) return;
      before.current = exchange.current?.offsetHeight ?? 0;
      setSentAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      setStage("sent");
    });
    return () => {
      live = false;
    };
  }, [stage]);

  useLayoutEffect(() => {
    const box = exchange.current;
    if (stage !== "sent" || !box) return;
    sent.current?.focus({ preventScroll: true });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    box.animate([{ height: `${before.current}px` }, { height: `${box.offsetHeight}px` }], {
      duration: 1100,
      easing: EASING,
    });
    if (copy.current && copy.current.getBoundingClientRect().top < 0) scrollToTop();
  }, [stage]);

  const sendDemo = () => {
    const el = formEl.current;
    if (!el) return;
    for (const [name, value] of Object.entries(SAMPLE)) {
      const field = el.elements.namedItem(name);
      if ((field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) && !field.value) field.value = value;
    }
    const message = el.elements.namedItem("message");
    if (message instanceof HTMLTextAreaElement) {
      grow(message);
      setLength(message.value.length);
    }
    setProgress(noteProgress(el));
    setDemo("sending");
    demoTimer.current = window.setTimeout(() => setDemo("sent"), 1400);
  };

  const bars = stage !== "form" ? 4 : progress >= 1 ? 4 : progress >= 0.6 ? 3 : progress >= 0.3 ? 2 : progress > 0 ? 1 : 0;
  const readout = status === "sending" ? "Transmitting" : status === "error" ? "Lost the signal" : READOUT[bars];
  const toGo = MIN_MESSAGE - length;

  return (
    <main id="main" tabIndex={-1}>
      <section className="sg-sec sg-contact" aria-labelledby="contact-title">
        <div className="sg-copy" ref={copy}>
          <Rise as="p" className="sg-label">
            Contact
          </Rise>
          <Lines as="h1" id="contact-title" className="sg-h1" lines={["Send a", "signal."]} delay={0.05} />
          <Rise as="p" className="sg-lede" delay={0.25}>
            A rough idea is a perfectly good place to start.
          </Rise>

          <Rise delay={0.35}>
            <div className="sg-exchange" ref={exchange}>
              {stage === "sent" ? (
                <div className="sg-sent" ref={sent} tabIndex={-1} role="status">
                  <Rise as="p" className="sg-stamp" delay={0.1}>
                    <i aria-hidden="true" />
                    Received{sentAt && ` · ${sentAt}`}
                  </Rise>
                  <Lines as="h2" lines={["It’s in", "my inbox."]} delay={0.15} />
                  <Rise as="p" delay={0.35}>
                    Thanks for reaching out. I’ll reply to the email address you shared.
                  </Rise>
                  <Rise className="sg-actions" delay={0.45}>
                    <Link className="sg-btn" href="/">
                      Back home
                    </Link>
                  </Rise>
                </div>
              ) : (
                <form
                  ref={formEl}
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
                  <fieldset className="sg-fields" disabled={status === "sending" || stage !== "form"}>
                    <legend className="sg-sr">Your message</legend>
                    <label className="sg-field" htmlFor="contact-name">
                      <span>Your name</span>
                      <input
                        id="contact-name"
                        name="name"
                        placeholder=" "
                        autoComplete="name"
                        required
                        minLength={LIMITS.name[0]}
                        maxLength={LIMITS.name[1]}
                      />
                    </label>
                    <label className="sg-field" htmlFor="contact-email">
                      <span>Your email</span>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        placeholder=" "
                        autoComplete="email"
                        required
                        maxLength={LIMITS.email[1]}
                      />
                    </label>
                    <fieldset className="sg-topics">
                      <legend>About</legend>
                      {TOPICS.map((topic, i) => (
                        <label key={topic}>
                          <input type="radio" name="topic" value={topic} defaultChecked={i === 0} required />
                          <span>{topic}</span>
                        </label>
                      ))}
                    </fieldset>
                    <label className="sg-field is-full" htmlFor="contact-message">
                      <span>Tell me a little about it</span>
                      <textarea
                        id="contact-message"
                        name="message"
                        placeholder=" "
                        required
                        minLength={MIN_MESSAGE}
                        maxLength={MAX_MESSAGE}
                        rows={3}
                        aria-describedby="contact-hint"
                        onChange={(event) => {
                          grow(event.target);
                          setLength(event.target.value.length);
                        }}
                      />
                      <em className="sg-count" aria-hidden="true">
                        {toGo > 0 ? `${toGo} to go` : `${length.toLocaleString()} / ${MAX_MESSAGE.toLocaleString()}`}
                      </em>
                    </label>
                    <p id="contact-hint" className="sg-sr">
                      A few sentences is plenty. At least {MIN_MESSAGE} characters.
                    </p>
                    <div className="sg-trap" aria-hidden="true">
                      <label htmlFor="contact-website">
                        Leave this empty
                        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
                      </label>
                    </div>
                  </fieldset>

                  {error && !demo && (
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
                      disabled={!token || status === "sending" || status === "loading" || stage !== "form"}
                    >
                      {status === "sending" ? "Sending…" : status === "loading" ? "Getting ready…" : "Send my note"}
                    </button>
                    <span className={status === "sending" ? "sg-meter is-busy" : "sg-meter"}>
                      <span className="sg-bars" aria-hidden="true">
                        {[0, 1, 2, 3].map((i) => (
                          <i key={i} className={i < bars ? "is-on" : undefined} />
                        ))}
                      </span>
                      {readout}
                    </span>
                  </div>
                  <p className="sg-alt">
                    Or write to <a href={`mailto:${EMAIL}`}>{EMAIL}</a>. Your details are only ever used to reply.
                  </p>
                </form>
              )}
            </div>
          </Rise>
        </div>
      </section>

      {import.meta.env.DEV &&
        typeof document !== "undefined" &&
        // On <body> so it floats over the footer, which stacks above <main>.
        createPortal(
          <button
            type="button"
            className="sg-devsend"
            disabled={stage === "leaving" || status === "sending"}
            onClick={() => {
              if (stage === "sent") setDemo(null);
              else sendDemo();
            }}
          >
            dev · {stage === "sent" ? "reset form" : "test send"}
          </button>,
          document.body,
        )}
    </main>
  );
}

/** Lets the message box grow with what's written, so the page scrolls instead of the box. */
function grow(box: HTMLTextAreaElement) {
  box.style.height = "auto";
  box.style.height = `${box.scrollHeight}px`;
}

/**
 * Lifts what was typed off each field, letter by letter from the left, and
 * streams it up and away towards the figure while the rest of the form
 * dissolves. Resolves once the form reads as empty.
 */
function transmit(form: HTMLFormElement): Promise<void> {
  form.classList.add("is-leaving");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return new Promise((done) => window.setTimeout(done, 350));
  }

  // A second pass (StrictMode re-running the effect) starts over rather than doubling the letters.
  form.querySelector(".sg-dust")?.remove();
  const layer = document.createElement("div");
  layer.className = "sg-dust";
  layer.setAttribute("aria-hidden", "true");
  form.append(layer);

  const origin = form.getBoundingClientRect();
  const narrow = window.innerWidth < 820;
  const pieces: HTMLElement[] = [];

  for (const control of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(".sg-field input, .sg-field textarea")) {
    if (!control.value) continue;
    const box = control.getBoundingClientRect();
    const style = getComputedStyle(control);
    const mirror = document.createElement("div");
    Object.assign(mirror.style, {
      left: `${box.left - origin.left}px`,
      top: `${box.top - origin.top}px`,
      width: `${box.width}px`,
      padding: style.padding,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      fontStretch: style.fontStretch,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      whiteSpace: control instanceof HTMLTextAreaElement ? "pre-wrap" : "pre",
    });
    // Long notes go word by word; a few thousand animated letters would stutter.
    const byLetter = control.value.length <= 480;
    for (const part of control.value.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        mirror.append(part);
        continue;
      }
      const word = document.createElement("span");
      word.className = "sg-word";
      if (byLetter) {
        for (const letter of part) {
          const bit = document.createElement("span");
          bit.textContent = letter;
          word.append(bit);
          pieces.push(bit);
        }
      } else {
        word.textContent = part;
        pieces.push(word);
      }
      mirror.append(word);
    }
    layer.append(mirror);
  }

  const total = pieces.length;
  const soft = total < 260;
  const flights = pieces.map((piece, i) => {
    const drift = Math.random();
    // Up and to the right, towards the figure; straight up on phones, where it sits above the form.
    const dx = narrow ? (drift - 0.5) * 120 : 80 + drift * 260;
    const dy = narrow ? -(140 + Math.random() * 220) : -(30 + Math.random() * 150);
    return piece.animate(
      [
        { transform: "translate(0, 0)", opacity: 1, color: "var(--ink)", filter: soft ? "blur(0px)" : "none" },
        { opacity: 1, color: "var(--accent)", offset: 0.25 },
        {
          transform: `translate(${dx}px, ${dy}px) scale(${0.3 + Math.random() * 0.4})`,
          opacity: 0,
          color: "var(--accent)",
          filter: soft ? "blur(4px)" : "none",
        },
      ],
      {
        duration: 700 + Math.random() * 500,
        // A sweep from the first letter to the last, loosened so it never looks like a typewriter.
        delay: (i / Math.max(1, total)) * 520 + Math.random() * 140,
        easing: "cubic-bezier(0.55, 0, 0.8, 0.35)",
        fill: "both",
      },
    );
  });

  const settle = new Promise((done) => window.setTimeout(done, 900));
  return Promise.all([settle, ...flights.map((flight) => flight.finished.catch(() => undefined))]).then(() => undefined);
}
