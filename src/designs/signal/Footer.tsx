import { Link } from "../../lib/router";
import { scrollToTop } from "../../lib/scroll";
import { EMAIL, SOCIALS } from "./content";

export function Footer() {
  return (
    <footer className="sg-foot">
      <div className="sg-foot-row">
        <p className="sg-foot-line">From Naga City, open to your next what if.</p>
        <nav aria-label="Elsewhere">
          <Link href="/contact">Contact</Link>
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          {SOCIALS.map((social) => (
            <a key={social.label} href={social.href} target="_blank" rel="noreferrer noopener">
              {social.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="sg-foot-row is-small">
        <span>© 2026 Gabriel Catimbang</span>
        <button type="button" onClick={scrollToTop}>
          Back to top
        </button>
      </div>
    </footer>
  );
}
