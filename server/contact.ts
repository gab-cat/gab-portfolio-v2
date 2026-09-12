import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export type ContactEnv = Record<string, string | undefined>;
type Command = (args: (string | number)[]) => Promise<unknown>;
export type Dependencies = { env: ContactEnv; command?: Command; fetch?: typeof fetch; now?: () => number };
const MAX_BYTES = 16_384;
const TTL = 1800;
const RECIPIENT = "catimbanggabriel@gmail.com";
const TOPICS = ["A project", "A role", "A collaboration", "Something else"];
const LIMIT_SCRIPT = `local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return n`;

class HttpError extends Error {
  constructor(public status: number, message: string, public retryAfter?: number) { super(message); }
}
function json(status: number, data: object, extra: Record<string, string> = {}) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...extra } });
}
async function boundedJSON(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new HttpError(415, "Please send the form as JSON.");
  if (Number(request.headers.get("content-length")) > MAX_BYTES) throw new HttpError(413, "Your message is too long.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Please complete the form.");
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) { await reader.cancel(); throw new HttpError(413, "Your message is too long."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch { throw new HttpError(400, "Please check the form and try again."); }
}
function field(body: Record<string, unknown>, key: string, min: number, max: number, multiline = false) {
  const value = body[key];
  if (typeof value !== "string") throw new HttpError(400, `Please check your ${key}.`);
  const result = value.trim();
  if (result.length < min || result.length > max || (multiline ? /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/ : /[\x00-\x1f\x7f]/).test(result)) throw new HttpError(400, `Please check your ${key}.`);
  return result;
}
export function createContactHandler(deps: Dependencies) {
  const { env } = deps;
  const requestFetch = deps.fetch ?? fetch;
  const now = deps.now ?? Date.now;
  const sign = (value: string) => createHmac("sha256", env.RESEND_API_KEY!).update(`portfolio-contact:${value}`).digest("base64url");
  const command: Command = deps.command ?? (async (args) => {
    const endpoint = env.UPSTASH_REDIS_REST_URL;
    if (!endpoint?.startsWith("https://") || !env.UPSTASH_REDIS_REST_TOKEN) throw new Error("Protection not configured");
    const result = await requestFetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify(args), signal: AbortSignal.timeout(4000) });
    if (!result.ok) throw new Error("Protection unavailable");
    const data = await result.json() as { result: unknown; error?: string };
    if (data.error || data.result === undefined) throw new Error("Protection unavailable");
    return data.result;
  });
  async function limit(key: string, max: number, seconds: number) {
    const count = await command(["EVAL", LIMIT_SCRIPT, 1, `contact:${key}`, seconds]);
    if (typeof count !== "number" || !Number.isInteger(count) || count < 1) throw new Error("Invalid limit response");
    if (count > max) throw new HttpError(429, "A few too many messages. Please try again later, or email me directly.", seconds);
  }
  return async function handle(request: Request, trustedIP: string | null): Promise<Response> {
    try {
      if (!["GET", "POST"].includes(request.method)) return json(405, { error: "Method not allowed." }, { Allow: "GET, POST" });
      const origin = env.CONTACT_ORIGIN ?? "https://gabcat.dev";
      const suppliedOrigin = request.headers.get("origin");
      if ((request.method === "POST" && suppliedOrigin !== origin) || (suppliedOrigin && suppliedOrigin !== origin) || request.headers.get("sec-fetch-site") === "cross-site") throw new HttpError(403, "Please send your message from the contact page.");
      if (!env.RESEND_API_KEY || !trustedIP) throw new HttpError(503, "The contact form is taking a break. Please email me directly.");
      const ip = sign(trustedIP);
      await limit(`${request.method === "GET" ? "form" : "attempt"}:${ip}`, request.method === "GET" ? 30 : 8, 900);
      if (request.method === "GET") {
        const payload = Buffer.from(JSON.stringify({ id: randomUUID(), at: now(), ip })).toString("base64url");
        return json(200, { token: `${payload}.${sign(payload)}` });
      }
      const body = await boundedJSON(request);
      // Quietly discard the honeypot; never use browser input as a recipient.
      if (body.website) return json(200, { ok: true });
      const name = field(body, "name", 2, 80);
      const email = field(body, "email", 3, 254).toLowerCase();
      const topic = field(body, "topic", 1, 40);
      const message = field(body, "message", 20, 5000, true);
      if (!/^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,63}$/i.test(email) || email.includes("..")) throw new HttpError(400, "Please enter a valid email address.");
      if (!TOPICS.includes(topic)) throw new HttpError(400, "Please choose what you’d like to talk about.");
      const token = field(body, "token", 1, 1024);
      const [payload, signature, extra] = token.split(".");
      const expected = Buffer.from(sign(payload));
      const actual = Buffer.from(signature ?? "");
      if (extra || expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new HttpError(400, "Your form has expired. Please refresh it and try again.");
      let session: { id: string; at: number; ip: string };
      try { session = JSON.parse(Buffer.from(payload, "base64url").toString()); } catch { throw new HttpError(400, "Please refresh the form and try again."); }
      const age = now() - session.at;
      if (session.ip !== ip || !Number.isFinite(age) || age < 3000 || age > TTL * 1000 || !/^[a-f0-9-]{36}$/.test(session.id)) throw new HttpError(400, "Please refresh the form, take a moment, and try again.");
      // Bind retries to the exact same message. Resend uses this key to deduplicate.
      const fingerprint = sign(JSON.stringify({ name, email, topic, message }));
      const lockKey = `contact:nonce:${session.id}`;
      const stored = await command(["SET", lockKey, fingerprint, "EX", TTL + 60, "NX"]);
      if (stored !== "OK") {
        const previous = await command(["GET", lockKey]);
        if (previous !== fingerprint) throw new HttpError(409, "Please refresh the form before sending another message.");
      }
      await limit(`sender:${sign(email)}`, 3, 3600);
      await limit(`ip:${ip}`, 5, 3600);
      // A rolling global ceiling bounds email spend even with rotating IPs.
      await limit("daily", 30, 86400);
      const response = await requestFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `portfolio/${session.id}` },
        body: JSON.stringify({ from: "Gabcat Portfolio <contact@generalsonline.app>", to: [RECIPIENT], reply_to: email, subject: `Portfolio enquiry: ${topic}`, text: `From: ${name}\nEmail: ${email}\nAbout: ${topic}\n\n${message}` }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new HttpError(502, "Your message couldn’t be sent right now. Please try again, or email me directly.");
      const sent = await response.json() as { id?: unknown };
      if (typeof sent.id !== "string" || !sent.id) throw new Error("Invalid send response");
      return json(200, { ok: true });
    } catch (error) {
      if (error instanceof HttpError) return json(error.status, { error: error.message }, error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {});
      // No contact details, provider payloads, or secrets are logged or returned.
      return json(503, { error: "The contact form is unavailable right now. Please try again later, or email me directly." });
    }
  };
}
