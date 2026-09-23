import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { CLAY, createClayKit, lumpy } from "./kit";
import { isMotionPaused, onMotionChange } from "../motion";
import { THEME_EVENT } from "../theme";

/* The Curiosity Machine.
   Every "what if" is a ball: a bucket elevator lifts it into the funnel, it
   loops through the build tube, gets looked over, rides the pipeline past a
   run of dominoes, and is launched into the world. Then it rolls back
   underground to the elevator and goes round again. Paths are scripted,
   not simulated, so every run is the same and costs almost nothing.
   On arrival the camera flies the whole route before settling. */

export interface MachineController {
  drop: () => void;
  dispose: () => void;
}

export interface MachineOptions {
  onShipped?: (total: number) => void;
  onReady?: () => void;
}

const BALL = 0.22;
const G = -9.8;
const SPAWN_GAP = 1.15;
const AUTO_GAP = 2.6;
const MAX_BALLS = 14;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export function createMachine(
  host: HTMLElement,
  options: MachineOptions = {},
): MachineController | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  const mobile = matchMedia("(max-width: 760px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  host.appendChild(renderer.domElement);

  const kit = createClayKit();
  const clay = kit.clay;
  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0xf3d9c2, 34, 80);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 120);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.6;
  room.dispose();
  pmrem.dispose();

  const hemi = new THREE.HemisphereLight(0xfff3e6, 0x6f8f5a, 0.8);
  const sun = new THREE.DirectionalLight(0xfff0dc, 3.2);
  sun.position.set(-7, 12, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -11;
  sun.shadow.camera.right = 11;
  sun.shadow.camera.top = 9;
  sun.shadow.camera.bottom = -7;
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 40;
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.03;
  const bounce = new THREE.DirectionalLight(0xffc9a8, 0.55);
  bounce.position.set(8, 3, 6);
  scene.add(hemi, sun, sun.target, bounce);

  const geometries: THREE.BufferGeometry[] = [];
  const keep = <T extends THREE.BufferGeometry>(g: T) => {
    geometries.push(g);
    return g;
  };
  const put = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D = scene,
    shadows = true,
  ) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = shadows;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const sphere = (r: number, lump = 0.05, seed = 0, w = 32, h = 22) =>
    keep(lumpy(new THREE.SphereGeometry(r, w, h), r * lump, 1.4 / r, seed));
  const capsule = (r: number, length: number, lump = 0.04, seed = 0) =>
    keep(lumpy(new THREE.CapsuleGeometry(r, length, 8, 20), r * lump, 2 / r, seed));
  const box = (w: number, h: number, d: number, radius: number, seed = 0) =>
    keep(lumpy(new RoundedBoxGeometry(w, h, d, 4, radius), 0.018, 1.6, seed));
  const tube = (curve: THREE.Curve<THREE.Vector3>, r: number, segments = 120, seed = 0) =>
    keep(lumpy(new THREE.TubeGeometry(curve, segments, r, 20, false), r * 0.06, 1.8, seed));
  const torus = (r: number, t: number, arc = Math.PI * 2, seed = 0) =>
    keep(lumpy(new THREE.TorusGeometry(r, t, 18, 72, arc), t * 0.08, 2.2, seed));

  /* ---------------------------------------------------------------- land */
  const groundMat = clay(0x86ad66, { roughness: 0.8, print: 0.25, repeat: 10 });
  const groundGeo = keep(new THREE.PlaneGeometry(150, 130, 150, 110));
  groundGeo.rotateX(-Math.PI / 2);
  {
    const p = groundGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      // Flat where the machine stands, gently rolling everywhere else.
      const calm = clamp01((Math.hypot(x * 0.55, z + 8) - 4) / 8);
      p.setY(i, Math.sin(x * 0.21 + z * 0.13) * 0.35 * calm + Math.cos(z * 0.3 - x * 0.07) * 0.3 * calm - (z < -8 ? (z + 8) * -0.05 : 0));
    }
    groundGeo.computeVertexNormals();
  }
  const ground = put(groundGeo, groundMat, scene, false);
  ground.position.z = -8;

  const hills = new THREE.Group();
  scene.add(hills);
  const hillMats = [
    clay(CLAY.moss, { roughness: 0.85, repeat: 6 }),
    clay(0x86ad72, { roughness: 0.85, repeat: 6 }),
    clay(CLAY.pine, { roughness: 0.85, repeat: 6 }),
    clay(0xb9cf8f, { roughness: 0.85, repeat: 6 }),
  ];
  const hillData: [number, number, number, number, number, number][] = [
    // x, z, radius, squash, stretch x, material
    [-15, -17, 9, 0.42, 1.5, 0],
    [-4, -22, 11, 0.42, 1.7, 1],
    [10, -18, 9.5, 0.45, 1.5, 2],
    [21, -23, 11, 0.4, 1.6, 0],
    [2, -14, 6, 0.3, 2.2, 3],
    [-22, -24, 10, 0.5, 1.4, 2],
  ];
  hillData.forEach(([x, z, r, sy, sx, m], i) => {
    const hill = put(sphere(1, 0.06, i * 3, 48, 24), hillMats[m], hills, false);
    hill.scale.set(r * sx, r * sy, r);
    hill.position.set(x, -r * 0.08, z);
  });

  const leafMats = [clay(CLAY.pine), clay(CLAY.moss), clay(0x5b8a57)];
  const trunkMat = clay(CLAY.cocoa);
  const pineGeos = [0, 1, 2].map((i) => keep(lumpy(new THREE.ConeGeometry(0.9 - i * 0.2, 1.1, 18, 4), 0.04, 2.2, i)));
  const trunkGeo = capsule(0.12, 0.6);
  const blobGeo = sphere(0.8, 0.08, 9);
  const addTree = (x: number, z: number, s: number, kind: number, m: number) => {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.scale.setScalar(s);
    tree.rotation.y = x;
    put(trunkGeo, trunkMat, tree).position.y = 0.35;
    if (kind === 0) {
      pineGeos.forEach((geo, i) => {
        put(geo, leafMats[m], tree).position.y = 1.05 + i * 0.55;
      });
    } else {
      const blob = put(blobGeo, leafMats[m], tree);
      blob.position.y = 1.35;
      blob.scale.set(1, 1.15, 1);
    }
    scene.add(tree);
    return tree;
  };
  [
    [-9.8, -3.5, 1.1, 0, 0],
    [-8.6, -5.2, 0.8, 1, 1],
    [-6.8, -6.5, 1.25, 0, 2],
    [-11.5, -7.5, 1.4, 0, 0],
    [8.3, -4.8, 1.05, 0, 0],
    [10.2, -3.2, 0.8, 1, 2],
    [9.4, -7.5, 1.4, 0, 1],
    [12.4, -6.5, 1.1, 1, 0],
    [-2.6, -8.2, 0.9, 1, 1],
    [3.8, -9.6, 1.2, 0, 2],
    [-14.5, -3, 1.3, 1, 0],
    [14.5, -2.5, 1.2, 0, 2],
  ].forEach(([x, z, s, k, m]) => addTree(x, z, s, k, m));

  // A soft sun (or a moon, after dark) sitting on the hills.
  const sunMat = clay(CLAY.butter, { emissive: CLAY.butter, emissiveIntensity: 0.55, roughness: 0.9 });
  const orb = put(sphere(2.2, 0.03, 4), sunMat, scene, false);
  orb.position.set(5.5, 3.6, -32);

  const cloudMat = clay(0xfffaf2, { roughness: 0.9, sheen: 0.8 });
  const clouds: THREE.Group[] = [];
  [
    [-11, 5.3, -12, 1.1],
    [1, 6.3, -18, 1.4],
    [13, 5.2, -13, 0.9],
  ].forEach(([x, y, z, s], i) => {
    const cloud = new THREE.Group();
    [
      [0, 0, 0, 0.9],
      [0.9, -0.15, 0.1, 0.7],
      [-0.9, -0.2, 0, 0.65],
      [0.35, 0.45, -0.1, 0.62],
      [1.6, -0.3, 0, 0.45],
    ].forEach(([cx, cy, cz, r], j) => {
      const puff = put(sphere(r, 0.05, i * 5 + j), cloudMat, cloud, false);
      puff.position.set(cx, cy, cz);
      puff.scale.y = 0.8;
    });
    cloud.position.set(x, y, z);
    cloud.scale.setScalar(s);
    cloud.userData.speed = 0.12 + i * 0.05;
    clouds.push(cloud);
    scene.add(cloud);
  });

  // Stars and lamp glow only show after dark.
  const starGeo = keep(new THREE.IcosahedronGeometry(0.07, 1));
  const starMat = new THREE.MeshBasicMaterial({ color: 0xfff1c9, fog: false });
  const stars = new THREE.InstancedMesh(starGeo, starMat, 70);
  {
    const m = new THREE.Matrix4();
    for (let i = 0; i < 70; i++) {
      const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const y = (Math.sin(i * 78.233) * 12345.6789) % 1;
      m.makeScale(1 + (i % 3) * 0.4, 1 + (i % 3) * 0.4, 1);
      m.setPosition(x * 34, 6 + Math.abs(y) * 9, -24 - (i % 5));
      stars.setMatrixAt(i, m);
    }
  }
  stars.visible = false;
  scene.add(stars);

  /* ------------------------------------------------------------- machine */
  const machine = new THREE.Group();
  scene.add(machine);

  // Funnel: a closed lathe profile so the rim has real thickness.
  const FX = -5.35;
  const FY = 3.85;
  const funnelProfile = [
    [0.27, -0.05],
    [0.27, 0.45],
    [1.22, 1.6],
    [1.34, 1.72],
    [1.44, 1.62],
    [0.4, 0.4],
    [0.38, -0.05],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const funnelGeo = keep(lumpy(new THREE.LatheGeometry(funnelProfile, 64), 0.025, 1.5, 3));
  const funnel = put(funnelGeo, clay(CLAY.cream, { repeat: 3 }), machine);
  funnel.position.set(FX, FY, 0);
  (funnel.material as THREE.Material).side = THREE.DoubleSide;
  const funnelRim = put(torus(1.39, 0.09, Math.PI * 2, 2), clay(CLAY.flame), machine);
  funnelRim.rotation.x = Math.PI / 2;
  funnelRim.position.set(FX, FY + 1.68, 0);
  const legMat = clay(CLAY.denim);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const top = v3(FX + Math.cos(a) * 0.95, FY + 1.05, Math.sin(a) * 0.95);
    const foot = v3(FX + Math.cos(a) * 1.55, 0.05, Math.sin(a) * 1.55);
    const len = top.distanceTo(foot);
    const leg = put(capsule(0.11, len, 0.04, i), legMat, machine);
    leg.position.copy(top).add(foot).multiplyScalar(0.5);
    leg.quaternion.setFromUnitVectors(v3(0, 1, 0), top.clone().sub(foot).normalize());
    const shoe = put(sphere(0.17, 0.08, i), legMat, machine);
    shoe.position.copy(foot);
    shoe.scale.y = 0.55;
  }
  const collar = put(torus(0.47, 0.1, Math.PI * 2, 5), clay(CLAY.denim), machine);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(FX, FY + 1.05, 0);

  // Build tube: down out of the funnel, one loop, out onto the rails.
  const tubePath = new THREE.CatmullRomCurve3(
    [
      v3(FX, FY + 0.2, 0),
      v3(FX, FY - 0.55, 0),
      v3(FX + 0.35, FY - 1.25, 0.1),
      v3(-4.1, 1.8, 0.3),
      v3(-3.2, 1.62, 0.38),
      v3(-2.45, 2.35, 0.25),
      v3(-3.2, 3.12, 0),
      v3(-3.95, 2.35, -0.25),
      v3(-3.2, 1.62, -0.4),
      v3(-2.35, 1.55, -0.28),
      v3(-1.7, 1.56, -0.05),
      v3(-1.45, 1.55, 0),
    ],
    false,
    "centripetal",
  );
  const tubeMat = clay(CLAY.sky, { repeat: 1 }).clone();
  tubeMat.side = THREE.DoubleSide;
  put(tube(tubePath, 0.28, 200, 1), tubeMat, machine);
  const mouth = put(torus(0.28, 0.08, Math.PI * 2, 7), clay(CLAY.butter), machine);
  mouth.position.set(-1.47, 1.55, 0);
  mouth.rotation.y = Math.PI / 2;
  const clamp = put(box(0.34, 1.9, 0.34, 0.14, 2), clay(CLAY.lilac), machine);
  clamp.position.set(-3.2, 0.72, -0.9);
  const clampArm = put(capsule(0.1, 0.85), clay(CLAY.lilac), machine);
  clampArm.position.set(-3.2, 1.62, -0.55);
  clampArm.rotation.x = Math.PI / 2;

  // Rails, gently downhill, through the review hoop.
  const RAIL_START = v3(-1.4, 1.53, 0);
  const RAIL_END = v3(0.55, 1.22, 0);
  const railMat = clay(CLAY.charcoal, { roughness: 0.5 });
  for (const side of [-0.13, 0.13]) {
    const rail = new THREE.LineCurve3(
      RAIL_START.clone().add(v3(0, -0.15, side)),
      RAIL_END.clone().add(v3(0.12, -0.15, side)),
    );
    put(tube(rail, 0.045, 8, side), railMat, machine);
  }
  for (const x of [-0.95, 0.25]) {
    const y = THREE.MathUtils.mapLinear(x, RAIL_START.x, RAIL_END.x, RAIL_START.y, RAIL_END.y) - 0.18;
    const post = put(capsule(0.06, y), railMat, machine);
    post.position.set(x, y / 2, -0.16);
  }

  // The review hoop: a magnifying glass stuck in the lawn.
  const HOOP_X = -0.45;
  const hoopY = THREE.MathUtils.mapLinear(HOOP_X, RAIL_START.x, RAIL_END.x, RAIL_START.y, RAIL_END.y);
  const hoop = new THREE.Group();
  hoop.position.set(HOOP_X, hoopY, 0);
  hoop.rotation.y = Math.PI / 2 - 0.85;
  const hoopRingMat = clay(CLAY.flame, { emissive: 0x69d27c, emissiveIntensity: 0 }).clone();
  put(torus(0.44, 0.075, Math.PI * 2, 4), hoopRingMat, hoop);
  const handle = put(capsule(0.09, 0.9), clay(CLAY.cocoa), hoop);
  handle.position.set(0.33, -0.8, 0);
  handle.rotation.z = 0.42;
  machine.add(hoop);

  // The pipeline: a belt with rollers, an arch of status lights, and cleats.
  const BELT_X0 = 0.7;
  const BELT_X1 = 3.65;
  const BELT_TOP = 0.96;
  const beltLen = BELT_X1 - BELT_X0;
  const beltCenter = (BELT_X0 + BELT_X1) / 2;
  const belt = put(box(beltLen + 0.2, 0.24, 0.72, 0.11, 6), clay(CLAY.charcoal, { roughness: 0.7 }), machine);
  belt.position.set(beltCenter, BELT_TOP - 0.12, 0);
  const frameMat = clay(CLAY.tangerine);
  const beltFrame = put(box(beltLen + 0.45, 0.2, 0.86, 0.09, 7), frameMat, machine);
  beltFrame.position.set(beltCenter, BELT_TOP - 0.34, 0);
  const rollerGeo = keep(lumpy(new THREE.CylinderGeometry(0.15, 0.15, 0.95, 24), 0.008, 3));
  rollerGeo.rotateX(Math.PI / 2);
  const rollers: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const roller = put(rollerGeo, clay(CLAY.butter), machine);
    roller.position.set(BELT_X0 + 0.05 + (i / 5) * (beltLen - 0.1), BELT_TOP - 0.34, 0);
    rollers.push(roller);
  }
  for (const x of [BELT_X0 + 0.35, BELT_X1 - 0.35]) {
    for (const z of [-0.3, 0.3]) {
      const leg = put(capsule(0.08, 0.5), frameMat, machine);
      leg.position.set(x, 0.3, z);
    }
  }
  const cleatGeo = box(0.12, 0.06, 0.6, 0.03, 8);
  const cleatMat = clay(0x4a4540);
  const cleats: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const cleat = put(cleatGeo, cleatMat, machine, false);
    cleat.position.y = BELT_TOP + 0.01;
    cleats.push(cleat);
  }
  const ARCH_X = 2.2;
  const arch = put(torus(0.72, 0.09, Math.PI, 9), clay(CLAY.lilac), machine);
  arch.position.set(ARCH_X, BELT_TOP - 0.1, -0.42);
  const lampColors = [0xff5f57, 0xfebc2e, 0x28c840];
  const lamps = lampColors.map((color, i) => {
    const mat = clay(color, { emissive: color, emissiveIntensity: 0 }).clone();
    const lamp = put(sphere(0.1, 0.05, i), mat, machine);
    const a = Math.PI * (0.72 - i * 0.22);
    lamp.position.set(ARCH_X + Math.cos(a) * 0.72, BELT_TOP - 0.1 + Math.sin(a) * 0.72, -0.28);
    return mat;
  });

  // The launcher: a wooden-block catapult with a spoon.
  const PIVOT = v3(4.95, 0.62, 0);
  const ARM = 1.02;
  const REST = Math.PI - 0.1;
  const THROWN = Math.PI / 2 + 0.28;
  const base = put(box(1.1, 0.34, 0.9, 0.12, 10), clay(CLAY.blush), machine);
  base.position.set(PIVOT.x, 0.17, 0);
  for (const z of [-0.32, 0.32]) {
    const post = put(box(0.2, 0.5, 0.14, 0.06, 11), clay(CLAY.blush), machine);
    post.position.set(PIVOT.x, 0.5, z);
  }
  const axle = put(capsule(0.06, 0.62), clay(CLAY.charcoal), machine);
  axle.rotation.x = Math.PI / 2;
  axle.position.copy(PIVOT);
  const arm = new THREE.Group();
  arm.position.copy(PIVOT);
  const armBar = put(box(ARM + 0.12, 0.13, 0.16, 0.06, 12), clay(CLAY.butter), arm);
  armBar.position.x = ARM / 2;
  const spoon = put(
    keep(lumpy(new THREE.SphereGeometry(0.25, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0.01, 3)),
    clay(CLAY.butter).clone(),
    arm,
  );
  (spoon.material as THREE.Material).side = THREE.DoubleSide;
  spoon.position.set(ARM, 0.02, 0);
  spoon.rotation.z = Math.PI;
  spoon.scale.y = 0.75;
  machine.add(arm);

  // The goal: a hole in one, with a flag that cheers.
  const HOLE = v3(7.05, 0, 0.55);
  const hole = put(keep(new THREE.CircleGeometry(0.36, 40)), clay(0x2d2520, { roughness: 1 }), machine, false);
  hole.rotation.x = -Math.PI / 2;
  hole.position.set(HOLE.x, 0.03, HOLE.z);
  const lip = put(torus(0.38, 0.06, Math.PI * 2, 13), clay(0x86ad72), machine);
  lip.rotation.x = Math.PI / 2;
  lip.position.set(HOLE.x, 0.04, HOLE.z);
  const pole = put(capsule(0.045, 2.1), clay(CLAY.cream), machine);
  pole.position.set(HOLE.x + 0.3, 1.05, HOLE.z - 0.2);
  const flagShape = new THREE.Shape();
  flagShape.moveTo(0, 0);
  flagShape.lineTo(0.95, -0.3);
  flagShape.lineTo(0, -0.62);
  flagShape.closePath();
  const flagGeo = keep(
    new THREE.ExtrudeGeometry(flagShape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 4,
      curveSegments: 4,
    }),
  );
  const flag = new THREE.Group();
  flag.position.set(HOLE.x + 0.3, 2.05, HOLE.z - 0.2);
  put(flagGeo, clay(CLAY.flame), flag);
  machine.add(flag);

  // Set dressing: a coffee mug and a tiny blinking server.
  const mug = new THREE.Group();
  mug.position.set(9.0, 0, -0.7);
  mug.rotation.y = -0.6;
  put(keep(lumpy(new THREE.CylinderGeometry(0.55, 0.5, 1.15, 32, 4), 0.02, 2)), clay(CLAY.cream), mug).position.y = 0.58;
  const coffee = put(keep(new THREE.CircleGeometry(0.47, 32)), clay(CLAY.cocoa, { roughness: 0.4 }), mug, false);
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 1.08;
  const mugHandle = put(torus(0.28, 0.08, Math.PI * 1.2, 3), clay(CLAY.cream), mug);
  mugHandle.position.set(0.55, 0.6, 0);
  mugHandle.rotation.z = -Math.PI * 0.6;
  const band = put(torus(0.535, 0.05, Math.PI * 2, 4), clay(CLAY.flame), mug);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.5;
  const steamMat = clay(0xffffff, { roughness: 1, sheen: 1 }).clone();
  steamMat.transparent = true;
  steamMat.opacity = 0.8;
  const steam = [0, 1, 2].map((i) => {
    const puff = put(sphere(0.13, 0.1, i), steamMat, mug, false);
    puff.userData.offset = i / 3;
    return puff;
  });
  scene.add(mug);

  const server = new THREE.Group();
  server.position.set(1.7, 0, -1.8);
  server.rotation.y = -0.25;
  put(box(0.95, 1.5, 0.8, 0.14, 14), clay(CLAY.charcoal, { roughness: 0.6 }), server).position.y = 0.75;
  const leds: THREE.MeshPhysicalMaterial[] = [];
  for (let row = 0; row < 3; row++) {
    const slot = put(box(0.72, 0.26, 0.1, 0.05, 15 + row), clay(0x46423d), server);
    slot.position.set(0, 0.42 + row * 0.38, 0.38);
    const mat = clay(0x6dd88a, { emissive: 0x6dd88a, emissiveIntensity: 1 }).clone();
    const led = put(sphere(0.045, 0.02, row), mat, server, false);
    led.position.set(0.24, 0.42 + row * 0.38, 0.45);
    leds.push(mat);
  }
  scene.add(server);

  // Lamp posts light the machine at night.
  const lampPostMat = clay(CLAY.charcoal);
  const bulbMat = clay(0xffe2a8, { emissive: 0xffc46b, emissiveIntensity: 0.2 }).clone();
  const lampLights = [v3(-10.2, 0, -3.6), v3(4.1, 0, -2.7)].map((p) => {
    const post = put(capsule(0.06, 2.4), lampPostMat, scene);
    post.position.set(p.x, 1.2, p.z);
    const bulb = put(sphere(0.2, 0.04, 2), bulbMat, scene, false);
    bulb.position.set(p.x, 2.55, p.z);
    const light = new THREE.PointLight(0xffb36b, 0, 9, 1.6);
    light.position.set(p.x, 2.5, p.z + 0.2);
    scene.add(light);
    return light;
  });

  /* ----------------------------------------------------- bucket elevator */
  // A belt of cups on two pulleys. Balls come up out of the return pipe,
  // ride a cup up the left side, and tip into the funnel over the top.
  const EL_CX = -7.6;
  const EL_R = 0.42;
  const EL_YB = 0.75;
  const EL_YT = 5.6;
  const EL_Z = -0.25;
  const EL_SIDE = EL_YT - EL_YB;
  const EL_LEN = 2 * EL_SIDE + 2 * Math.PI * EL_R;
  const CUPS = 10;
  const CUP_GAP = EL_LEN / CUPS;
  const CUP_PERIOD = 0.87;
  const BELT_SPEED = CUP_GAP / CUP_PERIOD;
  const CUP_OUT = 0.24;
  const EMERGE = 0.5;
  const beltPoint = (dist: number) => {
    const s0 = ((dist % EL_LEN) + EL_LEN) % EL_LEN;
    const arc = Math.PI * EL_R;
    if (s0 < EL_SIDE) return { x: EL_CX - EL_R, y: EL_YB + s0, phi: Math.PI };
    if (s0 < EL_SIDE + arc) {
      const th = Math.PI - (s0 - EL_SIDE) / EL_R;
      return { x: EL_CX + Math.cos(th) * EL_R, y: EL_YT + Math.sin(th) * EL_R, phi: th };
    }
    if (s0 < 2 * EL_SIDE + arc) return { x: EL_CX + EL_R, y: EL_YT - (s0 - EL_SIDE - arc), phi: 0 };
    const th = -(s0 - 2 * EL_SIDE - arc) / EL_R;
    return { x: EL_CX + Math.cos(th) * EL_R, y: EL_YB + Math.sin(th) * EL_R, phi: th };
  };
  class BeltPath extends THREE.Curve<THREE.Vector3> {
    constructor() {
      super();
    }
    getPoint(u: number, out = new THREE.Vector3()) {
      const b = beltPoint(u * EL_LEN);
      return out.set(b.x, b.y, EL_Z);
    }
  }
  const elevator = new THREE.Group();
  scene.add(elevator);
  const pulleyGeo = keep(lumpy(new THREE.CylinderGeometry(EL_R - 0.04, EL_R - 0.04, 0.22, 32), 0.01, 2));
  pulleyGeo.rotateX(Math.PI / 2);
  const pulleys = [EL_YB, EL_YT].map((y) => {
    const pulley = put(pulleyGeo, clay(CLAY.denim), elevator);
    pulley.position.set(EL_CX, y, EL_Z - 0.02);
    const hub = put(sphere(0.12, 0.05, 3), clay(CLAY.butter), pulley);
    hub.position.y = 0.12;
    return pulley;
  });
  put(keep(new THREE.TubeGeometry(new BeltPath(), 160, 0.05, 8, true)), clay(CLAY.charcoal, { roughness: 0.6 }), elevator);
  for (const x of [-0.18, 0.18]) {
    const post = put(capsule(0.08, EL_YT + 0.2), clay(CLAY.lilac), elevator);
    post.position.set(EL_CX + x, (EL_YT + 0.2) / 2, EL_Z - 0.34);
  }
  const brace = put(box(0.62, 0.16, 0.16, 0.06, 20), clay(CLAY.lilac), elevator);
  brace.position.set(EL_CX, EL_YT, EL_Z - 0.3);
  const cupGeo = keep(lumpy(new THREE.SphereGeometry(0.21, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0.008, 3, 21));
  const cupMat = clay(CLAY.tangerine).clone();
  cupMat.side = THREE.DoubleSide;
  const cups = Array.from({ length: CUPS }, () => put(cupGeo, cupMat, elevator));
  const BX = EL_CX - EL_R - CUP_OUT;
  const pipeMat = clay(CLAY.sky).clone();
  pipeMat.side = THREE.DoubleSide;
  const pipe = put(keep(lumpy(new THREE.CylinderGeometry(0.27, 0.3, 0.5, 24, 1, true), 0.01, 2, 22)), pipeMat, scene);
  pipe.position.set(BX, 0.05, EL_Z);
  const pipeLip = put(torus(0.28, 0.07, Math.PI * 2, 23), clay(CLAY.butter), scene);
  pipeLip.rotation.x = Math.PI / 2;
  pipeLip.position.set(BX, 0.3, EL_Z);
  // A hump in the lawn traces the return pipe back from the hole.
  const returnPath = new THREE.CatmullRomCurve3([
    v3(HOLE.x, -0.18, HOLE.z),
    v3(4.5, -0.12, 2.3),
    v3(-1.5, -0.12, 2.6),
    v3(-6.2, -0.12, 1.6),
    v3(BX, -0.18, EL_Z),
  ]);
  const returnPipe = put(tube(returnPath, 0.2, 120, 24), groundMat, scene, false);
  returnPipe.scale.y = 0.55;

  /* --------------------------------------------------------- gear train */
  const gearGeo = (radius: number, teeth: number) => {
    const shape = new THREE.Shape();
    const root = radius - 0.13;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const w = (Math.PI * 2) / teeth;
      const pts: [number, number][] = [
        [root, a],
        [radius, a + w * 0.18],
        [radius, a + w * 0.45],
        [root, a + w * 0.62],
      ];
      pts.forEach(([r, ang], k) => {
        const x = Math.cos(ang) * r;
        const y = Math.sin(ang) * r;
        if (i === 0 && k === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      });
    }
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, radius * 0.22, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const g = keep(new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 3, curveSegments: 6 }));
    g.center();
    return g;
  };
  const board = put(box(3.9, 2.35, 0.14, 0.12, 25), clay(CLAY.cream), scene);
  board.position.set(-3.2, 2.75, -1.62);
  for (const x of [-1.6, 1.6]) {
    const leg = put(capsule(0.07, 1.6), clay(CLAY.cream), scene);
    leg.position.set(-3.2 + x, 0.8, -1.64);
  }
  const gears = (
    [
      [0.8, 12, -3.2, 2.45, CLAY.butter],
      [0.5, 8, -2.02, 3.12, CLAY.flame],
      [0.56, 9, -4.34, 3.05, CLAY.lilac],
    ] as const
  ).map(([r, n, x, y, c]) => {
    const gear = put(gearGeo(r, n), clay(c), scene);
    gear.position.set(x, y, -1.46);
    gear.userData.ratio = 12 / n;
    const pin = put(sphere(0.09, 0.05, 26), clay(CLAY.charcoal), gear);
    pin.position.z = 0.1;
    return gear;
  });

  /* ------------------------------------------------------------ dominoes */
  // They topple in time with each ball riding the pipeline, then stand back up.
  const DOM_X0 = 0.95;
  const DOM_GAP = 0.32;
  const dominoGeo = box(0.12, 0.56, 0.34, 0.04, 27);
  const dominoLine = box(0.125, 0.03, 0.26, 0.01, 28);
  const dominoes = Array.from({ length: 8 }, (_, i) => {
    const pivot = new THREE.Group();
    pivot.position.set(DOM_X0 + i * DOM_GAP + 0.06, 0, 1.25);
    const body = put(dominoGeo, clay(i % 2 ? CLAY.cream : CLAY.oat), pivot);
    body.position.set(-0.06, 0.28, 0);
    const line = put(dominoLine, clay(CLAY.charcoal), pivot);
    line.position.set(-0.06, 0.28, 0);
    pivot.userData = { t: -1, lean: i === 7 ? -1.45 : -Math.asin(DOM_GAP / 0.58) };
    scene.add(pivot);
    return pivot;
  });

  /* ----------------------------------------------------------- far away */
  const windmill = new THREE.Group();
  windmill.position.set(10.8, 0.25, -8.5);
  put(keep(lumpy(new THREE.CylinderGeometry(0.3, 0.55, 2.6, 16, 2), 0.02, 2, 29)), clay(CLAY.cream), windmill).position.y = 1.3;
  put(keep(lumpy(new THREE.ConeGeometry(0.46, 0.62, 16), 0.01, 2, 30)), clay(CLAY.flame), windmill).position.y = 2.9;
  const blades = new THREE.Group();
  blades.position.set(0, 2.55, 0.55);
  put(sphere(0.14, 0.04, 31), clay(CLAY.charcoal), blades);
  for (let i = 0; i < 4; i++) {
    const blade = put(box(0.24, 1.4, 0.05, 0.04, 32 + i), clay(0xfff4e6), blades);
    blade.geometry.translate(0, 0.78, 0);
    blade.rotation.z = (i * Math.PI) / 2;
  }
  windmill.add(blades);
  windmill.scale.setScalar(1.1);
  scene.add(windmill);
  const balloon = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const gore = keep(lumpy(new THREE.SphereGeometry(1, 8, 20, (i / 8) * Math.PI * 2, Math.PI / 4), 0.01, 2, 40 + i));
    put(gore, clay(i % 2 ? CLAY.cream : CLAY.flame), balloon, false).scale.y = 1.18;
  }
  put(box(0.5, 0.4, 0.5, 0.08, 50), clay(CLAY.cocoa), balloon, false).position.y = -1.85;
  balloon.scale.setScalar(0.8);
  balloon.position.set(-11, 4.6, -21);
  scene.add(balloon);

  /* --------------------------------------------------------------- balls */
  const ballGeo = sphere(BALL, 0.04, 1, 28, 20);
  const ballPalette = [CLAY.flame, CLAY.butter, CLAY.sky, CLAY.lilac, CLAY.blush, CLAY.tangerine, CLAY.cream];
  const ballMats = ballPalette.map((c) => clay(c, { repeat: 1, print: 0.5 }));

  type Ball = { mesh: THREE.Mesh; age: number; last: THREE.Vector3 };
  const balls: Ball[] = [];
  const pool: THREE.Mesh[] = [];
  let colorIndex = 0;

  // Segment timeline for one ball. Each writes the ball's centre into `out`.
  type Segment = { d: number; at: (t: number, out: THREE.Vector3) => void; hidden?: boolean };
  const funnelInner = (r: number) => FY + 0.45 + ((r - 0.27) / 0.95) * 1.15;
  const spin0 = Math.PI;
  const spiralTurns = 2.25;
  const spiralR = (t: number) => THREE.MathUtils.lerp(1.02, 0.02, t ** 0.85);
  const spiralAt = (t: number, out: THREE.Vector3) => {
    const r = spiralR(t);
    const a = spin0 + spiralTurns * Math.PI * 2 * t ** 1.35;
    return out.set(FX + Math.cos(a) * r, funnelInner(Math.max(r, 0.27)) + BALL * 0.9 - (r < 0.27 ? (0.27 - r) * 3 : 0), Math.sin(a) * r);
  };
  const railAt = (t: number, out: THREE.Vector3) => out.lerpVectors(RAIL_START, RAIL_END, t * t * 0.45 + t * 0.55);
  const beltY = BELT_TOP + BALL;
  const armPoint = (a: number, out: THREE.Vector3) =>
    out.set(PIVOT.x + Math.cos(a) * (ARM - 0.02) + Math.sin(a) * (BALL + 0.02), PIVOT.y + Math.sin(a) * (ARM - 0.02) - Math.cos(a) * (BALL + 0.02), 0);
  const spoonRest = armPoint(REST, v3(0, 0, 0));
  const release = armPoint(THROWN, v3(0, 0, 0));
  const hop = (a: THREE.Vector3, b: THREE.Vector3, T: number) => {
    const v = b.clone().sub(a).sub(v3(0, 0.5 * G * T * T, 0)).divideScalar(T);
    return (t: number, out: THREE.Vector3) => {
      const s = t * T;
      out.copy(a).addScaledVector(v, s);
      out.y += 0.5 * G * s * s;
    };
  };
  const liftBottom = v3(BX, EL_YB + 0.1, EL_Z);
  // A ball rides inside its cup, over the top pulley, and is tipped out once
  // the cup has turned past the top, dropping into the near rim of the funnel.
  const TIP = Math.PI / 2 - 0.25;
  const LIFT_DIST = EL_SIDE + EL_R * (Math.PI - TIP);
  const inCup = (dist: number, out: THREE.Vector3) => {
    const b = beltPoint(dist);
    const tilt = b.phi - Math.PI;
    return out.set(
      b.x + Math.cos(b.phi) * CUP_OUT - Math.sin(tilt) * 0.07,
      b.y + Math.sin(b.phi) * CUP_OUT - 0.02 + Math.cos(tilt) * 0.07,
      EL_Z,
    );
  };
  const tipOut = inCup(LIFT_DIST, v3(0, 0, 0));
  const spiralStart = spiralAt(0, v3(0, 0, 0));
  const beltStart = v3(BELT_X0 + 0.3, beltY, 0);
  const beltEnd = v3(BELT_X1 - 0.05, beltY, 0);
  const holeIn = v3(HOLE.x, BALL * 0.6, HOLE.z);
  const segments: Segment[] = [
    { d: EMERGE, at: (t, out) => out.set(BX, THREE.MathUtils.lerp(-0.4, liftBottom.y, 1 - (1 - t) ** 2), EL_Z) },
    { d: LIFT_DIST / BELT_SPEED, at: (t, out) => inCup(t * LIFT_DIST, out) },
    { d: 0.42, at: hop(tipOut, spiralStart, 0.42) },
    { d: 2.3, at: spiralAt },
    { d: 1.75, at: (t, out) => out.copy(tubePath.getPointAt(Math.min(0.999, t))), hidden: true },
    { d: 1.2, at: railAt },
    { d: 0.3, at: hop(RAIL_END, beltStart, 0.3) },
    { d: (beltEnd.x - beltStart.x) / 1.35, at: (t, out) => out.lerpVectors(beltStart, beltEnd, t) },
    { d: 0.34, at: hop(beltEnd, spoonRest, 0.34) },
    { d: 0.32, at: (_t, out) => armPoint(armAngle(), out) },
    { d: 0.17, at: (_t, out) => armPoint(armAngle(), out) },
    { d: 0.95, at: hop(release, holeIn, 0.95) },
    { d: 0.35, at: (t, out) => out.set(HOLE.x, BALL * 0.6 - t * 0.6, HOLE.z) },
  ];
  const starts: number[] = [];
  let total = 0;
  for (const s of segments) {
    starts.push(total);
    total += s.d;
  }
  const S = { lift: 1, belt: 7, settle: 9, fling: 10, flight: 11, sink: 12 };
  const locate = (age: number) => {
    let i = segments.length - 1;
    while (i > 0 && age < starts[i]) i--;
    return { i, t: clamp01((age - starts[i]) / segments[i].d) };
  };

  // The catapult arm follows whichever ball is currently using it.
  let armBall: number | null = null;
  const armAngleFor = (age: number) => {
    const { i, t } = locate(age);
    if (i === S.settle) return REST + Math.sin(t * Math.PI) * 0.07;
    if (i === S.fling) return THREE.MathUtils.lerp(REST, THROWN, t * t);
    if (i === S.flight || i === S.sink) {
      const back = clamp01((age - starts[S.flight]) / 0.9);
      return THREE.MathUtils.lerp(THROWN, REST, easeInOut(back));
    }
    return REST;
  };
  const armAngle = () => (armBall === null ? REST : armAngleFor(armBall));

  let shipped = 0;
  let queued = 0;
  let sinceSpawn = SPAWN_GAP;
  let sinceAuto = AUTO_GAP - 0.6;
  let flagWave = 0;
  let lastSlot = 0;
  const spawn = (age = 0) => {
    const mesh = pool.pop() ?? put(ballGeo, ballMats[0], scene);
    mesh.material = ballMats[colorIndex++ % ballMats.length];
    mesh.visible = true;
    mesh.rotation.set(Math.random() * 3, Math.random() * 3, 0);
    balls.push({ mesh, age, last: v3(0, 0, 0) });
    place(balls[balls.length - 1], 0);
  };
  const place = (ball: Ball, dt: number) => {
    const { i, t } = locate(ball.age);
    ball.last.copy(ball.mesh.position);
    segments[i].at(t, ball.mesh.position);
    ball.mesh.visible = !segments[i].hidden || t < 0.05 || t > 0.93;
    ball.mesh.scale.setScalar(i === S.sink ? 1 - t * 0.5 : 1);
    if (dt > 0 && i !== S.belt && i !== S.lift) {
      const moved = ball.mesh.position.distanceTo(ball.last);
      ball.mesh.rotation.z -= moved / BALL;
    }
  };

  /* ----------------------------------------------------------- the frame */
  let width = 1;
  let height = 1;
  let pointerX = 0;
  let pointerY = 0;
  let smoothX = 0;
  let smoothY = 0;
  let scrollShift = 0;
  let clock = 0;
  let visible = true;
  let paused = isMotionPaused();
  let disposed = false;
  let frame = 0;
  let last = 0;
  let readySent = false;

  // The opening flight: funnel, elevator and loop, down the pipeline, past
  // the catapult, then back out to the wide shot. The last key is the live
  // camera, filled in every frame.
  const INTRO = 6.4;
  let intro = paused ? 1 : 0;
  let introSpeed = 1;
  const shotPos = [v3(-4.2, 10.2, 7.6), v3(-9.8, 5.0, 9.6), v3(-3.0, 2.7, 8.6), v3(3.4, 2.3, 8.2), v3(0, 0, 0)];
  const shotLook = [v3(-5.8, 4.6, 0), v3(-5.0, 2.8, 0), v3(-0.4, 1.4, 0), v3(4.6, 0.9, 0.3), v3(0, 0, 0)];
  const shotPosCurve = new THREE.CatmullRomCurve3(shotPos, false, "centripetal");
  const shotLookCurve = new THREE.CatmullRomCurve3(shotLook, false, "centripetal");
  const hurry = () => {
    if (intro < 1) introSpeed = 4.5;
  };
  const frameCamera = () => {
    const aspect = width / height;
    // Fit the machine's width, then slide the picture up so the copy has
    // open lawn to sit on. Tall screens get a wider lens instead of distance.
    const portrait = aspect < 0.9;
    camera.aspect = aspect;
    camera.fov = portrait ? 40 : 26;
    const fitWidth = portrait ? 16.8 : aspect < 1.3 ? 18.4 : 19.5;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const distance = Math.max(fitWidth / 2 / Math.tan(hfov / 2), 9.5 / 2 / Math.tan(vfov / 2));
    const focus = v3((portrait ? -0.35 : 0.4) + smoothX * 0.3, 2.35, 0);
    camera.position.set(
      focus.x + smoothX * 1.6,
      focus.y + distance * (portrait ? 0.16 : 0.11) - smoothY * 0.6 + scrollShift * 2.5,
      distance + scrollShift * 2,
    );
    const look = v3(focus.x, focus.y - scrollShift * 1.2, 0);
    if (intro < 1) {
      shotPos[4].copy(camera.position);
      shotLook[4].copy(look);
      const u = -(Math.cos(Math.PI * intro) - 1) / 2;
      shotPosCurve.getPoint(u, camera.position);
      shotLookCurve.getPoint(u, look);
      // Tall screens see a narrow slice, so each shot stands further back.
      if (portrait) {
        const back = THREE.MathUtils.lerp(2, 1, clamp01((u - 0.75) / 0.25));
        camera.position.sub(look).multiplyScalar(back).add(look);
      }
      const settle = clamp01((u - 0.7) / 0.3);
      camera.fov = THREE.MathUtils.lerp(36, camera.fov, settle * settle * (3 - 2 * settle));
    }
    camera.lookAt(look);
    camera.setViewOffset(width, height, 0, height * (portrait ? 0.24 : 0.1), width, height);
    camera.updateProjectionMatrix();
    fog.near = distance + 8;
    fog.far = distance + 55;
  };

  const update = (dt: number) => {
    clock += dt;
    if (intro < 1) intro = Math.min(1, intro + (dt * introSpeed) / INTRO);
    sinceSpawn += dt;
    sinceAuto += dt;
    const slot = Math.floor((clock + EMERGE) / CUP_PERIOD);
    if (slot > lastSlot) {
      lastSlot = slot;
      if (sinceSpawn >= SPAWN_GAP && balls.length < MAX_BALLS && (queued > 0 || sinceAuto >= AUTO_GAP - 0.05)) {
        if (queued > 0) queued--;
        sinceAuto = 0;
        sinceSpawn = 0;
        spawn(clock + EMERGE - slot * CUP_PERIOD);
      }
    }
    armBall = null;
    for (let i = balls.length - 1; i >= 0; i--) {
      const ball = balls[i];
      ball.age += dt;
      if (ball.age >= total) {
        ball.mesh.visible = false;
        pool.push(ball.mesh);
        balls.splice(i, 1);
        shipped++;
        flagWave = 1;
        options.onShipped?.(shipped);
        continue;
      }
      const { i: seg } = locate(ball.age);
      if (seg >= S.settle && seg <= S.sink && (armBall === null || ball.age < armBall)) armBall = ball.age;
    }
    balls.forEach((ball) => place(ball, dt));
    arm.rotation.z = armAngle();

    rollers.forEach((roller) => (roller.rotation.z = -clock * 7));
    cleats.forEach((cleat, i) => {
      const u = (clock * 1.35 + (i / cleats.length) * beltLen) % beltLen;
      cleat.position.x = BELT_X0 + u;
      const edge = Math.min(u, beltLen - u);
      cleat.scale.setScalar(clamp01(edge / 0.15));
    });
    // Review hoop and status lamps react to balls passing through.
    let hoopGlow = 0;
    const lampGlow = [0, 0, 0];
    for (const ball of balls) {
      const p = ball.mesh.position;
      hoopGlow = Math.max(hoopGlow, 1 - Math.abs(p.x - HOOP_X) / 0.35);
      if (Math.abs(p.y - beltY) < 0.02) {
        const k = (p.x - (ARCH_X - 0.7)) / 1.4;
        for (let j = 0; j < 3; j++) lampGlow[j] = Math.max(lampGlow[j], 1 - Math.abs(k - j * 0.5) * 3);
      }
    }
    hoopRingMat.emissiveIntensity = Math.max(0, hoopGlow) * 0.9;
    hoop.scale.setScalar(1 + Math.max(0, hoopGlow) * 0.06);
    lamps.forEach((mat, j) => (mat.emissiveIntensity = 0.15 + Math.max(0, lampGlow[j]) * 1.6));
    flagWave = Math.max(0, flagWave - dt * 0.9);
    flag.rotation.y = Math.sin(clock * 3) * 0.12 + Math.sin(clock * 16) * flagWave * 0.35;
    flag.scale.y = 1 + flagWave * 0.12;
    leds.forEach((mat, j) => (mat.emissiveIntensity = Math.sin(clock * (3 + j * 1.7) + j) > -0.2 ? 1.1 : 0.1));
    steam.forEach((puff) => {
      const k = (clock * 0.35 + puff.userData.offset) % 1;
      puff.position.set(Math.sin(k * 6 + puff.userData.offset * 9) * 0.12, 1.25 + k * 1.1, 0);
      puff.scale.setScalar(Math.sin(k * Math.PI) * 1.2 + 0.05);
    });
    clouds.forEach((cloud) => {
      cloud.position.x += cloud.userData.speed * dt;
      if (cloud.position.x > 24) cloud.position.x = -24;
    });
    const flap = Math.sin(clock * 1.3) * 0.02;
    orb.position.y = 3.6 + flap * 4;

    cups.forEach((cup, k) => {
      const b = beltPoint(BELT_SPEED * clock + k * CUP_GAP);
      cup.position.set(b.x + Math.cos(b.phi) * CUP_OUT, b.y + Math.sin(b.phi) * CUP_OUT - 0.02, EL_Z);
      cup.rotation.z = b.phi - Math.PI;
    });
    pulleys.forEach((pulley) => (pulley.rotation.z = -(BELT_SPEED * clock) / EL_R));
    const turn = clock * 0.9;
    gears.forEach((gear, k) => (gear.rotation.z = k === 0 ? turn : -turn * gear.userData.ratio + k * 0.2));
    blades.rotation.z = -clock * 1.1;
    balloon.position.x = -14 + ((clock * 0.12) % 40);
    balloon.position.y = 4.6 + Math.sin(clock * 0.5) * 0.25;
    for (const ball of balls) {
      if (locate(ball.age).i !== S.belt) continue;
      const bx = ball.mesh.position.x;
      dominoes.forEach((d, k) => {
        if (d.userData.t < 0 && bx >= DOM_X0 + k * DOM_GAP) d.userData.t = 0;
      });
    }
    dominoes.forEach((d) => {
      const u = d.userData;
      if (u.t < 0) return;
      u.t += dt;
      const e = (x: number) => x * x * (3 - 2 * x);
      d.rotation.z =
        u.t < 0.22 ? u.lean * e(u.t / 0.22) : u.t < 1.6 ? u.lean : u.t < 1.95 ? u.lean * (1 - e((u.t - 1.6) / 0.35)) : 0;
      if (u.t >= 1.95) u.t = -1;
    });
  };

  const render = () => {
    if (disposed) return;
    smoothX += (pointerX - smoothX) * 0.06;
    smoothY += (pointerY - smoothY) * 0.06;
    frameCamera();
    renderer.render(scene, camera);
    if (!readySent) {
      readySent = true;
      options.onReady?.();
    }
  };

  const loop = (now: number) => {
    frame = 0;
    const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 0;
    last = now;
    if (!paused) update(dt);
    render();
    schedule();
  };
  const schedule = () => {
    if (frame || disposed || !visible || document.hidden) return;
    // Keep drawing while paused only if the pointer is still easing the camera.
    const settling = Math.abs(pointerX - smoothX) + Math.abs(pointerY - smoothY) > 0.002;
    if (paused && !settling) {
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

  // Seed the machine mid-run so the first frame already tells the story.
  [3, 6, 9, 12, 15].map((m) => EMERGE + m * CUP_PERIOD).filter((age) => age < total).forEach((age) => spawn(age));
  balls.forEach((ball) => place(ball, 0));
  update(0);

  const resize = () => {
    width = host.clientWidth || 1;
    height = host.clientHeight || 1;
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    kick();
  };
  const theme = () => {
    const dark = document.documentElement.classList.contains("dark");
    fog.color.set(dark ? 0x1d2433 : 0xf3d9c2);
    hemi.color.set(dark ? 0x8190c4 : 0xfff3e6);
    hemi.groundColor.set(dark ? 0x1f2a24 : 0x6f8f5a);
    hemi.intensity = dark ? 0.7 : 0.8;
    sun.color.set(dark ? 0xb9c8ff : 0xfff0dc);
    sun.intensity = dark ? 0.75 : 3.2;
    bounce.intensity = dark ? 0.15 : 0.55;
    scene.environmentIntensity = dark ? 0.22 : 0.6;
    sunMat.color.set(dark ? 0xf1ead8 : CLAY.butter);
    sunMat.emissive.set(dark ? 0xd9dcf0 : CLAY.butter);
    sunMat.emissiveIntensity = dark ? 0.35 : 0.55;
    orb.scale.setScalar(dark ? 0.7 : 1);
    stars.visible = dark;
    cloudMat.color.set(dark ? 0x9aa3bd : 0xfffaf2);
    bulbMat.emissiveIntensity = dark ? 2.2 : 0.2;
    lampLights.forEach((light) => (light.intensity = dark ? 7 : 0));
    renderer.toneMappingExposure = dark ? 1.15 : 1;
    kick();
  };
  const onPointer = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    if (paused) kick();
  };
  const onScroll = () => {
    const rect = host.getBoundingClientRect();
    scrollShift = clamp01(-rect.top / Math.max(1, rect.height));
    if (scrollShift > 0.01) hurry();
    if (paused) kick();
  };
  const onVisibility = () => kick();
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) kick();
  });
  observer.observe(host);
  const resizer = new ResizeObserver(resize);
  resizer.observe(host);
  const stopMotion = onMotionChange((value) => {
    paused = value;
    if (paused) intro = 1;
    kick();
  });
  const onLost = (event: Event) => {
    event.preventDefault();
    disposed = true;
    cancelAnimationFrame(frame);
  };
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  for (const type of ["wheel", "pointerdown", "keydown", "touchstart"]) window.addEventListener(type, hurry, { passive: true });
  window.addEventListener(THEME_EVENT, theme);
  document.addEventListener("visibilitychange", onVisibility);
  renderer.domElement.addEventListener("webglcontextlost", onLost);
  theme();
  resize();
  onScroll();

  return {
    drop() {
      if (paused) return;
      queued = Math.min(queued + 1, 6);
      if (sinceSpawn >= SPAWN_GAP) sinceAuto = AUTO_GAP;
      kick();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizer.disconnect();
      stopMotion();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      for (const type of ["wheel", "pointerdown", "keydown", "touchstart"]) window.removeEventListener(type, hurry);
      window.removeEventListener(THEME_EVENT, theme);
      document.removeEventListener("visibilitychange", onVisibility);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      geometries.forEach((g) => g.dispose());
      [tubeMat, hoopRingMat, steamMat, bulbMat, starMat, cupMat, pipeMat, spoon.material as THREE.Material, ...lamps, ...leds].forEach((m) => m.dispose());
      kit.dispose();
      envMap.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
