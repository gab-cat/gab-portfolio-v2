import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { CLAY, contactShadowTexture, createClayKit, lumpy } from "./clay/kit";
import { board, controller, database, diorama, guild, merch, robot, servers, tarot, type Character, type Tools } from "./clay/characters";
import { isMotionPaused, onMotionChange } from "./motion";
import { onScrollFrame } from "./scroll";
import { THEME_EVENT } from "./theme";

export interface SculptureController {
  dispose: () => void;
}

/** One transparent viewport, shared lighting and geometry across every chapter.
 * Scissor regions keep each clay piece inside its own layout slot, including
 * sticky slots. One WebGL context, no model files, no texture downloads. */
export function createSculpture(
  host: HTMLElement,
  onUnavailable: () => void,
): SculptureController | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  renderer.toneMapping = THREE.NeutralToneMapping;
  host.appendChild(renderer.domElement);

  const kit = createClayKit();
  const clay = kit.clay;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.55;
  room.dispose();
  pmrem.dispose();
  const hemi = new THREE.HemisphereLight(0xfff5ea, 0xb99c86, 1.1);
  const key = new THREE.DirectionalLight(0xfff0e0, 2.6);
  key.position.set(-4, 6, 6);
  const rim = new THREE.DirectionalLight(0xffc8a6, 1.1);
  rim.position.set(5, 1, -2);
  scene.add(hemi, key, rim);

  const geometries: THREE.BufferGeometry[] = [];
  const keep = <T extends THREE.BufferGeometry>(g: T) => {
    geometries.push(g);
    return g;
  };
  const put = (geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D) => {
    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);
    return mesh;
  };
  const sphere = (r: number, lump = 0.05, seed = 0) =>
    keep(lumpy(new THREE.SphereGeometry(r, 36, 24), r * lump, 1.4 / r, seed));
  const box = (w: number, h: number, d: number, radius: number, seed = 0) =>
    keep(lumpy(new RoundedBoxGeometry(w, h, d, 5, radius), 0.025, 1.3, seed));
  const capsule = (r: number, length: number, seed = 0) =>
    keep(lumpy(new THREE.CapsuleGeometry(r, length, 8, 20), r * 0.05, 2 / r, seed));
  const torus = (r: number, t: number, arc = Math.PI * 2, seed = 0) =>
    keep(lumpy(new THREE.TorusGeometry(r, t, 20, 80, arc), t * 0.08, 2, seed));

  const shadowTexture = contactShadowTexture();
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0.22,
    toneMapped: false,
  });
  const shadowGeo = keep(new THREE.PlaneGeometry(1, 1));

  type Model = { root: THREE.Group; spin: THREE.Group; shadow: THREE.Mesh; radius: number; centerY: number; elev: number; span?: number; hover?: number; cast?: Character };
  const models: Record<string, Model> = {};
  /** `radius` and `centerY` bound the piece and its shadow; the camera always fits them. */
  const create = (name: string, radius: number, centerY: number, shadowY: number, shadowSize: number) => {
    const root = new THREE.Group();
    const spin = new THREE.Group();
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = shadowY;
    shadow.scale.set(shadowSize, shadowSize * 0.55, 1);
    root.add(spin, shadow);
    scene.add(root);
    models[name] = { root, spin, shadow, radius, centerY, elev: 0 };
    return spin;
  };

  /* Listen: two chat bubbles, one of them typing. */
  const connection = create("connection", 2.45, -0.1, -1.75, 4.6);
  const bubbleA = new THREE.Group();
  put(box(2.3, 1.35, 0.62, 0.42, 1), clay(CLAY.cream), bubbleA);
  const tailA = put(keep(lumpy(new THREE.ConeGeometry(0.26, 0.55, 20), 0.01, 3)), clay(CLAY.cream), bubbleA);
  tailA.position.set(-0.72, -0.8, 0);
  tailA.rotation.z = Math.PI + 0.5;
  const lineGeo = capsule(0.07, 1.2, 2);
  lineGeo.rotateZ(Math.PI / 2);
  [0.26, -0.02, -0.3].forEach((y, i) => {
    const line = put(lineGeo, clay(CLAY.oat), bubbleA);
    line.position.set(-0.12 - (i === 2 ? 0.25 : 0), y, 0.33);
    line.scale.x = i === 2 ? 0.6 : 1;
  });
  bubbleA.position.set(-0.75, 0.62, 0);
  bubbleA.rotation.z = 0.06;
  const bubbleB = new THREE.Group();
  put(box(1.9, 1.1, 0.62, 0.42, 3), clay(CLAY.flame), bubbleB);
  const tailB = put(keep(lumpy(new THREE.ConeGeometry(0.24, 0.5, 20), 0.01, 4)), clay(CLAY.flame), bubbleB);
  tailB.position.set(0.62, -0.66, 0);
  tailB.rotation.z = Math.PI - 0.5;
  const dots = [-0.45, 0, 0.45].map((x, i) => {
    const dot = put(sphere(0.13, 0.04, i), clay(0xfff4ea), bubbleB);
    dot.position.set(x, 0, 0.34);
    return dot;
  });
  bubbleB.position.set(0.85, -0.78, 0.4);
  bubbleB.rotation.z = -0.07;
  connection.add(bubbleA, bubbleB);

  /* Experience: one clay block per role, stacked as the story scrolls. */
  const building = create("building", 3.35, -0.9, -2.62, 4.4);
  const blockColors = [CLAY.sage, CLAY.lilac, CLAY.blush, CLAY.butter, CLAY.sky, 0xd9e97a];
  const blocks = blockColors.map((color, i) => {
    const w = 2.3 - (i % 2) * 0.35 - i * 0.08;
    const block = put(box(w, 0.62, 1.5 - (i % 3) * 0.12, 0.2, 10 + i), clay(color), building);
    block.userData = { y: -1.95 + i * 0.66, turn: (i % 2 ? 1 : -1) * (0.12 + i * 0.03) };
    return block;
  });
  const topper = put(sphere(0.34, 0.05, 7), clay(CLAY.flame), building);
  const towerBase = put(keep(lumpy(new THREE.CylinderGeometry(1.75, 1.85, 0.3, 48, 1), 0.02, 1.5, 17)), clay(CLAY.cream), building);
  towerBase.position.y = -2.42;

  /* Work: a small clay world with somewhere to be. */
  const possibility = create("possibility", 2.45, -0.1, -1.95, 3.6);
  const globe = new THREE.Group();
  put(sphere(1.35, 0.03, 11), clay(CLAY.sky, { repeat: 3 }), globe);
  const land = clay(CLAY.sage);
  [
    [0.4, 0.5, 0.55, 0.62],
    [-0.8, 0.1, 0.45, 0.5],
    [0.2, -0.7, 0.5, 0.45],
    [1.0, -0.2, -0.3, 0.4],
    [-0.3, 0.9, -0.6, 0.38],
    [-0.9, -0.5, -0.5, 0.42],
  ].forEach(([x, y, z, r], i) => {
    const blob = put(sphere(r, 0.1, 20 + i), land, globe);
    const dir = new THREE.Vector3(x, y, z).normalize();
    blob.position.copy(dir).multiplyScalar(1.3);
    blob.scale.set(1, 1, 0.28);
    blob.lookAt(dir.multiplyScalar(3));
  });
  const pin = new THREE.Group();
  put(sphere(0.2, 0.04, 30), clay(CLAY.flame), pin).position.y = 0.34;
  const pinStem = put(capsule(0.05, 0.25, 31), clay(CLAY.charcoal), pin);
  pinStem.position.y = 0.12;
  pin.position.set(0, 1.33, 0);
  globe.add(pin);
  const orbit = put(torus(2.05, 0.07, Math.PI * 2, 32), clay(CLAY.butter), possibility);
  orbit.rotation.set(1.25, 0.2, -0.3);
  const moon = put(sphere(0.28, 0.06, 33), clay(CLAY.flame), possibility);
  possibility.add(globe);

  /* Recognition: a trophy, still warm. */
  const pressure = create("pressure", 2.45, 0, -2.05, 3.2);
  const cupProfile = [
    [0, 0.2],
    [0.62, 0.3],
    [0.95, 0.9],
    [1.08, 1.75],
    [1.14, 1.82],
    [1.02, 1.82],
    [0.9, 1.1],
    [0.55, 0.45],
    [0, 0.4],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const gold = clay(CLAY.butter, { roughness: 0.45, sheen: 0.8 });
  const cup = put(keep(lumpy(new THREE.LatheGeometry(cupProfile, 64), 0.02, 1.8, 40)), gold, pressure);
  (cup.material as THREE.Material).side = THREE.DoubleSide;
  cup.position.y = -0.2;
  for (const side of [-1, 1]) {
    const handle = put(torus(0.38, 0.09, Math.PI * 1.15, 41 + side), gold, pressure);
    handle.position.set(side * 1.02, 1.05, 0);
    handle.rotation.z = side > 0 ? -Math.PI * 0.58 : Math.PI * 0.42;
  }
  const stem = put(capsule(0.2, 0.5, 43), gold, pressure);
  stem.position.y = -0.3;
  const plinth = put(box(1.6, 0.5, 1.2, 0.16, 44), clay(CLAY.charcoal), pressure);
  plinth.position.y = -1.0;
  const plaque = put(box(0.8, 0.22, 0.06, 0.05, 45), clay(CLAY.flame), pressure);
  plaque.position.set(0, -1.0, 0.61);
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.14 : 0.32;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i) star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    else star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const starGeo = keep(new THREE.ExtrudeGeometry(star, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4 }));
  starGeo.center();
  const starMesh = put(starGeo, clay(CLAY.flame), pressure);
  starMesh.position.set(0, 0.85, 0.98);
  const confettiColors = [CLAY.flame, CLAY.sky, CLAY.lilac, CLAY.sage, CLAY.blush];
  const confettiGeo = box(0.16, 0.16, 0.05, 0.03, 46);
  const confetti = Array.from({ length: 10 }, (_, i) => {
    const bit = put(confettiGeo, clay(confettiColors[i % confettiColors.length]), pressure);
    bit.userData = { a: (i / 10) * Math.PI * 2, r: 1.7 + (i % 3) * 0.25, y: 0.2 + (i % 4) * 0.45 };
    return bit;
  });

  /* Hello: a mailbox with its flag up. */
  const together = create("together", 2.5, 0.2, -1.8, 3.2);
  const mailbox = new THREE.Group();
  const orange = clay(CLAY.flame);
  put(box(1.35, 1.1, 2.1, 0.22, 50), orange, mailbox).position.y = 0.55;
  const roofGeo = keep(lumpy(new THREE.CylinderGeometry(0.675, 0.675, 2.1, 36, 1, false, 0, Math.PI), 0.015, 2, 51));
  roofGeo.rotateX(Math.PI / 2);
  roofGeo.rotateZ(Math.PI / 2);
  const roof = put(roofGeo, orange, mailbox);
  roof.position.y = 1.1;
  const door = put(box(1.18, 1.35, 0.14, 0.12, 52), clay(CLAY.cream), mailbox);
  door.position.set(0, 0.95, 1.06);
  const knob = put(sphere(0.09, 0.05, 53), clay(CLAY.charcoal), mailbox);
  knob.position.set(0, 0.62, 1.16);
  const slot = put(box(0.9, 0.12, 0.06, 0.04, 59), clay(CLAY.charcoal), mailbox);
  slot.position.set(0, 1.3, 1.14);
  const post = put(box(0.42, 1.8, 0.42, 0.12, 54), clay(CLAY.cocoa), mailbox);
  post.position.y = -0.85;
  const flagArm = new THREE.Group();
  flagArm.position.set(0.72, 0.8, 0.35);
  const flagPole = put(box(0.08, 1.05, 0.1, 0.03, 55), clay(CLAY.butter), flagArm);
  flagPole.position.y = 0.45;
  const flagTip = put(box(0.08, 0.36, 0.5, 0.05, 56), clay(CLAY.butter), flagArm);
  flagTip.position.set(0, 0.8, -0.24);
  mailbox.add(flagArm);
  const letter = new THREE.Group();
  put(box(1.0, 0.64, 0.07, 0.05, 57), clay(0xfffaf2), letter);
  const seal = put(sphere(0.1, 0.04, 58), clay(CLAY.flame), letter);
  seal.position.z = 0.05;
  seal.scale.z = 0.4;
  letter.scale.setScalar(0.8);
  mailbox.add(letter);
  const mound = put(sphere(0.85, 0.08, 60), clay(0x8fb66e, { roughness: 0.8 }), mailbox);
  mound.position.y = -1.78;
  mound.scale.set(1, 0.28, 1);
  mailbox.position.y = 0.2;
  together.add(mailbox);

  /* What I do: the cast, each standing on its own clay floor. */
  const owned: THREE.Material[] = [];
  const tools: Tools = {
    clay,
    keep,
    own: (m) => {
      owned.push(m);
      return m;
    },
    put,
    sphere,
    box,
    capsule,
    torus,
    shadow: (parent, size, y) => {
      const plane = new THREE.Mesh(shadowGeo, shadowMat);
      plane.rotation.x = -Math.PI / 2;
      plane.position.y = y;
      plane.scale.set(size, size * 0.55, 1);
      parent.add(plane);
      return plane;
    },
  };
  /** `span` is a half-width that must always fit, for wide pieces in narrow slots. */
  const stage = (name: string, cast: Character, radius: number, centerY: number, elev: number, span?: number) => {
    const spin = create(name, radius, centerY, 0, 0);
    const model = models[name];
    model.shadow.visible = false;
    model.elev = elev;
    model.cast = cast;
    model.span = span;
    spin.add(cast.group);
  };
  stage("robot", robot(tools, { rail: true }), 2.15, 0.0, 0.2);
  stage("servers", servers(tools), 2.35, 0.3, 0.24);
  stage("database", database(tools), 2.3, 0.1, 0.24);
  stage("controller", controller(tools), 2.05, -0.2, 0.2);
  stage("diorama", diorama(tools), 2.3, -0.42, 0.17, 6.35);
  stage("merch", merch(tools), 2.55, -0.05, 0.16);
  stage("guild", guild(tools), 2.45, -0.55, 0.3);
  stage("generals", board(tools), 1.85, -1.5, 0.7);
  stage("tarot", tarot(tools), 2.2, -0.55, 0.14);

  /* 404: two clay fours, and the ball playing the zero. */
  const missing = create("lost", 3.0, 0.05, -1.02, 6.4);
  const four = new THREE.Shape();
  (
    [
      [0, 2], [0.42, 2], [0.42, 0.97], [0.78, 0.97], [0.78, 2], [1.2, 2], [1.2, 0.97],
      [1.4, 0.97], [1.4, 0.55], [1.2, 0.55], [1.2, 0], [0.78, 0], [0.78, 0.55], [0, 0.55],
    ] as const
  ).forEach(([x, y], i) => (i ? four.lineTo(x, y) : four.moveTo(x, y)));
  four.closePath();
  const fourGeo = keep(lumpy(new THREE.ExtrudeGeometry(four, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.12, bevelSegments: 6, curveSegments: 4 }), 0.012, 2.2, 61));
  fourGeo.center();
  const digitMat = clay(CLAY.charcoal).clone();
  const fours = [-2.05, 2.05].map((x, i) => {
    const digit = put(fourGeo, digitMat, missing);
    digit.position.set(x, 0, 0);
    digit.rotation.y = i ? -0.18 : 0.18;
    return digit;
  });
  const zero = put(sphere(0.72, 0.03, 62), clay(CLAY.flame), missing);
  const zeroShadow = new THREE.Mesh(shadowGeo, shadowMat);
  zeroShadow.rotation.x = -Math.PI / 2;
  zeroShadow.position.set(0, -1.0, 0);
  missing.add(zeroShadow);
  // The hole it was meant for, with nobody in it.
  const emptyHole = put(keep(new THREE.CircleGeometry(0.3, 32)), clay(0x2d2520, { roughness: 1 }), missing);
  emptyHole.rotation.x = -Math.PI / 2;
  emptyHole.position.set(0, -0.99, 2.2);
  const lipRing = put(torus(0.31, 0.05, Math.PI * 2, 63), clay(CLAY.sage), missing);
  lipRing.rotation.x = Math.PI / 2;
  lipRing.position.set(0, -0.98, 2.2);

  /* ------------------------------------------------------------ frames */
  const slots = Array.from(document.querySelectorAll<HTMLElement>("[data-sculpture]"));
  const visibleSlots = new Set<HTMLElement>();
  const progressFor = new Map<HTMLElement, number>();
  let paused = isMotionPaused();
  let disposed = false;
  let lost = false;
  let frame = 0;
  let redraw = 0;
  let last = 0;
  let elapsed = 0;
  let pointerX = 0;
  let pointerY = 0;
  let smoothX = 0;
  let smoothY = 0;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let drawnThisFrame = false;

  const ease = (t: number) => 1 - (1 - t) ** 3;
  // Height above the landing spot for a dropped block: it falls, lands, and
  // hops a little, but never dips below where it rests, so it can't sink
  // into the block underneath.
  const dropHeight = (t: number) => {
    const k = Math.min(1, Math.max(0, t));
    return Math.abs(Math.cos(k * Math.PI * 2.5)) * (1 - k) ** 2;
  };

  const pose = (chapter: string, progress: number, model: Model, hovered = false) => {
    const t = elapsed;
    if (model.cast) {
      model.hover = (model.hover ?? 0) + ((hovered ? 1 : 0) - (model.hover ?? 0)) * 0.08;
      model.spin.rotation.set(0, Math.sin(t * 0.25) * 0.08 + (progress - 0.5) * 0.3, 0);
      model.cast.tick(t, { x: smoothX * 2, y: smoothY * 2, hover: model.hover });
      return;
    }
    model.spin.rotation.set(0.12 + smoothY * 0.18, -0.35 + smoothX * 0.35 + progress * 0.5, 0);
    model.spin.position.y = Math.sin(t * 0.9) * 0.06;
    if (chapter === "connection") {
      model.spin.rotation.y = -0.25 + smoothX * 0.3 + Math.sin(t * 0.4) * 0.1;
      bubbleA.position.y = 0.62 + Math.sin(t * 1.1) * 0.06;
      bubbleB.position.y = -0.78 + Math.sin(t * 1.1 + 1.4) * 0.07;
      dots.forEach((dot, i) => {
        const hop = Math.max(0, Math.sin(t * 5 - i * 0.9));
        dot.position.y = hop * 0.16;
        dot.scale.setScalar(1 + hop * 0.12);
      });
    } else if (chapter === "building") {
      model.spin.rotation.y = -0.5 + smoothX * 0.3 + progress * 0.9;
      // The camera rises with the tower so a dropping block and its ball
      // never leave the frame.
      model.centerY = -0.9 + progress * 1.2;
      // The first role is already standing when the chapter opens.
      const stacked = 1 + progress * (blocks.length - 1);
      blocks.forEach((block, i) => {
        const local = Math.min(1, Math.max(0, stacked - i));
        block.visible = local > 0;
        const fall = dropHeight(local);
        block.position.y = block.userData.y + fall * 1.05;
        block.rotation.y = block.userData.turn + fall * 0.6;
        // Squash only while touching down; flatten from the bottom so the
        // block stays sitting on the one below.
        const impact = local < 1 && fall < 0.04 ? (1 - fall / 0.04) * (1 - local) * 0.12 : 0;
        block.scale.set(1 + impact, 1 - impact, 1 + impact);
        block.position.y -= 0.31 * impact;
      });
      // The orange ball rides whichever block is currently on top.
      const top = blocks[Math.min(blocks.length, Math.ceil(stacked)) - 1];
      topper.position.y = top.position.y + 0.31 * top.scale.y + 0.32 + Math.abs(Math.sin(t * 2.2)) * 0.22;
      topper.rotation.y = top.rotation.y;
      model.shadow.scale.set(4.2, 2.3, 1);
    } else if (chapter === "possibility") {
      globe.rotation.y = t * 0.25 + progress * 1.5;
      globe.rotation.z = 0.35;
      const a = t * 0.6;
      const local = new THREE.Vector3(Math.cos(a) * 2.05, Math.sin(a) * 2.05, 0);
      local.applyEuler(orbit.rotation);
      moon.position.copy(local);
    } else if (chapter === "pressure") {
      model.spin.rotation.y = -0.2 + smoothX * 0.3 + Math.sin(t * 0.5) * 0.25 + progress * 0.4;
      starMesh.rotation.z = Math.sin(t * 1.4) * 0.12;
      confetti.forEach((bit, i) => {
        const { a, r, y } = bit.userData;
        const angle = a + t * 0.35;
        bit.position.set(Math.cos(angle) * r, y + Math.sin(t * 1.2 + i) * 0.18, Math.sin(angle) * r * 0.6);
        bit.rotation.set(t * 1.3 + i, t * 0.9 + i * 2, i);
      });
    } else if (chapter === "lost") {
      model.spin.rotation.set(0.08 + smoothY * 0.12, smoothX * 0.35 + Math.sin(t * 0.4) * 0.06, 0);
      model.spin.position.y = 0;
      const k = (t % 1.15) / 1.15;
      const hop = Math.sin(k * Math.PI);
      // Squash on the floor, stretch in the air.
      const squash = k < 0.12 || k > 0.88 ? 1 - Math.min(k, 1 - k) / 0.12 : 0;
      zero.position.y = -1 + 0.72 + hop * 0.95;
      zero.scale.set(1 + squash * 0.14 - hop * 0.03, 1 - squash * 0.16 + hop * 0.05, 1 + squash * 0.14 - hop * 0.03);
      zeroShadow.scale.setScalar(1.9 - hop * 0.7);
      fours.forEach((d, i) => (d.rotation.z = Math.sin(t * 1.3 + i * 2) * 0.03));
    } else if (chapter === "together") {
      model.spin.rotation.y = -0.55 + smoothX * 0.35 + Math.sin(t * 0.45) * 0.12;
      // A letter floats up to the door, turns flat, and slides through the
      // slot; the door hides it once it's in. Then the flag goes up.
      const cycle = (t % 4.6) / 4.6;
      const appear = ease(Math.min(1, cycle / 0.18));
      const line = ease(Math.min(1, Math.max(0, (cycle - 0.18) / 0.14)));
      const push = ease(Math.min(1, Math.max(0, (cycle - 0.34) / 0.2)));
      letter.visible = cycle < 0.56;
      letter.scale.setScalar(0.8 * appear);
      letter.position.set(0, 1.3 + (1 - line) * 0.55 + Math.sin(t * 3) * 0.03 * (1 - push), 2.35 - push * 1.75);
      letter.rotation.set(-Math.PI / 2 * line, 0, (1 - line) * 0.25);
      const raise = cycle < 0.54 ? 0 : cycle < 0.66 ? ease((cycle - 0.54) / 0.12) : cycle < 0.9 ? 1 : 1 - ease((cycle - 0.9) / 0.1);
      flagArm.rotation.x = 1.35 * (1 - raise);
    }
  };

  const render = () => {
    if (disposed || lost) return;
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
    renderer.clear();
    renderer.setScissorTest(true);
    for (const slot of visibleSlots) {
      const rect = slot.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= height || !rect.width || !rect.height) continue;
      const chapter = slot.dataset.sculpture || "connection";
      const model = models[chapter];
      if (!model) continue;
      for (const m of Object.values(models)) m.root.visible = m === model;
      // Progress follows a tracked section when given one (sticky slots),
      // otherwise the slot's own trip through the viewport.
      const track = slot.dataset.track ? document.getElementById(slot.dataset.track) : null;
      const box = track ? track.getBoundingClientRect() : rect;
      const live = track
        ? THREE.MathUtils.clamp(-box.top / Math.max(1, box.height - height), 0, 1)
        : THREE.MathUtils.clamp((height - rect.top) / (height + rect.height), 0, 1);
      const progress = paused && !track ? (progressFor.get(slot) ?? 0.5) : live;
      progressFor.set(slot, progress);
      pose(chapter, progress, model, !!slot.closest("a")?.matches(":hover"));
      camera.aspect = rect.width / rect.height;
      const vfov = THREE.MathUtils.degToRad(camera.fov);
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
      const distance = Math.max(
        (model.radius * 1.08) / Math.sin(Math.min(vfov, hfov) / 2),
        model.span ? model.span / Math.tan(hfov / 2) : 0,
      );
      camera.position.set(0, model.centerY + 0.35 + distance * model.elev, distance);
      camera.lookAt(0, model.centerY, 0);
      camera.updateProjectionMatrix();
      // This canvas sits above the page, so a stacked card that another card
      // has slid over must stop drawing where the covering card begins.
      let visibleBottom = rect.bottom;
      const card = slot.closest(".stack-card");
      const next = card?.nextElementSibling;
      if (next?.classList.contains("stack-card")) visibleBottom = Math.min(visibleBottom, next.getBoundingClientRect().top + 24);
      if (visibleBottom <= rect.top) continue;
      const y = height - rect.bottom;
      renderer.setViewport(rect.left, y, rect.width, rect.height);
      renderer.setScissor(rect.left, height - visibleBottom, rect.width, visibleBottom - rect.top);
      renderer.render(scene, camera);
      slot.dataset.rendered = "true";
    }
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  };
  const loop = (now: number) => {
    elapsed += last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    smoothX += (pointerX - smoothX) * 0.07;
    smoothY += (pointerY - smoothY) * 0.07;
    if (!drawnThisFrame) render();
    drawnThisFrame = false;
    frame = requestAnimationFrame(loop);
  };
  const requestRender = () => {
    if (redraw || disposed || lost || document.hidden) return;
    redraw = requestAnimationFrame(() => {
      redraw = 0;
      render();
    });
  };
  const onFrameScroll = () => {
    render();
    drawnThisFrame = !!frame;
  };
  const sync = () => {
    stop();
    requestRender();
    if (!paused && visibleSlots.size && !document.hidden && !lost && !disposed)
      frame = requestAnimationFrame(loop);
  };
  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    renderer.setSize(width, height);
    requestRender();
  };
  const theme = () => {
    const dark = document.documentElement.classList.contains("dark");
    hemi.intensity = dark ? 0.75 : 1.1;
    hemi.groundColor.set(dark ? 0x3a2a22 : 0xb99c86);
    key.intensity = dark ? 2.1 : 2.6;
    rim.color.set(dark ? 0xff9a6a : 0xffc8a6);
    rim.intensity = dark ? 1.6 : 1.1;
    shadowMat.opacity = dark ? 0.45 : 0.22;
    digitMat.color.set(dark ? CLAY.cream : 0x3a332d);
    Object.values(models).forEach((m) => m.cast?.theme?.(dark));
    requestRender();
  };
  const onPointer = (event: PointerEvent) => {
    if (paused || event.pointerType === "touch") return;
    pointerX = event.clientX / width - 0.5;
    pointerY = event.clientY / height - 0.5;
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    stop();
    slots.forEach((slot) => delete slot.dataset.rendered);
    onUnavailable();
  };
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) =>
        entry.isIntersecting
          ? visibleSlots.add(entry.target as HTMLElement)
          : visibleSlots.delete(entry.target as HTMLElement),
      );
      sync();
    },
    { rootMargin: "100px" },
  );
  const resizer = new ResizeObserver(requestRender);
  slots.forEach((slot) => {
    observer.observe(slot);
    resizer.observe(slot);
  });
  const stopMotion = onMotionChange((value) => {
    paused = value;
    sync();
  });
  const stopScrollFrame = onScrollFrame(onFrameScroll);
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", resize);
  window.addEventListener(THEME_EVENT, theme);
  document.addEventListener("visibilitychange", sync);
  renderer.domElement.addEventListener("webglcontextlost", onLost);
  resize();
  theme();
  document.fonts.ready.then(requestRender);
  return {
    dispose() {
      disposed = true;
      stop();
      cancelAnimationFrame(redraw);
      observer.disconnect();
      resizer.disconnect();
      stopMotion();
      stopScrollFrame();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", resize);
      window.removeEventListener(THEME_EVENT, theme);
      document.removeEventListener("visibilitychange", sync);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      slots.forEach((slot) => delete slot.dataset.rendered);
      geometries.forEach((g) => g.dispose());
      shadowMat.dispose();
      shadowTexture.dispose();
      owned.forEach((m) => m.dispose());
      digitMat.dispose();
      kit.dispose();
      envMap.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
