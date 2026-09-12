import { useEffect, useRef, useState } from "react";
import { EMAIL } from "../data";
import { Sculpture } from "./Sculpture";
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
    <section id="hello" className="hello-section hello-finale">
      <div className="studio-container finale-container">
        <Reveal className="finale-content">
          <div className="hello-top">
            <span>There’s always another what if.</span>
            <span className="availability">
              <i /> Open to the next good thing
            </span>
          </div>
          <div className="finale-stage">
            <p className="finale-prelude">You’ve seen what curiosity can do.</p>
            <h2 className="finale-headline">Now, what’s<br /><em>your what if?</em></h2>
            <div className="finale-orbit"><Sculpture chapter="together" /></div>
            <a className="finale-action" href="/contact">
              <span>Let’s make it happen</span><span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="hello-details">
            <p>
              An idea worth building. A team worth joining.
              <br />
              Tell me what you have in mind. I actually reply.
            </p>
            <div className="email-group">
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              <button onClick={copyEmail} aria-label="Copy email address">
                ↗ Copy
              </button>
              <span role="status" className="copy-status">
                {copyStatus}
              </span>
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
