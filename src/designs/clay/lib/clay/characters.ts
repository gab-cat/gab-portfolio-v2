import * as THREE from "three";
import { CLAY, lumpy } from "./kit";
import type { ClayKit } from "./kit";

/* The cast of the "What I do" section. Each builder returns a group that
   stands on a floor at y = -2, plus a tick that animates it. The same
   builders fill the big solo panels and, shrunk, the wide diorama. */

export interface Tools {
  clay: ClayKit["clay"];
  keep: <T extends THREE.BufferGeometry>(g: T) => T;
  own: <T extends THREE.Material>(m: T) => T;
  put: (geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D) => THREE.Mesh;
  sphere: (r: number, lump?: number, seed?: number) => THREE.BufferGeometry;
  box: (w: number, h: number, d: number, radius: number, seed?: number) => THREE.BufferGeometry;
  capsule: (r: number, length: number, seed?: number) => THREE.BufferGeometry;
  torus: (r: number, t: number, arc?: number, seed?: number) => THREE.BufferGeometry;
  shadow: (parent: THREE.Object3D, size: number, y: number) => THREE.Mesh;
}

export interface Look {
  x: number;
  y: number;
  /** 0 to 1, eased: how much the visitor is hovering this piece's card. */
  hover?: number;
}

export interface Character {
  group: THREE.Group;
  tick: (t: number, look: Look) => void;
  /** A track the character owns, in its local space, for others to use. */
  path?: THREE.Curve<THREE.Vector3>;
  /** Give it a squash, as if something just landed in it. */
  bump?: () => void;
  /** Recolour anything that should change between light and dark. */
  theme?: (dark: boolean) => void;
}

const FLOOR = -2;
const heartShape = () => {
  const s = new THREE.Shape();
  s.moveTo(0, -0.28);
  s.bezierCurveTo(-0.08, -0.2, -0.32, -0.04, -0.3, 0.1);
  s.bezierCurveTo(-0.28, 0.26, -0.06, 0.28, 0, 0.14);
  s.bezierCurveTo(0.06, 0.28, 0.28, 0.26, 0.3, 0.1);
  s.bezierCurveTo(0.32, -0.04, 0.08, -0.2, 0, -0.28);
  return s;
};
const extrude = (T: Tools, shape: THREE.Shape, depth: number, bevel: number) => {
  const g = T.keep(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 14 }));
  g.center();
  return g;
};

/** BUILD: a monitor-headed robot on a rail. Its eyes follow the cursor. */
export function robot(T: Tools, { rail = false } = {}): Character {
  const g = new THREE.Group();
  const shell = T.clay(0xf4d6c0);
  const orange = T.clay(0xef7a2e);
  const dark = T.clay(0x2a2220, { roughness: 0.4 });
  const plinth = T.put(T.box(2.3, 0.34, 1.9, 0.14, 1), orange, g);
  plinth.position.y = FLOOR + 0.17;
  const bodyGeo = T.keep(lumpy(new THREE.CylinderGeometry(0.95, 1.35, 1.2, 4, 1), 0.02, 1.5, 2));
  bodyGeo.rotateY(Math.PI / 4);
  T.put(bodyGeo, shell, g).position.y = FLOOR + 0.94;
  const pad = new THREE.Group();
  pad.position.set(-0.33, FLOOR + 0.9, 0.82);
  pad.rotation.x = -0.23;
  T.put(T.box(0.34, 0.1, 0.07, 0.03, 3), orange, pad);
  T.put(T.box(0.1, 0.34, 0.07, 0.03, 4), orange, pad);
  g.add(pad);
  [
    [0.3, FLOOR + 1.04, 0.78],
    [0.5, FLOOR + 0.8, 0.84],
  ].forEach(([x, y, z], i) => T.put(T.sphere(0.1, 0.05, 5 + i), orange, g).position.set(x, y, z));
  T.put(T.box(1.3, 0.2, 1.1, 0.08, 7), orange, g).position.y = FLOOR + 1.62;
  const head = new THREE.Group();
  head.position.y = FLOOR + 2.5;
  g.add(head);
  T.put(T.box(1.9, 1.55, 1.6, 0.28, 8), shell, head);
  T.put(T.box(1.36, 1.06, 0.16, 0.14, 9), orange, head).position.z = 0.76;
  T.put(T.box(1.1, 0.82, 0.1, 0.1, 10), dark, head).position.z = 0.83;
  const eyeL = T.put(T.sphere(0.17, 0.03, 11), T.clay(0xef7a2e, { emissive: 0xef7a2e, emissiveIntensity: 0.25 }), head);
  const eyeR = T.put(T.sphere(0.17, 0.03, 12), T.clay(0x4aa3ff, { emissive: 0x4aa3ff, emissiveIntensity: 0.25 }), head);
  [eyeL, eyeR].forEach((eye, i) => {
    eye.position.set(i ? 0.24 : -0.24, 0, 0.9);
    eye.scale.z = 0.45;
  });
  for (const side of [-1, 1]) {
    const port = T.put(T.box(0.08, 0.5, 0.6, 0.04, 13), T.clay(0xe6c3aa), head);
    port.position.x = side * 0.96;
  }
  const antenna = new THREE.Group();
  antenna.position.y = 0.78;
  head.add(antenna);
  T.put(T.capsule(0.07, 0.16, 14), orange, antenna).position.y = 0.1;
  const dishMat = T.own(T.clay(0xf1c9ad).clone());
  dishMat.side = THREE.DoubleSide;
  const dish = T.put(T.keep(lumpy(new THREE.SphereGeometry(0.4, 28, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0.01, 3, 15)), dishMat, antenna);
  dish.position.y = 0.5;
  dish.scale.y = 0.6;
  T.put(T.sphere(0.07, 0.04, 16), orange, antenna).position.y = 0.62;
  if (rail) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-7, FLOOR + 2.3, -0.6),
      new THREE.Vector3(-2.5, FLOOR + 2.45, 0),
      new THREE.Vector3(2.5, FLOOR + 2.55, 0),
      new THREE.Vector3(7, FLOOR + 2.35, -0.8),
    ]);
    T.put(T.keep(lumpy(new THREE.TubeGeometry(curve, 80, 0.14, 18, false), 0.008, 2, 17)), T.clay(0xdcd3c6, { roughness: 0.45 }), g);
  }
  T.shadow(g, 3.4, FLOOR + 0.01);
  return {
    group: g,
    tick(t, look) {
      g.position.y = Math.sin(t * 1.4) * 0.03;
      head.rotation.y = look.x * 0.45 + Math.sin(t * 0.5) * 0.06;
      head.rotation.x = look.y * 0.2;
      const blink = t % 3.6 < 0.12 ? 0.12 : 1;
      [eyeL, eyeR].forEach((eye, i) => {
        eye.position.x = (i ? 0.24 : -0.24) + look.x * 0.09;
        eye.position.y = -look.y * 0.07;
        eye.scale.y = blink;
      });
      antenna.rotation.y = t * 0.8;
    },
  };
}

/** The deploy track that spirals up around the server stack. */
class Helix extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super();
  }
  getPoint(u: number, out = new THREE.Vector3()) {
    const a = u * Math.PI * 2 * 2.2 + 0.6;
    return out.set(Math.cos(a) * 1.6, FLOOR + 0.2 + u * 2.2, Math.sin(a) * 1.25);
  }
}

/** SHIP: a server stack that keeps a heartbeat, with deploys spiralling up. */
export function servers(T: Tools, { balls: ownBalls = true } = {}): Character {
  const g = new THREE.Group();
  const slate = T.clay(0x44536f);
  const panel = T.clay(0x2c3850);
  const leds: THREE.MeshPhysicalMaterial[] = [];
  for (let i = 0; i < 3; i++) {
    const unit = new THREE.Group();
    unit.position.y = FLOOR + 0.45 + i * 0.7;
    T.put(T.box(2.1, 0.62, 1.5, 0.16, 20 + i), slate, unit);
    [0.1, -0.1].forEach((y, k) => T.put(T.box(1.1, 0.07, 0.05, 0.03, 23 + k), panel, unit).position.set(-0.25, y, 0.76));
    for (let k = 0; k < 3; k++) {
      const mat = T.own(T.clay(0x6dd88a, { emissive: 0x6dd88a, emissiveIntensity: 1 }).clone());
      leds.push(mat);
      T.put(T.sphere(0.055, 0.02, 26 + k), mat, unit).position.set(0.55 + k * 0.17, 0, 0.77);
    }
    g.add(unit);
  }
  for (const x of [-0.85, 0.85]) for (const z of [-0.55, 0.55]) T.put(T.capsule(0.08, 0.05, 30), panel, g).position.set(x, FLOOR + 0.1, z);
  const heart = T.put(extrude(T, heartShape(), 0.16, 0.08), T.clay(CLAY.flame), g);
  heart.position.y = FLOOR + 2.55;
  heart.scale.setScalar(1.35);
  const helix = new Helix();
  T.put(T.keep(new THREE.TubeGeometry(helix, 160, 0.06, 10, false)), T.clay(CLAY.butter), g);
  const balls = ownBalls ? [CLAY.flame, CLAY.sky, CLAY.cream, CLAY.lilac].map((c, i) => T.put(T.sphere(0.13, 0.04, 31 + i), T.clay(c), g)) : [];
  T.shadow(g, 3.6, FLOOR + 0.01);
  const p = new THREE.Vector3();
  return {
    group: g,
    path: helix,
    tick(t, look) {
      g.rotation.y = look.x * 0.25;
      const k = t % 1.3;
      const beat = Math.exp(-(((k - 0.1) / 0.06) ** 2)) * 0.28 + Math.exp(-(((k - 0.34) / 0.07) ** 2)) * 0.16;
      heart.scale.setScalar(1.35 * (1 + beat));
      heart.rotation.y = Math.sin(t * 0.8) * 0.4;
      leds.forEach((m, i) => (m.emissiveIntensity = Math.sin(t * (2.5 + (i % 4) * 1.3) + i * 1.7) > -0.3 ? 1.2 : 0.08));
      balls.forEach((ball, i) => {
        const u = (t * 0.11 + i / balls.length) % 1;
        helix.getPoint(u, p);
        ball.position.set(p.x * 1.08, p.y + 0.14, p.z * 1.08);
        ball.scale.setScalar(Math.min(1, u * 12, (1 - u) * 12));
      });
    },
  };
}

/** STORE: a stacked-disc database that swallows falling balls. */
export function database(T: Tools, { drops: ownDrops = true } = {}): Character {
  const g = new THREE.Group();
  const shades = [0x86ad72, 0x9ebf86, 0xb4cf9a];
  const discs = shades.map((c, i) => {
    const disc = new THREE.Group();
    disc.position.y = FLOOR + 0.36 + i * 0.72;
    T.put(T.keep(lumpy(new THREE.CylinderGeometry(1.15, 1.15, 0.62, 48, 1), 0.02, 1.4, 40 + i)), T.clay(c), disc);
    const rim = T.put(T.torus(1.1, 0.06, Math.PI * 2, 43 + i), T.clay(0xdcebc8), disc);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.31;
    [-0.3, 0, 0.3].forEach((x, k) => T.put(T.sphere(0.06, 0.02, 46 + k), T.clay(0x3f6f4f), disc).position.set(x, 0, 1.13));
    g.add(disc);
    return disc;
  });
  const top = FLOOR + 0.36 + 2 * 0.72 + 0.31;
  const drops = ownDrops ? [CLAY.flame, CLAY.butter, CLAY.sky].map((c, i) => T.put(T.sphere(0.16, 0.04, 50 + i), T.clay(c), g)) : [];
  let bumped = 0;
  const lens = new THREE.Group();
  const ring = T.put(T.torus(0.34, 0.07, Math.PI * 2, 53), T.clay(CLAY.sky), lens);
  ring.rotation.y = Math.PI / 2;
  const handle = T.put(T.capsule(0.07, 0.42, 54), T.clay(CLAY.cocoa), lens);
  handle.position.set(0, -0.55, 0);
  g.add(lens);
  T.shadow(g, 3.4, FLOOR + 0.01);
  return {
    group: g,
    bump: () => (bumped = 1),
    tick(t, look) {
      g.rotation.y = look.x * 0.3;
      bumped = Math.max(0, bumped - 0.05);
      let squash = Math.sin(bumped * Math.PI) * bumped;
      drops.forEach((ball, i) => {
        const k = ((t + i * 0.8) % 2.4) / 2.4;
        const fall = Math.min(1, k / 0.45);
        ball.position.set(Math.sin(i * 2.1) * 0.35, top + 2.6 * (1 - fall * fall) + 0.16, Math.cos(i * 2.1) * 0.3);
        ball.visible = k < 0.5;
        if (k > 0.45 && k < 0.6) squash = Math.max(squash, 1 - (k - 0.45) / 0.15);
      });
      discs.forEach((d, i) => d.scale.set(1 + squash * 0.05 * (i + 1) / 3, 1 - squash * 0.08 * (i + 1) / 3, 1 + squash * 0.05 * (i + 1) / 3));
      const a = t * 0.7;
      lens.position.set(Math.cos(a) * 1.9, FLOOR + 1.35 + Math.sin(t * 1.4) * 0.15, Math.sin(a) * 1.5);
      lens.rotation.y = -a + Math.PI / 2;
      lens.rotation.z = 0.35;
    },
  };
}

/** PLAY: a game controller, a key for the CTFs, and an AI sparkle. */
export function controller(T: Tools): Character {
  const g = new THREE.Group();
  const pad = new THREE.Group();
  g.add(pad);
  const lilac = T.clay(CLAY.lilac);
  const dark = T.clay(CLAY.charcoal, { roughness: 0.5 });
  T.put(T.box(2.3, 0.5, 1.2, 0.24, 60), lilac, pad);
  for (const side of [-1, 1]) {
    const grip = T.put(T.capsule(0.34, 0.55, 61), lilac, pad);
    grip.position.set(side * 0.82, -0.05, 0.55);
    grip.rotation.set(1.1, 0, side * -0.25);
  }
  const dpad = new THREE.Group();
  dpad.position.set(-0.6, 0.27, 0.05);
  T.put(T.box(0.42, 0.1, 0.13, 0.04, 62), dark, dpad);
  T.put(T.box(0.13, 0.1, 0.42, 0.04, 63), dark, dpad);
  pad.add(dpad);
  [
    [0.6, -0.2, CLAY.flame],
    [0.8, 0, CLAY.butter],
    [0.6, 0.2, CLAY.sky],
    [0.4, 0, CLAY.sage],
  ].forEach(([x, z, c], i) => {
    const b = T.put(T.sphere(0.1, 0.03, 64 + i), T.clay(c), pad);
    b.position.set(x, 0.28, z);
    b.scale.y = 0.6;
  });
  [-0.22, 0.22].forEach((x, i) => {
    const stick = T.put(T.keep(new THREE.CylinderGeometry(0.13, 0.15, 0.12, 20)), dark, pad);
    stick.position.set(x, 0.3, 0.3);
    T.put(T.sphere(0.12, 0.03, 68 + i), T.clay(0x4a4540), pad).position.set(x, 0.38, 0.3);
  });
  const key = new THREE.Group();
  const gold = T.clay(CLAY.butter, { roughness: 0.45 });
  T.put(T.torus(0.26, 0.08, Math.PI * 2, 70), gold, key).position.x = -0.5;
  T.put(T.box(0.8, 0.11, 0.11, 0.04, 71), gold, key).position.x = 0.1;
  [0.3, 0.45].forEach((x, i) => T.put(T.box(0.08, 0.2 - i * 0.05, 0.1, 0.02, 72 + i), gold, key).position.set(x, -0.12, 0));
  key.position.set(-1.7, 0.9, -0.3);
  g.add(key);
  const spark = new THREE.Shape();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 ? 0.1 : 0.42;
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    if (i) spark.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    else spark.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  spark.closePath();
  const star = T.put(extrude(T, spark, 0.1, 0.05), T.clay(0xfff4d6, { emissive: 0xffe7a8, emissiveIntensity: 0.25 }), g);
  star.position.set(1.7, 1.1, -0.2);
  const shade = T.shadow(g, 3, FLOOR + 0.01);
  return {
    group: g,
    tick(t, look) {
      const bob = Math.sin(t * 1.2) * 0.12;
      pad.position.y = -0.3 + bob;
      pad.rotation.set(0.55 + look.y * 0.2 + Math.sin(t * 0.9) * 0.05, look.x * 0.5 + Math.sin(t * 0.5) * 0.25, Math.sin(t * 0.7) * 0.08);
      shade.scale.set(3 - bob, 1.6 - bob * 0.5, 1);
      key.rotation.set(t * 0.6, t * 0.9, 0.3);
      key.position.y = 0.9 + Math.sin(t * 1.1 + 1) * 0.15;
      star.rotation.z = t * 0.5;
      star.scale.setScalar(1 + Math.sin(t * 2.2) * 0.12);
      star.position.y = 1.1 + Math.sin(t * 1.3) * 0.12;
    },
  };
}

/** The whole crew on one clay table, joined by a single marble run: out
 * of a feeder, through the robot's head, down the server's spiral, into the
 * database, out again, and into the hole in the floor. */
export function diorama(T: Tools): Character {
  const g = new THREE.Group();
  const F = -1.6;
  const scale = 0.64;
  const bot = robot(T);
  const rack = servers(T, { balls: false });
  const db = database(T, { drops: false });
  const pad = controller(T);
  const cast = [bot, rack, db, pad];
  const X = [-4.65, -1.55, 1.55, 4.65];
  cast.forEach((c, i) => {
    c.group.scale.setScalar(scale);
    c.group.position.set(X[i], F - FLOOR * scale, -1.1);
    g.add(c.group);
  });
  const toTable = (c: Character, v: THREE.Vector3) => v.clone().multiplyScalar(scale).add(c.group.position);

  // The table everything stands on. Its back edge is the horizon.
  const tableMat = T.own(T.clay(0xbfb3a2, { roughness: 0.95, sheen: 0.12, repeat: 6 }).clone());
  const table = T.put(T.box(22, 0.5, 10, 0.2, 200), tableMat, g);
  table.position.set(0, F - 0.25, 0.6);
  const inkMat = T.own(new THREE.MeshBasicMaterial({ color: 0x3b332b, transparent: true, opacity: 0.8 }));
  const hole = T.put(T.keep(new THREE.CircleGeometry(0.4, 40)), inkMat, g);
  hole.rotation.x = -Math.PI / 2;
  hole.position.set(5.5, F + 0.005, 1.15);
  const hollowMat = T.own(new THREE.MeshBasicMaterial({ color: 0x6f6252, transparent: true, opacity: 0.28 }));
  const tri = new THREE.Shape();
  tri.moveTo(-0.4, -0.3);
  tri.lineTo(0.4, -0.3);
  tri.lineTo(0, 0.35);
  tri.closePath();
  const triMesh = T.put(T.keep(new THREE.ShapeGeometry(tri)), hollowMat, g);
  triMesh.rotation.x = -Math.PI / 2;
  triMesh.position.set(-2.9, F + 0.005, 2.3);
  const sq = T.put(T.keep(new THREE.PlaneGeometry(0.55, 0.55)), hollowMat, g);
  sq.rotation.set(-Math.PI / 2, 0, 0.4);
  sq.position.set(3.2, F + 0.005, 2.4);

  // A pedestal so the controller stands on the table like everyone else.
  const stand = T.clay(0xc5b4ef);
  const post = T.put(T.keep(lumpy(new THREE.CylinderGeometry(0.28, 0.34, 0.75, 24), 0.01, 3, 201)), stand, g);
  post.position.set(X[3], F + 0.375, -1.1);
  const foot = T.put(T.keep(lumpy(new THREE.CylinderGeometry(0.62, 0.66, 0.14, 32), 0.01, 3, 202)), stand, g);
  foot.position.set(X[3], F + 0.07, -1.1);

  // The run, in three legs, plus the server's own spiral in between.
  const headY = toTable(bot, new THREE.Vector3(0, FLOOR + 2.5, 0)).y;
  const helix = rack.path!;
  const helixTop = toTable(rack, helix.getPoint(1));
  const helixBottom = toTable(rack, helix.getPoint(0));
  const dbIn = new THREE.Vector3(X[2] - 0.62, F + 0.16, -0.7);
  const dbOut = new THREE.Vector3(X[2] + 0.62, F + 0.16, -0.7);
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const legs = [
    new THREE.CatmullRomCurve3([V(-6.45, headY + 0.45, -1.1), V(-5.7, headY + 0.1, -1.1), V(X[0], headY, -1.1), V(-3.3, headY - 0.03, -1.0), V(-2.5, helixTop.y + 0.02, -0.5), helixTop], false, "centripetal"),
    new THREE.CatmullRomCurve3([helixBottom, V(-0.1, F + 0.18, 0.1), V(0.8, F + 0.17, -0.1), dbIn], false, "centripetal"),
    new THREE.CatmullRomCurve3([dbOut, V(3.0, F + 0.15, 0.2), V(4.1, F + 0.14, 1.0), V(5.0, F + 0.13, 1.15)], false, "centripetal"),
  ];
  const trackMat = T.clay(0xefe6d8, { roughness: 0.55 });
  legs.forEach((leg, i) => T.put(T.keep(lumpy(new THREE.TubeGeometry(leg, 160, 0.1, 14, false), 0.006, 2, 210 + i)), trackMat, g));
  // Posts hold the high leg up; the floor legs lie on the table.
  [0.05, 0.3, 0.72, 0.9].forEach((u, i) => {
    const p = legs[0].getPointAt(u);
    const h = p.y - F;
    T.put(T.capsule(0.05, h), trackMat, g).position.set(p.x, F + h / 2, p.z - 0.04);
    T.shadow(g, 0.45, F + 0.01).position.set(p.x, F + 0.01, p.z);
    void i;
  });
  // The feeder the balls come from, and sleeves where they enter and leave the database.
  const feeder = T.put(T.keep(lumpy(new THREE.SphereGeometry(0.34, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0.01, 3, 220)), T.own(T.clay(CLAY.flame).clone()), g);
  (feeder.material as THREE.Material).side = THREE.DoubleSide;
  feeder.rotation.x = Math.PI;
  feeder.position.set(-6.45, headY + 0.67, -1.1);
  const feederPost = T.put(T.capsule(0.06, headY + 0.67 - F), trackMat, g);
  feederPost.position.set(-6.7, (headY + 0.67 + F) / 2, -1.2);
  for (const [p, a] of [[dbIn, Math.PI / 2], [dbOut, Math.PI / 2]] as const) {
    const sleeve = T.put(T.torus(0.16, 0.06, Math.PI * 2, 221), T.clay(CLAY.butter), g);
    sleeve.position.copy(p);
    sleeve.rotation.y = a;
  }

  // One ball's trip, as timed legs.
  const up = 0.2;
  const trip: { d: number; at: (u: number, out: THREE.Vector3) => void; hide?: boolean }[] = [
    { d: 0.5, at: (u, o) => o.set(-6.45, headY + 0.57 - u * 0.4, -1.1) },
    { d: 2.4, at: (u, o) => o.copy(legs[0].getPointAt(u)).setY(legs[0].getPointAt(u).y + up) },
    { d: 3.4, at: (u, o) => o.copy(toTable(rack, helix.getPoint(1 - u))).setY(toTable(rack, helix.getPoint(1 - u)).y + 0.13) },
    { d: 1.3, at: (u, o) => o.copy(legs[1].getPointAt(u)).setY(legs[1].getPointAt(u).y + up * 0.8) },
    { d: 0.7, at: (_u, o) => o.copy(dbIn), hide: true },
    { d: 1.7, at: (u, o) => o.copy(legs[2].getPointAt(u)).setY(legs[2].getPointAt(u).y + up * 0.8) },
    { d: 0.45, at: (u, o) => o.set(5.0 + u * 0.5, F + 0.3 - u * u * 0.75, 1.15) },
  ];
  const total = trip.reduce((sum, leg) => sum + leg.d, 0);
  const colors = [CLAY.flame, CLAY.sky, CLAY.butter, CLAY.lilac, CLAY.flame];
  const balls = colors.map((c, i) => T.put(T.sphere(0.15, 0.04, 230 + i), T.clay(c), g));
  const lastLeg = balls.map(() => -1);
  const p = new THREE.Vector3();
  return {
    group: g,
    theme: (dark) => {
      tableMat.color.set(dark ? 0x3b332c : 0xbfb3a2);
      trackMat.color.set(dark ? 0xd9cdbb : 0xefe6d8);
    },
    tick(t, look) {
      // Small turns only, so the rail stays threaded through the robot's head.
      const calm = { x: look.x * 0.15, y: look.y * 0.15, hover: look.hover };
      cast.forEach((c) => c.tick(t, calm));
      balls.forEach((ball, i) => {
        let k = (t + (i * total) / balls.length) % total;
        let leg = 0;
        while (leg < trip.length - 1 && k > trip[leg].d) k -= trip[leg++].d;
        const u = Math.min(1, k / trip[leg].d);
        trip[leg].at(u, p);
        ball.position.copy(p);
        ball.visible = !trip[leg].hide;
        const fadeIn = leg === 0 ? Math.min(1, u * 3) : 1;
        const fadeOut = leg === trip.length - 1 ? 1 - Math.max(0, (u - 0.6) / 0.4) : 1;
        ball.scale.setScalar(fadeIn * fadeOut);
        ball.rotation.z = -t * 6;
        if (leg === 4 && lastLeg[i] !== 4) db.bump?.();
        lastLeg[i] = leg;
      });
    },
  };
}

/* ------------------------------------------------------------- projects */

/** MerchTrack: a clay tee on a rail, a shopping bag, and a price tag. */
export function merch(T: Tools): Character {
  const g = new THREE.Group();
  const wood = T.clay(0xc79a6e);
  const rail = T.put(T.capsule(0.07, 4.0), wood, g);
  rail.rotation.z = Math.PI / 2;
  rail.position.y = 1.75;
  for (const x of [-1.95, 1.95]) T.put(T.capsule(0.08, 3.7), wood, g).position.set(x, FLOOR + 1.87, -0.1);
  for (const x of [-1.95, 1.95]) {
    const foot = T.put(T.box(0.7, 0.12, 0.5, 0.05, 101), wood, g);
    foot.position.set(x, FLOOR + 0.06, -0.1);
  }
  const hanger = new THREE.Group();
  hanger.position.y = 1.75;
  g.add(hanger);
  const hook = T.put(T.torus(0.13, 0.035, Math.PI * 1.4, 102), T.clay(CLAY.charcoal), hanger);
  hook.rotation.z = -Math.PI * 0.2;
  const bar = T.put(T.capsule(0.04, 1.7), T.clay(CLAY.charcoal), hanger);
  bar.rotation.z = Math.PI / 2;
  bar.position.y = -0.34;
  // The tee's outline, traced from the old illustration and puffed up.
  const s = 0.0125;
  const P = (x: number, y: number) => new THREE.Vector2((x - 100) * s, (22 - y) * s);
  const tee = new THREE.Shape();
  tee.moveTo(P(55, 18).x, P(55, 18).y);
  tee.lineTo(P(78, 8).x, P(78, 8).y);
  tee.bezierCurveTo(P(83, 25).x, P(83, 25).y, P(117, 25).x, P(117, 25).y, P(122, 8).x, P(122, 8).y);
  [[145, 18], [190, 64], [158, 94], [143, 78], [149, 202], [51, 202], [57, 78], [42, 94], [10, 64], [55, 18]].forEach(([x, y]) => tee.lineTo(P(x, y).x, P(x, y).y));
  const teeGeo = T.keep(lumpy(new THREE.ExtrudeGeometry(tee, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.1, bevelSegments: 6, curveSegments: 10 }), 0.015, 1.6, 103));
  teeGeo.translate(0, 0, -0.11);
  const shirt = new THREE.Group();
  shirt.position.y = -0.32;
  hanger.add(shirt);
  T.put(teeGeo, T.clay(0x2f4a3a), shirt);
  const badge = T.put(T.keep(lumpy(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 32), 0.005, 3, 104)), T.clay(0xebf19e), shirt);
  badge.rotation.x = Math.PI / 2;
  badge.position.set(0, -0.95, 0.27);
  T.put(T.sphere(0.09, 0.05, 105), T.clay(CLAY.flame), shirt).position.set(0, -0.95, 0.31);
  const bag = new THREE.Group();
  bag.position.set(1.25, FLOOR, 1.05);
  bag.rotation.y = -0.4;
  T.put(T.box(1.05, 1.05, 0.55, 0.1, 106), T.clay(CLAY.cream), bag).position.y = 0.53;
  T.put(T.box(1.07, 0.16, 0.57, 0.04, 107), T.clay(CLAY.flame), bag).position.y = 0.72;
  const strap = T.put(T.torus(0.26, 0.04, Math.PI, 108), T.clay(CLAY.flame), bag);
  strap.position.y = 1.05;
  g.add(bag);
  T.shadow(g, 4.6, FLOOR + 0.01);
  return {
    group: g,
    tick(t, look) {
      const h = look.hover ?? 0;
      hanger.rotation.z = Math.sin(t * 1.1) * 0.05 + look.x * 0.05;
      shirt.rotation.y = h * Math.PI * 2 + Math.sin(t * 0.7) * 0.12;
      bag.position.y = FLOOR + Math.abs(Math.sin(t * 2.2)) * 0.06 * h;
    },
  };
}

/** CS Guild: a chunky </>, three students gathered round, and a star. */
export function guild(T: Tools): Character {
  const g = new THREE.Group();
  const plinth = T.put(T.keep(lumpy(new THREE.CylinderGeometry(2.25, 2.35, 0.32, 48), 0.02, 1.4, 110)), T.clay(0xcdbef2), g);
  plinth.position.y = FLOOR + 0.16;
  const ink = T.clay(0x4a3876);
  const code = new THREE.Group();
  code.position.y = FLOOR + 1.45;
  g.add(code);
  const stroke = T.box(0.95, 0.3, 0.34, 0.13, 111);
  const slash = T.box(1.8, 0.3, 0.34, 0.13, 112);
  for (const side of [-1, 1]) {
    for (const up of [-1, 1]) {
      const bit = T.put(stroke, ink, code);
      bit.position.set(side * 1.25, up * 0.3, 0);
      bit.rotation.z = side * up * -0.62;
    }
  }
  const slashMesh = T.put(slash, T.clay(CLAY.flame), code);
  slashMesh.rotation.z = 1.2;
  const people = [CLAY.flame, CLAY.sky, CLAY.sage].map((c, i) => {
    const p = new THREE.Group();
    const body = T.put(T.capsule(0.17, 0.3), T.clay(c), p);
    body.position.y = 0.32;
    T.put(T.sphere(0.17, 0.04, 113 + i), T.clay(0xf1c9ad), p).position.y = 0.78;
    p.position.set(-1.05 + i * 1.05, FLOOR + 0.32, 1.35 - Math.abs(i - 1) * 0.2);
    p.rotation.y = (1 - i) * 0.5;
    g.add(p);
    return p;
  });
  const star = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const arm = T.put(T.capsule(0.09, 0.62), T.clay(CLAY.butter), star);
    arm.rotation.z = (i * Math.PI) / 3;
  }
  star.position.set(1.65, 1.35, -0.4);
  g.add(star);
  T.shadow(g, 5, FLOOR + 0.01);
  return {
    group: g,
    tick(t, look) {
      const h = look.hover ?? 0;
      code.rotation.y = look.x * 0.3 + Math.sin(t * 0.6) * 0.1;
      code.position.y = FLOOR + 1.45 + Math.sin(t * 1.2) * 0.06;
      star.rotation.z = t * (0.6 + h * 2);
      people.forEach((p, i) => {
        const hop = Math.max(0, Math.sin(t * 5 + i * 1.3));
        p.position.y = FLOOR + 0.32 + hop * (0.04 + h * 0.3);
      });
    },
  };
}

/** Games of the Generals: a board where the pieces keep making moves. */
export function board(T: Tools): Character {
  const g = new THREE.Group();
  const top = FLOOR + 0.32;
  T.put(T.box(3.8, 0.32, 2.6, 0.14, 120), T.clay(0x44535c), g).position.y = FLOOR + 0.16;
  const cellGeo = T.box(0.4, 0.06, 0.4, 0.04, 121);
  const cellA = T.clay(0xb7c5c7);
  const cellB = T.clay(0x9dafb4);
  const cell = (c: number, r: number) => new THREE.Vector3(-1.4 + c * 0.4, top + 0.03, -0.8 + r * 0.4);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) T.put(cellGeo, (r + c) % 2 ? cellA : cellB, g).position.copy(cell(c, r));
  const tileGeo = T.box(0.3, 0.42, 0.12, 0.05, 122);
  const light = T.clay(0xedece2);
  const dark = T.clay(0xd7724b);
  const pieces = (
    [
      [1, 4, light], [3, 4, light], [5, 3, light], [6, 4, light],
      [2, 0, dark], [4, 1, dark], [5, 0, dark], [7, 1, dark],
    ] as const
  ).map(([c, r, m], i) => {
    const piece = T.put(tileGeo, m, g);
    const home = cell(c, r);
    home.y += 0.26;
    piece.position.copy(home);
    piece.userData = { home, phase: i * 0.7 };
    return piece;
  });
  const star = T.put(T.sphere(0.05, 0.03, 123), T.clay(CLAY.flame), pieces[2]);
  star.position.set(0, 0.06, 0.07);
  T.shadow(g, 5, FLOOR + 0.01);
  const move = new THREE.Vector3();
  return {
    group: g,
    tick(t, look) {
      const h = look.hover ?? 0;
      g.rotation.y = look.x * 0.2;
      pieces.forEach((piece, i) => {
        const { home, phase } = piece.userData;
        piece.position.copy(home);
        piece.position.y += Math.max(0, Math.sin(t * 6 - i * 0.6)) * 0.3 * h;
        piece.rotation.y = Math.sin(t * 0.8 + phase) * 0.08;
      });
      // One light piece advances a square and slides back; a dark one answers.
      const k = (t % 4) / 4;
      const step = k < 0.25 ? (k / 0.25) : k < 0.5 ? 1 : k < 0.75 ? 1 - (k - 0.5) / 0.25 : 0;
      const e = step * step * (3 - 2 * step);
      move.set(0, Math.sin(e * Math.PI) * 0.35, -0.4 * e);
      pieces[2].position.add(move);
      const k2 = ((t + 2) % 4) / 4;
      const s2 = k2 < 0.25 ? k2 / 0.25 : k2 < 0.5 ? 1 : k2 < 0.75 ? 1 - (k2 - 0.5) / 0.25 : 0;
      const e2 = s2 * s2 * (3 - 2 * s2);
      pieces[5].position.add(move.set(0.4 * e2, Math.sin(e2 * Math.PI) * 0.35, 0));
    },
  };
}

/** Your Daily Tarot: the moon, the star and the sun, fanned out. */
export function tarot(T: Tools): Character {
  const g = new THREE.Group();
  const plum = T.clay(0x693c52);
  const cardGeo = T.box(1.2, 1.95, 0.08, 0.12, 130);
  const faceGeo = T.box(1.0, 1.72, 0.03, 0.08, 131);
  const faces = [0xb6bacf, 0xf6eddf, 0xd4ac91];
  const cards = faces.map((c, i) => {
    const card = new THREE.Group();
    T.put(cardGeo, plum, card);
    T.put(faceGeo, T.clay(c), card).position.z = 0.045;
    const emblem = new THREE.Group();
    emblem.position.set(0, 0.12, 0.07);
    card.add(emblem);
    if (i === 0) {
      const moon = T.put(T.torus(0.26, 0.09, Math.PI * 1.25, 132), plum, emblem);
      moon.rotation.z = 0.9;
    } else if (i === 1) {
      const star = new THREE.Shape();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 ? 0.12 : 0.32;
        const a = (k / 10) * Math.PI * 2 + Math.PI / 2;
        if (k) star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        else star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      const geo = T.keep(new THREE.ExtrudeGeometry(star, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 }));
      geo.center();
      T.put(geo, T.clay(CLAY.flame), emblem);
    } else {
      T.put(T.sphere(0.2, 0.03, 133), plum, emblem);
      for (let k = 0; k < 8; k++) {
        const ray = T.put(T.capsule(0.03, 0.12), plum, emblem);
        const a = (k / 8) * Math.PI * 2;
        ray.position.set(Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0);
        ray.rotation.z = a - Math.PI / 2;
      }
    }
    const numeral = T.put(T.box(0.34, 0.08, 0.02, 0.03, 134 + i), plum, card);
    numeral.position.set(0, -0.62, 0.07);
    g.add(card);
    return card;
  });
  T.shadow(g, 4.2, FLOOR + 0.01);
  return {
    group: g,
    tick(t, look) {
      const h = look.hover ?? 0;
      const spread = 1.0 + h * 0.3;
      const tilt = 0.24 + h * 0.14;
      cards.forEach((card, i) => {
        const side = i - 1;
        card.position.set(side * spread, -0.35 + Math.sin(t * 1.1 + i) * 0.08 - Math.abs(side) * 0.12, side ? -0.25 : 0.1);
        card.rotation.set(0, side * -0.28 + look.x * 0.2, -side * tilt);
      });
      // Every few seconds the middle card turns itself over and back.
      const k = (t % 5) / 5;
      const flip = k > 0.8 ? (k - 0.8) / 0.2 : 0;
      cards[1].rotation.y += flip * flip * (3 - 2 * flip) * Math.PI * 2;
    },
  };
}
