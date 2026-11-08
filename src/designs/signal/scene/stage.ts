import { TROPHIES } from "../../../data";

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
  world: 5,
  hello: 6,
  lost: 7,
  lissajous: 8,
  sea: 9,
} as const;

export const FIGURES = 10;

/** One light circles the wins trophy per award in src/data.ts. */
export const LIGHTS = TROPHIES.length;

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
  /**
   * The world a project gets: a band on the planet for each thing built, a
   * ringlet for each tool it was built with, a moon for each result. The seed
   * sets its tilt, its storm and where each ring and moon sits, so the same
   * project always gets the same world. Changing it reshapes the planet in place.
   */
  world?: World;
  /** How far the world's page has scrolled past its resting place, in CSS pixels; the planet goes up with it. */
  lift?: number;
};

export type World = { seed: string; bands: number; rings: number; moons: number };

/**
 * The footer's sea, which every page ends on: how much of the footer is in
 * view (0 to 1) and where its horizon, sky and bottom edge are on screen, in
 * CSS pixels from the top of the viewport.
 */
export type Ending = { amount: number; horizon: number; sky: number; bottom: number };

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
  /**
   * Light up one of the lights circling the wins trophy, or one band of the
   * work planet (its line is hovered), or none. MOON_FOCUS + k lights moon k.
   */
  focus: (index: number | null) => void;
  /** Where the footer is, so the field can settle into the sea as it comes up. */
  ending: (ending: Ending) => void;
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

/** signal.focus(MOON_FOCUS + k) lights the work planet's moon k. */
export const MOON_FOCUS = 100;

let field: FieldController | null = null;
let latest: Scene = only(FIGURE.horizon);
let latestLevel = 1;
let latestEnding: Ending = { amount: 0, horizon: 0, sky: 0, bottom: 0 };

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
  ending(ending: Ending) {
    latestEnding = ending;
    field?.ending(ending);
  },
};

/** Called by the frame once the field exists; returns the detach. */
export function attach(controller: FieldController) {
  field = controller;
  controller.set(latest);
  controller.level(latestLevel);
  controller.ending(latestEnding);
  return () => {
    if (field === controller) field = null;
  };
}
