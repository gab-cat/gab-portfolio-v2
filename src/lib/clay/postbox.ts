import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { CLAY, createClayKit, lumpy } from "./kit";
import { isMotionPaused, onMotionChange } from "../motion";
import { THEME_EVENT } from "../theme";

/* The contact page's sky. Your island floats in the middle of it with a
   waterfall spilling into the clouds, other islands drift at every depth,
   and a balloon, birds and paper planes keep the air busy. The note you
   write in the form is the letter floating here: it fills in as you type,
   seals itself when the form is ready, and posts itself into the mailbox
   when you hit send, which launches a squadron of paper planes. */

export interface PostboxController {
  setProgress: (value: number) => void;
  setTopic: (index: number) => void;
  send: () => void;
  shake: () => void;
  dispose: () => void;
}

const TOPIC_COLORS = [CLAY.flame, CLAY.sky, CLAY.lilac, CLAY.butter];
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const backOut = (t: number) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2;

export interface PostboxOptions {
  onReady?: () => void;
  /** On wide screens the island is framed in the space left of this column. */
  column?: HTMLElement | null;
}

export function createPostbox(host: HTMLElement, options: PostboxOptions = {}): PostboxController | null {
  const { onReady, column } = options;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  host.appendChild(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.style.touchAction = "pan-y";

  const kit = createClayKit();
  const clay = kit.clay;
  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0xf5d6bd, 30, 80);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 160);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.55;
  room.dispose();
  pmrem.dispose();

  const hemi = new THREE.HemisphereLight(0xfff4e8, 0xa38a74, 1.0);
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.8);
  sun.position.set(-4, 9, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const sc = sun.shadow.camera;
  sc.left = -5;
  sc.right = 5;
  sc.top = 5;
  sc.bottom = -5;
  sc.near = 1;
  sc.far = 25;
  sun.shadow.radius = 5;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  const rim = new THREE.DirectionalLight(0xffc6a4, 0.9);
  rim.position.set(5, 2, -3);
  const lamp = new THREE.PointLight(0xffb36b, 0, 7, 1.5);
  lamp.position.set(0.6, 3.6, 1.6);
  scene.add(hemi, sun, sun.target, rim, lamp);

  const geometries: THREE.BufferGeometry[] = [];
  const keep = <T extends THREE.BufferGeometry>(g: T) => {
    geometries.push(g);
    return g;
  };
  const put = (geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, cast = true) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const sphere = (r: number, lump = 0.05, seed = 0) =>
    keep(lumpy(new THREE.SphereGeometry(r, 32, 22), r * lump, 1.4 / r, seed));
  const box = (w: number, h: number, d: number, radius: number, seed = 0) =>
    keep(lumpy(new RoundedBoxGeometry(w, h, d, 4, radius), 0.015, 1.5, seed));
  const capsule = (r: number, length: number, seed = 0) =>
    keep(lumpy(new THREE.CapsuleGeometry(r, length, 6, 16), r * 0.05, 2 / r, seed));
  const extrude = (shape: THREE.Shape, depth: number, bevel: number) => {
    const g = keep(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 12 }));
    g.center();
    return g;
  };

  const world = new THREE.Group();
  scene.add(world);
  const hanging: THREE.Mesh[] = [];

  /* ------------------------------------------------------------- island */
  const TOP = 0.08;
  const body = put(keep(lumpy(new THREE.CylinderGeometry(3.05, 2.35, 1.1, 64, 3), 0.06, 1.2, 1)), clay(0xc9a27e, { repeat: 4 }), world);
  body.position.y = -0.52;
  const grass = put(keep(lumpy(new THREE.CylinderGeometry(3.2, 3.12, 0.3, 64, 1), 0.035, 1.3, 2)), clay(0x8fb66e, { roughness: 0.8, repeat: 5 }), world);
  grass.position.y = TOP - 0.15;
  const drip = put(keep(lumpy(new THREE.TorusGeometry(3.12, 0.13, 12, 64), 0.03, 2, 3)), clay(0x8fb66e, { roughness: 0.8, repeat: 5 }), world);
  drip.rotation.x = Math.PI / 2;
  drip.position.y = TOP - 0.3;


  // Trees, pebbles and flowers.
  const trunk = clay(CLAY.cocoa);
  const leaves = [clay(CLAY.pine), clay(CLAY.moss)];
  const tree = new THREE.Group();
  put(capsule(0.12, 0.7), trunk, tree).position.y = 0.4;
  const crown = put(sphere(0.75, 0.08, 4), leaves[1], tree);
  crown.position.y = 1.35;
  crown.scale.y = 1.15;
  tree.position.set(-2.1, TOP, -1.3);
  world.add(tree);
  const pine = new THREE.Group();
  put(capsule(0.1, 0.4), trunk, pine).position.y = 0.25;
  [0, 1, 2].forEach((i) => {
    const cone = put(keep(lumpy(new THREE.ConeGeometry(0.62 - i * 0.14, 0.75, 16, 3), 0.03, 2.4, i)), leaves[0], pine);
    cone.position.y = 0.7 + i * 0.38;
  });
  pine.position.set(-2.5, TOP, 0.5);
  pine.scale.setScalar(0.85);
  world.add(pine);
  const pebbleMat = clay(CLAY.oat);
  [
    [2.35, 0.7, 0.22],
    [2.55, 0.35, 0.14],
    [-0.4, 2.1, 0.17],
  ].forEach(([x, z, r], i) => {
    const pebble = put(sphere(r, 0.12, 10 + i), pebbleMat, world);
    pebble.position.set(x, TOP + r * 0.35, z);
    pebble.scale.y = 0.6;
  });
  const flowerColors = [CLAY.blush, CLAY.butter, CLAY.lilac, CLAY.flame];
  const stemGeo = capsule(0.025, 0.35);
  const petalGeo = sphere(0.09, 0.05, 20);
  const flowers: THREE.Group[] = [];
  [
    [-1.2, 1.7],
    [-1.55, 1.25],
    [2.4, -0.4],
    [2.1, -1.0],
    [-0.9, -2.2],
  ].forEach(([x, z], i) => {
    const flower = new THREE.Group();
    put(stemGeo, leaves[0], flower, false).position.y = 0.2;
    const bloom = put(petalGeo, clay(flowerColors[i % flowerColors.length]), flower, false);
    bloom.position.y = 0.42;
    flower.position.set(x, TOP, z);
    flower.userData.phase = i * 1.3;
    flowers.push(flower);
    world.add(flower);
  });

  /* ------------------------------------------------------------ mailbox */
  const mailbox = new THREE.Group();
  mailbox.position.set(0.95, TOP, -0.35);
  mailbox.rotation.y = -0.5;
  world.add(mailbox);
  const orange = clay(CLAY.flame);
  put(box(0.42, 1.6, 0.42, 0.12, 30), clay(CLAY.cocoa), mailbox).position.y = 0.8;
  const boxBody = new THREE.Group();
  boxBody.position.y = 1.6;
  mailbox.add(boxBody);
  put(box(1.35, 1.05, 2.0, 0.2, 31), orange, boxBody).position.y = 0.5;
  const roofGeo = keep(lumpy(new THREE.CylinderGeometry(0.675, 0.675, 2.0, 36, 1, false, 0, Math.PI), 0.012, 2, 32));
  roofGeo.rotateX(Math.PI / 2);
  roofGeo.rotateZ(Math.PI / 2);
  put(roofGeo, orange, boxBody).position.y = 1.02;
  const door = put(box(1.18, 1.35, 0.14, 0.12, 33), clay(CLAY.cream), boxBody);
  door.position.set(0, 0.85, 1.0);
  const slot = put(box(0.85, 0.12, 0.08, 0.04, 34), clay(CLAY.charcoal), boxBody, false);
  slot.position.set(0, 1.22, 1.08);
  const knob = put(sphere(0.08, 0.05, 35), clay(CLAY.charcoal), boxBody);
  knob.position.set(0, 0.6, 1.1);
  const flagArm = new THREE.Group();
  flagArm.position.set(0.72, 0.55, 0.3);
  put(box(0.08, 1.05, 0.1, 0.03, 36), clay(CLAY.butter), flagArm).position.y = 0.45;
  const flagTip = put(box(0.08, 0.38, 0.52, 0.05, 37), clay(CLAY.butter), flagArm);
  flagTip.position.set(0, 0.8, -0.24);
  boxBody.add(flagArm);
  const FLAG_DOWN = 1.45;

  /* ------------------------------------------------------------- letter */
  const letter = new THREE.Group();
  const HOVER = new THREE.Vector3(-1.15, 2.05, 1.0);
  letter.position.copy(HOVER);
  world.add(letter);
  const paper = clay(0xfffaf2, { print: 0.2 });
  put(box(1.5, 1.0, 0.07, 0.05, 40), paper, letter);
  const addressMat = clay(CLAY.oat);
  const lineGeo = capsule(0.028, 1);
  lineGeo.rotateZ(Math.PI / 2);
  [
    [-0.12, -0.12, 0.62],
    [-0.2, -0.28, 0.46],
  ].forEach(([x, y, w]) => {
    const line = put(lineGeo, addressMat, letter, false);
    line.position.set(x, y, 0.045);
    line.scale.set(w, 1, 1);
  });
  const sheet = new THREE.Group();
  letter.add(sheet);
  put(box(1.3, 0.95, 0.025, 0.02, 41), clay(0xffffff, { print: 0.15 }), sheet);
  const inkMat = clay(CLAY.charcoal, { roughness: 0.5 });
  const writing = [0.3, 0.15, 0, -0.15].map((y, i) => {
    const line = put(lineGeo, inkMat, sheet, false);
    line.position.set(-0.5, y, 0.02);
    line.userData.width = i === 3 ? 0.55 : 1;
    return line;
  });
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-0.75, 0);
  flapShape.lineTo(0.75, 0);
  flapShape.lineTo(0, -0.62);
  flapShape.closePath();
  const flapGeo = extrude(flapShape, 0.01, 0.015);
  flapGeo.translate(0, -0.31, 0);
  const flap = new THREE.Group();
  flap.position.set(0, 0.5, -0.05);
  put(flapGeo, clay(0xf1e4cf), flap);
  letter.add(flap);
  const stampMat = clay(TOPIC_COLORS[0]).clone();
  const stamp = put(box(0.3, 0.36, 0.035, 0.05, 42), stampMat, letter, false);
  stamp.position.set(0.5, 0.2, 0.05);
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, -0.28);
  heartShape.bezierCurveTo(-0.08, -0.2, -0.32, -0.04, -0.3, 0.1);
  heartShape.bezierCurveTo(-0.28, 0.26, -0.06, 0.28, 0, 0.14);
  heartShape.bezierCurveTo(0.06, 0.28, 0.28, 0.26, 0.3, 0.1);
  heartShape.bezierCurveTo(0.32, -0.04, 0.08, -0.2, 0, -0.28);
  const heart = put(extrude(heartShape, 0.12, 0.06), clay(CLAY.flame), world, false);
  heart.visible = false;

  // A paper plane that loops the island.
  const plane = new THREE.Group();
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(0.7, 0);
  wingShape.lineTo(0, 0.28);
  wingShape.closePath();
  const wingGeo = keep(new THREE.ExtrudeGeometry(wingShape, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 }));
  const wingMat = clay(0xfffaf2);
  for (const side of [-1, 1]) {
    const wing = put(wingGeo, wingMat, plane);
    wing.rotation.x = side * 1.25;
    wing.rotation.y = Math.PI;
    wing.position.x = 0.35;
  }
  plane.rotation.order = "YXZ";
  plane.scale.setScalar(1.35);
  world.add(plane);

  // Confetti for the moment the note goes in.
  const confettiGeo = box(0.13, 0.13, 0.04, 0.025, 50);
  const confetti = Array.from({ length: 18 }, (_, i) => {
    const bit = put(confettiGeo, clay([CLAY.flame, CLAY.butter, CLAY.sky, CLAY.lilac, CLAY.sage, CLAY.blush][i % 6]), world, false);
    bit.visible = false;
    return { mesh: bit, v: new THREE.Vector3(), spin: new THREE.Vector3(), life: 0 };
  });

  /* -------------------------------------------------- the floating world */
  const rock = clay(0x9c7a5e, { repeat: 3 });
  const rootGeo = keep(lumpy(new THREE.ConeGeometry(2.45, 2.8, 40, 8), 0.2, 0.8, 5));
  rootGeo.rotateX(Math.PI);
  put(rootGeo, rock, world).position.y = -2.45;
  [
    [1.6, -1.9, 0.9, 0.45],
    [-1.4, -2.3, -0.8, 0.38],
    [0.3, -3.3, 1.0, 0.3],
  ].forEach(([x, y, z, r], i) => {
    const pebble = put(sphere(r, 0.2, 70 + i), rock, world);
    pebble.position.set(x, y, z);
    pebble.userData.phase = i * 2.1;
    pebble.userData.y = y;
    hanging.push(pebble);
  });

  // A pond, a stream to the edge, and a waterfall down into the clouds.
  const stripes = (() => {
    const h = 64;
    const data = new Uint8Array(4 * h * 4);
    for (let y = 0; y < h; y++) {
      const v = 0.5 + 0.5 * Math.sin((y / h) * Math.PI * 2 * 3) * Math.sin((y / h) * Math.PI * 2 + 1);
      for (let x = 0; x < 4; x++) {
        const i = (y * 4 + x) * 4;
        data[i] = 200 + v * 55;
        data[i + 1] = 228 + v * 27;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
    }
    const t = new THREE.DataTexture(data, 4, h, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  })();
  const fade = (() => {
    const h = 64;
    const data = new Uint8Array(h * 4);
    // alphaMap reads the green channel, so write the ramp into all three.
    for (let y = 0; y < h; y++) {
      const v = 255 * Math.min(1, (y / h) * 2.2) * 0.92;
      data.set([v, v, v, 255], y * 4);
    }
    const t = new THREE.DataTexture(data, 1, h, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    return t;
  })();
  const fallMap = stripes.clone();
  fallMap.repeat.set(1, 2.5);
  const streamMap = stripes.clone();
  streamMap.repeat.set(1, 1.5);
  const water = new THREE.MeshStandardMaterial({ color: 0x9fd0f2, roughness: 0.25, metalness: 0, emissive: 0x3f8fd0, emissiveIntensity: 0.12 });
  const fallMat = water.clone();
  fallMat.map = fallMap;
  fallMat.alphaMap = fade;
  fallMat.transparent = true;
  fallMat.side = THREE.DoubleSide;
  fallMat.depthWrite = false;
  const streamMat = water.clone();
  streamMat.map = streamMap;
  const FALL = 1.2;
  const out = new THREE.Vector3(Math.cos(FALL), 0, Math.sin(FALL));
  const side = new THREE.Vector3(-out.z, 0, out.x);
  const pondAt = new THREE.Vector3(0.75, TOP + 0.03, 1.1);
  const lip = out.clone().multiplyScalar(3.12).setY(TOP + 0.03);
  const pond = put(keep(new THREE.CircleGeometry(0.55, 36)), water, world, false);
  pond.rotation.x = -Math.PI / 2;
  pond.position.copy(pondAt);
  const streamLen = pondAt.distanceTo(lip);
  const streamGeo = keep(new THREE.PlaneGeometry(0.42, streamLen, 1, 8));
  streamGeo.rotateX(-Math.PI / 2);
  const stream = put(streamGeo, streamMat, world, false);
  stream.position.copy(pondAt).lerp(lip, 0.5).setY(TOP + 0.035);
  stream.rotation.y = Math.atan2(lip.x - pondAt.x, lip.z - pondAt.z);
  const fallGeo = keep(new THREE.PlaneGeometry(0.46, 1, 1, 48));
  {
    const p = fallGeo.attributes.position as THREE.BufferAttribute;
    const drop = 6.4;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i);
      const s = (0.5 - p.getY(i)) * drop;
      const spread = 1 + s * 0.12;
      const arc = 0.55 * (1 - Math.exp(-s * 1.4));
      const v = lip.clone().addScaledVector(side, u * spread).addScaledVector(out, arc);
      v.y = TOP + 0.02 - s;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    fallGeo.computeVertexNormals();
  }
  put(fallGeo, fallMat, world, false);
  const mistMat = clay(0xffffff, { roughness: 1, sheen: 1 }).clone();
  mistMat.transparent = true;
  mistMat.opacity = 0.85;
  const mist = [0, 1, 2, 3].map((i) => {
    const puff = put(sphere(0.55 - i * 0.07, 0.1, 80 + i), mistMat, world, false);
    puff.position.copy(lip).addScaledVector(out, 0.6 + (i % 2) * 0.3).addScaledVector(side, (i - 1.5) * 0.35);
    puff.position.y = TOP - 5.9 + (i % 2) * 0.2;
    puff.userData.phase = i * 1.7;
    return puff;
  });

  // Everything around the island lives in the sky, which only parallaxes.
  const sky = new THREE.Group();
  scene.add(sky);
  const skyGrass = clay(0x8fb66e, { roughness: 0.8, repeat: 4 });
  const skyDirt = clay(0xc9a27e, { repeat: 3 });
  const makeIsland = (r: number, seed: number) => {
    const isle = new THREE.Group();
    put(keep(lumpy(new THREE.CylinderGeometry(r, r * 0.96, 0.24, 36, 1), 0.03, 1.2 / r, seed)), skyGrass, isle, false).position.y = -0.1;
    put(keep(lumpy(new THREE.CylinderGeometry(r * 0.97, r * 0.72, r * 0.4, 36, 2), 0.05, 1.2 / r, seed + 1)), skyDirt, isle, false).position.y = -0.22 - r * 0.2;
    const tip = keep(lumpy(new THREE.ConeGeometry(r * 0.72, r * 1.3, 28, 5), 0.18 * r, 1 / r, seed + 2));
    tip.rotateX(Math.PI);
    put(tip, rock, isle, false).position.y = -0.22 - r * 0.4 - r * 0.65;
    return isle;
  };
  const addTree = (parent: THREE.Object3D, x: number, z: number, s: number, kind: number) => {
    const t = new THREE.Group();
    put(capsule(0.12, 0.6), trunk, t, false).position.y = 0.35;
    if (kind) {
      const c = put(sphere(0.7, 0.08, 90 + x), leaves[1], t, false);
      c.position.y = 1.25;
      c.scale.y = 1.15;
    } else {
      [0, 1, 2].forEach((i) => {
        const cone = put(keep(lumpy(new THREE.ConeGeometry(0.6 - i * 0.14, 0.72, 14, 3), 0.03, 2.4, i + 5)), leaves[0], t, false);
        cone.position.y = 0.65 + i * 0.36;
      });
    }
    t.position.set(x, 0, z);
    t.scale.setScalar(s);
    parent.add(t);
  };
  const houseAt = (parent: THREE.Object3D) => {
    const h = new THREE.Group();
    put(box(0.9, 0.7, 0.8, 0.1, 95), clay(CLAY.cream), h, false).position.y = 0.35;
    const roofG = keep(lumpy(new THREE.ConeGeometry(0.78, 0.6, 4, 1), 0.02, 2, 96));
    roofG.rotateY(Math.PI / 4);
    put(roofG, clay(CLAY.flame), h, false).position.y = 1.0;
    const doorM = put(box(0.24, 0.38, 0.05, 0.05, 97), clay(CLAY.cocoa), h, false);
    doorM.position.set(0, 0.2, 0.41);
    const win = clay(0xffd28a, { emissive: 0xffb84d, emissiveIntensity: 0.1 }).clone();
    windows.push(win);
    const w1 = put(box(0.2, 0.2, 0.05, 0.04, 98), win, h, false);
    w1.position.set(0.28, 0.45, 0.41);
    parent.add(h);
    return h;
  };
  const isles: THREE.Group[] = [];
  const windows: THREE.MeshPhysicalMaterial[] = [];
  (
    [
      // All on the island's side of the sky: the card owns the right.
      [-7.2, 4.2, -6, 1.15, "pine"],
      [-6.4, -2.9, 2.2, 0.9, "rocks"],
      [3.6, -3.5, 2.6, 0.7, "tree"],
      [-11.5, 6.2, -13, 1.5, "house"],
      [-16, -1.4, -16, 1.9, "grove"],
      [5.2, 5.6, -10, 1.1, "tree"],
      [1.5, 8.6, -20, 1.4, "pine"],
    ] as const
  ).forEach(([x, y, z, r, kind], i) => {
    const isle = makeIsland(r, 100 + i * 7);
    if (kind === "pine") addTree(isle, 0.1, 0, r * 0.6, 0);
    if (kind === "tree") addTree(isle, -0.1, 0.1, r * 0.55, 1);
    if (kind === "grove") {
      addTree(isle, -0.6, -0.2, 0.9, 0);
      addTree(isle, 0.5, 0.3, 0.75, 1);
    }
    if (kind === "house") {
      const h = houseAt(isle);
      h.rotation.y = -0.5;
      addTree(isle, 0.85, -0.4, 0.55, 0);
    }
    if (kind === "rocks") {
      [0, 1].forEach((k) => {
        const pb = put(sphere(0.22 - k * 0.07, 0.15, 110 + k), pebbleMat, isle, false);
        pb.position.set(-0.2 + k * 0.4, 0.05, k * 0.2);
        pb.scale.y = 0.65;
      });
      [0, 1, 2].forEach((k) => {
        const f = new THREE.Group();
        put(stemGeo, leaves[0], f, false).position.y = 0.2;
        put(petalGeo, clay(flowerColors[k]), f, false).position.y = 0.42;
        f.position.set(0.3 - k * 0.3, 0, -0.35 + k * 0.1);
        isle.add(f);
      });
    }
    isle.position.set(x, y, z);
    isle.rotation.y = i * 1.3;
    isle.userData = { y, phase: i * 1.9 };
    isles.push(isle);
    sky.add(isle);
  });

  // A striped clay balloon, drifting.
  const balloon = new THREE.Group();
  for (let i = 0; i < 10; i++) {
    const gore = keep(lumpy(new THREE.SphereGeometry(1, 8, 22, (i / 10) * Math.PI * 2, (Math.PI * 2) / 10), 0.01, 2, 120 + i));
    put(gore, clay(i % 2 ? CLAY.cream : CLAY.flame), balloon, false);
  }
  balloon.children.forEach((c) => c.scale.set(1, 1.18, 1));
  const skirt = put(keep(lumpy(new THREE.CylinderGeometry(0.42, 0.3, 0.4, 20), 0.01, 3, 131)), clay(CLAY.flame), balloon, false);
  skirt.position.y = -1.18;
  const basket = put(box(0.55, 0.42, 0.55, 0.08, 132), clay(CLAY.cocoa), balloon, false);
  basket.position.y = -2.0;
  const burnerMat = clay(0xffb84d, { emissive: 0xff8a3d, emissiveIntensity: 0.6 }).clone();
  put(sphere(0.12, 0.05, 133), burnerMat, balloon, false).position.y = -1.45;
  [
    [-0.22, -0.22],
    [0.22, -0.22],
    [-0.22, 0.22],
    [0.22, 0.22],
  ].forEach(([x, z]) => {
    const top = new THREE.Vector3(x * 1.6, -1.25, z * 1.6);
    const bottom = new THREE.Vector3(x, -1.8, z);
    const rope = put(capsule(0.018, top.distanceTo(bottom)), clay(CLAY.cocoa), balloon, false);
    rope.position.copy(top).add(bottom).multiplyScalar(0.5);
    rope.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(bottom).normalize());
  });
  balloon.scale.setScalar(0.95);
  sky.add(balloon);
  const balloonLight = new THREE.PointLight(0xff9a4d, 0, 5, 1.6);
  balloon.add(balloonLight);
  balloonLight.position.y = -1.5;

  // A few birds on a lazy loop.
  const birdMat = clay(CLAY.charcoal);
  const wingG = box(0.36, 0.03, 0.14, 0.012, 140);
  const birds = Array.from({ length: 6 }, (_, i) => {
    const b = new THREE.Group();
    const body = put(capsule(0.06, 0.22), birdMat, b, false);
    body.rotation.z = Math.PI / 2;
    const wings = [-1, 1].map((sgn) => {
      const pivot = new THREE.Group();
      const w = put(wingG, birdMat, pivot, false);
      w.position.z = sgn * 0.18;
      w.rotation.y = Math.PI / 2;
      b.add(pivot);
      pivot.userData.sign = sgn;
      return pivot;
    });
    b.rotation.order = "YXZ";
    b.userData = { wings, offset: new THREE.Vector3((i % 3) * 0.7 - 0.7, Math.floor(i / 3) * 0.5 + (i % 2) * 0.2, (i % 3) * 0.6 + Math.floor(i / 3) * 0.9), phase: i * 0.8 };
    sky.add(b);
    return b;
  });

  // A sea of clouds below, and a few drifting overhead.
  const cloudMat = clay(0xfffaf3, { roughness: 0.95, sheen: 0.9 });
  const seaPuffs: THREE.Mesh[] = [];
  for (let i = 0; i < 34; i++) {
    const r = 2 + ((i * 37) % 17) / 8;
    const puff = put(sphere(r, 0.06, 150 + i), cloudMat, sky, false);
    puff.position.set(-34 + (i * 61) % 70, -6.3 + ((i * 13) % 7) * 0.12, -26 + (i * 23) % 34);
    puff.scale.set(1.3, 0.42, 1);
    seaPuffs.push(puff);
  }
  const clouds = [
    [-9, 7.5, -10, 1.1],
    [8, 10, -16, 1.5],
    [18, 6.5, -20, 1.3],
    [-16, 9, -22, 1.4],
  ].map(([x, y, z, sc], i) => {
    const c = new THREE.Group();
    [
      [0, 0, 0, 0.9],
      [0.9, -0.15, 0.1, 0.7],
      [-0.9, -0.2, 0, 0.65],
      [0.35, 0.45, -0.1, 0.62],
    ].forEach(([cx, cy, cz, r], j) => {
      const puff = put(sphere(r, 0.05, 190 + i * 5 + j), cloudMat, c, false);
      puff.position.set(cx, cy, cz);
      puff.scale.y = 0.8;
    });
    c.position.set(x, y, z);
    c.scale.setScalar(sc);
    sky.add(c);
    return c;
  });
  const orbMat = clay(CLAY.butter, { emissive: CLAY.butter, emissiveIntensity: 0.6, roughness: 0.9 }).clone();
  orbMat.fog = false;
  const orb = put(sphere(3.2, 0.02, 199), orbMat, sky, false);
  orb.position.set(16, 12, -40);

  // After dark: stars and fireflies.
  const starMat = new THREE.MeshBasicMaterial({ color: 0xfff1c9, fog: false });
  const stars = new THREE.InstancedMesh(keep(new THREE.IcosahedronGeometry(0.09, 1)), starMat, 120);
  {
    const m = new THREE.Matrix4();
    for (let i = 0; i < 120; i++) {
      const fx = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1);
      const fy = Math.abs((Math.sin(i * 78.233) * 12345.6789) % 1);
      const sz = 0.7 + (i % 3) * 0.45;
      m.makeScale(sz, sz, sz);
      m.setPosition(-45 + fx * 90, -2 + fy * 30, -45 - (i % 6));
      stars.setMatrixAt(i, m);
    }
  }
  stars.visible = false;
  sky.add(stars);
  const flyMat = new THREE.MeshBasicMaterial({ color: 0xffe27a, fog: false });
  const flies = new THREE.InstancedMesh(keep(new THREE.SphereGeometry(0.045, 8, 6)), flyMat, 40);
  flies.visible = false;
  world.add(flies);
  const flyMatrix = new THREE.Matrix4();

  // The squadron that carries a sent note out into the world.
  const makePlane = () => {
    const g = new THREE.Group();
    for (const sd of [-1, 1]) {
      const w = put(wingGeo, wingMat, g, false);
      w.rotation.x = sd * 1.25;
      w.rotation.y = Math.PI;
      w.position.x = 0.35;
    }
    g.rotation.order = "YXZ";
    g.visible = false;
    scene.add(g);
    return g;
  };
  const squadron = Array.from({ length: 12 }, (_, i) => {
    const a = -1.25 + (i / 11) * 2.5;
    const dir = new THREE.Vector3(Math.sin(a) * 1.1, 0.5 + (i % 3) * 0.16, -Math.cos(a) * 0.75 - 0.2).normalize();
    return { mesh: makePlane(), dir, speed: 5.2 + (i % 4) * 0.9, delay: i * 0.07, t: -1, start: new THREE.Vector3(), last: new THREE.Vector3() };
  });

  /* -------------------------------------------------------------- state */
  let width = 1;
  let height = 1;
  let target = 0;
  let progress = 0;
  let ready = 0;
  let sendT = -1;
  let sent = false;
  let shakeT = 0;
  let bounceT = 0;
  let clock = 0;
  let spin = 0;
  let spinVelocity = 0;
  let dragging = false;
  let dragX = 0;
  let dragDistance = 0;
  let pointerX = 0;
  let pointerY = 0;
  let smoothX = 0;
  let smoothY = 0;
  let paused = isMotionPaused();
  let visible = true;
  let disposed = false;
  let frame = 0;
  let last = 0;
  let readySent = false;
  let intro = isMotionPaused() ? 1 : 0;
  let celebrate = -1;

  const slotWorld = new THREE.Vector3();
  const flyFrom = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  const launch = () => {
    boxBody.updateWorldMatrix(true, false);
    const from = new THREE.Vector3(0, 1.3, 1.2).applyMatrix4(boxBody.matrixWorld);
    squadron.forEach((p) => {
      p.t = -p.delay;
      p.start.copy(from);
      p.last.copy(from);
    });
    celebrate = 0;
  };
  const burst = () => {
    launch();
    boxBody.updateWorldMatrix(true, false);
    const origin = new THREE.Vector3(0, 1.5, 0.4).applyMatrix4(boxBody.matrixWorld);
    world.worldToLocal(origin);
    confetti.forEach((bit, i) => {
      const a = (i / confetti.length) * Math.PI * 2;
      bit.mesh.visible = true;
      bit.mesh.position.copy(origin);
      bit.v.set(Math.cos(a) * (1.2 + (i % 3) * 0.5), 3.4 + (i % 4) * 0.6, Math.sin(a) * (1.2 + (i % 2) * 0.6));
      bit.spin.set(3 + i, 2 + (i % 5), 4 - (i % 3));
      bit.life = 1.6 + (i % 4) * 0.15;
    });
  };

  const update = (dt: number) => {
    clock += dt;
    progress += (target - progress) * Math.min(1, dt * 6);
    const complete = target >= 1 ? 1 : 0;
    ready += (complete - ready) * Math.min(1, dt * 5);

    // The island turns under your hand, then settles.
    if (!dragging) {
      spin += spinVelocity;
      spinVelocity *= 0.92;
      spin += (Math.sin(clock * 0.25) * 0.12 - spin) * 0.01;
    }
    smoothX += (pointerX - smoothX) * 0.06;
    smoothY += (pointerY - smoothY) * 0.06;
    world.rotation.y = spin + smoothX * 0.18;
    world.position.y = Math.sin(clock * 0.8) * 0.08;

    // The note writes itself as the form fills in.
    writing.forEach((line, i) => {
      const w = clamp01(progress * 4.4 - i * 1.05) * line.userData.width;
      line.scale.set(Math.max(0.001, w * 0.95), 1, 1);
      line.position.x = -0.55 + (w * 0.95) / 2;
      line.visible = w > 0.01;
    });
    sheet.position.y = 0.62 * (1 - easeOut(ready));
    flap.rotation.x = (Math.PI - 0.12) * (1 - easeOut(clamp01(ready * 1.4 - 0.4)));
    const pop = clamp01(ready * 1.6 - 0.6);
    stamp.scale.setScalar(pop > 0 ? backOut(pop) : 0.001);

    // Post it.
    if (sendT >= 0) {
      sendT += dt / 1.8;
      const t = sendT;
      boxBody.updateWorldMatrix(true, false);
      slotWorld.set(0, 1.22, 1.3).applyMatrix4(boxBody.matrixWorld);
      world.worldToLocal(slotWorld);
      if (t < 0.5) {
        const k = easeOut(t / 0.5);
        const mid = tmp.copy(flyFrom).lerp(slotWorld, 0.5);
        mid.y += 1.3;
        const a = flyFrom.clone().lerp(mid, k);
        const b = mid.clone().lerp(slotWorld, k);
        letter.position.copy(a.lerp(b, k));
        letter.rotation.set(-0.1, THREE.MathUtils.lerp(0, mailbox.rotation.y, k), Math.sin(k * Math.PI) * 0.4);
        letter.scale.setScalar(THREE.MathUtils.lerp(1, 0.55, k));
        letter.visible = true;
      } else {
        const k = clamp01((t - 0.5) / 0.1);
        letter.scale.set(0.55, 0.55 * (1 - k), 0.55);
        letter.visible = k < 1;
      }
      if (t >= 0.58 && !sent) {
        sent = true;
        burst();
      }
      const squash = clamp01((t - 0.56) / 0.3);
      const s = squash > 0 && squash < 1 ? Math.sin(squash * Math.PI * 2) * (1 - squash) * 0.14 : 0;
      boxBody.scale.set(1 + s, 1 - s, 1 + s);
      const raise = clamp01((t - 0.62) / 0.3);
      flagArm.rotation.x = FLAG_DOWN * (1 - backOut(raise));
      heart.visible = t > 0.75;
      if (t >= 1) sendT = 1;
    } else {
      letter.visible = !sent;
      letter.position.set(HOVER.x, HOVER.y + Math.sin(clock * 1.4) * 0.1, HOVER.z);
      letter.rotation.set(-0.12 + Math.sin(clock * 0.9) * 0.05, Math.sin(clock * 0.6) * 0.25 + smoothX * 0.2, Math.sin(clock * 1.1) * 0.06);
      if (shakeT > 0) {
        shakeT = Math.max(0, shakeT - dt);
        letter.position.x += Math.sin(shakeT * 60) * shakeT * 0.3;
      }
      if (!sent) flagArm.rotation.x = FLAG_DOWN - Math.max(0, Math.sin(bounceT * 18)) * bounceT * 0.8;
    }

    // Poke the mailbox and it boings.
    if (bounceT > 0 && sendT < 0) {
      bounceT = Math.max(0, bounceT - dt);
      const s = Math.sin((1 - bounceT / 0.7) * Math.PI * 3) * (bounceT / 0.7) * 0.12;
      boxBody.scale.set(1 + s, 1 - s, 1 + s);
    }
    if (sent) {
      boxBody.updateWorldMatrix(true, false);
      tmp.set(0, 2.25, 0.2).applyMatrix4(boxBody.matrixWorld);
      world.worldToLocal(tmp);
      heart.position.set(tmp.x, tmp.y + Math.sin(clock * 2) * 0.1, tmp.z);
      heart.rotation.y = clock * 1.2;
      heart.scale.setScalar(sendT < 1 ? backOut(clamp01((sendT - 0.75) / 0.25)) : 1);
    }
    confetti.forEach((bit) => {
      if (bit.life <= 0) return;
      bit.life -= dt;
      bit.v.y -= 9 * dt;
      bit.mesh.position.addScaledVector(bit.v, dt);
      if (bit.mesh.position.y < TOP + 0.05) {
        bit.mesh.position.y = TOP + 0.05;
        bit.v.multiplyScalar(0.3);
      }
      bit.mesh.rotation.x += bit.spin.x * dt;
      bit.mesh.rotation.y += bit.spin.y * dt;
      bit.mesh.scale.setScalar(Math.min(1, bit.life * 2));
      bit.mesh.visible = bit.life > 0;
    });

    // The plane's nose is its local -x; point it along the path's velocity,
    // bank into the turn and pitch with the bob.
    const a = clock * 0.5;
    plane.position.set(Math.cos(a) * 3.9, 3.0 + Math.sin(clock * 1.3) * 0.3, Math.sin(a) * 2.6);
    const heading = Math.atan2(2.6 * Math.cos(a), 3.9 * Math.sin(a));
    const climb = Math.cos(clock * 1.3) * 0.39;
    plane.rotation.set(-0.35, heading, Math.atan2(climb, 1.6) * -1);
    flowers.forEach((f) => (f.rotation.z = Math.sin(clock * 1.5 + f.userData.phase) * 0.12));

    // The sky around it.
    intro = Math.min(1, intro + dt / 2.8);
    fallMap.offset.y = clock * 0.9;
    streamMap.offset.y = -clock * 0.6;
    mist.forEach((m) => m.scale.setScalar(1 + Math.sin(clock * 2 + m.userData.phase) * 0.12));
    hanging.forEach((h) => (h.position.y = h.userData.y + Math.sin(clock * 0.9 + h.userData.phase) * 0.12));
    isles.forEach((isle) => {
      isle.position.y = isle.userData.y + Math.sin(clock * 0.5 + isle.userData.phase) * 0.22;
      isle.rotation.y += dt * 0.03;
    });
    balloon.position.set(-3.5 + Math.sin(clock * 0.05) * 5.5, 6.4 + Math.sin(clock * 0.7) * 0.3, -5.5);
    balloon.rotation.y = clock * 0.08;
    balloon.rotation.z = Math.sin(clock * 0.6) * 0.04;
    const flock = clock * 0.07;
    const center = new THREE.Vector3(Math.cos(flock) * 13, 7.5 + Math.sin(clock * 0.3) * 0.6, -9 + Math.sin(flock) * 5);
    const birdHeading = Math.atan2(Math.cos(flock) * 5, Math.sin(flock) * 13);
    birds.forEach((b) => {
      const { offset, wings, phase } = b.userData;
      b.position.copy(center).add(offset);
      b.rotation.set(0, birdHeading, 0);
      const flap = Math.sin(clock * 9 + phase) * 0.6;
      wings.forEach((w: THREE.Group) => (w.rotation.x = w.userData.sign * flap));
    });
    seaPuffs.forEach((puff, i) => {
      puff.position.x += dt * (0.12 + (i % 3) * 0.04);
      if (puff.position.x > 36) puff.position.x = -36;
    });
    clouds.forEach((c, i) => {
      c.position.x += dt * (0.2 + i * 0.05);
      if (c.position.x > 30) c.position.x = -30;
    });
    if (flies.visible) {
      for (let i = 0; i < 40; i++) {
        const a = clock * (0.15 + (i % 5) * 0.03) + i * 2.4;
        const r = 2.2 + (i % 7) * 0.45;
        flyMatrix.makeTranslation(Math.cos(a) * r, 0.6 + ((i * 7) % 11) * 0.28 + Math.sin(clock * 1.3 + i) * 0.3, Math.sin(a) * r);
        const glow = 0.6 + Math.max(0, Math.sin(clock * 3 + i * 1.7)) * 0.9;
        flyMatrix.scale(tmp.set(glow, glow, glow));
        flies.setMatrixAt(i, flyMatrix);
      }
      flies.instanceMatrix.needsUpdate = true;
    }
    squadron.forEach((p, i) => {
      if (p.t === -1 && !p.mesh.visible) return;
      p.t += dt;
      if (p.t < 0) return;
      const life = 3.6;
      if (p.t > life) {
        p.mesh.visible = false;
        p.t = -1;
        return;
      }
      p.mesh.visible = true;
      p.last.copy(p.mesh.position);
      const k = p.t;
      p.mesh.position.copy(p.start).addScaledVector(p.dir, p.speed * k * (0.6 + k * 0.25));
      p.mesh.position.y += Math.sin(k * 2.2 + i) * 0.35 * k;
      const v = tmp.copy(p.mesh.position).sub(p.last);
      if (v.lengthSq() > 1e-6) {
        p.mesh.rotation.set(Math.sin(k * 3 + i) * 0.3, Math.atan2(v.z, -v.x), -Math.atan2(v.y, Math.hypot(v.x, v.z)));
      }
      p.mesh.scale.setScalar(1.3 * Math.min(1, k * 4) * (1 - Math.max(0, (k - life + 0.6) / 0.6)));
    });
    if (celebrate >= 0) {
      celebrate += dt;
      if (celebrate > 6) celebrate = -1;
    }
  };

  const frameCamera = () => {
    const aspect = width / height;
    const wide = width >= 1000;
    camera.aspect = aspect;
    camera.fov = wide ? 32 : 40;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    // On wide screens the island owns the space left of the form column.
    const left = wide && column ? Math.max(width * 0.4, column.getBoundingClientRect().left) : width;
    const fitW = (9.2 / ((left / width) * (wide ? 0.8 : 0.96))) / 2 / Math.tan(hfov / 2);
    const fitH = (8.2 / (wide ? 0.66 : 0.44)) / 2 / Math.tan(vfov / 2);
    const distance = Math.max(fitW, fitH);
    const cx = wide ? left / 2 : width / 2;
    const cy = wide ? height * 0.53 : height * 0.3;
    // Arrive from high in the sky, and look up to watch the planes go.
    const arrive = 1 - easeOut(intro);
    const cheer = celebrate >= 0 ? Math.sin(Math.min(1, celebrate / 6) * Math.PI) : 0;
    camera.position.set(
      smoothX * 0.9,
      1.2 + distance * 0.26 + arrive * 9 - smoothY * 0.6 + cheer * 0.6,
      distance * (1 + arrive * 0.7),
    );
    camera.lookAt(smoothX * 0.3, 1.0 + arrive * 3 + cheer * 1.8, 0);
    camera.setViewOffset(width, height, width / 2 - cx, height / 2 - cy, width, height);
    camera.updateProjectionMatrix();
    fog.near = distance + 10;
    fog.far = distance + 60;
  };

  const render = () => {
    frameCamera();
    renderer.render(scene, camera);
    if (!readySent) {
      readySent = true;
      onReady?.();
    }
  };
  const busy = () => intro < 1 || celebrate >= 0 || squadron.some((p) => p.mesh.visible || p.t > -1) || dragging || sendT >= 0 && sendT < 1 || confetti.some((b) => b.life > 0) || Math.abs(target - progress) > 0.002 || Math.abs((target >= 1 ? 1 : 0) - ready) > 0.002;
  const loop = (now: number) => {
    frame = 0;
    const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 0;
    last = now;
    // Reduced motion still shows the story beats; it only drops the idle drift.
    if (!paused || busy()) update(dt);
    render();
    schedule();
  };
  const schedule = () => {
    if (frame || disposed || !visible || document.hidden) return;
    if (paused && !busy()) {
      last = 0;
      return;
    }
    frame = requestAnimationFrame(loop);
  };
  const kick = () => {
    if (!frame) {
      last = 0;
      render();
    }
    schedule();
  };

  /* ---------------------------------------------------------- pointers */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hit = (event: PointerEvent, object: THREE.Object3D) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(object, true).length > 0;
  };
  const onDown = (event: PointerEvent) => {
    dragging = true;
    dragX = event.clientX;
    dragDistance = 0;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
    kick();
  };
  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "touch") {
      const rect = canvas.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }
    if (dragging) {
      const dx = event.clientX - dragX;
      dragX = event.clientX;
      dragDistance += Math.abs(dx);
      spin += dx * 0.01;
      spinVelocity = dx * 0.01;
    }
    if (!frame) kick();
  };
  const onUp = (event: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    canvas.style.cursor = "grab";
    if (dragDistance < 5) {
      if (hit(event, mailbox)) bounceT = 0.7;
      else if (hit(event, letter)) shakeT = 0.5;
    }
    kick();
  };
  const onLeave = () => {
    pointerX = 0;
    pointerY = 0;
    kick();
  };
  canvas.style.cursor = "grab";
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("pointerleave", onLeave);

  const resize = () => {
    width = host.clientWidth || 1;
    height = host.clientHeight || 1;
    renderer.setSize(width, height, false);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    kick();
  };
  const theme = () => {
    const dark = document.documentElement.classList.contains("dark");
    hemi.intensity = dark ? 0.55 : 1.0;
    hemi.color.set(dark ? 0x8a96c8 : 0xfff4e8);
    sun.intensity = dark ? 1.1 : 2.8;
    sun.color.set(dark ? 0xc4d0ff : 0xfff0dc);
    lamp.intensity = dark ? 4.5 : 0;
    scene.environmentIntensity = dark ? 0.25 : 0.55;
    fog.color.set(dark ? 0x1d2433 : 0xf5d6bd);
    cloudMat.color.set(dark ? 0x7f89a8 : 0xfffaf3);
    mistMat.color.set(dark ? 0x9aa6c4 : 0xffffff);
    orbMat.color.set(dark ? 0xf1ead8 : CLAY.butter);
    orbMat.emissive.set(dark ? 0xd9dcf0 : CLAY.butter);
    orbMat.emissiveIntensity = dark ? 0.4 : 0.6;
    orb.scale.setScalar(dark ? 0.6 : 1);
    stars.visible = dark;
    flies.visible = dark;
    windows.forEach((w) => (w.emissiveIntensity = dark ? 1.6 : 0.1));
    burnerMat.emissiveIntensity = dark ? 2 : 0.6;
    balloonLight.intensity = dark ? 4 : 0;
    water.emissiveIntensity = fallMat.emissiveIntensity = streamMat.emissiveIntensity = dark ? 0.35 : 0.12;
    kick();
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    kick();
  });
  observer.observe(host);
  const resizer = new ResizeObserver(resize);
  resizer.observe(host);
  const stopMotion = onMotionChange((value) => {
    paused = value;
    kick();
  });
  const onVisibility = () => kick();
  window.addEventListener(THEME_EVENT, theme);
  document.addEventListener("visibilitychange", onVisibility);
  flagArm.rotation.x = FLAG_DOWN;
  update(0);
  theme();
  resize();

  return {
    setProgress(value) {
      target = clamp01(value);
      kick();
    },
    setTopic(index) {
      stampMat.color.set(TOPIC_COLORS[index] ?? TOPIC_COLORS[0]);
      if (ready > 0.5) shakeT = 0.25;
      kick();
    },
    send() {
      if (sendT >= 0) return;
      target = 1;
      ready = 1;
      flyFrom.copy(letter.position);
      sendT = 0;
      kick();
    },
    shake() {
      shakeT = 0.5;
      kick();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizer.disconnect();
      stopMotion();
      window.removeEventListener(THEME_EVENT, theme);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
      geometries.forEach((g) => g.dispose());
      stampMat.dispose();
      [water, fallMat, streamMat, mistMat, burnerMat, orbMat, starMat, flyMat, ...windows].forEach((m) => m.dispose());
      [stripes, fallMap, streamMap, fade].forEach((t) => t.dispose());
      kit.dispose();
      envMap.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
