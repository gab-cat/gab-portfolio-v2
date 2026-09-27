import { isMotionPaused, onMotionChange } from "../../../lib/motion";
import { THEME_EVENT } from "../../../lib/theme";
import { FIGURE, FIGURES, WIDE, only, type FieldController, type Scene } from "./stage";
import {
  GLSL_NOISE,
  breathe,
  createStage,
  damp,
  isDark,
  linked,
  lookAtOrigin,
  perspective,
  pointerOnPlane,
  program,
  rng,
  sampleText,
  type Vec3,
} from "./gl";
import { LAND_COLS, LAND_ROWS, landGrid } from "./land";

/**
 * Signal: one particle system that re-forms into a different figure for each
 * part of the site. Figures, in order (see FIGURE in stage.ts):
 *   0 black hole  1 waveform  2 lattice  3 globe  4 trophy  5 field  6 hello  7 radar  8 Lissajous
 * Every particle carries all nine destinations; pages blend between them and
 * a burst of noise hides the seams. Plain WebGL2, no 3D library: the whole
 * field is one draw call.
 */

type Placement = { x: number; y: number; s: number };

const deg = Math.PI / 180;
const FOV = 35 * deg;

const TAU = Math.PI * 2;

/** A roughly normal random number (mean 0, spread 1), clamped so nothing flies off. */
const gauss = (rand: () => number) =>
  Math.max(-2.5, Math.min(2.5, Math.sqrt(-2 * Math.log(rand() || 1e-6)) * Math.cos(TAU * rand())));

/** The black hole's proportions, in figure units. The shader reads the same numbers. */
const SHADOW = 0.55;
const INNER = 0.62;
const OUTER = 3.2;

/** What each particle of the black hole is, kept in the fourth slot of its target. */
const DISK = 0;
const ECHO = 1;
const RING = 2;
const STAR = 3;

/**
 * The hero: a black hole with its accretion disk, the lensed far side of the
 * disk arching over the shadow, a photon ring, and faint stars drifting behind
 * it. Particles store where they orbit (radius, starting angle, height) rather
 * than a position; the vertex shader moves them and bends the light.
 */
function horizon(count: number) {
  const out = new Float32Array(count * 4);
  const rand = rng(7);
  for (let i = 0; i < count; i++) {
    const k = i * 4;
    const u = rand();
    if (u < 0.08) {
      out[k] = (rand() * 2 - 1) * 7;
      out[k + 1] = (rand() * 2 - 1) * 3.6;
      out[k + 2] = -1.5 - rand() * 2.5;
      out[k + 3] = STAR;
    } else if (u < 0.14) {
      // Soft on both sides; about a third of it is a wider, fainter haze, so the shadow has no hard rim.
      const haze = rand() < 0.35 ? 1 : 0;
      out[k] = SHADOW * (1.035 + gauss(rand) * (haze ? 0.07 : 0.022));
      out[k + 1] = rand() * TAU;
      out[k + 2] = haze;
      out[k + 3] = RING;
    } else {
      const r = INNER + (OUTER - INNER) * Math.pow(rand(), 2.1);
      out[k] = r;
      out[k + 1] = rand() * TAU;
      // A soft thickness that flares outward, so the band crossing the shadow has no knife edge.
      out[k + 2] = gauss(rand) * (0.018 + 0.014 * r);
      out[k + 3] = u < 0.2 ? ECHO : DISK;
    }
  }
  return out;
}

/** A unit vector for a latitude and longitude. */
function latLon(lat: number, lon: number): Vec3 {
  const phi = (90 - lat) * deg;
  const theta = (lon + 180) * deg;
  return [-Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];
}

/** Nine ribbons of a sound wave. Targets are (x, depth, spare, ribbon); the shader shapes the wave. */
function waveform(count: number, tint: Float32Array) {
  const out = new Float32Array(count * 4);
  const rand = rng(11);
  const ribbons = 9;
  for (let i = 0; i < count; i++) {
    const r = Math.floor(rand() * ribbons);
    // Fewer points toward either end, so the ribbons thin out instead of stopping at a wall.
    let u = 0;
    do u = rand() * 2 - 1;
    while (rand() > Math.pow(Math.cos((u * Math.PI) / 2), 0.7));
    const x = u * 2.1;
    const env = Math.cos((x / 2.1) * (Math.PI / 2));
    const gather = 0.3 + 0.7 * env; // and draw together as they fade
    out.set([x, ((r - ribbons / 2) * 0.09 + (rand() - 0.5) * 0.02) * gather, 0, r], i * 4);
    tint[i] = r === 4 ? 1 : 0;
  }
  return out;
}

/** A 3 x 3 x 3 lattice of cubes. Targets are (position within its cube, which cube). */
function lattice(count: number, tint: Float32Array) {
  const out = new Float32Array(count * 4);
  const rand = rng(13);
  const s = 0.3; // the shader spaces the cubes
  const corners = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ];
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  for (let i = 0; i < count; i++) {
    const cx = Math.floor(rand() * 3) - 1;
    const cy = Math.floor(rand() * 3) - 1;
    const cz = Math.floor(rand() * 3) - 1;
    const [a, b] = edges[Math.floor(rand() * 12)];
    const t = rand();
    const pa = corners[a];
    const pb = corners[b];
    out.set(
      [
        ((pa[0] + (pb[0] - pa[0]) * t) * s) / 2 + (rand() - 0.5) * 0.01,
        ((pa[1] + (pb[1] - pa[1]) * t) * s) / 2 + (rand() - 0.5) * 0.01,
        ((pa[2] + (pb[2] - pa[2]) * t) * s) / 2 + (rand() - 0.5) * 0.01,
        cx + 1 + (cy + 1) * 3 + (cz + 1) * 9,
      ],
      i * 4,
    );
    tint[i] = cx === 1 && cy === 1 && cz === 1 ? 1 : 0;
  }
  return out;
}

/** How bright each part of the globe's surface is, kept in the fourth slot of its target. */
const OCEAN_GLOW = 0.13;
const LAND_GLOW = 0.85;
const REACHED_GLOW = 0.95;

/**
 * Everything else on the globe moves, so the fourth slot says what a particle is
 * instead (the shader reads the same numbers):
 *   0-1      a surface dot, and its brightness
 *   ARC + k + t   a point t of the way along arc k, from Naga City outward
 *   RIPPLE + j    a point on ripple ring j spreading out from Naga City
 *   INFLOW        a point spiralling into Naga City
 *   LANDING + k   the glow where arc k lands
 */
const ARC = 2;
const RIPPLE = 20;
const INFLOW = 30;
const LANDING = 40;

const GLOBE_R = 1.05;
const NAGA = latLon(13.62, 123.19);
/** How far the globe turns to bring Naga City to the front (see spinY in the shader). */
const NAGA_FRONT = Math.PI / 2 - (123.19 + 180) * deg;
// Keep in step with REACHED in scripts/globe-land.ts, which colours these countries.
const CITIES: Vec3[] = [
  [43.65, -79.38], // Toronto, where the support chat lived
  [1.35, 103.82], // Singapore
  [35.68, 139.69], // Tokyo
  [37.77, -122.42], // San Francisco
  [51.51, -0.13], // London
  [-33.87, 151.21], // Sydney
  [50.11, 8.68], // Frankfurt
  [19.07, 72.88], // Mumbai
].map(([lat, lon]) => latLon(lat, lon));
/** How far round the globe each arc runs, in radians. */
const ARC_ANGLES = CITIES.map((c) => Math.acos(Math.max(-1, Math.min(1, c[0] * NAGA[0] + c[1] * NAGA[1] + c[2] * NAGA[2]))));
/** Two directions along the surface at Naga City, for the rings and the spiral. */
const NAGA_EAST = ((): Vec3 => {
  const [x, , z] = NAGA;
  const l = Math.hypot(x, z);
  return [-z / l, 0, x / l];
})();
const NAGA_NORTH: Vec3 = [
  NAGA[1] * NAGA_EAST[2] - NAGA[2] * NAGA_EAST[1],
  NAGA[2] * NAGA_EAST[0] - NAGA[0] * NAGA_EAST[2],
  NAGA[0] * NAGA_EAST[1] - NAGA[1] * NAGA_EAST[0],
];

/**
 * A dotted Earth: faint ocean, muted land, and the countries the work has
 * reached picked out in orange. Every arc leaves Naga City in the Philippines,
 * one of them for Toronto; the shader sends light along them both ways.
 */
function globe(count: number, tint: Float32Array) {
  const out = new Float32Array(count * 4);
  const rand = rng(17);
  const R = GLOBE_R;
  const naga = NAGA;
  const cities = CITIES;

  const land = landGrid();
  const cellOf = (v: Vec3) => {
    const lat = 90 - Math.acos(Math.max(-1, Math.min(1, v[1]))) / deg;
    const lon = ((Math.atan2(v[2], -v[0]) / deg + 360) % 360) - 180;
    const row = Math.min(LAND_ROWS - 1, Math.floor(90 - lat));
    const col = Math.min(LAND_COLS - 1, Math.floor(lon + 180));
    return land[row * LAND_COLS + col];
  };
  let at = 0;
  const put = (v: Vec3, kind: number, accent: number) => {
    out.set([v[0], v[1], v[2], kind], at * 4);
    tint[at++] = accent;
  };

  // The surface: points scattered at random, loosely, like the rest of the field.
  // Land keeps every point that falls on it; the ocean keeps just enough to hold
  // the sphere's shape.
  const surface = Math.floor(count * 0.64);
  const scattered = Math.floor(surface * 2.5);
  const points: { v: Vec3; cell: number }[] = [];
  let ocean = 0;
  for (let i = 0; i < scattered; i++) {
    const y = rand() * 2 - 1;
    const r = Math.sqrt(1 - y * y);
    const a = rand() * TAU;
    const v: Vec3 = [Math.cos(a) * r, y, Math.sin(a) * r];
    const cell = cellOf(v);
    if (cell === 0) ocean++;
    points.push({ v, cell });
  }
  // a little under the exact share, so nothing runs out of room before the last points
  const keepOcean = (0.97 * Math.max(0, surface - (scattered - ocean))) / ocean;
  for (const { v, cell } of points) {
    if (at >= surface) break;
    if (cell === 0 && rand() > keepOcean) continue;
    const glow = cell === 2 ? REACHED_GLOW : cell === 1 ? LAND_GLOW : OCEAN_GLOW;
    const lift = R * (1 + gauss(rand) * (cell === 0 ? 0.004 : 0.009));
    put([v[0] * lift, v[1] * lift, v[2] * lift], glow, cell === 2 ? 1 : 0);
  }

  // Naga City: light spiralling in, and rings spreading out. The shader places
  // these; the target only carries a starting angle and phase.
  const inflow = at + Math.floor(count * 0.025);
  while (at < inflow) put([rand() * TAU, rand(), gauss(rand)], INFLOW, 1);
  const rings = at + Math.floor(count * 0.014);
  for (let j = 0; at < rings; j = 1 - j) put([rand() * TAU, gauss(rand), 0], RIPPLE + j, 1);

  // Where each arc lands: a small glow that flares as the light arrives.
  const ends = at + Math.floor(count * 0.02);
  while (at < ends) {
    const k = Math.floor(rand() * cities.length);
    const c = cities[k];
    const p: Vec3 = [c[0] + gauss(rand) * 0.012, c[1] + gauss(rand) * 0.012, c[2] + gauss(rand) * 0.012];
    const lift = (R * (1 + Math.abs(gauss(rand)) * 0.007)) / Math.hypot(p[0], p[1], p[2]);
    put([p[0] * lift, p[1] * lift, p[2] * lift], LANDING + k, 1);
  }

  // The arcs, great circles lifted off the surface: longer trips climb higher and
  // get more particles, so every arc is equally dense.
  const angles = ARC_ANGLES;
  const total = angles.reduce((a, b) => a + b, 0);
  while (at < count) {
    let pick = rand() * total;
    let k = 0;
    while (k < cities.length - 1 && pick > angles[k]) pick -= angles[k++];
    const to = cities[k];
    const angle = angles[k];
    const t = rand() * 0.999;
    // slerp from Naga City to the city
    const a = Math.sin((1 - t) * angle) / Math.sin(angle);
    const b = Math.sin(t * angle) / Math.sin(angle);
    const lift = R * (1 + Math.sin(Math.PI * t) * (0.06 + (0.26 * angle) / Math.PI)) + gauss(rand) * 0.008;
    const loose = () => gauss(rand) * 0.006;
    put(
      [(naga[0] * a + to[0] * b) * lift + loose(), (naga[1] * a + to[1] * b) * lift + loose(), (naga[2] * a + to[2] * b) * lift + loose()],
      ARC + k + t,
      1,
    );
  }
  return out;
}

/**
 * Wins: a trophy turning slowly under a light, its body a loose scatter of dots. The shader turns it and lights it: gold where the light is
 * soft, white-hot where it catches. Seven small lights circle it, one per
 * podium; hovering a trophy in the list lights its own. Targets are
 * (x, y, z, kind):
 *   0-1               glitter drifting up around it (x, phase, z), and brightness
 *   CUP + 0.5 + 0.45n  a dot on the turned body (angle, height, radius); n is the
 *                     upward part of the surface's normal there
 *   HANDLE            a dot on a handle (x, y, z in the trophy's own space)
 *   ORBIT + k + trail podium k's light (trail 0 at its head)
 */
const CUP = 10;
const HANDLE = 20;
const ORBIT = 30;
/** The trophy's outline from the middle of its foot to its lip, as (radius, height). */
const OUTLINE: [number, number][] = [
  [0, -1], [0.44, -1], [0.44, -0.9], [0.36, -0.9], [0.34, -0.8], [0.13, -0.77],
  [0.075, -0.62], [0.12, -0.52], [0.07, -0.43], [0.07, -0.3], [0.15, -0.22], [0.31, -0.12],
  [0.43, 0.02], [0.51, 0.2], [0.56, 0.4], [0.59, 0.6], [0.61, 0.72], [0.66, 0.77],
];

function trophy(count: number, tint: Float32Array) {
  const out = new Float32Array(count * 4);
  const rand = rng(31);
  let at = 0;
  const put = (x: number, y: number, z: number, kind: number, accent: number) => {
    out.set([x, y, z, kind], at * 4);
    tint[at++] = accent;
  };
  const upTo = (share: number) => Math.min(count, at + Math.floor(count * share));
  // The body, turned from the outline: dots scattered over it, a little loose off the surface.
  const segments = OUTLINE.slice(1).map((b, i) => {
    const a = OUTLINE[i];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return { a, b, length, area: length * (a[0] + b[0] + 0.02) };
  });
  const area = segments.reduce((sum, seg) => sum + seg.area, 0);
  for (const end = upTo(0.68); at < end; ) {
    let pick = rand() * area;
    let i = 0;
    while (i < segments.length - 1 && pick > segments[i].area) pick -= segments[i++].area;
    const { a, b, length } = segments[i];
    const t = rand();
    const n = -(b[0] - a[0]) / length; // the normal's upward part
    const r = Math.max(0, a[0] + (b[0] - a[0]) * t + gauss(rand) * 0.009);
    const y = a[1] + (b[1] - a[1]) * t + gauss(rand) * 0.006;
    put(rand() * TAU, y, r, CUP + 0.5 + 0.45 * n, 1);
  }

  // Two handles, loops of tube on either side of the cup.
  for (const end = upTo(0.08); at < end; ) {
    const side = rand() < 0.5 ? -1 : 1;
    const phi = (rand() - 0.5) * Math.PI;
    const psi = rand() * TAU;
    const [cx, cy] = [Math.cos(phi), Math.sin(phi)];
    const tube = 0.026 * (1 + gauss(rand) * 0.25);
    const x = 0.5 + 0.3 * cx + tube * cx * Math.cos(psi);
    const y = 0.3 + 0.27 * cy + tube * cy * Math.cos(psi);
    put(side * x, y, tube * Math.sin(psi), HANDLE, 1);
  }

  // The seven lights, each with a fading tail.
  for (let k = 0; k < 7; k++) {
    for (const end = upTo(0.012); at < end; ) put(gauss(rand) * 0.008, gauss(rand) * 0.008, gauss(rand) * 0.008, ORBIT + k + Math.pow(rand(), 1.8) * 0.99, 0);
  }

  // Glitter.
  while (at < count) put(gauss(rand) * 0.85, rand(), gauss(rand) * 0.6, 0.1 + 0.5 * Math.pow(rand(), 3), rand() < 0.35 ? 1 : 0);
  return out;
}

/**
 * The 404: a radar scope sweeping an empty sky. Rings, a bezel of ticks and a
 * crosshair; a sweep that lights the static as it passes and finds nothing;
 * a ping spreading from the middle now and then. It lies flat and the shader
 * tips it toward us. Targets are (x, y, z, kind):
 *   0-1      the scope's rings, ticks and crosshair (xyz = position), and brightness
 *   SWEEP    phosphor the sweep lights (angle, radius, spare)
 *   PING     a ping ring (angle, jitter, which ring)
 */
const SWEEP = 10;
const PING = 20;
const SCOPE = 1.15;

function radar(count: number, tint: Float32Array) {
  const out = new Float32Array(count * 4);
  const rand = rng(41);
  let at = 0;
  const put = (x: number, y: number, z: number, kind: number, accent: number) => {
    out.set([x, y, z, kind], at * 4);
    tint[at++] = accent;
  };
  const upTo = (share: number) => Math.min(count, at + Math.floor(count * share));
  const flat = (r: number, a: number, glow: number) => put(Math.cos(a) * r, 0, Math.sin(a) * r, glow, 0);

  for (const end = upTo(0.2); at < end; ) {
    const ring = 1 + Math.floor(Math.sqrt(rand()) * 4);
    const r = (ring / 4) * SCOPE;
    flat(r, Math.round((rand() * TAU * r) / 0.022) * (0.022 / r), ring === 4 ? 0.55 : 0.28);
  }
  // The bezel: a tick every 10 degrees, longer every 30.
  for (const end = upTo(0.05); at < end; ) {
    const tick = Math.floor(rand() * 36);
    const long = tick % 3 === 0;
    flat(SCOPE + 0.03 + rand() * (long ? 0.09 : 0.045), (tick / 36) * TAU, long ? 0.5 : 0.3);
  }
  for (const end = upTo(0.04); at < end; ) {
    const r = (rand() * 2 - 1) * SCOPE;
    if (Math.abs(r) < 0.04) continue;
    if (rand() < 0.5) put(r, 0, 0, 0.14, 0);
    else put(0, 0, r, 0.14, 0);
  }
  for (const end = upTo(0.1); at < end; ) put(rand() * TAU, gauss(rand), rand() < 0.5 ? 0 : 1, PING, 1);
  while (at < count) put(rand() * TAU, Math.sqrt(rand()) * SCOPE, rand(), SWEEP, 1);
  return out;
}

/**
 * Contact: a Lissajous curve, the loop an oscilloscope draws when two signals
 * lock together, traced twice (the second strand in orange, a beat behind).
 * The shader draws it: a loose cloud while the form is empty, pulling into a
 * crisp knot as it fills in, slowly changing shape all the while. Targets are
 * (x, y, z, kind):
 *   0-1           faint dust behind it (xyz = position), and brightness
 *   STRAND + s    a point on strand s (how far round the curve, two scatter offsets)
 */
const STRAND = 10;

function lissajous(count: number, tint: Float32Array) {
  const out = new Float32Array(count * 4);
  const rand = rng(43);
  for (let i = 0; i < count; i++) {
    if (i < count * 0.1) {
      out.set([(rand() * 2 - 1) * 2.4, (rand() * 2 - 1) * 1.6, -1.5 - rand() * 2, 0.06 + 0.3 * Math.pow(rand(), 3)], i * 4);
      tint[i] = 0;
      continue;
    }
    const strand = rand() < 0.3 ? 1 : 0;
    out.set([rand(), gauss(rand), gauss(rand), STRAND + strand], i * 4);
    tint[i] = strand;
  }
  return out;
}

/** Dust filling the screen, at every depth; the shader drifts it toward us. */
function field(count: number, tint: Float32Array) {
  const out = new Float32Array(count * 4);
  const rand = rng(19);
  for (let i = 0; i < count; i++) {
    out.set([(rand() * 2 - 1) * 4.4, (rand() * 2 - 1) * 2.6, -rand() * 4 + 0.6, 0], i * 4);
    tint[i] = rand() < 0.07 ? 1 : 0;
  }
  return out;
}

/**
 * "hello.", held still. Its full stop is a beacon: it breathes, sends rings of
 * signal out across the word, and the letters light up as each ring passes.
 * Targets are (x, y, z, kind):
 *   0-1     a letter particle (xyz = position), and a random number for its glints
 *   BEACON  the full stop
 *   WAVE    a point on a ring (angle, jitter, which ring)
 * Returns the full stop's centre and radius too, for the shader.
 */
const BEACON = 10;
const WAVE = 20;

function hello(count: number, tint: Float32Array, options: Parameters<typeof sampleText>[2]) {
  const at = sampleText("hello.", count, options);
  const out = new Float32Array(count * 4);
  const rand = rng(41);
  // The full stop is the rightmost glyph: everything past the widest gap near the right edge.
  const xs = Array.from({ length: count }, (_, i) => at[i * 3]).sort((a, b) => a - b);
  const right = xs[xs.length - 1];
  let start = right;
  let widest = 0;
  for (let i = xs.length - 1; i > 0 && xs[i] > right - 0.32; i--) {
    if (xs[i] - xs[i - 1] > widest) {
      widest = xs[i] - xs[i - 1];
      start = xs[i];
    }
  }
  let cx = 0;
  let cy = 0;
  let n = 0;
  for (let i = 0; i < count; i++) {
    if (at[i * 3] < start) continue;
    cx += at[i * 3];
    cy += at[i * 3 + 1];
    n++;
  }
  const beacon: Vec3 = [cx / Math.max(1, n), cy / Math.max(1, n), 0];
  for (let i = 0; i < count; i++) if (at[i * 3] >= start) beacon[2] = Math.max(beacon[2], Math.hypot(at[i * 3] - beacon[0], at[i * 3 + 1] - beacon[1]));

  for (let i = 0; i < count; i++) {
    const [x, y, z] = [at[i * 3], at[i * 3 + 1], at[i * 3 + 2]];
    if (x >= start) {
      out.set([x, y, z, BEACON], i * 4);
      tint[i] = 1;
    } else if (rand() < 0.14) {
      out.set([rand() * TAU, gauss(rand), Math.floor(rand() * 3), WAVE], i * 4);
      tint[i] = 1;
    } else {
      out.set([x, y, z, rand()], i * 4);
      tint[i] = rand() < 0.05 ? 1 : 0;
    }
  }
  return { targets: out, beacon };
}

const glslVec = (v: Vec3) => `vec3(${v.map((n) => n.toFixed(5)).join(", ")})`;

const ATTRIBUTES = ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "aRand", "aMask"] as const;

const vertex = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
${GLSL_NOISE}
// One target per figure (see the generators above). The fourth slot usually
// says what a particle is; each figure's function below reads it.
in vec4 t0; in vec4 t1; in vec4 t2; in vec4 t3;
in vec4 t4; in vec4 t5; in vec4 t6; in vec4 t7; in vec4 t8;
in vec4 aRand;   // size, phase, spare, colour threshold
in uint aMask;   // bit k: this particle is an orange accent in figure k
uniform float uW[${FIGURES}];
uniform vec3 uOff[${FIGURES}];
uniform float uScale[${FIGURES}];
uniform float uSpin[${FIGURES}];
uniform float uTurn;
uniform float uFocus;      // the light circling the trophy whose row is hovered
uniform float uFocusAmt;
uniform vec3 uBeacon;      // the full stop of "hello.": centre and radius
uniform float uTime;
uniform float uChaos;
uniform float uKick;
uniform float uIntro;
uniform float uAmp;
uniform float uBeat;
uniform vec3 uPointer;
uniform float uPointerAmt;
uniform float uSize;
uniform float uPixelRatio;
uniform float uZoom;
uniform float uShift;
uniform mat4 uView;
uniform mat4 uProj;
out float vAccent;
out float vAlpha;

const float PI = 3.14159265;

vec3 spinY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 tiltX(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z); }
vec3 place(vec3 p, int k) { return spinY(p, uTime * uSpin[k]) * uScale[k] + uOff[k]; }
float hash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }

// A travelling light: a crisp front and a tail fading out behind it. s is how far behind the front.
float pulse(float s) { return s >= 0.0 ? exp(-s * 11.0) : exp(s * 70.0); }

// Every figure is complete the moment it shows; the motion below never stops and never starts over.

// 1. The waveform: nine ribbons (t = x, depth, spare, ribbon). The wave travels, breathes with
// uAmp (flat when nobody is talking), ripples on each beat, and light runs along every ribbon.
vec3 wave(vec4 t, out float lit, out float grow) {
  float x = t.x;
  float r = t.w;
  float env = cos(clamp(x / 2.1, -1.0, 1.0) * 1.5707963);
  float gather = 0.3 + 0.7 * env;
  float y = sin(x * 2.4 + r * 0.55 - uTime * 0.2) * 0.42 * env * env + (r - 4.5) * 0.035 * gather;
  y = y * uAmp + sin(x * 3.2 - uTime * 0.45 + aRand.y) * 0.05 * uAmp;
  y += sin(x * 9.0 - uTime * 14.0 + aRand.z * 0.6) * uBeat * 0.24 * env * env;
  float head = fract(uTime / 30.0 + r * 0.137) * 5.6 - 2.8;
  float light = pulse((head - x) * 0.9);
  // It fades out toward both ends rather than stopping.
  lit = (0.2 + 0.8 * smoothstep(2.1, 1.1, abs(x))) * (0.7 + 0.6 * light);
  grow = 1.0 + 0.7 * light;
  return vec3(x, y, t.y);
}

// Turns p about the x, y or z axis.
vec3 turnAbout(vec3 p, int axis, float a) {
  float c = cos(a), s = sin(a);
  if (axis == 0) return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
  if (axis == 1) return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  return vec3(c * p.x - s * p.y, s * p.x + c * p.y, p.z);
}

// 2. The lattice: 27 cubes (t = position in its cube, which cube). It breathes open and shut,
// one slice at a time twists a quarter turn and back like a puzzle being worked, and a plane
// of light sweeps through it.
vec3 lattice(vec4 t, out float lit, out float grow) {
  int i = int(t.w + 0.5);
  vec3 c = vec3(float(i % 3) - 1.0, float((i / 3) % 3) - 1.0, float(i / 9) - 1.0);
  vec3 p = c * 0.42 * (1.0 + 0.1 * sin(uTime * 0.45)) + t.xyz;
  float cycle = floor(uTime / 6.5);
  float phase = fract(uTime / 6.5);
  int axis = int(mod(cycle, 3.0));
  // Only the two slices away from the orange corner cube turn, so it never moves.
  float slice = mod(floor(cycle / 3.0), 2.0) < 1.0 ? -1.0 : 0.0;
  float way = mod(cycle, 2.0) < 1.0 ? 1.0 : -1.0;
  float twist = (smoothstep(0.05, 0.4, phase) - smoothstep(0.55, 0.9, phase)) * 1.5707963 * way;
  if (abs(c[axis] - slice) < 0.5) p = turnAbout(p, axis, twist);
  float across = dot(p, vec3(0.8, 0.52, 0.3));
  float light = pulse((fract(uTime / 8.0) * 3.4 - 1.7 - across) * 2.5);
  lit = 0.75 + 0.7 * light;
  grow = 1.0 + 0.6 * light;
  return p;
}

// 3. The globe.
// The globe leans its north toward us, where most of the arcs go. facing is 1 for
// the point nearest us and -1 for the one furthest away.
vec3 globe(vec3 p, out float facing) {
  vec3 q = spinY(p, uTurn);
  float c = cos(0.32), s = sin(0.32);
  q = vec3(q.x, c * q.y - s * q.z, s * q.y + c * q.z);
  facing = q.z / max(length(q), 1e-4);
  return q * uScale[3] + uOff[3];
}

const float GLOBE_R = ${GLOBE_R.toFixed(2)};
const vec3 NAGA = ${glslVec(NAGA)};
const vec3 NAGA_EAST = ${glslVec(NAGA_EAST)};
const vec3 NAGA_NORTH = ${glslVec(NAGA_NORTH)};
const float ARC_ANGLE[${ARC_ANGLES.length}] = float[](${ARC_ANGLES.map((a) => a.toFixed(4)).join(", ")});

// How far along arc k the light is: x going out from Naga City, y coming home.
// Both run past the end (to 1.4) so each trip is followed by a quiet spell.
vec2 heads(int k) {
  float trip = 3.0 + 3.2 * ARC_ANGLE[k];
  float offset = fract(float(k) * 0.618);
  return vec2(fract(uTime / trip + offset), fract(uTime / (trip * 1.25) + offset + 0.5)) * 1.4;
}


// A point on the globe near Naga City, r out along the surface in direction a.
vec3 nearNaga(float a, float r) { return normalize(NAGA + (NAGA_EAST * cos(a) + NAGA_NORTH * sin(a)) * r) * GLOBE_R; }

// Where a globe particle is before the globe turns, how bright and how big (see globe() in field.ts).
vec3 earthAt(vec4 t, out float lit, out float grow) {
  float w = t.w;
  if (w < 1.5) {
    lit = w;
    grow = 0.55 + 0.65 * w;
    return t.xyz;
  }
  if (w < ${RIPPLE.toFixed(1)}) {
    int k = int(w - ${ARC.toFixed(1)});
    float along = w - ${ARC.toFixed(1)} - float(k);
    vec2 h = heads(k);
    float light = max(pulse(h.x - along), pulse(h.y - (1.0 - along)));
    lit = 0.32 + 0.68 * light;
    grow = 1.1 * (1.0 + 0.9 * light);
    return t.xyz;
  }
  if (w < ${INFLOW.toFixed(1)}) {
    // Rings spreading out over the islands and fading.
    float f = fract(uTime * 0.22 + (w - ${RIPPLE.toFixed(1)}) * 0.5);
    lit = smoothstep(0.0, 0.08, f) * pow(1.0 - f, 1.3);
    grow = 1.1;
    return nearNaga(t.x, (0.015 + 0.2 * f) * (1.0 + 0.05 * t.y)) * 1.004;
  }
  if (w < ${LANDING.toFixed(1)}) {
    // Light spiralling in, brightening as it reaches the centre.
    float f = fract(t.y + uTime * 0.16);
    lit = smoothstep(0.0, 0.3, f) * (0.45 + 0.55 * f);
    grow = 0.8 + 0.5 * f;
    return nearNaga(t.x + f * 2.6, pow(1.0 - f, 1.7) * 0.075 + abs(t.z) * 0.002) * (1.0 + 0.012 * (1.0 - f));
  }
  // A landing flares as the outbound light arrives.
  float since = heads(int(w - ${LANDING.toFixed(1)})).x - 1.0;
  float flare = since >= 0.0 ? exp(-since * 8.0) : 0.0;
  lit = 0.5 + 0.5 * flare;
  grow = 1.2 * (1.0 + flare);
  return t.xyz;
}


// 4. Wins: a trophy (see trophy() in field.ts).
const vec3 LIGHT = vec3(-0.52, 0.56, 0.64);

// Soft light where the surface faces the lamp, a glint where it catches, dark round the back.
float shade(vec3 n, out float glint) {
  glint = pow(max(dot(n, normalize(LIGHT + vec3(0.0, 0.0, 1.0))), 0.0), 26.0);
  return (0.22 + 0.78 * max(dot(n, LIGHT), 0.0)) * mix(0.15, 1.0, smoothstep(-0.3, 0.2, n.z)) + glint;
}

// tone: 0 ink, 1 accent, 2 use the particle's own mask.
vec3 trophy(vec4 t, out float lit, out float grow, out float tone) {
  float w = t.w;
  float spin = uTime * 0.16;
  if (w < 1.5) {
    float f = fract(t.y + uTime * 0.03);
    lit = sin(f * PI) * w;
    grow = 0.7;
    tone = 2.0;
    return vec3(t.x + sin(uTime * 0.25 + t.z * 5.0) * 0.04, -1.0 + f * 2.2, t.z);
  }
  if (w < ${ORBIT.toFixed(1)}) {
    vec3 p;
    vec3 n;
    if (w < ${HANDLE.toFixed(1)}) {
      float up = (w - ${(CUP + 0.5).toFixed(1)}) / 0.45;
      float a = t.x + spin;
      float outward = sqrt(max(0.0, 1.0 - up * up));
      n = vec3(cos(a) * outward, up, sin(a) * outward);
      p = vec3(cos(a) * t.z, t.y, sin(a) * t.z);
    } else {
      n = spinY(normalize(t.xyz - vec3(sign(t.x) * 0.5, 0.3, 0.0)), spin);
      p = spinY(t.xyz, spin);
    }
    float glint;
    lit = shade(n, glint);
    grow = 1.0 + glint;
    // Gold, turning white-hot where it glints.
    tone = 1.0 - step(aRand.w, glint * 1.6);
    return p;
  }
  // The seven lights, on a tilted orbit, dimmed as they pass behind the cup.
  int k = int(w - ${ORBIT.toFixed(1)});
  float trail = w - ${ORBIT.toFixed(1)} - float(k);
  float a = uTime * 0.42 + float(k) * ${(TAU / 7).toFixed(4)} - trail * 0.8;
  vec3 p = tiltX(vec3(cos(a) * 0.92, 0.0, sin(a) * 0.92), -0.32);
  p = vec3(p.x * 0.98 - p.y * 0.2, p.x * 0.2 + p.y * 0.98 + 0.12, p.z) + t.xyz;
  float on = step(abs(uFocus - float(k)), 0.5);
  float behind = step(p.z, 0.0) * step(abs(p.x), 0.6);
  lit = pow(1.0 - trail, 2.2) * (1.0 - 0.8 * behind) * mix(1.0, mix(0.45, 2.2, on), uFocusAmt);
  grow = (1.0 + 0.9 * (1.0 - trail)) * mix(1.0, mix(1.0, 1.8, on), uFocusAmt);
  tone = 0.0;
  return p;
}

// 5. The work chapter's field: dust drifting toward us, fading in far away and out as it passes.
vec3 drift(vec4 t, out float lit, out float grow) {
  float z = mod(t.z + uTime * 0.06 + 3.4, 4.0) - 3.4;
  lit = smoothstep(-3.4, -2.6, z) * smoothstep(0.6, 0.2, z);
  grow = 1.0;
  return vec3(t.xy, z);
}

// 6. "hello." (see hello() in field.ts). The word holds still; its full stop is a beacon
// (uBeacon: centre and radius) sending out a ring every few seconds, and the letters light
// up as each ring washes over them.
const float WAVE_EVERY = 3.4;
const float WAVE_SPEED = 0.5;

// How old ring i is: 0 is the newest.
float waveAge(float i) { return fract(uTime / WAVE_EVERY) * WAVE_EVERY + i * WAVE_EVERY; }

vec3 helloAt(vec4 t, out float lit, out float grow) {
  float w = t.w;
  vec2 dot_ = uBeacon.xy;
  float r0 = uBeacon.z;
  if (w < 1.5) {
    float d = distance(t.xy, dot_);
    float wash = 0.0;
    for (int i = 0; i < 3; i++) {
      float age = waveAge(float(i));
      wash += pulse((r0 + age * WAVE_SPEED - d) * 2.2) * exp(-age * 0.1);
    }
    // Now and then a particle glints.
    float glint = pow(max(0.0, sin(uTime * 0.5 + w * 97.0)), 80.0);
    lit = 0.62 + 1.1 * wash + 0.9 * glint;
    grow = 1.0 + 0.45 * wash + 0.9 * glint;
    return t.xyz;
  }
  if (w < ${WAVE.toFixed(1)}) {
    // The full stop swells as each ring leaves it.
    float swell = exp(-waveAge(0.0) * 2.2);
    lit = 0.85 + 0.4 * swell;
    grow = 1.0 + 0.3 * swell;
    return vec3(dot_ + (t.xy - dot_) * (1.0 + 0.12 * swell), t.z);
  }
  float age = waveAge(t.z);
  float r = r0 * 1.15 + age * WAVE_SPEED;
  lit = smoothstep(0.0, 0.15, age) * exp(-age * 0.4);
  grow = 1.3;
  return vec3(dot_ + vec2(cos(t.x), sin(t.x)) * r * (1.0 + 0.004 * t.y), 0.0);
}

// 7. The 404: a radar sweeping an empty sky (see radar() in field.ts).
vec3 radar(vec4 t, out float lit, out float grow) {
  float w = t.w;
  vec3 p;
  grow = 1.0;
  float sweep = uTime * 0.42;
  if (w < 1.5) {
    lit = w;
    p = t.xyz;
  } else if (w < ${PING.toFixed(1)}) {
    // Phosphor: bright just behind the sweep line, fading round the dial. It lights only static.
    p = vec3(cos(t.x) * t.y, 0.0, sin(t.x) * t.y);
    float behind = fract((sweep - t.x) / ${TAU.toFixed(4)});
    float trail = pow(1.0 - behind, 7.0);
    float line = exp(-behind * 160.0);
    float speck = step(0.93, hash(t.z * 311.0 + floor(uTime / 7.5 + t.z)));
    lit = trail * (0.12 + 0.5 * speck) + line * 0.9;
    grow = 0.8 + 0.8 * line + 0.6 * speck * trail;
  } else {
    // A ping spreading from the middle, finding nothing.
    float f = fract(uTime / 6.0 + t.z * 0.5);
    float r = f * ${SCOPE.toFixed(2)} * (1.0 + 0.01 * t.y);
    p = vec3(cos(t.x) * r, 0.0, sin(t.x) * r);
    lit = 0.5 * smoothstep(0.0, 0.06, f) * pow(1.0 - f, 1.6);
  }
  // Tipped toward us, like a scope on a desk.
  return tiltX(p, -0.95);
}

// 8. Contact: a Lissajous curve (see lissajous() in field.ts). uAmp rises as the form
// fills in, pulling the loose cloud into a crisp knot; each keystroke (uBeat) sends a
// ripple along it.
vec3 knot(float u, float phase) {
  float a = u * ${TAU.toFixed(5)};
  return vec3(sin(3.0 * a + phase), 0.82 * sin(2.0 * a), 0.55 * sin(5.0 * a + phase * 0.6)) * 0.92;
}

vec3 lissajousAt(vec4 t, out float lit, out float grow) {
  if (t.w < 1.5) {
    lit = t.w;
    grow = 1.0;
    return t.xyz;
  }
  float strand = t.w - ${STRAND.toFixed(1)};
  float u = t.x;
  // It keeps changing shape, slowly; the second strand runs a beat behind the first.
  float phase = uTime * 0.05 + strand * 0.3;
  vec3 p = knot(u, phase) * (1.0 + strand * 0.03);
  vec3 along = normalize(knot(u + 0.001, phase) - knot(u - 0.001, phase));
  vec3 side = normalize(cross(along, vec3(0.3, 1.0, 0.2)));
  vec3 lift = cross(along, side);
  float clear = smoothstep(0.16, 0.9, uAmp);
  float spread = mix(0.085, 0.012, clear);
  float ripple = sin(u * 70.0 - uTime * 5.0) * uBeat * 0.05;
  p += side * (t.y * spread + ripple) + lift * t.z * spread;
  // Light travels round it, one pulse per strand.
  float light = pulse((fract(uTime / 16.0 + strand * 0.5) - u) * 4.0);
  lit = (0.45 + 0.5 * clear) + 0.7 * light * clear + 0.4 * uBeat;
  grow = 1.0 + 0.6 * light;
  return p;
}

// 0. The black hole.
const float SHADOW = ${SHADOW.toFixed(2)};
const float INNER = ${INNER.toFixed(2)};
const float OUTER = ${OUTER.toFixed(2)};
const float TILT = 0.1;    // we see the disk almost edge on
const float ROLL = -0.24;  // and the whole view leans, so the disk climbs away from the copy
const float LENS = 0.4;    // how hard starlight from behind is bent

vec2 roll(vec2 p) { float c = cos(ROLL), s = sin(ROLL); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }

// A point-mass lens: anything behind the hole shows up pushed away from its centre, more so the further back it is.
vec2 lens(vec2 p, float behind) {
  float b = max(length(p), 1e-4);
  return p * (0.5 * (b + sqrt(b * b + 4.0 * LENS * behind)) / b);
}

// Where a black hole particle is this frame, plus how bright, how big and how hot it looks.
vec3 hole(vec4 t, out float glow, out float size, out float hot) {
  if (t.w > 2.5) {
    // Stars far behind, drifting past and bent around the shadow as they go.
    vec3 s = t.xyz;
    s.x = mod(s.x + uTime * 0.04 + 7.0, 14.0) - 7.0;
    glow = 0.38 * smoothstep(7.0, 6.0, abs(s.x));
    size = 0.65;
    hot = 0.0;
    return vec3(roll(lens(s.xy, -s.z)), s.z * 0.08);
  }
  if (t.w > 1.5) {
    // The photon ring: light that circled the hole once. Brighter on the side the disk swings toward us,
    // with a faint haze (t.z = 1) spilling either side of it.
    float a = t.y + uTime * 0.5;
    float lit = 0.5 + 0.5 * cos(a);
    glow = (0.5 + 0.5 * lit) * mix(1.0, 0.22, t.z);
    size = mix(0.75, 1.9, t.z);
    hot = 0.3 * (1.0 - lit);
    return vec3(roll(vec2(cos(a), sin(a)) * t.x), 0.0);
  }
  // The disk. Inner orbits run faster (Kepler); the near half crosses in front of the shadow.
  float r = t.x;
  float a = t.y + uTime * 0.32 * pow(r, -1.5);
  bool echo = t.w > 0.5;
  if (echo) a = PI + mod(a, PI);        // an echo only ever shows the far half
  float c = cos(a);
  float s = sin(a);
  float heat = smoothstep(OUTER, INNER, r);
  float spread = 1.0 - heat;
  float streak = 0.55 + 0.45 * snoise(vec3(r * 3.5, cos(t.y) * 1.4, sin(t.y) * 1.4 + uTime * 0.03));
  // The side swinging toward us is brighter and whiter; the side falling away dims and runs orange.
  glow = clamp((0.14 + 0.86 * pow(heat, 1.3)) * streak * pow(1.0 + 0.35 * c, 2.0), 0.0, 1.0);
  size = mix(1.2, 0.9, heat);
  hot = pow(heat, 1.1) * (0.6 - 0.4 * c);
  float behind = max(0.0, -s);          // 0 at either end of the disk, 1 straight behind the hole
  if (echo) {
    // Light from the underside of the far half, bent under the hole: a thin arc hugging the shadow.
    float phi = 3.0 * PI - a;
    glow *= 0.75 * smoothstep(0.0, 0.6, behind);
    size *= 0.85;
    return vec3(roll(vec2(cos(phi), sin(phi)) * (SHADOW * (1.05 + 0.3 * spread) + t.z * 0.6)), 0.0);
  }
  if (s >= 0.0) return vec3(roll(vec2(c * r, t.z - s * r * TILT)), s * r * 0.12);
  // Light from the top of the far half, bent up and over the shadow: the arc above it. It leaves
  // the disk at either end and closes in on the shadow the further behind it the particle is.
  float phi = 2.0 * PI - a;
  float bend = smoothstep(0.0, 1.0, behind);
  glow = min(1.0, glow * (1.0 + 0.8 * bend));
  size *= 1.0 + 0.3 * bend;
  float reach = mix(r, SHADOW * 1.1 + 0.2 * (r - INNER), bend) + t.z;
  return vec3(roll(vec2(cos(phi), sin(phi)) * reach), s * r * 0.12);
}

void main() {
  vec3 P = vec3(0.0);
  float lit = 0.0;
  float grow = 0.0;
  float hot = 0.0;
  float l, g;
  if (uW[0] > 0.0005) {
    P += uW[0] * (hole(t0, l, g, hot) * uScale[0] + uOff[0]);
    lit += uW[0] * l;
    grow += uW[0] * g;
  }
  if (uW[1] > 0.0005) {
    P += uW[1] * place(wave(t1, l, g), 1);
    lit += uW[1] * l;
    grow += uW[1] * g;
  }
  if (uW[2] > 0.0005) {
    P += uW[2] * place(lattice(t2, l, g), 2);
    lit += uW[2] * l;
    grow += uW[2] * g;
  }
  if (uW[3] > 0.0005) {
    float facing;
    P += uW[3] * globe(earthAt(t3, l, g), facing);
    // The far side all but disappears, so the continents on this side read.
    lit += uW[3] * l * mix(0.1, 1.0, smoothstep(-0.2, 0.45, facing));
    grow += uW[3] * g;
  }
  float tone = 2.0;
  if (uW[4] > 0.0005) {
    P += uW[4] * place(trophy(t4, l, g, tone), 4);
    lit += uW[4] * l;
    grow += uW[4] * g;
  }
  if (uW[5] > 0.0005) {
    P += uW[5] * place(drift(t5, l, g), 5);
    lit += uW[5] * l;
    grow += uW[5] * g;
  }
  if (uW[6] > 0.0005) {
    P += uW[6] * place(helloAt(t6, l, g), 6);
    lit += uW[6] * l;
    grow += uW[6] * g;
  }
  if (uW[7] > 0.0005) {
    P += uW[7] * place(radar(t7, l, g), 7);
    lit += uW[7] * l;
    grow += uW[7] * g;
  }
  if (uW[8] > 0.0005) {
    P += uW[8] * place(lissajousAt(t8, l, g), 8);
    lit += uW[8] * l;
    grow += uW[8] * g;
  }
  float total = 0.0;
  for (int k = 0; k < ${FIGURES}; k++) total += uW[k];
  total = max(total, 1e-3);
  lit /= total;
  grow /= total;

  float turbulence = uChaos * 0.9 + uKick * 1.5 + (1.0 - uIntro) * 3.2;
  vec3 q = P * 0.9 + vec3(0.0, 0.0, uTime * 0.15);
  P += vec3(snoise(q), snoise(q + 17.1), snoise(q + 31.7)) * turbulence;
  P += vec3(snoise(P * 2.0 + uTime * 0.3), snoise(P * 2.0 + 9.0 + uTime * 0.3), 0.0) * 0.012;

  vec3 at = P * uZoom + vec3(uShift, 0.0, 0.0);
  vec2 d = at.xy - uPointer.xy;
  float f = exp(-dot(d, d) / 0.12) * uPointerAmt;
  at.xy += normalize(d + 1e-4) * f * 0.28;
  at.z += f * 0.35;

  vec4 mv = uView * vec4(at, 1.0);
  gl_Position = uProj * mv;
  float twinkle = 0.75 + 0.25 * sin(uTime * 1.3 + aRand.y * 6.2831);
  gl_PointSize = uSize * aRand.x * grow * twinkle * uPixelRatio * (5.0 / -mv.z);

  // The black hole decides its colour every frame (hot and receding runs orange); the rest use their mask.
  float accent = uW[0] * step(aRand.w, hot);
  for (int k = 1; k < ${FIGURES}; k++) {
    float own = float((aMask >> uint(k)) & 1u);
    accent += uW[k] * (k == 4 && tone < 1.5 ? tone : own);
  }
  vAccent = accent;
  vAlpha = lit * (0.35 + 0.65 * uIntro);
}
`;

const fragment = /* glsl */ `#version 300 es
precision mediump float;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform float uOpacity;
in float vAccent;
in float vAlpha;
out vec4 color;
void main() {
  float a = 1.0 - smoothstep(0.08, 0.5, length(gl_PointCoord - 0.5));
  color = vec4(mix(uInk, uAccent, step(0.5, vAccent)), a * vAlpha * uOpacity);
}
`;

const DISPLAY = "'Mona Sans Variable', sans-serif";

const rgb = (hex: string): Vec3 => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as Vec3;

const THEMES = {
  dark: { ink: rgb("#f1ede6"), accent: rgb("#ff6a3d"), opacity: 0.9 },
  light: { ink: rgb("#141312"), accent: rgb("#e2480f"), opacity: 0.85 },
};

export async function createField(host: HTMLElement, onReady: () => void): Promise<FieldController | null> {
  const stage = createStage(host, { dprCap: 2 });
  if (!stage) return null;
  const { gl, canvas } = stage;

  const mobile = window.matchMedia("(max-width: 760px)").matches;
  const COUNT = mobile ? 12000 : 36000;

  await document.fonts.load(`600 100px ${DISPLAY}`);

  // Build every figure on the CPU first, a slice at a time, so the page stays responsive.
  const targets: Float32Array[] = [];
  const aRand = new Float32Array(COUNT * 4);
  const aMask = new Uint16Array(COUNT);
  const scratch = new Float32Array(COUNT);
  const rand = rng(29);
  const mark = (figure: number) => {
    const bit = 1 << figure;
    for (let i = 0; i < COUNT; i++) aMask[i] = scratch[i] ? aMask[i] | bit : aMask[i] & ~bit;
  };
  for (let i = 0; i < COUNT; i++) {
    aRand[i * 4] = 0.6 + Math.pow(rand(), 3) * 2.2;
    aRand[i * 4 + 1] = rand() * 10;
    aRand[i * 4 + 2] = rand();
    aRand[i * 4 + 3] = rand();
  }

  targets[0] = horizon(COUNT);
  await breathe();
  targets[1] = waveform(COUNT, scratch);
  mark(1);
  targets[2] = lattice(COUNT, scratch);
  mark(2);
  await breathe();
  targets[3] = globe(COUNT, scratch);
  mark(3);
  await breathe();
  targets[4] = trophy(COUNT, scratch);
  mark(4);
  targets[5] = field(COUNT, scratch);
  mark(5);
  await breathe();
  const word = hello(COUNT, scratch, { font: `600 150px ${DISPLAY}`, height: 1.25, seed: 37 });
  targets[6] = word.targets;
  mark(6);
  await breathe();
  targets[7] = radar(COUNT, scratch);
  mark(7);
  targets[8] = lissajous(COUNT, scratch);
  mark(8);
  await breathe();

  // GPU side: one vertex array, one buffer per attribute. Rebuilt if the context is lost and restored.
  let gpu: {
    shader: WebGLProgram;
    vao: WebGLVertexArrayObject;
    at: (name: string) => WebGLUniformLocation | null;
  } | null = null;

  const upload = async () => {
    const built = program(gl, vertex, fragment, ATTRIBUTES);
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    ATTRIBUTES.forEach((name, i) => {
      const buffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(i);
      if (name === "aMask") {
        gl.bufferData(gl.ARRAY_BUFFER, aMask, gl.STATIC_DRAW);
        gl.vertexAttribIPointer(i, 1, gl.UNSIGNED_SHORT, 0, 0);
      } else {
        const data = name === "aRand" ? aRand : targets[i];
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.vertexAttribPointer(i, 4, gl.FLOAT, false, 0, 0);
      }
    });
    gl.bindVertexArray(null);
    await linked(gl, built);
    const locations = new Map<string, WebGLUniformLocation | null>();
    gpu = {
      shader: built.program,
      vao,
      at: (name) => {
        if (!locations.has(name)) locations.set(name, gl.getUniformLocation(built.program, name));
        return locations.get(name)!;
      },
    };
  };

  let theme = THEMES[isDark() ? "dark" : "light"];
  let dark = isDark();
  let redraw = true;
  const onTheme = () => {
    dark = isDark();
    theme = THEMES[dark ? "dark" : "light"];
    redraw = true;
  };
  window.addEventListener(THEME_EVENT, onTheme);

  let lost = false;
  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    gpu = null;
  };
  const onRestored = () => {
    void upload().then(() => {
      lost = false;
      redraw = true;
    });
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  // Where each figure sits depends on the screen and the page: above the copy
  // on phones, beside it on most screens, and spread across the home page's
  // chapters on wide ones. Placements glide when the page changes.
  const view = new Float32Array(16);
  const proj = new Float32Array(16);
  const offsets = new Float32Array(FIGURES * 3);
  const scales = new Float32Array(FIGURES);
  const goal = { offsets: new Float32Array(FIGURES * 3), scales: new Float32Array(FIGURES) };
  const wide = window.matchMedia(WIDE);
  let room: Scene["layout"] = "home";
  let aspect = 1;
  const layout = (snap: boolean) => {
    const w = stage.width;
    const h = stage.height;
    aspect = w / h;
    perspective(proj, FOV, aspect, 0.1, 50);
    const visH = 2 * 5 * Math.tan(FOV / 2);
    const visW = visH * aspect;
    const narrow = w < 820;
    const side = narrow ? 0 : Math.min(visW * 0.24, 1.6);
    const up = narrow ? visH * 0.18 : 0;
    const fit = narrow ? Math.min(1, visW / 3.4) : 1;
    // Portrait tablets get the desktop copy but not the room beside it: the black hole moves up and in.
    const tall = !narrow && aspect < 1.1;
    const spread = room === "home" && wide.matches;
    const p: Placement[] = [
      narrow
        ? { x: 0, y: up * 1.2, s: fit }
        : tall
          ? { x: visW * 0.12, y: visH * 0.16, s: Math.min(1, visW / 3.6) }
          : { x: side * 1.05, y: 0.26, s: 1.05 },
      // Listen: a horizon line running off both edges.
      spread ? { x: 0, y: 0, s: visW / 3.6 } : { x: narrow ? 0 : side * 1.15, y: up, s: fit * (narrow ? 0.7 : 0.72) },
      // Build: the lattice between the two columns of crafts.
      spread ? { x: visW * 0.049, y: -0.5, s: 0.85 } : { x: side, y: up, s: fit * (narrow ? 0.8 : 1.15) },
      { x: side, y: up - (narrow ? 0 : 0.08), s: fit * (narrow ? 0.8 : 0.95) },
      { x: -side, y: up, s: fit * (narrow ? 0.6 : 1) },
      { x: 0, y: 0, s: Math.max(1, visW / 7) },
      { x: 0, y: narrow ? up : 0.62, s: fit * (narrow ? 0.9 : 1.45) },
      { x: narrow ? 0 : side * 0.95, y: narrow ? up * 1.1 : 0.05, s: fit * (narrow ? 0.75 : 0.9) },
      // Contact: the Lissajous curve beside the form.
      { x: narrow ? 0 : side * 1.1, y: narrow ? up : -0.1, s: fit * (narrow ? 0.65 : 0.95) },
    ];
    p.forEach((pl, i) => {
      goal.offsets.set([pl.x, pl.y, 0], i * 3);
      goal.scales[i] = pl.s;
    });
    if (snap) {
      offsets.set(goal.offsets);
      scales.set(goal.scales);
    }
    redraw = true;
  };
  stage.onResize(() => layout(true));

  // The pointer, in world space on the z = 0 plane.
  const ndc = { x: 0, y: 0 };
  const pointer: Vec3 = [99, 99, 0];
  const pointerNow: Vec3 = [99, 99, 0];
  let pointerActive = 0;
  let pointerAmt = 0;
  const camera = { eye: [0, 0, 5] as Vec3, axes: lookAtOrigin(view, [0, 0, 5]) };
  const onMove = (event: PointerEvent) => {
    ndc.x = (event.clientX / stage.width) * 2 - 1;
    ndc.y = -(event.clientY / stage.height) * 2 + 1;
    const hit = pointerOnPlane(camera.eye, camera.axes, ndc.x, ndc.y, FOV, aspect);
    if (hit) {
      pointer[0] = hit[0];
      pointer[1] = hit[1];
    }
    pointerActive = event.pointerType === "touch" ? 0.6 : 1;
  };
  const onLeave = () => (pointerActive = 0);
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);

  // Paused (the nav toggle) or reduced motion: no drift, no noise, quick cuts between figures.
  let still = isMotionPaused();
  const stopWatching = onMotionChange((paused) => {
    still = paused;
    redraw = true;
  });

  let target: Scene = only(FIGURE.horizon);
  const weights = new Float32Array(FIGURES);
  weights[FIGURE.horizon] = 1;
  const spins = new Float32Array([0, 0, 0.12, 0, 0, 0, 0, 0, 0]);
  // The globe starts each visit with the Philippines turning in from the left, so
  // the arcs' meeting point is the first thing in view. Held still, it faces us.
  let turn = NAGA_FRONT;
  let focus = -1;
  let focusAmt = 0;
  let focusTarget = 0;
  let chaos = 0;
  let kick = 0;
  let dim = 1;
  let amp = 1;
  let ampTarget = 1;
  let beat = 0;
  let zoom = 1;
  let shift = 0;
  let intro = still ? 1 : 0;
  let clock = 0;
  let camX = 0;
  let camY = 0;
  let shown = false;

  await upload();

  stage.start((_t, dt) => {
    if (lost || !gpu) return;
    const signature = () =>
      weights.reduce((sum, w, i) => sum + w * (i + 1), 0) + chaos + dim + zoom + shift + amp + focusAmt + pointerAmt + camX + camY + pointerNow[0] + pointerNow[1];
    const before = signature();
    if (!still) clock += dt;
    if (weights[3] < 0.02) turn = NAGA_FRONT - (still ? 0.3 : 0.8);
    else if (!still) turn += dt * 0.05;
    focusAmt = damp(focusAmt, focusTarget, still ? 14 : 8, dt);
    intro = still ? 1 : damp(intro, 1, 1.6, dt);
    for (let i = 0; i < FIGURES; i++) weights[i] = damp(weights[i], target.weights[i] ?? 0, still ? 14 : 7, dt);
    chaos = damp(chaos, still ? 0 : target.chaos, 6, dt);
    kick = still ? 0 : kick * Math.exp(-3.2 * dt);
    beat = still ? 0 : beat * Math.exp(-4 * dt);
    amp = damp(amp, ampTarget, 3, dt);
    dim = damp(dim, target.dim, 5, dt);
    zoom = damp(zoom, target.zoom ?? 1, 4, dt);
    shift = damp(shift, target.shift ?? 0, 4, dt);
    const ease = 1 - Math.exp(-10 * dt);
    for (let i = 0; i < 3; i++) pointerNow[i] += (pointer[i] - pointerNow[i]) * ease;
    pointerAmt = damp(pointerAmt, pointerActive, 4, dt);
    // a slow parallax drift toward the pointer
    camX = damp(camX, ndc.x * 0.18, 2, dt);
    camY = damp(camY, ndc.y * 0.12, 2, dt);
    let moving = false;
    const glide = (now: Float32Array, to: Float32Array) => {
      for (let i = 0; i < now.length; i++) {
        now[i] = damp(now[i], to[i], still ? 14 : 4, dt);
        if (Math.abs(now[i] - to[i]) > 1e-4) moving = true;
      }
    };
    glide(offsets, goal.offsets);
    glide(scales, goal.scales);

    // Held still with nothing changing: skip the frame and let the GPU rest.
    if (still && !redraw && !moving && Math.abs(signature() - before) < 1e-5) return;
    redraw = false;

    camera.eye = [camX, camY, 5];
    camera.axes = lookAtOrigin(view, camera.eye);

    const at = gpu.at;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    if (dark) gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    else gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(gpu.shader);
    gl.uniform1fv(at("uW"), weights);
    gl.uniform3fv(at("uOff"), offsets);
    gl.uniform1fv(at("uScale"), scales);
    gl.uniform1fv(at("uSpin"), spins);
    gl.uniform1f(at("uTurn"), turn);
    gl.uniform3fv(at("uBeacon"), word.beacon);
    gl.uniform1f(at("uFocus"), focus);
    gl.uniform1f(at("uFocusAmt"), focusAmt);
    gl.uniform1f(at("uTime"), clock);
    gl.uniform1f(at("uChaos"), chaos);
    gl.uniform1f(at("uKick"), kick);
    gl.uniform1f(at("uIntro"), intro);
    gl.uniform1f(at("uAmp"), amp);
    gl.uniform1f(at("uBeat"), beat);
    gl.uniform3fv(at("uPointer"), pointerNow);
    gl.uniform1f(at("uPointerAmt"), pointerAmt);
    gl.uniform1f(at("uSize"), mobile ? 2.3 : 1.75);
    gl.uniform1f(at("uPixelRatio"), stage.dpr);
    gl.uniform1f(at("uZoom"), zoom);
    gl.uniform1f(at("uShift"), shift);
    gl.uniformMatrix4fv(at("uView"), false, view);
    gl.uniformMatrix4fv(at("uProj"), false, proj);
    gl.uniform3fv(at("uInk"), theme.ink);
    gl.uniform3fv(at("uAccent"), theme.accent);
    gl.uniform1f(at("uOpacity"), theme.opacity * dim);
    gl.bindVertexArray(gpu.vao);
    gl.drawArrays(gl.POINTS, 0, COUNT);
    gl.bindVertexArray(null);

    if (!shown) {
      shown = true;
      onReady();
    }
  });

  return {
    set: (next) => {
      target = next;
      const want = next.layout ?? "home";
      if (want !== room) {
        room = want;
        layout(false);
      }
    },
    focus: (index) => {
      if (index !== null) focus = index;
      focusTarget = index === null ? 0 : 1;
    },
    kick: (amount) => {
      kick = Math.min(1.2, kick + amount);
    },
    level: (value) => {
      ampTarget = value;
    },
    beat: (amount) => {
      beat = Math.min(1, beat + amount);
    },
    dispose: () => {
      stopWatching();
      window.removeEventListener(THEME_EVENT, onTheme);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      stage.dispose();
    },
  };
}
