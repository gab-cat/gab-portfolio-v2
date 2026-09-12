import { EMAIL, SOCIALS } from "../data";
import { Reveal } from "./Reveal";
import { scrollToTop } from "../lib/lenis";

export function Footer() {
  return (
    <div className="footer-shell">
      <footer className="signature-footer" id="footer">
        <div className="studio-container">
          <Reveal className="footer-heading-row">
            <p>From Naga City.<br /><em>Open to your next what if.</em></p>
            <div className="footer-contact-block">
              <a className="footer-contact" href="/contact">Good things start here <span aria-hidden="true">↗</span></a>
              <a className="footer-email" href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </div>
          </Reveal>
          <div className="footer-navigation">
            <nav aria-label="Footer navigation"><a href="/#work">Selected work</a><a href="/#journey">Experience</a><a href="/contact">Contact</a></nav>
            <nav aria-label="Social profiles">{SOCIALS.map(s => <a key={s.label} href={s.href} target="_blank" rel="noreferrer">{s.label} ↗</a>)}</nav>
          </div>
          <Reveal y={35} className="footer-wordmark"><a href="/" aria-label="Gabcat home">gabcat<span>®</span><i aria-hidden="true">✳</i></a></Reveal>
          <div className="signature-colophon"><span>© {new Date().getFullYear()} Gabriel Catimbang</span><span>Built with intent. Always in progress.</span><button onClick={scrollToTop}>Back to top ↑</button></div>
        </div>
      </footer>
    </div>
  );
}
