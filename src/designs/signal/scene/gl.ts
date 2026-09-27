/**
 * WebGL2 plumbing for the particle field, with no 3D library: one context, a
 * render loop that sleeps when the tab is hidden, resize handling, a small
 * camera, and the point samplers the figures are built from.
 */

export const isDark = () => document.documentElement.classList.contains("dark");

export type Stage = {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  dpr: number;
  onResize: (fn: (w: number, h: number) => void) => void;
  start: (frame: (time: number, delta: number) => void) => void;
  dispose: () => void;
};

export function createStage(host: HTMLElement, { dprCap = 2 } = {}): Stage | null {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: "high-performance",
  });
  if (!gl) return null;
  const mobile = window.matchMedia("(max-width: 760px)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? Math.min(1.5, dprCap) : dprCap);
  canvas.style.cssText = "display:block;width:100%;height:100%";
  host.appendChild(canvas);

  const resizers: ((w: number, h: number) => void)[] = [];
  const stage: Stage = {
    gl,
    canvas,
    width: host.clientWidth || window.innerWidth,
    height: host.clientHeight || window.innerHeight,
    dpr,
    onResize: (fn) => {
      resizers.push(fn);
      fn(stage.width, stage.height);
    },
    start: () => undefined,
    dispose: () => undefined,
  };

  const resize = () => {
    stage.width = host.clientWidth || window.innerWidth;
    stage.height = host.clientHeight || window.innerHeight;
    canvas.width = Math.round(stage.width * dpr);
    canvas.height = Math.round(stage.height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    resizers.forEach((fn) => fn(stage.width, stage.height));
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  let raf = 0;
  let last = 0;
  let frameFn: ((t: number, dt: number) => void) | null = null;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const t = now / 1000;
    const dt = Math.min(0.05, last ? t - last : 0.016);
    last = t;
    frameFn?.(t, dt);
  };
  const onVisibility = () => {
    cancelAnimationFrame(raf);
    last = 0;
    if (!document.hidden && frameFn) raf = requestAnimationFrame(tick);
  };
  document.addEventListener("visibilitychange", onVisibility);

  stage.start = (fn) => {
    frameFn = fn;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  };
  stage.dispose = () => {
    cancelAnimationFrame(raf);
    frameFn = null;
    ro.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    canvas.remove();
  };
  return stage;
}

function shader(gl: WebGL2RenderingContext, type: number, source: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, source);
  gl.compileShader(s);
  return s;
}

/**
 * Compile and link without waiting on the driver. Attribute locations follow
 * the order given. Call `linked` before first use.
 */
export function program(gl: WebGL2RenderingContext, vertex: string, fragment: string, attributes: readonly string[]) {
  const p = gl.createProgram()!;
  const vs = shader(gl, gl.VERTEX_SHADER, vertex);
  const fs = shader(gl, gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  attributes.forEach((name, i) => gl.bindAttribLocation(p, i, name));
  gl.linkProgram(p);
  return { program: p, shaders: [vs, fs] };
}

/** Resolves once the program has linked. With KHR_parallel_shader_compile the driver works off the main thread meanwhile. */
export async function linked(gl: WebGL2RenderingContext, { program: p, shaders }: ReturnType<typeof program>) {
  const parallel = gl.getExtension("KHR_parallel_shader_compile");
  if (parallel) {
    while (!gl.getProgramParameter(p, parallel.COMPLETION_STATUS_KHR)) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = [gl.getProgramInfoLog(p), ...shaders.map((s) => gl.getShaderInfoLog(s))].filter(Boolean).join("\n");
    throw new Error(`particle shader failed to link: ${log}`);
  }
  shaders.forEach((s) => gl.deleteShader(s));
}

/** Frame-rate independent easing toward a target. */
export const damp = (a: number, b: number, lambda: number, dt: number) => a + (b - a) * (1 - Math.exp(-lambda * dt));

/** Hand the main thread back between chunks of set-up work so input and paint stay smooth. */
export function breathe() {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  return scheduler?.yield ? scheduler.yield() : new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export type Vec3 = [number, number, number];

/** Column-major perspective projection. */
export function perspective(out: Float32Array, fovY: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovY / 2);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
  return out;
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** A camera at `eye` looking at the origin: the view matrix plus its axes, for casting pointer rays. */
export function lookAtOrigin(out: Float32Array, eye: Vec3) {
  const z = normalize(eye);
  const x = normalize(cross([0, 1, 0], z));
  const y = cross(z, x);
  out.set([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]);
  return { x, y, z };
}

/** Where a ray from the camera through a point on screen (NDC) meets the z = 0 plane. */
export function pointerOnPlane(eye: Vec3, axes: { x: Vec3; y: Vec3; z: Vec3 }, ndcX: number, ndcY: number, fovY: number, aspect: number): Vec3 | null {
  const h = Math.tan(fovY / 2);
  const dir = sub(
    [axes.x[0] * ndcX * h * aspect + axes.y[0] * ndcY * h, axes.x[1] * ndcX * h * aspect + axes.y[1] * ndcY * h, axes.x[2] * ndcX * h * aspect + axes.y[2] * ndcY * h],
    axes.z,
  );
  if (Math.abs(dir[2]) < 1e-6) return null;
  const t = -eye[2] / dir[2];
  return [eye[0] + dir[0] * t, eye[1] + dir[1] * t, 0];
}

/** Deterministic random so every visit builds the same scene. */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Scatter `count` points over an image. `weight` maps a pixel's luminance
 * (0 dark, 1 light) to how likely a point lands there; return 0 to skip it.
 * Output is centred, `height` units tall, with relief in z.
 */
export function sampleImage(
  img: HTMLImageElement,
  count: number,
  weight: (lum: number) => number,
  { height = 2.6, relief = 0.3, grid = 220, seed = 3 } = {},
) {
  const aspect = img.naturalWidth / img.naturalHeight;
  const gh = grid;
  const gw = Math.round(grid * aspect);
  const c = document.createElement("canvas");
  c.width = gw;
  c.height = gh;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, gw, gh);
  const data = ctx.getImageData(0, 0, gw, gh).data;
  const lums = new Float32Array(gw * gh);
  const weights = new Float32Array(gw * gh);
  let total = 0;
  for (let i = 0; i < gw * gh; i++) {
    const r = data[i * 4] / 255;
    const g = data[i * 4 + 1] / 255;
    const b = data[i * 4 + 2] / 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lums[i] = lum;
    const w = Math.max(0, weight(lum));
    weights[i] = w;
    total += w;
  }
  const positions = new Float32Array(count * 3);
  const shade = new Float32Array(count);
  const rand = rng(seed);
  // cumulative distribution for fast weighted picks
  const cdf = new Float32Array(weights.length);
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i] / total;
    cdf[i] = acc;
  }
  const scale = height / gh;
  for (let n = 0; n < count; n++) {
    const r = rand();
    let lo = 0;
    let hi = cdf.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < r) lo = mid + 1;
      else hi = mid;
    }
    const px = lo % gw;
    const py = Math.floor(lo / gw);
    const lum = lums[lo];
    positions[n * 3] = (px + rand() - gw / 2) * scale;
    positions[n * 3 + 1] = (gh / 2 - py - rand()) * scale;
    positions[n * 3 + 2] = (lum - 0.5) * relief + (rand() - 0.5) * 0.02;
    shade[n] = lum;
  }
  return { positions, shade };
}

/** Scatter points over text drawn with a loaded web font. */
export function sampleText(
  text: string,
  count: number,
  { font = "900 200px sans-serif", height = 2, seed = 5, lineHeight = 1, step = 1 } = {},
) {
  const lines = text.split("\n");
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.font = font;
  const size = parseFloat(font.match(/(\d+)px/)?.[1] ?? "400");
  const width = Math.ceil(Math.max(...lines.map((l) => ctx.measureText(l).width))) + 40;
  const h = Math.ceil(size * lineHeight * lines.length + size * 0.3);
  c.width = width;
  c.height = h;
  ctx.font = font;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, i) => ctx.fillText(line, width / 2, size * lineHeight * (i + 0.5) + size * 0.15));
  const data = ctx.getImageData(0, 0, width, h).data;
  const hits: number[] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < width; x += step) {
      if (data[(y * width + x) * 4 + 3] > 140) hits.push(x, y);
    }
  }
  const rand = rng(seed);
  const positions = new Float32Array(count * 3);
  const scale = height / h;
  for (let n = 0; n < count; n++) {
    const k = Math.floor(rand() * (hits.length / 2)) * 2;
    positions[n * 3] = (hits[k] + rand() * step - width / 2) * scale;
    positions[n * 3 + 1] = (h / 2 - hits[k + 1] - rand() * step) * scale;
    positions[n * 3 + 2] = (rand() - 0.5) * 0.12;
  }
  return positions;
}

/** Ashima/McEwan 3D simplex noise, for vertex shaders. */
export const GLSL_NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;
