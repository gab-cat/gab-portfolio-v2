/**
 * The bridge between pages and the particle field. Pages say which figure
 * they want; the field (loaded later, in its own chunk) picks up
 * the latest request whenever it arrives.
 */

/** Every particle carries one destination per figure. */
export const FIGURE = {
  horizon: 0,
  wave: 1,
  lattice: 2,
  globe: 3,
  trophy: 4,
  field: 5,
  hello: 6,
  lost: 7,
  lissajous: 8,
} as const;

export const FIGURES = 9;

export type Scene = {
  /** How much of each figure to show; the field eases toward it. */
  weights: number[];
  /** 0 calm, 1 a storm of noise. Hides the seams between figures. */
  chaos: number;
  /** Overall opacity, for when copy needs the room. */
  dim: number;
  /** Scale the whole field (1 is the layout's size) and slide it sideways, for pages with wider copy. */
  zoom?: number;
  shift?: number;
  /**
   * Which page's placements to use. The home page spreads its chapters out
   * on wide screens; the contact page keeps its figures beside the form.
   */
  layout?: "home" | "contact";
};

/** Screens roomy enough for the home page's spread-out chapters. signal.css uses the same query. */
export const WIDE = "(min-width: 1024px) and (min-aspect-ratio: 11/10)";

export type FieldController = {
  set: (scene: Scene) => void;
  /** A one-off shove of noise that decays on its own: a send, an error. */
  kick: (amount: number) => void;
  /** Height of the waveform figure (1 its natural shape, near 0 a flat line), and how clearly the contact page's Lissajous curve comes through. */
  level: (value: number) => void;
  /** A ripple along the waveform and the Lissajous curve, like a keystroke landing. */
  beat: (amount: number) => void;
  /** Light up one of the seven lights circling the wins trophy (its row is hovered), or none. */
  focus: (index: number | null) => void;
  dispose: () => void;
};

export function only(figure: number, chaos = 0, dim = 1): Scene {
  const weights = new Array(FIGURES).fill(0);
  weights[figure] = 1;
  return { weights, chaos, dim };
}

export const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

let field: FieldController | null = null;
let latest: Scene = only(FIGURE.horizon);
let latestLevel = 1;

export const signal = {
  show(scene: Scene) {
    latest = scene;
    field?.set(scene);
  },
  kick(amount: number) {
    field?.kick(amount);
  },
  level(value: number) {
    latestLevel = value;
    field?.level(value);
  },
  beat(amount: number) {
    field?.beat(amount);
  },
  focus(index: number | null) {
    field?.focus(index);
  },
};

/** Called by the frame once the field exists; returns the detach. */
export function attach(controller: FieldController) {
  field = controller;
  controller.set(latest);
  controller.level(latestLevel);
  return () => {
    if (field === controller) field = null;
  };
}
