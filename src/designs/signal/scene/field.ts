import { isMotionPaused, onMotionChange } from "../../../lib/motion";
import { THEME_EVENT } from "../../../lib/theme";
import { FIELD_PORTRAIT } from "../content";
import { FIGURES, type FieldController, type Scene } from "./stage";
import {
  GLSL_NOISE,
  breathe,
  createStage,
  damp,
  isDark,
  linked,
  loadImage,
  lookAtOrigin,
  perspective,
  pointerOnPlane,
  program,
  rng,
  sampleImage,
  sampleText,
  type Vec3,
} from "./gl";

/**
 * Signal: one particle system that re-forms into a different figure for each
 * part of the site. Figures, in order (see FIGURE in stage.ts):
 *   0 portrait  1 waveform  2 lattice  3 globe  4 seven  5 field  6 hello  7 404
 * Every particle carries all eight destinations; pages blend between them and
 * a burst of noise hides the seams. Plain WebGL2, no 3D library: the whole
 * field is one draw call.
 */

type Placement = { x: number; y: number; s: number };

const deg = Math.PI / 180;
const FOV = 35 * deg;

/** A unit vector for a latitude and longitude. */
function latLon(lat: number, lon: number): Vec3 {
  const phi = (90 - lat) * deg;
  const theta = (lon + 180) * deg;
  return [-Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];
}

function waveform(count: number, tint: Float32Array) {
  const out = new Float32Array(count * 3);
  const rand = rng(11);
  const ribbons = 9;
  for (let i = 0; i < count; i++) {
    const r = Math.floor(rand() * ribbons);
    const x = (rand() * 2 - 1) * 2.1;
    const env = Math.cos((x / 2.1) * (Math.PI / 2));
    out[i * 3] = x;
    out[i * 3 + 1] = Math.sin(x * 2.4 + r * 0.55) * 0.42 * env * env + (r - ribbons / 2) * 0.035;
    out[i * 3 + 2] = (r - ribbons / 2) * 0.09 + (rand() - 0.5) * 0.02;
    tint[i] = r === 4 ? 1 : 0;
  }
  return out;
}

function lattice(count: number, tint: Float32Array) {
  const out = new Float32Array(count * 3);
  const rand = rng(13);
  const s = 0.3;
  const gap = 0.42;
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
    out[i * 3] = cx * gap + ((pa[0] + (pb[0] - pa[0]) * t) * s) / 2 + (rand() - 0.5) * 0.01;
    out[i * 3 + 1] = cy * gap + ((pa[1] + (pb[1] - pa[1]) * t) * s) / 2 + (rand() - 0.5) * 0.01;
    out[i * 3 + 2] = cz * gap + ((pa[2] + (pb[2] - pa[2]) * t) * s) / 2 + (rand() - 0.5) * 0.01;
    tint[i] = cx === 1 && cy === 1 && cz === 1 ? 1 : 0;
  }
  return out;
}

/** A dotted Earth with arcs leaving Naga City, one of them to Toronto. */
function globe(count: number, tint: Float32Array) {
  const out = new Float32Array(count * 3);
  const rand = rng(17);
  const R = 1.05;
  const naga = latLon(13.62, 123.19);
  const cities: [number, number][] = [
    [43.65, -79.38], // Toronto, where the support chat lived
    [14.6, 120.98],
    [1.35, 103.82],
    [35.68, 139.69],
    [37.77, -122.42],
    [51.51, -0.13],
    [-33.87, 151.21],
    [50.11, 8.68],
    [19.07, 72.88],
  ];
  const sphereCount = Math.floor(count * 0.66);
  const clusterCount = Math.floor(count * 0.06);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    let v: Vec3;
    if (i < sphereCount) {
      const y = 1 - (i / (sphereCount - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      v = [Math.cos(th) * r * R, y * R, Math.sin(th) * r * R];
      tint[i] = 0;
    } else if (i < sphereCount + clusterCount) {
      v = [naga[0] * R + (rand() - 0.5) * 0.07, naga[1] * R + (rand() - 0.5) * 0.07, naga[2] * R + (rand() - 0.5) * 0.07];
      tint[i] = 1;
    } else {
      const [lat, lon] = cities[Math.floor(rand() * cities.length)];
      const to = latLon(lat, lon);
      const t = rand();
      const mix: Vec3 = [naga[0] + (to[0] - naga[0]) * t, naga[1] + (to[1] - naga[1]) * t, naga[2] + (to[2] - naga[2]) * t];
      const lift = (R * (1 + Math.sin(Math.PI * t) * 0.32)) / (Math.hypot(mix[0], mix[1], mix[2]) || 1);
      v = [mix[0] * lift, mix[1] * lift, mix[2] * lift];
      tint[i] = 1;
    }
    out[i * 3] = v[0];
    out[i * 3 + 1] = v[1];
    out[i * 3 + 2] = v[2];
  }
  return out;
}

function field(count: number, tint: Float32Array) {
  const out = new Float32Array(count * 3);
  const rand = rng(19);
  for (let i = 0; i < count; i++) {
    out[i * 3] = (rand() * 2 - 1) * 4.4;
    out[i * 3 + 1] = (rand() * 2 - 1) * 2.6;
    out[i * 3 + 2] = -rand() * 4 + 0.6;
    tint[i] = rand() < 0.07 ? 1 : 0;
  }
  return out;
}

const ATTRIBUTES = ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7", "aRand", "aMask"] as const;

const vertex = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
${GLSL_NOISE}
in vec3 t0; in vec3 t1; in vec3 t2; in vec3 t3;
in vec3 t4; in vec3 t5; in vec3 t6; in vec3 t7;
in vec4 aRand;   // size, phase, spare, portrait shade
in uint aMask;   // bit k: this particle is an orange accent in figure k
uniform float uW[8];
uniform vec3 uOff[8];
uniform float uScale[8];
uniform float uSpin[8];
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
uniform float uDark;
uniform float uZoom;
uniform float uShift;
uniform mat4 uView;
uniform mat4 uProj;
out float vAccent;
out float vAlpha;

vec3 spinY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 place(vec3 p, int k) { return spinY(p, uTime * uSpin[k]) * uScale[k] + uOff[k]; }

void main() {
  // The waveform breathes with uAmp (flat when nobody is talking) and ripples on each beat.
  vec3 w1 = t1;
  float env = cos(clamp(w1.x / 2.1, -1.0, 1.0) * 1.5707963);
  w1.y = w1.y * uAmp + sin(w1.x * 3.2 - uTime * 1.8 + aRand.y) * 0.05 * uAmp;
  w1.y += sin(w1.x * 9.0 - uTime * 14.0 + aRand.z * 0.6) * uBeat * 0.24 * env * env;

  vec3 P = uW[0] * place(t0, 0) + uW[1] * place(w1, 1) + uW[2] * place(t2, 2) + uW[3] * place(t3, 3)
         + uW[4] * place(t4, 4) + uW[5] * place(t5, 5) + uW[6] * place(t6, 6) + uW[7] * place(t7, 7);

  float turbulence = uChaos * 0.9 + uKick * 1.5 + (1.0 - uIntro) * 3.2;
  vec3 q = P * 0.9 + vec3(0.0, 0.0, uTime * 0.15);
  P += vec3(snoise(q), snoise(q + 17.1), snoise(q + 31.7)) * turbulence;
  P += vec3(snoise(P * 2.0 + uTime * 0.3), snoise(P * 2.0 + 9.0 + uTime * 0.3), 0.0) * 0.012;

  vec3 world = P * uZoom + vec3(uShift, 0.0, 0.0);
  vec2 d = world.xy - uPointer.xy;
  float f = exp(-dot(d, d) / 0.12) * uPointerAmt;
  world.xy += normalize(d + 1e-4) * f * 0.28;
  world.z += f * 0.35;

  vec4 mv = uView * vec4(world, 1.0);
  gl_Position = uProj * mv;
  float twinkle = 0.75 + 0.25 * sin(uTime * 2.0 + aRand.y * 6.2831);
  gl_PointSize = uSize * aRand.x * twinkle * uPixelRatio * (5.0 / -mv.z);

  float accent = 0.0;
  for (int k = 0; k < 8; k++) accent += uW[k] * float((aMask >> uint(k)) & 1u);
  vAccent = accent;
  float shade = mix(0.55 + 0.45 * aRand.w, 0.5 + 0.5 * (1.0 - aRand.w), 1.0 - uDark);
  vAlpha = mix(1.0, shade, uW[0]) * (0.35 + 0.65 * uIntro);
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
  const COUNT = mobile ? 12000 : 22000;

  const [img] = await Promise.all([loadImage(FIELD_PORTRAIT), document.fonts.load(`600 100px ${DISPLAY}`)]);

  // Build every figure on the CPU first, a slice at a time, so the page stays responsive.
  const targets: Float32Array[] = [];
  const aRand = new Float32Array(COUNT * 4);
  const aMask = new Uint8Array(COUNT);
  const scratch = new Float32Array(COUNT);
  const rand = rng(29);
  const mark = (figure: number) => {
    const bit = 1 << figure;
    for (let i = 0; i < COUNT; i++) aMask[i] = scratch[i] ? aMask[i] | bit : aMask[i] & ~bit;
  };
  const sprinkle = (share: number) => {
    for (let i = 0; i < COUNT; i++) scratch[i] = rand() < share ? 1 : 0;
  };
  for (let i = 0; i < COUNT; i++) {
    aRand[i * 4] = 0.6 + Math.pow(rand(), 3) * 2.2;
    aRand[i * 4 + 1] = rand() * 10;
    aRand[i * 4 + 2] = rand();
  }

  // Dark mode draws the light parts of the photo, light mode the dark parts.
  const setPortrait = (dark: boolean) => {
    const { positions, shade } = sampleImage(
      img,
      COUNT,
      dark
        ? (lum) => (lum > 0.94 ? 0 : 0.03 + Math.pow(lum, 1.7))
        : (lum) => (lum > 0.94 ? 0 : 0.04 + Math.pow(1 - lum, 1.25)),
      { height: 2.7, relief: 0.35 },
    );
    targets[0] = positions;
    for (let i = 0; i < COUNT; i++) {
      aRand[i * 4 + 3] = shade[i];
      scratch[i] = aRand[i * 4 + 2] > 0.94 ? 1 : 0;
    }
    mark(0);
  };
  setPortrait(isDark());
  await breathe();
  targets[1] = waveform(COUNT, scratch);
  mark(1);
  targets[2] = lattice(COUNT, scratch);
  mark(2);
  await breathe();
  targets[3] = globe(COUNT, scratch);
  mark(3);
  await breathe();
  targets[4] = sampleText("7", COUNT, { font: `800 240px ${DISPLAY}`, height: 2.5, seed: 31 });
  sprinkle(0.1);
  mark(4);
  targets[5] = field(COUNT, scratch);
  mark(5);
  await breathe();
  targets[6] = sampleText("hello.", COUNT, { font: `600 150px ${DISPLAY}`, height: 1.25, seed: 37 });
  sprinkle(0.08);
  mark(6);
  await breathe();
  targets[7] = sampleText("404", COUNT, { font: `700 170px ${DISPLAY}`, height: 1.2, seed: 41 });
  sprinkle(0.12);
  mark(7);
  await breathe();

  // GPU side: one vertex array, one buffer per attribute. Rebuilt if the context is lost and restored.
  let gpu: {
    shader: WebGLProgram;
    vao: WebGLVertexArrayObject;
    buffers: WebGLBuffer[];
    at: (name: string) => WebGLUniformLocation | null;
  } | null = null;

  const upload = async () => {
    const built = program(gl, vertex, fragment, ATTRIBUTES);
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const buffers = ATTRIBUTES.map((name, i) => {
      const buffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(i);
      if (name === "aMask") {
        gl.bufferData(gl.ARRAY_BUFFER, aMask, gl.DYNAMIC_DRAW);
        gl.vertexAttribIPointer(i, 1, gl.UNSIGNED_BYTE, 0, 0);
      } else if (name === "aRand") {
        gl.bufferData(gl.ARRAY_BUFFER, aRand, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(i, 4, gl.FLOAT, false, 0, 0);
      } else {
        gl.bufferData(gl.ARRAY_BUFFER, targets[i], i === 0 ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
        gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 0, 0);
      }
      return buffer;
    });
    gl.bindVertexArray(null);
    await linked(gl, built);
    const locations = new Map<string, WebGLUniformLocation | null>();
    gpu = {
      shader: built.program,
      vao,
      buffers,
      at: (name) => {
        if (!locations.has(name)) locations.set(name, gl.getUniformLocation(built.program, name));
        return locations.get(name)!;
      },
    };
  };

  const reupload = (index: number, data: Float32Array | Uint8Array) => {
    if (!gpu) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, gpu.buffers[index]);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
  };

  let theme = THEMES[isDark() ? "dark" : "light"];
  let dark = isDark();
  let redraw = true;
  const onTheme = () => {
    dark = isDark();
    theme = THEMES[dark ? "dark" : "light"];
    setPortrait(dark);
    reupload(0, targets[0]);
    reupload(8, aRand);
    reupload(9, aMask);
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

  // Where each figure sits depends on the screen: beside the copy on wide
  // screens, above it on phones.
  const view = new Float32Array(16);
  const proj = new Float32Array(16);
  const offsets = new Float32Array(FIGURES * 3);
  const scales = new Float32Array(FIGURES);
  let aspect = 1;
  const layout = (w: number, h: number) => {
    aspect = w / h;
    perspective(proj, FOV, aspect, 0.1, 50);
    const visH = 2 * 5 * Math.tan(FOV / 2);
    const visW = visH * aspect;
    const narrow = w < 820;
    const side = narrow ? 0 : Math.min(visW * 0.24, 1.6);
    const up = narrow ? visH * 0.18 : 0;
    const fit = narrow ? Math.min(1, visW / 3.4) : 1;
    const p: Placement[] = [
      { x: side, y: narrow ? up * 1.25 : -0.05, s: fit * (narrow ? 0.82 : 1) },
      { x: narrow ? 0 : side * 1.15, y: up, s: fit * (narrow ? 0.7 : 0.72) },
      { x: side, y: up, s: fit * (narrow ? 0.8 : 1.15) },
      { x: side, y: up - (narrow ? 0 : 0.08), s: fit * (narrow ? 0.8 : 0.95) },
      { x: -side, y: up, s: fit * (narrow ? 0.6 : 1) },
      { x: 0, y: 0, s: Math.max(1, visW / 7) },
      { x: 0, y: narrow ? up : 0.62, s: fit * (narrow ? 0.9 : 1.45) },
      { x: narrow ? 0 : side * 0.95, y: narrow ? up * 1.1 : 0.05, s: fit * (narrow ? 0.85 : 1.05) },
    ];
    p.forEach((pl, i) => {
      offsets.set([pl.x, pl.y, 0], i * 3);
      scales[i] = pl.s;
    });
    redraw = true;
  };
  stage.onResize(layout);

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

  let target: Scene = { weights: [1, 0, 0, 0, 0, 0, 0, 0], chaos: 0, dim: 1 };
  const weights = new Float32Array([1, 0, 0, 0, 0, 0, 0, 0]);
  const spins = new Float32Array([0, 0, 0.18, 0.12, 0, 0.02, 0, 0]);
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
      weights.reduce((sum, w, i) => sum + w * (i + 1), 0) + chaos + dim + zoom + shift + amp + pointerAmt + camX + camY + pointerNow[0] + pointerNow[1];
    const before = signature();
    if (!still) clock += dt;
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

    // Held still with nothing changing: skip the frame and let the GPU rest.
    if (still && !redraw && Math.abs(signature() - before) < 1e-5) return;
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
    gl.uniform1f(at("uTime"), clock);
    gl.uniform1f(at("uChaos"), chaos);
    gl.uniform1f(at("uKick"), kick);
    gl.uniform1f(at("uIntro"), intro);
    gl.uniform1f(at("uAmp"), amp);
    gl.uniform1f(at("uBeat"), beat);
    gl.uniform3fv(at("uPointer"), pointerNow);
    gl.uniform1f(at("uPointerAmt"), pointerAmt);
    gl.uniform1f(at("uSize"), mobile ? 2.3 : 2.1);
    gl.uniform1f(at("uPixelRatio"), stage.dpr);
    gl.uniform1f(at("uDark"), dark ? 1 : 0);
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
