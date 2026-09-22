import * as THREE from "three";

/* Everything that makes a primitive read as hand-pressed plasticine:
   a lumpy silhouette, a fingerprint normal map, and a soft sheen. No
   textures are downloaded; the grain is generated once per page. */

const P = new Uint8Array(512);
{
  const perm = Array.from({ length: 256 }, (_, i) => i);
  let seed = 7;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 512; i++) P[i] = perm[i & 255];
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function grad(h: number, x: number, y: number, z: number) {
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/** Classic Perlin noise, roughly in [-1, 1]. */
export function noise3(x: number, y: number, z: number) {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x);
  y -= Math.floor(y);
  z -= Math.floor(z);
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const A = P[X] + Y;
  const AA = P[A] + Z;
  const AB = P[A + 1] + Z;
  const B = P[X + 1] + Y;
  const BA = P[B] + Z;
  const BB = P[B + 1] + Z;
  return lerp(
    lerp(
      lerp(grad(P[AA] & 15, x, y, z), grad(P[BA] & 15, x - 1, y, z), u),
      lerp(grad(P[AB] & 15, x, y - 1, z), grad(P[BB] & 15, x - 1, y - 1, z), u),
      v,
    ),
    lerp(
      lerp(grad(P[AA + 1] & 15, x, y, z - 1), grad(P[BA + 1] & 15, x - 1, y, z - 1), u),
      lerp(grad(P[AB + 1] & 15, x, y - 1, z - 1), grad(P[BB + 1] & 15, x - 1, y - 1, z - 1), u),
      v,
    ),
    w,
  );
}

/**
 * Push vertices along their normals with low-frequency noise so silhouettes
 * wobble like something shaped by hand. Normals are bent by the noise
 * gradient rather than recomputed, which keeps UV seams invisible.
 */
export function lumpy<T extends THREE.BufferGeometry>(
  geometry: T,
  amount = 0.03,
  frequency = 1.6,
  seed = 0,
): T {
  const pos = geometry.attributes.position as THREE.BufferAttribute;
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const nor = geometry.attributes.normal as THREE.BufferAttribute;
  const e = 0.05;
  const d = (x: number, y: number, z: number) =>
    noise3(x * frequency + seed, y * frequency + seed * 1.7, z * frequency - seed) * amount;
  const n = new THREE.Vector3();
  const g = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    n.set(nor.getX(i), nor.getY(i), nor.getZ(i)).normalize();
    const h = d(x, y, z);
    g.set(
      (d(x + e, y, z) - d(x - e, y, z)) / (2 * e),
      (d(x, y + e, z) - d(x, y - e, z)) / (2 * e),
      (d(x, y, z + e) - d(x, y, z - e)) / (2 * e),
    );
    g.addScaledVector(n, -g.dot(n));
    pos.setXYZ(i, x + n.x * h, y + n.y * h, z + n.z * h);
    n.sub(g).normalize();
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  pos.needsUpdate = true;
  nor.needsUpdate = true;
  geometry.computeBoundingSphere();
  return geometry;
}

/** Fingerprints, smudges and tiny pits, baked into a tangent-space normal map. */
function fingerprintTexture(size = 256) {
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Tileable by sampling noise on a torus.
      const a = (x / size) * Math.PI * 2;
      const b = (y / size) * Math.PI * 2;
      const r = 1.3;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      const pz = Math.cos(b) * r;
      const pw = Math.sin(b) * r;
      const smudge = noise3(px * 1.4 + pw, py * 1.4, pz * 1.4) * 0.6;
      const pores = noise3(px * 9 + 3, py * 9 - pw * 4, pz * 9) * 0.25;
      const ridges = Math.sin((px * 2 + pz * 3 + noise3(px * 2, pz * 2, pw * 2) * 2.5) * 11) * 0.12;
      height[y * size + x] = smudge + pores + ridges * (0.5 + noise3(px, py * 2, pw) * 0.5);
    }
  }
  const data = new Uint8Array(size * size * 4);
  const s = 2.2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const h = (xx: number, yy: number) =>
        height[((yy + size) % size) * size + ((xx + size) % size)];
      const dx = (h(x + 1, y) - h(x - 1, y)) * s;
      const dy = (h(x, y + 1) - h(x, y - 1)) * s;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

let sharedPrint: THREE.DataTexture | null = null;
let printUsers = 0;

export interface ClayKit {
  clay: (color: THREE.ColorRepresentation, options?: ClayOptions) => THREE.MeshPhysicalMaterial;
  dispose: () => void;
}

export interface ClayOptions {
  roughness?: number;
  sheen?: number;
  print?: number;
  repeat?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
}

/** One cache per renderer: every colour becomes a single shared material. */
export function createClayKit(): ClayKit {
  sharedPrint ??= fingerprintTexture();
  printUsers++;
  const print = sharedPrint;
  const cache = new Map<string, THREE.MeshPhysicalMaterial>();
  const repeats = new Map<number, THREE.Texture>();
  const printAt = (repeat: number) => {
    let texture = repeats.get(repeat);
    if (!texture) {
      texture = print.clone();
      texture.repeat.set(repeat, repeat);
      texture.needsUpdate = true;
      repeats.set(repeat, texture);
    }
    return texture;
  };
  return {
    clay(color, options = {}) {
      const key = JSON.stringify([new THREE.Color(color).getHex(), options]);
      const cached = cache.get(key);
      if (cached) return cached;
      const base = new THREE.Color(color);
      const material = new THREE.MeshPhysicalMaterial({
        color: base,
        roughness: options.roughness ?? 0.62,
        metalness: 0,
        sheen: options.sheen ?? 0.55,
        sheenRoughness: 0.55,
        sheenColor: base.clone().lerp(new THREE.Color(0xffffff), 0.55),
        normalMap: printAt(options.repeat ?? 2),
        normalScale: new THREE.Vector2(options.print ?? 0.35, options.print ?? 0.35),
        envMapIntensity: 0.55,
        emissive: options.emissive ?? 0x000000,
        emissiveIntensity: options.emissiveIntensity ?? 0,
      });
      cache.set(key, material);
      return material;
    },
    dispose() {
      cache.forEach((material) => material.dispose());
      repeats.forEach((texture) => texture.dispose());
      cache.clear();
      repeats.clear();
      if (--printUsers === 0) {
        sharedPrint?.dispose();
        sharedPrint = null;
      }
    },
  };
}

/** A soft round contact shadow, for scenes that skip real shadow maps. */
export function contactShadowTexture() {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x / (size - 1) - 0.5, y / (size - 1) - 0.5) * 2;
      const a = Math.max(0, 1 - d) ** 2.2;
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 0;
      data[i + 3] = a * 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

/** Palette shared by the page and every scene. */
export const CLAY = {
  flame: 0xec5a2a,
  tangerine: 0xf5894a,
  butter: 0xf6cf5f,
  cream: 0xf4ead8,
  oat: 0xe8dcc6,
  sky: 0x86b6e0,
  denim: 0x4f7fc0,
  lilac: 0xb9a4ec,
  blush: 0xf2a79a,
  sage: 0x9ebf86,
  moss: 0x6f9a60,
  pine: 0x3f6f4f,
  cocoa: 0x5a3d32,
  charcoal: 0x2a2724,
} as const;
