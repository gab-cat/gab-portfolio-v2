import * as THREE from "three";
import { GLSL_NOISE, createStage, damp, isDark, loadImage, rng, sampleImage, sampleText } from "../shared/gl";
import { THEME_EVENT } from "../../src/lib/theme";

/**
 * Signal: one particle system that re-forms into a different figure for each
 * chapter. Targets, in order:
 *   0 portrait  1 waveform  2 lattice  3 globe  4 seven  5 field  6 hello
 * Every particle carries all seven destinations; the page blends between them
 * with scroll, and a burst of noise hides the seams.
 */

export const TARGETS = 7;
type Placement = { x: number; y: number; z: number; s: number; spin: number };

const deg = Math.PI / 180;

function latLon(lat: number, lon: number, r: number) {
  const phi = (90 - lat) * deg;
  const theta = (lon + 180) * deg;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
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
  const naga = latLon(13.62, 123.19, R);
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
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    if (i < sphereCount) {
      const y = 1 - (i / (sphereCount - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      v.set(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(R);
      tint[i] = 0;
    } else if (i < sphereCount + clusterCount) {
      v.copy(naga).add(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.07));
      tint[i] = 1;
    } else {
      const [lat, lon] = cities[Math.floor(rand() * cities.length)];
      const to = latLon(lat, lon, R);
      const t = rand();
      v.copy(naga).normalize().lerp(to.clone().normalize(), t).normalize();
      v.multiplyScalar(R * (1 + Math.sin(Math.PI * t) * 0.32));
      tint[i] = 1;
    }
    out[i * 3] = v.x;
    out[i * 3 + 1] = v.y;
    out[i * 3 + 2] = v.z;
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

const vertex = /* glsl */ `
${GLSL_NOISE}
attribute vec3 t0; attribute vec3 t1; attribute vec3 t2; attribute vec3 t3;
attribute vec3 t4; attribute vec3 t5; attribute vec3 t6;
attribute vec4 aRand;   // size, phase, spare, portrait shade
attribute vec4 aTintA;  // accent flags for targets 0-3
attribute vec3 aTintB;  // accent flags for targets 4-6
uniform float uW[7];
uniform vec3 uOff[7];
uniform float uScale[7];
uniform float uSpin[7];
uniform float uTime;
uniform float uChaos;
uniform float uIntro;
uniform vec3 uPointer;
uniform float uPointerAmt;
uniform float uSize;
uniform float uPixelRatio;
uniform float uDark;
varying float vAccent;
varying float vAlpha;

vec3 spinY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 place(vec3 p, int k) { return spinY(p, uTime * uSpin[k]) * uScale[k] + uOff[k]; }

void main() {
  vec3 w1 = t1;
  w1.y += sin(w1.x * 3.2 - uTime * 1.8 + aRand.y) * 0.05;
  vec3 P = uW[0] * place(t0, 0) + uW[1] * place(w1, 1) + uW[2] * place(t2, 2) + uW[3] * place(t3, 3)
         + uW[4] * place(t4, 4) + uW[5] * place(t5, 5) + uW[6] * place(t6, 6);

  float turbulence = uChaos * 0.9 + (1.0 - uIntro) * 3.2;
  vec3 q = P * 0.9 + vec3(0.0, 0.0, uTime * 0.15);
  P += vec3(snoise(q), snoise(q + 17.1), snoise(q + 31.7)) * turbulence;
  P += vec3(snoise(P * 2.0 + uTime * 0.3), snoise(P * 2.0 + 9.0 + uTime * 0.3), 0.0) * 0.012;

  vec4 world = modelMatrix * vec4(P, 1.0);
  vec2 d = world.xy - uPointer.xy;
  float f = exp(-dot(d, d) / 0.12) * uPointerAmt;
  world.xy += normalize(d + 1e-4) * f * 0.28;
  world.z += f * 0.35;

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;
  float twinkle = 0.75 + 0.25 * sin(uTime * 2.0 + aRand.y * 6.2831);
  gl_PointSize = uSize * aRand.x * twinkle * uPixelRatio * (5.0 / -mv.z);

  vAccent = uW[0] * aTintA.x + uW[1] * aTintA.y + uW[2] * aTintA.z + uW[3] * aTintA.w
          + uW[4] * aTintB.x + uW[5] * aTintB.y + uW[6] * aTintB.z;
  float shade = mix(0.55 + 0.45 * aRand.w, 0.5 + 0.5 * (1.0 - aRand.w), 1.0 - uDark);
  vAlpha = mix(1.0, shade, uW[0]) * (0.35 + 0.65 * uIntro);
}
`;

const fragment = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uAccent;
uniform float uOpacity;
varying float vAccent;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.08, d);
  vec3 col = mix(uInk, uAccent, step(0.5, vAccent));
  gl_FragColor = vec4(col, a * vAlpha * uOpacity);
}
`;

export type SignalState = { weights: number[]; chaos: number };

export type SignalController = {
  setState: (state: SignalState) => void;
  dispose: () => void;
};

export async function createSignal(host: HTMLElement, onReady: () => void): Promise<SignalController | null> {
  const stage = createStage(host, { antialias: false, dprCap: 2 });
  if (!stage) return null;
  const { renderer } = stage;

  const mobile = window.matchMedia("(max-width: 760px)").matches;
  const COUNT = mobile ? 12000 : 22000;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0, 5);

  await document.fonts.ready;
  const img = await loadImage("/portraits/gab-editorial.webp");

  const tintA = new Float32Array(COUNT * 4);
  const tintB = new Float32Array(COUNT * 3);
  const scratch = new Float32Array(COUNT);
  const fillTint = (target: number) => {
    for (let i = 0; i < COUNT; i++) {
      if (target < 4) tintA[i * 4 + target] = scratch[i];
      else tintB[i * 3 + target - 4] = scratch[i];
    }
  };

  const rand = rng(29);
  const aRand = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    aRand[i * 4] = 0.6 + Math.pow(rand(), 3) * 2.2;
    aRand[i * 4 + 1] = rand() * 10;
    aRand[i * 4 + 2] = rand();
  }

  const portraitFor = (dark: boolean) =>
    sampleImage(
      img,
      COUNT,
      dark
        ? (lum) => (lum > 0.94 ? 0 : 0.03 + Math.pow(lum, 1.7))
        : (lum) => (lum > 0.94 ? 0 : 0.04 + Math.pow(1 - lum, 1.25)),
      { height: 2.7, relief: 0.35 },
    );

  const geometry = new THREE.BufferGeometry();
  const setPortrait = (dark: boolean) => {
    const { positions, shade } = portraitFor(dark);
    geometry.setAttribute("t0", new THREE.BufferAttribute(positions, 3));
    for (let i = 0; i < COUNT; i++) {
      aRand[i * 4 + 3] = shade[i];
      scratch[i] = aRand[i * 4 + 2] > 0.94 ? 1 : 0;
    }
    fillTint(0);
  };
  setPortrait(isDark());

  const add = (name: string, data: Float32Array, target: number) => {
    geometry.setAttribute(name, new THREE.BufferAttribute(data, 3));
    fillTint(target);
  };
  add("t1", waveform(COUNT, scratch), 1);
  add("t2", lattice(COUNT, scratch), 2);
  add("t3", globe(COUNT, scratch), 3);
  const display = "'Mona Sans Variable', sans-serif";
  const seven = sampleText("7", COUNT, { font: `800 600px ${display}`, height: 2.5, seed: 31 });
  for (let i = 0; i < COUNT; i++) scratch[i] = rand() < 0.1 ? 1 : 0;
  add("t4", seven, 4);
  add("t5", field(COUNT, scratch), 5);
  const hello = sampleText("hello.", COUNT, { font: `600 360px ${display}`, height: 1.25, seed: 37 });
  for (let i = 0; i < COUNT; i++) scratch[i] = rand() < 0.08 ? 1 : 0;
  add("t6", hello, 6);
  // the drawing position attribute is required but unused: point it at t0
  geometry.setAttribute("position", geometry.getAttribute("t0"));
  geometry.setAttribute("aRand", new THREE.BufferAttribute(aRand, 4));
  geometry.setAttribute("aTintA", new THREE.BufferAttribute(tintA, 4));
  geometry.setAttribute("aTintB", new THREE.BufferAttribute(tintB, 3));

  const uniforms = {
    uW: { value: [1, 0, 0, 0, 0, 0, 0] },
    uOff: { value: Array.from({ length: TARGETS }, () => new THREE.Vector3()) },
    uScale: { value: new Array(TARGETS).fill(1) },
    uSpin: { value: [0, 0, 0.18, 0.12, 0, 0.02, 0] },
    uTime: { value: 0 },
    uChaos: { value: 0 },
    uIntro: { value: 0 },
    uPointer: { value: new THREE.Vector3(99, 99, 0) },
    uPointerAmt: { value: 0 },
    uSize: { value: mobile ? 2.3 : 2.1 },
    uPixelRatio: { value: stage.dpr },
    uDark: { value: 1 },
    uInk: { value: new THREE.Color() },
    uAccent: { value: new THREE.Color() },
    uOpacity: { value: 1 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  const applyTheme = () => {
    const dark = isDark();
    uniforms.uDark.value = dark ? 1 : 0;
    uniforms.uInk.value.set(dark ? "#f1ede6" : "#141312");
    uniforms.uAccent.value.set(dark ? "#ff6a3d" : "#e2480f");
    uniforms.uOpacity.value = dark ? 0.95 : 0.85;
    material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    material.needsUpdate = true;
  };
  applyTheme();
  const onTheme = () => {
    setPortrait(isDark());
    geometry.attributes.aRand.needsUpdate = true;
    geometry.attributes.aTintA.needsUpdate = true;
    applyTheme();
  };
  window.addEventListener(THEME_EVENT, onTheme);

  // Where each figure sits depends on the screen: beside the copy on wide
  // screens, above it on phones.
  const layout = (w: number, h: number) => {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const visH = 2 * camera.position.z * Math.tan((camera.fov * deg) / 2);
    const visW = visH * camera.aspect;
    const narrow = w < 820;
    const side = narrow ? 0 : Math.min(visW * 0.24, 1.6);
    const up = narrow ? visH * 0.18 : 0;
    const fit = narrow ? Math.min(1, visW / 3.4) : 1;
    const p: Placement[] = [
      { x: side, y: narrow ? up * 1.25 : -0.05, z: 0, s: fit * (narrow ? 0.82 : 1), spin: 0 },
      { x: narrow ? 0 : side * 1.05, y: up, z: 0, s: fit * (narrow ? 0.7 : 0.72), spin: 0 },
      { x: side, y: up, z: 0, s: fit * (narrow ? 0.8 : 1.15), spin: 0.18 },
      { x: side, y: up - (narrow ? 0 : 0.08), z: 0, s: fit * (narrow ? 0.8 : 0.95), spin: 0.12 },
      { x: -side, y: up, z: 0, s: fit * (narrow ? 0.6 : 1), spin: 0 },
      { x: 0, y: 0, z: 0, s: Math.max(1, visW / 7), spin: 0.02 },
      { x: 0, y: narrow ? up : 0.35, z: 0, s: fit * (narrow ? 0.9 : 1.6), spin: 0 },
    ];
    p.forEach((pl, i) => {
      uniforms.uOff.value[i].set(pl.x, pl.y, pl.z);
      uniforms.uScale.value[i] = pl.s;
    });
  };
  stage.onResize(layout);

  // pointer in world space on the z = 0 plane
  const ndc = new THREE.Vector2();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  const pointer = new THREE.Vector3(99, 99, 0);
  let pointerActive = 0;
  const onMove = (event: PointerEvent) => {
    ndc.set((event.clientX / stage.width) * 2 - 1, -(event.clientY / stage.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) pointer.copy(hit);
    pointerActive = 1;
  };
  const onLeave = () => (pointerActive = 0);
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);

  let state: SignalState = { weights: [1, 0, 0, 0, 0, 0, 0], chaos: 0 };
  const current = [1, 0, 0, 0, 0, 0, 0];
  let chaos = 0;
  let intro = 0;
  let camX = 0;
  let camY = 0;

  onReady();
  stage.start((t, dt) => {
    uniforms.uTime.value = t;
    intro = damp(intro, 1, 1.6, dt);
    uniforms.uIntro.value = intro;
    for (let i = 0; i < TARGETS; i++) current[i] = damp(current[i], state.weights[i], 7, dt);
    uniforms.uW.value = current;
    chaos = damp(chaos, state.chaos, 6, dt);
    uniforms.uChaos.value = chaos;
    uniforms.uPointer.value.lerp(pointer, 1 - Math.exp(-10 * dt));
    uniforms.uPointerAmt.value = damp(uniforms.uPointerAmt.value, pointerActive, 4, dt);
    // a slow parallax drift toward the pointer
    camX = damp(camX, (ndc.x || 0) * 0.18, 2, dt);
    camY = damp(camY, (ndc.y || 0) * 0.12, 2, dt);
    camera.position.x = camX;
    camera.position.y = camY;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  });

  return {
    setState: (next) => {
      state = next;
    },
    dispose: () => {
      window.removeEventListener(THEME_EVENT, onTheme);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      geometry.dispose();
      material.dispose();
      stage.dispose();
    },
  };
}
