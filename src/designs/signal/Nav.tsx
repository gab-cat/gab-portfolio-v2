import { Moon, Pause, Play, Sun } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { isUserPaused, onMotionChange, setMotionPaused } from "../../lib/motion";
import { Link, useRouter } from "../../lib/router";
import { toggleTheme, useTheme } from "../../lib/theme";

function usePaused() {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    setPaused(isUserPaused());
    return onMotionChange(() => setPaused(isUserPaused()));
  }, []);
  return paused;
}

export function Nav() {
  const { route } = useRouter();
  const theme = useTheme();
  const paused = usePaused();
  const themeButton = useRef<HTMLButtonElement>(null);

  const flipTheme = () => {
    const box = themeButton.current?.getBoundingClientRect();
    toggleTheme(box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : undefined);
  };

  return (
    <header className="sg-nav">
      <Link href="/" className="sg-mark">
        Gabriel Catimbang
      </Link>
      <nav className="sg-links" aria-label="Main">
        <Link href="/#story" className="is-extra">
          About
        </Link>
        <Link href="/#work">Work</Link>
        <Link href="/contact" aria-current={route === "contact" ? "page" : undefined}>
          Contact
        </Link>
      </nav>
      <div className="sg-tools">
        <button
          type="button"
          className="sg-icon"
          aria-label={paused ? "Play the particles" : "Pause the particles"}
          aria-pressed={paused}
          onClick={() => setMotionPaused(!paused)}
        >
          {paused ? <Play size={17} weight="bold" /> : <Pause size={17} weight="bold" />}
        </button>
        <button
          ref={themeButton}
          type="button"
          className="sg-icon"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={flipTheme}
        >
          {theme === "dark" ? <Moon size={17} weight="bold" /> : <Sun size={17} weight="bold" />}
        </button>
      </div>
    </header>
  );
}
