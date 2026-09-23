import { useEffect, useRef, useState } from "react";
import { EMAIL } from "../data";
import { Sculpture } from "./Sculpture";
import { Link } from "../lib/router";
import { Reveal } from "./Reveal";

export function Hello() {
  const [copyStatus, setCopyStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copyEmail = async () => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopyStatus("Copied!");
    } catch {
      setCopyStatus("Couldn’t copy. Use the email link.");
    }
    timer.current = setTimeout(() => setCopyStatus(""), 3500);
  };
  return (
    <section id="hello" className="hello-tray">
      <div className="clay-container hello-inner">
        <Reveal className="hello-copy">
          <div className="hello-top">
            <span>There’s always another what if.</span>
            <span className="availability">
              <i /> Open to the next good thing
            </span>
          </div>
          <p className="hello-prelude">You’ve seen what curiosity can do.</p>
          <h2 className="hello-headline">
            Now, what’s <em>your what if?</em>
          </h2>
          <p className="hello-note">
            An idea worth building. A team worth joining. Tell me what you have
            in mind. I actually reply.
          </p>
          <div className="hello-actions">
            <Link className="btn btn-ink" href="/contact">
              Let’s make it happen <span aria-hidden="true">↗</span>
            </Link>
            <div className="email-group">
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              <button onClick={copyEmail} aria-label="Copy email address">
                Copy
              </button>
              <span role="status" className="copy-status">
                {copyStatus}
              </span>
            </div>
          </div>
        </Reveal>
        <Sculpture chapter="together" className="hello-mailbox" />
      </div>
    </section>
  );
}
