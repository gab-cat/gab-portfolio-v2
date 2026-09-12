import { createContactHandler } from "../server/contact";

const handle = createContactHandler({ env: process.env });
function route(request: Request) {
  // Vercel overwrites this header; never trust a user-supplied X-Forwarded-For.
  const ip = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? null : null;
  return handle(request, ip);
}
export const GET = route;
export const POST = route;
