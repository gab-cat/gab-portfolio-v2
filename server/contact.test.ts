import { describe, expect, test } from "bun:test";
import { createContactHandler } from "./contact";

function fixture() {
  let time = 1_800_000_000_000;
  const store = new Map<string, { value: string | number; expires: number }>();
  const sends: { headers: Record<string, string>; body: Record<string, unknown> }[] = [];
  let redisDown = false;
  let sendFailure = false;
  const command = async (args: (string | number)[]) => {
    if (redisDown) throw new Error("Redis offline");
    const key = String(args[0] === "EVAL" ? args[3] : args[1]);
    if ((store.get(key)?.expires ?? Infinity) <= time) store.delete(key);
    if (args[0] === "EVAL") {
      const old = store.get(key);
      const value = Number(old?.value ?? 0) + 1;
      store.set(key, { value, expires: old?.expires ?? time + Number(args[4]) * 1000 });
      return value;
    }
    if (args[0] === "SET") {
      if (store.has(key)) return null;
      store.set(key, { value: String(args[2]), expires: time + Number(args[4]) * 1000 });
      return "OK";
    }
    if (args[0] === "GET") return store.get(key)?.value ?? null;
    throw new Error("Unexpected command");
  };
  const env = { RESEND_API_KEY: "test-only-not-a-real-key", CONTACT_ORIGIN: "https://gabcat.dev" };
  const provider: typeof fetch = (async (_url: unknown, init: RequestInit) => {
    sends.push({ headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
    return Response.json(sendFailure ? { error: "private provider detail" } : { id: "mock-email-id" }, { status: sendFailure ? 500 : 200 });
  }) as typeof fetch;
  const handle = createContactHandler({ env, command, fetch: provider, now: () => time });
  const ip = "203.0.113.42";
  const get = (clientIP = ip) => handle(new Request("https://gabcat.dev/api/contact"), clientIP);
  const post = (body: unknown, options: { origin?: string; ip?: string; type?: string } = {}) => handle(new Request("https://gabcat.dev/api/contact", { method: "POST", headers: { Origin: options.origin ?? env.CONTACT_ORIGIN, "Content-Type": options.type ?? "application/json" }, body: JSON.stringify(body) }), options.ip ?? ip);
  const valid = async (clientIP = ip) => {
    const response = await get(clientIP);
    const { token } = await response.json();
    time += 3500;
    return { name: "Test Visitor", email: "visitor@example.com", topic: "A project", message: "I would like to discuss building a useful website.", website: "", token };
  };
  return { handle, get, post, valid, sends, store, env, command, advance: (ms: number) => { time += ms; }, redisOff: () => { redisDown = true; }, providerFails: () => { sendFailure = true; } };
}

describe("contact server boundary", () => {
  test("valid message uses a fixed sender, fixed recipient, plain text and reply-to", async () => {
    const f = fixture(); const body = await f.valid();
    expect((await f.post({ ...body, to: "attacker@example.com", from: "spoof@example.com" })).status).toBe(200);
    expect(f.sends[0].body.from).toBe("Gabcat Portfolio <contact@generalsonline.app>");
    expect(f.sends[0].body.to).toEqual(["catimbanggabriel@gmail.com"]);
    expect(f.sends[0].body.reply_to).toBe(body.email);
    expect(f.sends[0].body.html).toBeUndefined();
    expect(f.sends[0].body.text).toContain(body.message);
  });
  test("rejects foreign origins without calling Redis or Resend", async () => {
    const f = fixture(); f.redisOff();
    expect((await f.post({}, { origin: "https://evil.example" })).status).toBe(403);
    expect(f.sends).toHaveLength(0);
  });
  test("rejects missing origin and cross-site fetches", async () => {
    const f = fixture();
    expect((await f.handle(new Request("https://gabcat.dev/api/contact", { method: "POST" }), "1.2.3.4")).status).toBe(403);
    expect((await f.handle(new Request("https://gabcat.dev/api/contact", { headers: { "sec-fetch-site": "cross-site" } }), "1.2.3.4")).status).toBe(403);
  });
  test("honeypot pretends success but never sends", async () => {
    const f = fixture(); expect((await f.post({ website: "spam" })).status).toBe(200); expect(f.sends).toHaveLength(0);
  });
  test("rejects unsupported methods and media types", async () => {
    const f = fixture(); expect((await f.handle(new Request("https://gabcat.dev/api/contact", { method: "DELETE" }), "x")).status).toBe(405);
    expect((await f.post({}, { type: "text/plain" })).status).toBe(415);
  });
  test("enforces actual streamed bytes without Content-Length", async () => {
    const f = fixture(); const body = await f.valid();
    expect((await f.post({ ...body, message: "x".repeat(17000) })).status).toBe(413); expect(f.sends).toHaveLength(0);
  });
  test("malformed JSON is a client error", async () => {
    const f = fixture();
    expect((await f.handle(new Request("https://gabcat.dev/api/contact", { method: "POST", headers: { Origin: f.env.CONTACT_ORIGIN, "Content-Type": "application/json" }, body: "{" }), "1.2.3.4")).status).toBe(400);
  });
  for (const [key, value] of [["name", "A"], ["name", "Name\r\nBcc: attacker@example.com"], ["email", "no-email"], ["email", "a..b@example.com"], ["email", "a@example.com\nBcc:x"], ["message", "short"], ["message", "x".repeat(5001)], ["topic", "Injected subject"], ["token", "forged.token"]]) {
    test(`rejects invalid ${key}: ${String(value).slice(0, 22)}`, async () => {
      const f = fixture(); expect((await f.post({ ...await f.valid(), [key]: value })).status).toBe(400); expect(f.sends).toHaveLength(0);
    });
  }
  test("signed token rejects changed IP, too-fast and expired submissions", async () => {
    const f = fixture(); const body = await f.valid();
    expect((await f.post(body, { ip: "203.0.113.99" })).status).toBe(400);
    f.advance(-3500); expect((await f.post(body)).status).toBe(400);
    f.advance(1_801_000); expect((await f.post(body)).status).toBe(400); expect(f.sends).toHaveLength(0);
  });
  test("same form cannot be reused with changed content", async () => {
    const f = fixture(); const body = await f.valid(); expect((await f.post(body)).status).toBe(200);
    expect((await f.post({ ...body, message: "A different message on a reused form session." })).status).toBe(409); expect(f.sends).toHaveLength(1);
  });
  test("same-message retries preserve Resend idempotency key", async () => {
    const f = fixture(); const body = await f.valid(); await f.post(body); await f.post(body);
    expect(f.sends[0].headers["Idempotency-Key"]).toBe(f.sends[1].headers["Idempotency-Key"]);
  });
  test("sender limit returns 429 and Retry-After", async () => {
    const f = fixture(); for (let i = 0; i < 3; i++) expect((await f.post(await f.valid())).status).toBe(200);
    const response = await f.post(await f.valid()); expect(response.status).toBe(429); expect(response.headers.get("Retry-After")).toBe("3600"); expect(f.sends).toHaveLength(3);
  });
  test("IP limit survives rotating email addresses", async () => {
    const f = fixture(); for (let i = 0; i < 5; i++) expect((await f.post({ ...await f.valid(), email: `v${i}@example.com` })).status).toBe(200);
    expect((await f.post({ ...await f.valid(), email: "another@example.com" })).status).toBe(429); expect(f.sends).toHaveLength(5);
  });
  test("global cap survives rotating IP and email addresses", async () => {
    const f = fixture(); for (let i = 0; i < 30; i++) { const ip = `203.0.113.${i}`; expect((await f.post({ ...await f.valid(ip), email: `v${i}@example.com` }, { ip })).status).toBe(200); }
    const ip = "203.0.113.100"; expect((await f.post({ ...await f.valid(ip), email: "next@example.com" }, { ip })).status).toBe(429); expect(f.sends).toHaveLength(30);
  });
  test("attempt limit counts invalid requests too", async () => {
    const f = fixture(); for (let i = 0; i < 8; i++) await f.post({}); expect((await f.post({})).status).toBe(429);
  });
  test("token requests are rate limited and never cached", async () => {
    const f = fixture(); for (let i = 0; i < 30; i++) expect((await f.get()).headers.get("cache-control")).toBe("no-store"); expect((await f.get()).status).toBe(429);
    f.advance(901_000); expect((await f.get()).status).toBe(200);
  });
  test("fails closed with missing credentials, trusted IP, or unavailable protection", async () => {
    const f = fixture(); const body = await f.valid(); f.redisOff(); expect((await f.post(body)).status).toBe(503); expect(f.sends).toHaveLength(0);
    expect((await f.handle(new Request("https://gabcat.dev/api/contact"), null)).status).toBe(503);
    const handle = createContactHandler({ env: {} }); expect((await handle(new Request("https://gabcat.dev/api/contact"), "x")).status).toBe(503);
  });
  test("provider errors never report success or leak details", async () => {
    const f = fixture(); const body = await f.valid(); f.providerFails(); const res = await f.post(body); expect(res.status).toBe(502); expect(await res.text()).not.toContain("private provider detail");
  });
  test("multiple handler instances share the protection store", async () => {
    const f = fixture(); for (let i = 0; i < 8; i++) await f.post({});
    const other = createContactHandler({ env: f.env, command: f.command });
    expect((await other(new Request("https://gabcat.dev/api/contact", { method: "POST", headers: { Origin: f.env.CONTACT_ORIGIN } }), "203.0.113.42")).status).toBe(429);
  });
});
