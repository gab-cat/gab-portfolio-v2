import { useEffect, useRef, useState } from "react";
import { EMAIL, SOCIALS } from "../data";
import { scrollToTop } from "../lib/lenis";
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
    <section id="hello" className="hello-section">
      <div className="studio-container">
        <Reveal>
          <div className="hello-top">
            <span>There’s always another what if.</span>
            <span className="availability">
              <i /> Open to the next good thing
            </span>
          </div>
          <div className="hello-closing">
            <a className="hello-headline" href={`mailto:${EMAIL}`}>
              <span>
                What if we
                <br />
                <em>made something?</em>
              </span>
              <span className="hello-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
            <Sculpture chapter="together" />
          </div>
          <div className="hello-details">
            <p>
              A project, a role, or an interesting conversation.
              <br />
              My inbox is open. I actually reply.
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
        <footer>
          <a className="footer-brand" href="#top">
            gabcat<span>®</span>
          </a>
          <div className="footer-socials">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
              >
                {social.label} ↗
              </a>
            ))}
          </div>
          <button onClick={scrollToTop}>Back to top ↑</button>
        </footer>
        <div className="footer-bottom">
          <span>© 2026 Gabriel Catimbang</span>
          <span>From Naga City, with curiosity.</span>
        </div>
      </div>
    </section>
  );
}
