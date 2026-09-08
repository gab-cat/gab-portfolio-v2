import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { THEME_EVENT } from "./theme";

export interface SculptureController {
  setPaused: (paused: boolean) => void;
  dispose: () => void;
}

/** One transparent viewport, shared lighting and geometry across every chapter.
 * Scissor regions keep each sculpture inside its own layout slot, including
 * sticky slots. No extra WebGL contexts, remote models, or texture downloads. */
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentMap = pmrem.fromScene(room, 0.04);
  scene.environment = environmentMap.texture;
  room.dispose();
  pmrem.dispose();
  const chrome = new THREE.MeshPhysicalMaterial({
    color: 0xdce3e3,
    metalness: 1,
    roughness: 0.19,
    clearcoat: 1,
    envMapIntensity: 1.4,
  });
  const orange = new THREE.MeshPhysicalMaterial({
    color: 0xe43c0c,
    metalness: 0.5,
    roughness: 0.29,
    clearcoat: 0.7,
    envMapIntensity: 0.75,
  });
  const key = new THREE.DirectionalLight(0xffffff, 2);
  key.position.set(-3, 5, 5);
  const rim = new THREE.DirectionalLight(0xffc6ae, 2);
  rim.position.set(4, -2, 1);
  scene.add(key, rim);
  const geometries = {
    knot: new THREE.TorusKnotGeometry(1.05, 0.34, 144, 24, 2, 3),
    orbit: new THREE.TorusGeometry(2.05, 0.09, 16, 112),
    link: new THREE.TorusGeometry(1.05, 0.23, 24, 96),
    sphere: new THREE.SphereGeometry(0.27, 24, 16),
    slab: new RoundedBoxGeometry(2.6, 0.32, 2.1, 3, 0.14),
    petal: new THREE.SphereGeometry(0.28, 20, 16),
  };
  const mesh = (geometry: THREE.BufferGeometry, material = chrome) =>
    new THREE.Mesh(geometry, material);
  const models: Record<string, THREE.Group> = {};
  const create = (name: string) => {
    const group = new THREE.Group();
    models[name] = group;
    scene.add(group);
    return group;
  };
  const curiosity = create("curiosity");
  const knot = mesh(geometries.knot);
  knot.rotation.set(0.3, -0.5, 0);
  const orbit = mesh(geometries.orbit, orange);
  orbit.rotation.set(1, -0.4, -0.3);
  curiosity.add(knot, orbit);

  const connection = create("connection");
  for (let i = 0; i < 2; i++) {
    const link = mesh(geometries.link, i ? orange : chrome);
    link.position.x = (i - 0.5) * 1.45;
    link.rotation.set(i ? 1.15 : -0.25, i ? 0.25 : -0.35, 0);
    connection.add(link);
  }
  const building = create("building");
  for (let i = 0; i < 3; i++) {
    const slab = mesh(geometries.slab, i === 1 ? orange : chrome);
    slab.position.y = (i - 1) * 0.85;
    slab.rotation.y = i * 0.18;
    building.add(slab);
  }
  const possibility = create("possibility");
  for (let i = 0; i < 3; i++) {
    const ring = mesh(geometries.link, i === 1 ? orange : chrome);
    ring.rotation.set((i * Math.PI) / 3, (i * Math.PI) / 3, 0);
    ring.scale.setScalar(1.25);
    possibility.add(ring);
  }
  const pressure = create("pressure");
  for (let i = 0; i < 8; i++) {
    const petal = mesh(geometries.petal, i % 3 === 0 ? orange : chrome);
    const angle = (i / 8) * Math.PI * 2;
    petal.position.set(Math.sin(angle) * 1.05, Math.cos(angle) * 1.05, 0);
    petal.scale.set(1.05, 2.8, 1.05);
    petal.rotation.z = -angle;
    pressure.add(petal);
  }
  const together = create("together");
  const openRing = mesh(geometries.link);
  openRing.scale.setScalar(1.5);
  const smallRing = mesh(geometries.link, orange);
  smallRing.scale.setScalar(0.75);
  smallRing.rotation.x = 0.8;
  together.add(openRing, smallRing);
  const satellite = mesh(geometries.sphere, orange);
  scene.add(satellite);

  const slots = Array.from(
    document.querySelectorAll<HTMLElement>("[data-sculpture]"),
  );
  const visibleSlots = new Set<HTMLElement>();
  const chapterProgress = new Map<HTMLElement, number>();
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  let paused = preference.matches;
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
  const render = () => {
    if (disposed || lost) return;
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
    renderer.clear();
    renderer.setScissorTest(true);
    for (const slot of visibleSlots) {
      const rect = slot.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= height || !rect.width || !rect.height)
        continue;
      const chapter = slot.dataset.sculpture || "curiosity";
      const model = models[chapter];
      if (!model) continue;
      for (const group of Object.values(models))
        group.visible = group === model;
      // Movement follows the chapter through the viewport; reduced motion and
      // explicit pause freeze the sculpture, while its normal page position scrolls.
      const progress = paused
        ? (chapterProgress.get(slot) ?? 0.5)
        : THREE.MathUtils.clamp(
            (height - rect.top) / (height + rect.height),
            0,
            1,
          );
      chapterProgress.set(slot, progress);
      model.rotation.set(
        0.15 + smoothY * 0.25 + (chapter === "building" ? 0.35 : 0),
        -0.3 + elapsed * 0.09 + smoothX * 0.4 + progress * 0.65,
        -0.18,
      );
      model.position.y = Math.sin(elapsed * 0.6) * 0.08;
      orbit.rotation.z = -0.3 - elapsed * 0.08;
      building.children.forEach((child, i) => {
        child.position.y = (i - 1) * (0.65 + progress * 0.7);
        child.rotation.y = i * 0.18 + Math.sin(elapsed * 0.3 + i) * 0.1;
      });
      possibility.children.forEach((child, i) => {
        child.rotation.z = elapsed * 0.08 * (i % 2 ? -1 : 1) + progress * 0.4;
      });
      pressure.rotation.z = -0.18 + elapsed * 0.1 + progress * 0.35;
      smallRing.rotation.y = elapsed * 0.15 + progress;
      satellite.visible =
        chapter === "curiosity" ||
        chapter === "possibility" ||
        chapter === "together";
      satellite.position.set(
        Math.cos(elapsed * 0.25 + 0.5) * 2.1,
        Math.sin(elapsed * 0.25 + 0.5) * 1.6,
        0.4,
      );
      camera.aspect = rect.width / rect.height;
      const distance = chapter === "curiosity" ? 9.6 : 7.6;
      camera.position.set(
        0,
        0,
        camera.aspect < 1 ? distance / camera.aspect : distance,
      );
      camera.updateProjectionMatrix();
      renderer.setViewport(
        rect.left,
        height - rect.bottom,
        rect.width,
        rect.height,
      );
      renderer.setScissor(
        rect.left,
        height - rect.bottom,
        rect.width,
        rect.height,
      );
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
    if (!last || now - last >= 32) {
      elapsed += last ? Math.min((now - last) / 1000, 0.06) : 0;
      last = now;
      smoothX += (pointerX - smoothX) * 0.07;
      smoothY += (pointerY - smoothY) * 0.07;
      render();
    }
    frame = requestAnimationFrame(loop);
  };
  const requestRender = () => {
    if (redraw || disposed || lost || document.hidden) return;
    redraw = requestAnimationFrame(() => {
      redraw = 0;
      render();
    });
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
    chrome.color.setHex(dark ? 0xb5c5c3 : 0xdce3e3);
    renderer.toneMappingExposure = dark ? 1.5 : 1.2;
    requestRender();
  };
  const onPointer = (event: PointerEvent) => {
    if (paused || event.pointerType === "touch") return;
    pointerX = event.clientX / width - 0.5;
    pointerY = event.clientY / height - 0.5;
  };
  const onPreference = () => {
    paused = preference.matches;
    sync();
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
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", resize);
  window.addEventListener(THEME_EVENT, theme);
  document.addEventListener("visibilitychange", sync);
  preference.addEventListener("change", onPreference);
  renderer.domElement.addEventListener("webglcontextlost", onLost);
  resize();
  theme();
  document.fonts.ready.then(requestRender);
  return {
    setPaused(value) {
      paused = value;
      sync();
    },
    dispose() {
      disposed = true;
      stop();
      cancelAnimationFrame(redraw);
      observer.disconnect();
      resizer.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", resize);
      window.removeEventListener(THEME_EVENT, theme);
      document.removeEventListener("visibilitychange", sync);
      preference.removeEventListener("change", onPreference);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      slots.forEach((slot) => delete slot.dataset.rendered);
      [...Object.values(geometries), chrome, orange, environmentMap].forEach(
        (resource) => resource.dispose(),
      );
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
