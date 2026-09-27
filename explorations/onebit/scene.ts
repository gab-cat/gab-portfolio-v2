import * as THREE from "three";
import { createStage, damp, isDark, prefersReducedMotion, rng } from "../shared/gl";
import { noise3 } from "../../src/designs/clay/lib/clay/kit";
import { THEME_EVENT } from "../../src/lib/theme";

/**
 * 1-Bit Bicol: a flight over a hand-built Bicol at dawn. Naga City sits by
 * its river under Mt. Isarog; Mayon's perfect cone stands on the horizon and
 * pokes through the cloud deck. The frame is rendered small, then pushed
 * through an ordered Bayer dither into three inks.
 */

const PX = 3; // screen pixels per rendered pixel

const fbm = (x: number, z: number) => {
  let a = 0;
  let amp = 1;
  let f = 1;
  for (let o = 0; o < 5; o++) {
    a += noise3(x * f, 0.37, z * f) * amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return a;
};

const NAGA = new THREE.Vector2(0, 0);
const ISAROG = new THREE.Vector2(70, -60);
const MAYON = new THREE.Vector2(170, -300);

function height(x: number, z: number) {
  let h = fbm(x * 0.008 + 3.1, z * 0.008 - 1.7) * 9 + 1.5;
  // the coast falls away to the west and south
  h -= Math.max(0, (-x - 90) * 0.12) + Math.max(0, (z - 150) * 0.1);
  const ri = Math.hypot(x - ISAROG.x, z - ISAROG.y);
  h += 40 * Math.pow(Math.max(0, 1 - ri / 85), 1.7) * (1 + fbm(x * 0.05, z * 0.05) * 0.25);
  const rm = Math.hypot(x - MAYON.x, z - MAYON.y);
  // Mayon: a near-perfect, slightly concave cone with a small crater
  h += 78 * Math.pow(Math.max(0, 1 - rm / 70), 1.4) - (rm < 2.5 ? 3 : 0);
  // the Naga river, and the flat city along it
  const riverZ = Math.sin(x * 0.035) * 12 + Math.sin(x * 0.011 + 1) * 20;
  const dr = z - riverZ;
  h -= 3.2 * Math.exp(-(dr * dr) / 30) * (Math.abs(x) < 220 ? 1 : 0);
  const city = Math.exp(-((x - NAGA.x) ** 2 + (z - NAGA.y) ** 2) / 1800);
  h = h * (1 - city * 0.8) + 0.8 * city;
  return h;
}

const DITHER_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const DITHER_FRAG = /* glsl */ `
uniform sampler2D tScene;
uniform vec3 uInk;
uniform vec3 uMid;
uniform vec3 uLight;
uniform float uLift;
varying vec2 vUv;
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
void main() {
  vec3 c = texture2D(tScene, vUv).rgb;
  // the target holds linear light; judge brightness the way the eye does
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  l = clamp(pow(l, 0.4545) * uLift - 0.07, 0.0, 1.0);
  float level = floor(l * 2.0 + bayer8(gl_FragCoord.xy));
  vec3 col = level < 0.5 ? uInk : (level < 1.5 ? uMid : uLight);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const SKY_FRAG = /* glsl */ `
uniform vec3 uSun;
uniform float uSpace;
varying vec3 vDir;
void main() {
  float h = clamp(vDir.y, -0.2, 1.0);
  float horizon = pow(1.0 - max(h, 0.0), 5.0);
  float sun = pow(max(dot(vDir, uSun), 0.0), 60.0) + pow(max(dot(vDir, uSun), 0.0), 6.0) * 0.35;
  float l = mix(0.012, 0.7, horizon) + sun;
  l = mix(l, 0.002 + pow(max(dot(vDir, uSun), 0.0), 40.0) * 0.4, uSpace);
  gl_FragColor = vec4(vec3(l), 1.0);
}
`;

export type Leg = { pos: [number, number, number]; look: [number, number, number] };

/** One stop per section, from dawn over Naga City to a globe in orbit. */
export const LEGS: Leg[] = [
  { pos: [-70, 34, 150], look: [140, 30, -250] }, // hero: Mayon at sunrise
  { pos: [-26, 22, 46], look: [6, 0, -6] }, // listen: over Naga City
  { pos: [-60, 6, 6], look: [60, 3, -8] }, // build: low along the river
  { pos: [40, 40, -40], look: [140, 70, -240] }, // ship: climbing
  { pos: [30, 84, -110], look: [170, 72, -300] }, // wins: above the clouds, Mayon's tip
  { pos: [0, 330, 60], look: [0, 420, -100] }, // work: the internet
  { pos: [-30, 400, 25], look: [0, 420, -100] }, // hello: the beacon
];

export type OneBitController = {
  setLeg: (u: number) => void;
  hud: () => { alt: number };
  dispose: () => void;
};

export function createOneBit(host: HTMLElement): OneBitController | null {
  const stage = createStage(host, { antialias: false });
  if (!stage) return null;
  const { renderer } = stage;
  const reduced = prefersReducedMotion();
  renderer.setPixelRatio(1 / PX);
  renderer.setSize(stage.width, stage.height, false);
  stage.canvas.style.imageRendering = "pixelated";

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xb8b8b8, 120, 520);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 3000);

  const sunDir = new THREE.Vector3(0.45, 0.1, -1).normalize();
  const light = new THREE.DirectionalLight(0xffffff, 2.2);
  light.position.copy(sunDir).multiplyScalar(100);
  scene.add(light);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x111111, 0.32));

  // sky dome
  const skyMat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms: { uSun: { value: sunDir }, uSpace: { value: 0 } },
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), skyMat);
  scene.add(sky);

  // terrain
  const SIZE = 900;
  const SEG = 260;
  const terrainGeo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  terrainGeo.rotateX(-Math.PI / 2);
  terrainGeo.translate(40, 0, -120);
  const pos = terrainGeo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setY(i, height(pos.getX(i), pos.getZ(i)));
  terrainGeo.computeVertexNormals();
  const terrain = new THREE.Mesh(terrainGeo, new THREE.MeshLambertMaterial({ color: 0x9a9a9a, flatShading: true }));
  scene.add(terrain);

  // sea, with a sun glitter band
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 3000),
    new THREE.MeshPhongMaterial({ color: 0x3a3a3a, shininess: 90, specular: 0xffffff }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.2;
  scene.add(sea);

  // Naga City lights along the river
  const rand = rng(41);
  const lights: number[] = [];
  for (let i = 0; i < 900; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.pow(rand(), 0.7) * 48;
    const x = NAGA.x + Math.cos(a) * r * 1.4;
    const z = NAGA.y + Math.sin(a) * r * 0.8;
    // snap to a loose street grid
    const gx = Math.round(x / 3) * 3 + (rand() - 0.5) * 0.6;
    const gz = Math.round(z / 3) * 3 + (rand() - 0.5) * 0.6;
    lights.push(gx, height(gx, gz) + 0.6, gz);
  }
  const lightsGeo = new THREE.BufferGeometry();
  lightsGeo.setAttribute("position", new THREE.Float32BufferAttribute(lights, 3));
  const lightsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.55, sizeAttenuation: true, fog: false });
  scene.add(new THREE.Points(lightsGeo, lightsMat));

  // stars
  const starPos: number[] = [];
  for (let i = 0; i < 2200; i++) {
    const v = new THREE.Vector3(rand() * 2 - 1, rand() * 0.9 + 0.1, rand() * 2 - 1).normalize().multiplyScalar(1400);
    starPos.push(v.x, v.y, v.z);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 2.4, sizeAttenuation: false, fog: false, transparent: true, opacity: 0 });
  scene.add(new THREE.Points(starGeo, starMat));

  // Mayon's plume
  const plume = new THREE.Group();
  for (let i = 0; i < 11; i++) {
    const puff = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.6 + i * 0.55, 1),
      new THREE.MeshLambertMaterial({ color: 0xd8d8d8, flatShading: true }),
    );
    puff.position.set(MAYON.x + i * 5.5, 79 + i * 2.2, MAYON.y + i * 2.5);
    plume.add(puff);
  }
  scene.add(plume);

  // cloud deck: soft noise sheets the camera climbs through
  const cloudMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float a = 0.0, m = 0.5; for (int i = 0; i < 5; i++) { a += n(p) * m; p *= 2.1; m *= 0.5; } return a; }
      void main(){
        vec2 p = vUv * 9.0 + vec2(uTime * 0.01, 0.0);
        float d = smoothstep(0.34, 0.62, fbm(p));
        float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x) * smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
        gl_FragColor = vec4(vec3(0.62 + d * 0.3), d * edge);
      }`,
  });
  const clouds = new THREE.Group();
  [60, 64, 68].forEach((y, i) => {
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), cloudMat);
    sheet.rotation.x = -Math.PI / 2;
    sheet.position.set(60 + i * 30, y, -160 - i * 20);
    clouds.add(sheet);
  });
  scene.add(clouds);

  // the internet: a dotted globe with arcs leaving Naga
  const globe = new THREE.Group();
  globe.position.set(0, 420, -100);
  const R = 42;
  const gPts: number[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 2600; i++) {
    const y = 1 - (i / 2599) * 2;
    const r = Math.sqrt(1 - y * y);
    gPts.push(Math.cos(golden * i) * r * R, y * R, Math.sin(golden * i) * r * R);
  }
  const gGeo = new THREE.BufferGeometry();
  gGeo.setAttribute("position", new THREE.Float32BufferAttribute(gPts, 3));
  globe.add(new THREE.Points(gGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.75, fog: false })));
  const latLon = (lat: number, lon: number, r: number) => {
    const phi = ((90 - lat) * Math.PI) / 180;
    const th = ((lon + 180) * Math.PI) / 180;
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  };
  const naga = latLon(13.62, 123.19, R);
  const arcMat = new THREE.LineBasicMaterial({ color: 0xffffff, fog: false });
  [[43.65, -79.38], [14.6, 120.98], [1.35, 103.82], [35.68, 139.69], [37.77, -122.42], [51.51, -0.13], [-33.87, 151.21]].forEach(([lat, lon]) => {
    const to = latLon(lat, lon, R);
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= 48; s++) {
      const t = s / 48;
      pts.push(naga.clone().normalize().lerp(to.clone().normalize(), t).normalize().multiplyScalar(R * (1 + Math.sin(Math.PI * t) * 0.35)));
    }
    globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), arcMat));
  });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }));
  beacon.position.copy(naga);
  globe.add(beacon);
  // face Naga toward the arriving camera
  globe.rotation.y = -2.1;
  globe.rotation.x = 0.25;
  scene.add(globe);

  // render small, then dither to the screen
  const target = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const ditherMat = new THREE.ShaderMaterial({
    vertexShader: DITHER_VERT,
    fragmentShader: DITHER_FRAG,
    uniforms: {
      tScene: { value: target.texture },
      uInk: { value: new THREE.Color() },
      uMid: { value: new THREE.Color() },
      uLight: { value: new THREE.Color() },
      uLift: { value: 1.08 },
    },
    depthTest: false,
    depthWrite: false,
  });
  const quadScene = new THREE.Scene();
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), ditherMat));

  const applyTheme = () => {
    const dark = isDark();
    ditherMat.uniforms.uInk.value.set(dark ? "#0c0b0a" : "#171614");
    ditherMat.uniforms.uMid.value.set(dark ? "#ff6a2b" : "#ff5a1f");
    ditherMat.uniforms.uLight.value.set(dark ? "#f0ebe1" : "#ebe8e1");
  };
  applyTheme();
  window.addEventListener(THEME_EVENT, applyTheme);

  const size = new THREE.Vector2();
  stage.onResize((w, h) => {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.getDrawingBufferSize(size);
    target.setSize(size.x, size.y);
  });

  const posCurve = new THREE.CatmullRomCurve3(LEGS.map((l) => new THREE.Vector3(...l.pos)), false, "centripetal");
  const lookCurve = new THREE.CatmullRomCurve3(LEGS.map((l) => new THREE.Vector3(...l.look)), false, "centripetal");
  let u = 0;
  let shown = 0;
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const pointer = new THREE.Vector2();
  const onMove = (e: PointerEvent) => pointer.set((e.clientX / stage.width) * 2 - 1, (e.clientY / stage.height) * 2 - 1);
  window.addEventListener("pointermove", onMove, { passive: true });
  const sway = new THREE.Vector2();

  stage.start((t, dt) => {
    shown = reduced ? u : damp(shown, u, 2.4, dt);
    const p = Math.min(1, Math.max(0, shown / (LEGS.length - 1)));
    posCurve.getPoint(p, camPos);
    lookCurve.getPoint(p, camLook);
    sway.x = damp(sway.x, pointer.x, 1.5, dt);
    sway.y = damp(sway.y, pointer.y, 1.5, dt);
    camPos.x += sway.x * 3 + (reduced ? 0 : Math.sin(t * 0.4) * 0.6);
    camPos.y += -sway.y * 2 + (reduced ? 0 : Math.sin(t * 0.55) * 0.4);
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    // higher means darker sky and more stars
    const space = THREE.MathUtils.smoothstep(camPos.y, 90, 300);
    skyMat.uniforms.uSpace.value = space;
    starMat.opacity = THREE.MathUtils.smoothstep(camPos.y, 60, 200);
    (scene.fog as THREE.Fog).far = 520 + space * 3000;
    cloudMat.uniforms.uTime.value = t;
    plume.children.forEach((c, i) => (c.position.x = MAYON.x + i * 5.5 + Math.sin(t * 0.2 + i) * 1.5));
    globe.rotation.y = -2.1 + (reduced ? 0 : Math.sin(t * 0.08) * 0.15);
    beacon.scale.setScalar(1 + (reduced ? 0 : Math.max(0, Math.sin(t * 3)) * 0.8));
    lightsMat.size = 0.55 + (reduced ? 0 : Math.sin(t * 5) * 0.05);

    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(quadScene, quadCam);
  });

  return {
    setLeg: (next) => {
      u = next;
    },
    hud: () => ({ alt: Math.max(0, camera.position.y) }),
    dispose: () => {
      window.removeEventListener(THEME_EVENT, applyTheme);
      window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      });
      ditherMat.dispose();
      target.dispose();
      stage.dispose();
    },
  };
}
