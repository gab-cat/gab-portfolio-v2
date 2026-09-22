/** One switch for every 3D scene: the visitor's pause and reduced motion. */
type Listener = (paused: boolean) => void;

const listeners = new Set<Listener>();
let userPaused = false;

function reduced() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function isMotionPaused() {
  return userPaused || reduced();
}

export function isUserPaused() {
  return userPaused;
}

export function setMotionPaused(value: boolean) {
  userPaused = value;
  listeners.forEach((listener) => listener(isMotionPaused()));
}

export function onMotionChange(listener: Listener) {
  listeners.add(listener);
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  const sync = () => listener(isMotionPaused());
  query.addEventListener("change", sync);
  return () => {
    listeners.delete(listener);
    query.removeEventListener("change", sync);
  };
}
