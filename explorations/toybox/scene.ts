import * as THREE from "three";
import * as CANNON from "cannon-es";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createStage, isDark, prefersReducedMotion, rng } from "../shared/gl";
import { THEME_EVENT } from "../../src/lib/theme";

/**
 * Toybox: a physics pit the size of the screen. Every part of the portfolio
 * arrives as a toy you can grab, throw and click. cannon-es does the
 * physics; everything visible is a rounded box, a lathe or a sphere.
 */

export const TOY_COLORS = ["#ff5a1f", "#2d5bff", "#ffc21a", "#ff6fae", "#18b26b"] as const;
const INK = "#16161a";

export type ToySpec =
  | { kind: "letter"; id: string; label: string; color: string }
  | { kind: "crate"; id: string; label: string; color: string }
  | { kind: "pill"; id: string; label: string; color: string }
  | { kind: "trophy"; id: string; label: string; color: string; rank: string }
  | { kind: "ball"; id: string; label: string; color: string };

type Toy = { spec: ToySpec; mesh: THREE.Object3D; body: CANNON.Body; born: number; dying: number };

export type ToyboxController = {
  drop: (specs: ToySpec[], stagger?: number) => void;
  clear: () => void;
  shake: () => void;
  setRightInset: (px: number) => void;
  onPick: (fn: (id: string) => void) => void;
  dispose: () => void;
};

function labelTexture(text: string, w: number, h: number, bg: string, fg: string, size: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let fontSize = size;
  ctx.font = `800 ${fontSize}px "Unbounded Variable", sans-serif`;
  while (ctx.measureText(text).width > w * 0.86 && fontSize > 10) {
    fontSize -= 2;
    ctx.font = `800 ${fontSize}px "Unbounded Variable", sans-serif`;
  }
  ctx.fillText(text, w / 2, h / 2 + fontSize * 0.05);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

const plastic = (color: string, map?: THREE.Texture) =>
  new THREE.MeshPhysicalMaterial({ color: map ? "#ffffff" : color, map, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25 });

export function createToybox(host: HTMLElement): ToyboxController | null {
  const stage = createStage(host, { shadows: true, dprCap: 1.75 });
  if (!stage) return null;
  const { renderer } = stage;
  renderer.toneMapping = THREE.NeutralToneMapping;
  const reduced = prefersReducedMotion();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.8;
  room.dispose();
  pmrem.dispose();

  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-5, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 8;
  sun.shadow.bias = -0.0005;
  const sc = sun.shadow.camera;
  sc.left = -16;
  sc.right = 16;
  sc.top = 12;
  sc.bottom = -12;
  scene.add(sun, new THREE.HemisphereLight(0xffffff, 0x999999, 0.5));

  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.ShadowMaterial({ opacity: 0.18 }));
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // physics world with a floor, two side walls and a front and back pane
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -18, 0) });
  world.allowSleep = true;
  world.broadphase = new CANNON.SAPBroadphase(world);
  const toyMat = new CANNON.Material("toy");
  world.defaultContactMaterial.friction = 0.35;
  world.defaultContactMaterial.restitution = 0.38;
  world.addContactMaterial(new CANNON.ContactMaterial(toyMat, toyMat, { friction: 0.3, restitution: 0.42 }));
  const walls = {
    floor: new CANNON.Body({ mass: 0, shape: new CANNON.Plane() }),
    left: new CANNON.Body({ mass: 0, shape: new CANNON.Plane() }),
    right: new CANNON.Body({ mass: 0, shape: new CANNON.Plane() }),
    back: new CANNON.Body({ mass: 0, shape: new CANNON.Plane() }),
    front: new CANNON.Body({ mass: 0, shape: new CANNON.Plane() }),
  };
  walls.floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  walls.left.quaternion.setFromEuler(0, Math.PI / 2, 0);
  walls.right.quaternion.setFromEuler(0, -Math.PI / 2, 0);
  walls.back.position.set(0, 0, -1.6);
  walls.front.quaternion.setFromEuler(0, Math.PI, 0);
  walls.front.position.set(0, 0, 1.6);
  Object.values(walls).forEach((b) => world.addBody(b));

  let rightInset = 0;
  const bounds = { floor: -2.5, left: -5, right: 5, top: 4 };
  const layout = () => {
    const aspect = stage.width / stage.height;
    const tan = Math.tan(THREE.MathUtils.degToRad(15));
    const dist = Math.max(13, 7 / (2 * tan * aspect));
    camera.aspect = aspect;
    camera.position.set(0, dist * 0.2, dist);
    camera.lookAt(0, 0.2, 0);
    camera.updateProjectionMatrix();
    const visH = 2 * dist * tan;
    const visW = visH * aspect;
    const unit = visH / stage.height;
    bounds.floor = -visH / 2 + (stage.width < 820 ? 180 : 138) * unit;
    bounds.left = -visW / 2 + 0.2;
    bounds.right = visW / 2 - 0.2 - rightInset * unit;
    bounds.top = visH / 2 + 1.5;
    walls.floor.position.set(0, bounds.floor, 0);
    walls.left.position.set(bounds.left, 0, 0);
    walls.right.position.set(bounds.right, 0, 0);
    floorMesh.position.y = bounds.floor;
  };
  stage.onResize(layout);

  const toys: Toy[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  const rand = rng(Date.now() % 997);

  const make = (spec: ToySpec): { mesh: THREE.Object3D; shape: CANNON.Shape; mass: number } => {
    if (spec.kind === "letter") {
      const s = 0.95;
      const geo = new RoundedBoxGeometry(s, s, s, 4, 0.16);
      const tex = labelTexture(spec.label, 256, 256, spec.color, spec.color === "#ffc21a" ? INK : "#ffffff", 190);
      const mat = plastic(spec.color, tex);
      geometries.push(geo);
      materials.push(mat);
      textures.push(tex);
      return { mesh: new THREE.Mesh(geo, mat), shape: new CANNON.Box(new CANNON.Vec3(s / 2, s / 2, s / 2)), mass: 1 };
    }
    if (spec.kind === "crate") {
      const [w, h, d] = [2.3, 1.05, 1.05];
      const geo = new RoundedBoxGeometry(w, h, d, 4, 0.14);
      const face = labelTexture(spec.label, 512, 236, spec.color, "#ffffff", 64);
      const side = plastic(spec.color);
      const front = plastic(spec.color, face);
      geometries.push(geo);
      materials.push(side, front);
      textures.push(face);
      return {
        mesh: new THREE.Mesh(geo, [side, side, front, front, front, front]),
        shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)),
        mass: 2.2,
      };
    }
    if (spec.kind === "pill") {
      const w = Math.max(1.3, 0.34 + spec.label.length * 0.13);
      const geo = new RoundedBoxGeometry(w, 0.5, 0.5, 5, 0.24);
      const face = labelTexture(spec.label, Math.round(w * 140), 70, spec.color, spec.color === "#ffc21a" ? INK : "#ffffff", 34);
      const side = plastic(spec.color);
      const front = plastic(spec.color, face);
      geometries.push(geo);
      materials.push(side, front);
      textures.push(face);
      return {
        mesh: new THREE.Mesh(geo, [side, side, front, front, front, front]),
        shape: new CANNON.Box(new CANNON.Vec3(w / 2, 0.25, 0.25)),
        mass: 0.5,
      };
    }
    if (spec.kind === "trophy") {
      const group = new THREE.Group();
      const gold = new THREE.MeshPhysicalMaterial({ color: spec.color, metalness: 0.85, roughness: 0.22, clearcoat: 1 });
      const base = plastic(INK);
      const cupPts = [
        new THREE.Vector2(0.05, 0),
        new THREE.Vector2(0.12, 0.08),
        new THREE.Vector2(0.1, 0.3),
        new THREE.Vector2(0.14, 0.42),
        new THREE.Vector2(0.42, 0.62),
        new THREE.Vector2(0.48, 1.05),
        new THREE.Vector2(0.44, 1.06),
      ];
      const cupGeo = new THREE.LatheGeometry(cupPts, 36);
      const cup = new THREE.Mesh(cupGeo, gold);
      cup.position.y = -0.45;
      const baseGeo = new RoundedBoxGeometry(0.62, 0.3, 0.62, 3, 0.06);
      const b = new THREE.Mesh(baseGeo, base);
      b.position.y = -0.4;
      const plateTex = labelTexture(spec.rank, 128, 128, INK, spec.color, 90);
      const plateMat = new THREE.MeshBasicMaterial({ map: plateTex });
      const plateGeo = new THREE.PlaneGeometry(0.26, 0.26);
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.set(0, -0.4, 0.312);
      group.add(cup, b, plate);
      geometries.push(cupGeo, baseGeo, plateGeo);
      materials.push(gold, base, plateMat);
      textures.push(plateTex);
      return { mesh: group, shape: new CANNON.Cylinder(0.34, 0.34, 1.1, 12), mass: 1.3 };
    }
    const r = 0.85;
    const geo = new THREE.SphereGeometry(r, 48, 32);
    const tex = labelTexture(spec.label, 512, 256, spec.color, "#ffffff", 96);
    const mat = plastic(spec.color, tex);
    geometries.push(geo);
    materials.push(mat);
    textures.push(tex);
    return { mesh: new THREE.Mesh(geo, mat), shape: new CANNON.Sphere(r), mass: 1.6 };
  };

  const spawn = (spec: ToySpec) => {
    const { mesh, shape, mass } = make(spec);
    mesh.traverse((o) => {
      o.castShadow = true;
      o.receiveShadow = true;
      o.userData.toy = spec.id;
    });
    scene.add(mesh);
    const span = bounds.right - bounds.left;
    const body = new CANNON.Body({
      mass,
      shape,
      material: toyMat,
      position: new CANNON.Vec3(bounds.left + 1 + rand() * (span - 2), bounds.top + rand() * 2, (rand() - 0.5) * 1.2),
      angularDamping: 0.2,
      linearDamping: 0.04,
      sleepSpeedLimit: 0.15,
    });
    body.quaternion.setFromEuler(rand() * 0.8, rand() * 6.28, rand() * 0.8);
    body.angularVelocity.set((rand() - 0.5) * 6, (rand() - 0.5) * 6, (rand() - 0.5) * 6);
    world.addBody(body);
    toys.push({ spec, mesh, body, born: performance.now(), dying: 0 });
    // keep the pit from overflowing: oldest non-letter toys leave first
    const alive = toys.filter((t) => !t.dying);
    if (alive.length > 46) {
      const victim = alive.find((t) => t.spec.kind !== "letter") ?? alive[0];
      victim.dying = performance.now();
    }
  };

  const timers: number[] = [];
  const drop = (specs: ToySpec[], stagger = 120) => {
    specs.forEach((s, i) => timers.push(window.setTimeout(() => spawn(s), reduced ? 0 : i * stagger)));
  };

  const remove = (t: Toy) => {
    scene.remove(t.mesh);
    world.removeBody(t.body);
    toys.splice(toys.indexOf(t), 1);
  };

  // grab, drag and throw
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hand = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC });
  hand.collisionFilterGroup = 0;
  hand.collisionFilterMask = 0;
  world.addBody(hand);
  let joint: CANNON.PointToPointConstraint | null = null;
  let held: Toy | null = null;
  const dragPlane = new THREE.Plane();
  const hit = new THREE.Vector3();
  let downAt = { x: 0, y: 0, t: 0 };
  let pickListener: ((id: string) => void) | null = null;

  const toNdc = (e: PointerEvent) => ndc.set((e.clientX / stage.width) * 2 - 1, -(e.clientY / stage.height) * 2 + 1);
  const toyAt = () => {
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(toys.map((t) => t.mesh), true);
    if (!hits.length) return null;
    const id = hits[0].object.userData.toy as string;
    return { toy: toys.find((t) => t.spec.id === id) ?? null, point: hits[0].point };
  };

  const onDown = (e: PointerEvent) => {
    if (e.target !== stage.canvas) return;
    toNdc(e);
    const found = toyAt();
    if (!found?.toy) return;
    held = found.toy;
    downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    dragPlane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), found.point);
    hand.position.set(found.point.x, found.point.y, found.point.z);
    const local = held.body.pointToLocalFrame(new CANNON.Vec3(found.point.x, found.point.y, found.point.z));
    joint = new CANNON.PointToPointConstraint(held.body, local, hand, new CANNON.Vec3(0, 0, 0), 60);
    world.addConstraint(joint);
    held.body.wakeUp();
    stage.canvas.setPointerCapture(e.pointerId);
    stage.canvas.style.cursor = "grabbing";
  };
  const onMove = (e: PointerEvent) => {
    toNdc(e);
    if (joint) {
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(dragPlane, hit)) {
        hand.position.set(
          THREE.MathUtils.clamp(hit.x, bounds.left + 0.3, bounds.right - 0.3),
          Math.max(hit.y, bounds.floor + 0.3),
          hit.z,
        );
      }
      return;
    }
    if (e.target === stage.canvas) stage.canvas.style.cursor = toyAt()?.toy ? "grab" : "";
  };
  const onUp = (e: PointerEvent) => {
    if (!joint || !held) return;
    world.removeConstraint(joint);
    joint = null;
    const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
    if (moved < 6 && performance.now() - downAt.t < 350) {
      held.body.applyImpulse(new CANNON.Vec3(0, 4 * held.body.mass, 0));
      pickListener?.(held.spec.id);
    }
    held = null;
    stage.canvas.style.cursor = "";
  };
  stage.canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp);

  const applyTheme = () => {
    (floorMesh.material as THREE.ShadowMaterial).opacity = isDark() ? 0.5 : 0.18;
    scene.environmentIntensity = isDark() ? 0.55 : 0.8;
  };
  applyTheme();
  window.addEventListener(THEME_EVENT, applyTheme);

  stage.start((_t, dt) => {
    world.step(1 / 60, dt, 4);
    const now = performance.now();
    for (let i = toys.length - 1; i >= 0; i--) {
      const t = toys[i];
      t.mesh.position.set(t.body.position.x, t.body.position.y, t.body.position.z);
      t.mesh.quaternion.set(t.body.quaternion.x, t.body.quaternion.y, t.body.quaternion.z, t.body.quaternion.w);
      // a toy thrown out of the pit, or retired, shrinks away
      if (t.body.position.y < bounds.floor - 4) t.dying ||= now;
      if (t.dying) {
        const k = Math.max(0, 1 - (now - t.dying) / 350);
        t.mesh.scale.setScalar(k);
        if (k === 0) remove(t);
      }
    }
    renderer.render(scene, camera);
  });

  return {
    drop,
    clear: () => {
      const now = performance.now();
      toys.forEach((t) => (t.dying ||= now + Math.random() * 200));
    },
    shake: () => {
      toys.forEach((t) => {
        t.body.wakeUp();
        t.body.applyImpulse(new CANNON.Vec3((Math.random() - 0.5) * 6 * t.body.mass, (8 + Math.random() * 6) * t.body.mass, 0));
        t.body.angularVelocity.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
      });
    },
    setRightInset: (px) => {
      rightInset = px;
      layout();
    },
    onPick: (fn) => {
      pickListener = fn;
    },
    dispose: () => {
      timers.forEach(clearTimeout);
      window.removeEventListener(THEME_EVENT, applyTheme);
      stage.canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      stage.dispose();
    },
  };
}
