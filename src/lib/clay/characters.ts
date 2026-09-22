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
}

export interface Character {
  group: THREE.Group;
  tick: (t: number, look: Look) => void;
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
export function servers(T: Tools): Character {
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
  const balls = [CLAY.flame, CLAY.sky, CLAY.cream, CLAY.lilac].map((c, i) => T.put(T.sphere(0.13, 0.04, 31 + i), T.clay(c), g));
  T.shadow(g, 3.6, FLOOR + 0.01);
  const p = new THREE.Vector3();
  return {
    group: g,
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
export function database(T: Tools): Character {
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
  const drops = [CLAY.flame, CLAY.butter, CLAY.sky].map((c, i) => T.put(T.sphere(0.16, 0.04, 50 + i), T.clay(c), g));
  const lens = new THREE.Group();
  const ring = T.put(T.torus(0.34, 0.07, Math.PI * 2, 53), T.clay(CLAY.sky), lens);
  ring.rotation.y = Math.PI / 2;
  const handle = T.put(T.capsule(0.07, 0.42, 54), T.clay(CLAY.cocoa), lens);
  handle.position.set(0, -0.55, 0);
  g.add(lens);
  T.shadow(g, 3.4, FLOOR + 0.01);
  return {
    group: g,
    tick(t, look) {
      g.rotation.y = look.x * 0.3;
      let squash = 0;
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

/** The whole crew in a row, linked by a snaking marble track that ends in a hole. */
export function diorama(T: Tools): Character {
  const g = new THREE.Group();
  const F = -1.6;
  const scale = 0.64;
  const cast = [robot(T), servers(T), database(T), controller(T)];
  cast.forEach((c, i) => {
    c.group.scale.setScalar(scale);
    c.group.position.set(-4.65 + i * 3.1, F - FLOOR * scale, -1.1);
    g.add(c.group);
  });
  // Starts high on the left and loses height as it snakes past each character.
  const points = [
    [-6.3, -0.55, 0.5],
    [-5.3, -0.68, 1.5],
    [-3.8, -0.78, 0.8],
    [-2.8, -0.86, 1.7],
    [-1.2, -0.95, 1.9],
    [0.1, -1.02, 1.1],
    [1.2, -1.08, 1.9],
    [2.8, -1.14, 2.0],
    [3.8, -1.19, 1.2],
    [4.9, -1.24, 1.9],
    [5.6, -1.28, 1.5],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const track = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const trackMat = T.clay(0xe6ddcf, { roughness: 0.55 });
  T.put(T.keep(lumpy(new THREE.TubeGeometry(track, 220, 0.12, 14, false), 0.006, 2, 80)), trackMat, g);
  [0.08, 0.3, 0.52, 0.74, 0.92].forEach((u, i) => {
    const p = track.getPointAt(u);
    const h = p.y - F;
    const post = T.put(T.capsule(0.05, h), trackMat, g);
    post.position.set(p.x, F + h / 2, p.z - 0.05);
    T.shadow(g, 0.5, F + 0.01).position.set(p.x, F + 0.01, p.z);
    void i;
  });
  const end = track.getPointAt(1);
  const holeMat = T.own(new THREE.MeshBasicMaterial({ color: 0x3b332b, transparent: true, opacity: 0.85 }));
  const hole = T.put(T.keep(new THREE.CircleGeometry(0.42, 40)), holeMat, g);
  hole.rotation.x = -Math.PI / 2;
  hole.position.set(end.x + 0.55, F + 0.005, end.z + 0.2);
  hole.scale.set(1, 0.9, 1);
  const tri = new THREE.Shape();
  tri.moveTo(-0.4, -0.3);
  tri.lineTo(0.4, -0.3);
  tri.lineTo(0, 0.35);
  tri.closePath();
  const decoMat = T.own(new THREE.MeshBasicMaterial({ color: 0x6f6252, transparent: true, opacity: 0.35 }));
  const triMesh = T.put(T.keep(new THREE.ShapeGeometry(tri)), decoMat, g);
  triMesh.rotation.x = -Math.PI / 2;
  triMesh.position.set(-1.6, F + 0.005, 2.9);
  const sq = T.put(T.keep(new THREE.PlaneGeometry(0.6, 0.6)), decoMat, g);
  sq.rotation.set(-Math.PI / 2, 0, 0.4);
  sq.position.set(2.1, F + 0.005, 3.0);
  const colors = [CLAY.flame, CLAY.sky, CLAY.butter, CLAY.flame, CLAY.sky];
  const balls = colors.map((c, i) => T.put(T.sphere(0.15, 0.04, 90 + i), T.clay(c), g));
  const p = new THREE.Vector3();
  return {
    group: g,
    tick(t, look) {
      cast.forEach((c) => c.tick(t, look));
      balls.forEach((ball, i) => {
        const u = (t * 0.06 + i / balls.length) % 1.08;
        if (u <= 1) {
          track.getPointAt(u, p);
          ball.position.set(p.x, p.y + 0.24, p.z);
          ball.rotation.z = -u * 40;
          ball.scale.setScalar(Math.min(1, u * 20));
          ball.visible = true;
        } else {
          // Off the end of the track and into the hole.
          const k = (u - 1) / 0.08;
          ball.position.set(end.x + 0.55 * k, end.y + 0.24 - (end.y + 0.24 - F + 0.3) * k * k, end.z + 0.2 * k);
          ball.scale.setScalar(1 - Math.max(0, k - 0.7) / 0.3);
          ball.visible = k < 1;
        }
      });
    },
  };
}
