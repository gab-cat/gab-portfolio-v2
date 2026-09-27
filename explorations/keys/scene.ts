import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createStage, damp, isDark, prefersReducedMotion, smoothstep } from "../shared/gl";
import { THEME_EVENT } from "../../src/lib/theme";

/**
 * GC-61: a 60% mechanical keyboard built from rounded boxes and canvas
 * legends. It assembles itself on load, reacts to the visitor's real
 * keyboard, and explodes into five layers that map onto the stack.
 */

type KeyDef = { label: string; code: string; w?: number; accent?: boolean; mod?: boolean };

const ROWS: KeyDef[][] = [
  [
    { label: "esc", code: "Escape", accent: true },
    ..."1234567890".split("").map((d) => ({ label: d, code: `Digit${d}` })),
    { label: "-", code: "Minus" },
    { label: "=", code: "Equal" },
    { label: "delete", code: "Backspace", w: 2, mod: true },
  ],
  [
    { label: "tab", code: "Tab", w: 1.5, mod: true },
    ..."QWERTYUIOP".split("").map((c) => ({ label: c, code: `Key${c}` })),
    { label: "[", code: "BracketLeft" },
    { label: "]", code: "BracketRight" },
    { label: "\\", code: "Backslash", w: 1.5, mod: true },
  ],
  [
    { label: "caps", code: "CapsLock", w: 1.75, mod: true },
    ..."ASDFGHJKL".split("").map((c) => ({ label: c, code: `Key${c}` })),
    { label: ";", code: "Semicolon" },
    { label: "'", code: "Quote" },
    { label: "enter", code: "Enter", w: 2.25, accent: true },
  ],
  [
    { label: "shift", code: "ShiftLeft", w: 2.25, mod: true },
    ..."ZXCVBNM".split("").map((c) => ({ label: c, code: `Key${c}` })),
    { label: ",", code: "Comma" },
    { label: ".", code: "Period" },
    { label: "/", code: "Slash" },
    { label: "shift", code: "ShiftRight", w: 2.75, mod: true },
  ],
  [
    { label: "ctrl", code: "ControlLeft", w: 1.25, mod: true },
    { label: "opt", code: "AltLeft", w: 1.25, mod: true },
    { label: "cmd", code: "MetaLeft", w: 1.25, mod: true },
    { label: "", code: "Space", w: 6.25 },
    { label: "cmd", code: "MetaRight", w: 1.25, mod: true },
    { label: "opt", code: "AltRight", w: 1.25, mod: true },
    { label: "fn", code: "Fn", w: 1.25, mod: true },
    { label: "ctrl", code: "ControlRight", w: 1.25, mod: true },
  ],
];

/**
 * Camera stops, one per page section. The camera orbits `look` at `dist`,
 * `az` degrees around and `el` degrees up; `shift` slides the framed board
 * sideways (a fraction of the screen) so it never sits under the copy.
 */
export type Keyframe = {
  look: [number, number, number];
  dist: number;
  az: number;
  el: number;
  shift: number;
  explode: number;
  dim: number;
};

export const KEYFRAMES: Keyframe[] = [
  { look: [0.4, -0.2, -0.3], dist: 36, az: -16, el: 36, shift: 0.22, explode: 0, dim: 0 }, // hero
  { look: [0.4, 1.9, 0], dist: 50, az: 28, el: 16, shift: 0.05, explode: 1, dim: 0 }, // anatomy
  { look: [3.5, 0.2, 0], dist: 21, az: 62, el: 14, shift: 0.26, explode: 0, dim: 0.15 }, // log
  { look: [-2.5, 0, 0], dist: 32, az: -38, el: 30, shift: -0.3, explode: 0, dim: 0.1 }, // work
  { look: [0, 0, -0.4], dist: 44, az: 0, el: 88, shift: 0.24, explode: 0, dim: 0.1 }, // wins
  { look: [6.3, 0.35, 0.1], dist: 12.5, az: 34, el: 32, shift: 0.24, explode: 0, dim: 0 }, // enter
];

/** Where each layer's callout attaches, in keyboard space before exploding. */
export const LAYERS = ["keycaps", "switches", "plate", "pcb", "case"] as const;
export type Layer = (typeof LAYERS)[number];

export type KeysController = {
  setProgress: (section: number, t: number) => void;
  press: (code: string, down: boolean) => void;
  setDisplay: (text: string) => void;
  anchors: () => Record<Layer, { x: number; y: number; visible: boolean }>;
  onKey: (fn: (code: string, label: string) => void) => void;
  dispose: () => void;
};

const COLORS = {
  light: { alpha: "#e4e4df", mod: "#b9b9b3", accent: "#ff5a1f", legend: "#1b1b1b", legendMod: "#1b1b1b", case: "#c8c8c3", plate: "#9d9d98", pcb: "#16181a" },
  dark: { alpha: "#2c2c2c", mod: "#1d1d1d", accent: "#ff5a1f", legend: "#e9e7e2", legendMod: "#bdbab4", case: "#1c1c1c", plate: "#3c3c3c", pcb: "#0c0d0e" },
};

function legendTexture(label: string, w: number, color: string, accent: boolean) {
  const c = document.createElement("canvas");
  const unit = 128;
  c.width = Math.round(unit * w);
  c.height = unit;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = accent ? "#160600" : color;
  const single = label.length === 1;
  ctx.font = single ? `500 44px "Host Grotesk Variable", sans-serif` : `500 26px "IBM Plex Mono", monospace`;
  ctx.textBaseline = "top";
  ctx.fillText(single ? label : label.toUpperCase(), 22, 20);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function pcbTexture() {
  const c = document.createElement("canvas");
  c.width = 1536;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#121416";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "#ff5a1f";
  ctx.lineWidth = 3;
  let seed = 9;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 90; i++) {
    let x = rand() * c.width;
    let y = rand() * c.height;
    ctx.globalAlpha = 0.35 + rand() * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 4; s++) {
      if (s % 2 === 0) x += (rand() - 0.5) * 360;
      else y += (rand() - 0.5) * 200;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ff5a1f";
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // switch footprints
  ctx.fillStyle = "#2a2d30";
  for (let r = 0; r < 5; r++) for (let k = 0; k < 15; k++) ctx.fillRect(50 + k * 97, 45 + r * 94, 40, 40);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createKeys(host: HTMLElement): KeysController | null {
  const stage = createStage(host, { shadows: true, dprCap: 1.75 });
  if (!stage) return null;
  const { renderer } = stage;
  renderer.toneMapping = THREE.NeutralToneMapping;
  const reduced = prefersReducedMotion();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 300);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.03).texture;
  scene.environmentIntensity = 0.9;
  room.dispose();
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(-8, 16, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -12;
  key.shadow.camera.right = 12;
  key.shadow.camera.top = 9;
  key.shadow.camera.bottom = -9;
  key.shadow.camera.far = 60;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  scene.add(key);
  const fill = new THREE.HemisphereLight(0xffffff, 0x888888, 0.6);
  scene.add(fill);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.02;
  ground.receiveShadow = true;
  scene.add(ground);

  const board = new THREE.Group();
  scene.add(board);

  const layers: Record<Layer, THREE.Group> = {
    keycaps: new THREE.Group(),
    switches: new THREE.Group(),
    plate: new THREE.Group(),
    pcb: new THREE.Group(),
    case: new THREE.Group(),
  };
  LAYERS.forEach((l) => board.add(layers[l]));

  const palette = () => (isDark() ? COLORS.dark : COLORS.light);
  let pal = palette();

  const matAlpha = new THREE.MeshStandardMaterial({ color: pal.alpha, roughness: 0.62 });
  const matMod = new THREE.MeshStandardMaterial({ color: pal.mod, roughness: 0.62 });
  const matAccent = new THREE.MeshStandardMaterial({ color: pal.accent, roughness: 0.5 });
  const matSwitch = new THREE.MeshStandardMaterial({ color: "#151515", roughness: 0.4 });
  const matStem = new THREE.MeshStandardMaterial({ color: "#ff5a1f", roughness: 0.4 });
  const matCase = new THREE.MeshStandardMaterial({ color: pal.case, roughness: 0.32, metalness: 0.75 });
  const matPlate = new THREE.MeshStandardMaterial({ color: pal.plate, roughness: 0.35, metalness: 0.8 });
  const matPcb = new THREE.MeshStandardMaterial({ map: pcbTexture(), roughness: 0.7 });

  type Cap = {
    def: KeyDef;
    group: THREE.Group;
    cap: THREE.Mesh;
    legend: THREE.Mesh;
    home: THREE.Vector3;
    depth: number;
    target: number;
    vel: number;
    drop: number;
    delay: number;
  };
  const caps = new Map<string, Cap>();
  const capMeshes: THREE.Mesh[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const legendMats: THREE.MeshBasicMaterial[] = [];

  const U = 1;
  ROWS.forEach((row, r) => {
    let x = -7.5;
    row.forEach((def) => {
      const w = def.w ?? 1;
      const cx = x + w / 2;
      const cz = -2 + r;
      x += w;
      const geo = new RoundedBoxGeometry(w * U - 0.1, 0.46, 0.9, 3, 0.11);
      geometries.push(geo);
      const cap = new THREE.Mesh(geo, def.accent ? matAccent : def.mod ? matMod : matAlpha);
      cap.castShadow = true;
      cap.receiveShadow = true;
      cap.userData.code = def.code;
      const legendMat = new THREE.MeshBasicMaterial({
        map: legendTexture(def.label, w, def.mod ? pal.legendMod : pal.legend, !!def.accent),
        transparent: true,
        depthWrite: false,
      });
      legendMats.push(legendMat);
      const legendGeo = new THREE.PlaneGeometry(w * U - 0.26, 0.74);
      geometries.push(legendGeo);
      const legend = new THREE.Mesh(legendGeo, legendMat);
      legend.rotation.x = -Math.PI / 2;
      legend.position.y = 0.232;
      const group = new THREE.Group();
      group.add(cap, legend);
      const home = new THREE.Vector3(cx, 0.52, cz);
      group.position.copy(home);
      layers.keycaps.add(group);
      capMeshes.push(cap);
      caps.set(def.code, {
        def,
        group,
        cap,
        legend,
        home,
        depth: 0,
        target: 0,
        vel: 0,
        drop: reduced ? 0 : 7,
        delay: reduced ? 0 : 0.25 + (cx + 7.5) * 0.045 + r * 0.05,
      });

      // switch under every cap: housing plus an orange stem
      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.26, 0.62), matSwitch);
      housing.position.set(cx, 0.2, cz);
      housing.castShadow = true;
      const stem = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), matStem);
      stem.position.set(cx, 0.38, cz);
      layers.switches.add(housing, stem);
      geometries.push(housing.geometry, stem.geometry);
    });
  });

  const plateGeo = new RoundedBoxGeometry(15.3, 0.07, 5.3, 2, 0.03);
  const plate = new THREE.Mesh(plateGeo, matPlate);
  plate.position.y = 0.05;
  plate.castShadow = true;
  plate.receiveShadow = true;
  layers.plate.add(plate);

  const pcbGeo = new THREE.BoxGeometry(15.1, 0.06, 5.1);
  const pcb = new THREE.Mesh(pcbGeo, [matSwitch, matSwitch, matPcb, matSwitch, matSwitch, matSwitch]);
  pcb.position.y = -0.22;
  pcb.receiveShadow = true;
  layers.pcb.add(pcb);

  // case with a display strip along the back
  const caseGeo = new RoundedBoxGeometry(16.1, 1.0, 7.1, 4, 0.34);
  const shell = new THREE.Mesh(caseGeo, matCase);
  shell.position.set(0, -0.48, -0.55);
  shell.castShadow = true;
  shell.receiveShadow = true;
  layers.case.add(shell);

  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 1024;
  screenCanvas.height = 128;
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
  // a raised, tilted display pod along the back edge, visible above the caps
  const pod = new THREE.Group();
  const podBody = new THREE.Mesh(new RoundedBoxGeometry(7.8, 1.4, 1.3, 3, 0.18), matCase);
  podBody.position.y = -0.25;
  podBody.castShadow = true;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(7.1, 0.86), screenMat);
  screen.position.set(0, 0.2, 0.7);
  screen.rotation.x = -0.6;
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(7.4, 1.05, 0.06, 2, 0.02), new THREE.MeshStandardMaterial({ color: "#0b0b0b", roughness: 0.3 }));
  bezel.position.set(0, 0.2, 0.64);
  bezel.rotation.x = -0.6;
  pod.add(podBody, bezel, screen);
  pod.position.set(3.4, 0.62, -3.75);
  layers.case.add(pod);

  // coiled cable leaving the back
  const cablePts = [
    new THREE.Vector3(-5.5, -0.3, -4.1),
    new THREE.Vector3(-5.6, -0.6, -6),
    new THREE.Vector3(-6.4, -0.9, -8),
    new THREE.Vector3(-9, -0.95, -9.5),
    new THREE.Vector3(-14, -0.95, -10.5),
  ];
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePts), 80, 0.12, 12, false),
    new THREE.MeshStandardMaterial({ color: "#ff5a1f", roughness: 0.55 }),
  );
  cable.castShadow = true;
  layers.case.add(cable);

  let display = "GC-61 READY";
  let blink = true;
  const drawScreen = () => {
    const ctx = screenCanvas.getContext("2d")!;
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, 1024, 128);
    // faint pixel grid so it reads as a dot-matrix panel
    ctx.fillStyle = "#171717";
    for (let x = 0; x < 1024; x += 8) for (let y = 0; y < 128; y += 8) ctx.fillRect(x, y, 5, 5);
    ctx.fillStyle = "#ff5a1f";
    ctx.font = `800 76px "Doto Variable", monospace`;
    ctx.textBaseline = "middle";
    ctx.fillText(display + (blink ? "_" : " "), 34, 68);
    screenTex.needsUpdate = true;
  };
  document.fonts.ready.then(() => {
    caps.forEach((c) => {
      const mat = c.legend.material as THREE.MeshBasicMaterial;
      mat.map?.dispose();
      mat.map = legendTexture(c.def.label, c.def.w ?? 1, c.def.mod ? pal.legendMod : pal.legend, !!c.def.accent);
      mat.needsUpdate = true;
    });
    drawScreen();
  });
  drawScreen();
  const blinkTimer = window.setInterval(() => {
    blink = !blink;
    drawScreen();
  }, 530);

  const applyTheme = () => {
    pal = palette();
    matAlpha.color.set(pal.alpha);
    matMod.color.set(pal.mod);
    matCase.color.set(pal.case);
    matPlate.color.set(pal.plate);
    (ground.material as THREE.ShadowMaterial).opacity = isDark() ? 0.45 : 0.16;
    scene.environmentIntensity = isDark() ? 0.55 : 0.9;
    caps.forEach((c) => {
      const mat = c.legend.material as THREE.MeshBasicMaterial;
      mat.map?.dispose();
      mat.map = legendTexture(c.def.label, c.def.w ?? 1, c.def.mod ? pal.legendMod : pal.legend, !!c.def.accent);
      mat.needsUpdate = true;
    });
  };
  applyTheme();
  window.addEventListener(THEME_EVENT, applyTheme);

  const narrow = () => stage.width / stage.height < 0.9;
  stage.onResize((w, h) => {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });

  // hover and click on the 3D keys
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2(9, 9);
  let hovered: Cap | null = null;
  let listener: ((code: string, label: string) => void) | null = null;
  const pick = () => {
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(capMeshes, false)[0];
    return hit ? caps.get(hit.object.userData.code as string) ?? null : null;
  };
  const onMove = (event: PointerEvent) => {
    if (event.target !== stage.canvas) {
      ndc.set(9, 9);
      return;
    }
    ndc.set((event.clientX / stage.width) * 2 - 1, -(event.clientY / stage.height) * 2 + 1);
  };
  let held: Cap | null = null;
  const onDown = (event: PointerEvent) => {
    if (event.target !== stage.canvas) return;
    const c = pick();
    if (!c) return;
    held = c;
    c.target = 1;
    listener?.(c.def.code, c.def.label);
  };
  const onUp = () => {
    if (held) held.target = 0;
    held = null;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);

  let section = 0;
  let sectionT = 0;
  const view = { ...KEYFRAMES[0], look: [...KEYFRAMES[0].look] as [number, number, number] };
  let explode = 0;
  let dim = 0;
  const LIFT: Record<Layer, number> = { keycaps: 4.4, switches: 2.7, plate: 1.55, pcb: 0.45, case: -0.5 };
  let start = -1;

  stage.start((t, dt) => {
    if (start < 0) start = t;
    const age = t - start;
    const a = KEYFRAMES[Math.min(section, KEYFRAMES.length - 1)];
    const b = KEYFRAMES[Math.min(section + 1, KEYFRAMES.length - 1)];
    const k = smoothstep(0, 1, sectionT);
    const mix = (x: number, y: number) => x + (y - x) * k;
    const lambda = reduced ? 50 : 3;
    const slim = narrow();
    view.dist = damp(view.dist, mix(a.dist, b.dist) * (slim ? 1.75 : 1), lambda, dt);
    view.az = damp(view.az, mix(a.az, b.az), lambda, dt);
    view.el = damp(view.el, mix(a.el, b.el), lambda, dt);
    view.shift = damp(view.shift, slim ? 0 : mix(a.shift, b.shift), lambda, dt);
    for (let i = 0; i < 3; i++) {
      // phones: centre the board and park it in the upper half, above the copy
      const want = mix(a.look[i], b.look[i]) * (slim && i === 0 ? 0.3 : 1) - (slim && i === 1 ? 4.5 : 0);
      view.look[i] = damp(view.look[i], want, lambda, dt);
    }
    explode = damp(explode, mix(a.explode, b.explode), reduced ? 50 : 4, dt);
    dim = damp(dim, mix(a.dim, b.dim), 4, dt);
    const az = (view.az * Math.PI) / 180;
    const el = (Math.min(view.el, 89) * Math.PI) / 180;
    camera.position.set(
      view.look[0] + Math.sin(az) * Math.cos(el) * view.dist,
      view.look[1] + Math.sin(el) * view.dist,
      view.look[2] + Math.cos(az) * Math.cos(el) * view.dist,
    );
    camera.lookAt(view.look[0], view.look[1], view.look[2]);
    camera.setViewOffset(stage.width, stage.height, -view.shift * stage.width, 0, stage.width, stage.height);

    LAYERS.forEach((l) => (layers[l].position.y = LIFT[l] * explode));
    layers.keycaps.position.x = 0;

    const hover = pick();
    if (hover !== hovered) {
      if (hovered && hovered !== held) hovered.target = 0;
      hovered = hover;
      stage.canvas.style.cursor = hover ? "pointer" : "";
    }

    caps.forEach((c) => {
      // intro: every cap drops onto its switch, left to right
      const since = age - c.delay;
      let fall = 0;
      if (c.drop > 0) {
        fall = since < 0 ? c.drop : c.drop * Math.max(0, 1 - since / 0.5) ** 2;
        if (since >= 0.5) {
          // landing: hand the impact to the spring so the cap bounces on its switch
          c.drop = 0;
          c.vel = -4.2;
        }
      }
      const want = c.target * -0.17 + (hovered === c && c.target === 0 ? 0.05 : 0);
      // a stiff spring gives the travel a mechanical snap
      const accel = (want - c.depth) * 900 - c.vel * 38;
      c.vel += accel * dt;
      c.depth += c.vel * dt;
      c.group.position.set(c.home.x, c.home.y + c.depth + fall, c.home.z);
    });

    renderer.toneMappingExposure = 1 - dim * 0.35;
    renderer.render(scene, camera);
  });

  const projected = new THREE.Vector3();
  const anchorPoints: Record<Layer, THREE.Vector3> = {
    keycaps: new THREE.Vector3(7.8, 0.75, 1.6),
    switches: new THREE.Vector3(7.6, 0.3, 1.6),
    plate: new THREE.Vector3(7.7, 0.06, 1.8),
    pcb: new THREE.Vector3(7.6, -0.22, 1.8),
    case: new THREE.Vector3(8.05, -0.45, 1.9),
  };

  return {
    setProgress: (s, t) => {
      section = s;
      sectionT = t;
    },
    press: (code, down) => {
      const c = caps.get(code);
      if (c) c.target = down ? 1 : 0;
    },
    setDisplay: (text) => {
      display = text;
      blink = true;
      drawScreen();
    },
    anchors: () => {
      const out = {} as Record<Layer, { x: number; y: number; visible: boolean }>;
      LAYERS.forEach((l) => {
        projected.copy(anchorPoints[l]);
        projected.y += LIFT[l] * explode;
        projected.project(camera);
        out[l] = {
          x: ((projected.x + 1) / 2) * stage.width,
          y: ((1 - projected.y) / 2) * stage.height,
          visible: explode > 0.55,
        };
      });
      return out;
    },
    onKey: (fn) => {
      listener = fn;
    },
    dispose: () => {
      clearInterval(blinkTimer);
      window.removeEventListener(THEME_EVENT, applyTheme);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      geometries.forEach((g) => g.dispose());
      legendMats.forEach((m) => {
        m.map?.dispose();
        m.dispose();
      });
      [matAlpha, matMod, matAccent, matSwitch, matStem, matCase, matPlate, matPcb, screenMat].forEach((m) => m.dispose());
      screenTex.dispose();
      stage.dispose();
    },
  };
}
