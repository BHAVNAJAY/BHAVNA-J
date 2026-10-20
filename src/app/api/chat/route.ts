/**
 * POST /api/chat — Bhavna's AI Portfolio Assistant.
 *
 * Pipeline: origin check → size check → JSON parse → validation → rate limit
 *           → retrieve portfolio evidence → Gemini → JSON answer.
 *
 * Needs a Node server (e.g. Vercel, `next start`, `next dev`). It cannot run on GitHub Pages, which only
 * serves static files — for that setup deploy this repo to Vercel too and point the static site at it with
 * NEXT_PUBLIC_CHAT_API_URL (see README / .env.example).
 *
 * Privacy: visitor messages are never logged. Only error categories are.
 */
import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/assistantInstructions";
import { MAX_BODY_BYTES, parseChatRequest } from "@/lib/chatValidation";
import { ChatError, generateAnswer } from "@/lib/gemini";
import { formatContext, retrieve } from "@/lib/portfolioKnowledge";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Browser origins allowed to call this API from another site (the static GitHub Pages build). */
const ALLOWED_ORIGINS = (process.env.CHAT_ALLOWED_ORIGINS ?? "https://bhavnajay.github.io,http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const h: Record<string, string> = { Vary: "Origin", "Cache-Control": "no-store" };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    h["Access-Control-Allow-Headers"] = "Content-Type";
    h["Access-Control-Max-Age"] = "86400";
  }
  return h;
}

function reply(status: number, body: Record<string, unknown>, origin: string | null, extra: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...corsHeaders(origin), ...extra } });
}

function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || req.headers.get("x-real-ip") || "unknown";
}

/** A cross-origin browser request from a site that is not on the allow-list is refused. */
function originRefused(req: Request, origin: string | null): boolean {
  if (!origin) return false; // same-origin fetches and non-browser clients (curl) send no Origin
  const host = req.headers.get("host");
  let sameHost = false;
  try {
    sameHost = new URL(origin).host === host;
  } catch {
    return true;
  }
  return !sameHost && !ALLOWED_ORIGINS.includes(origin.replace(/\/$/, ""));
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");

  if (originRefused(req, origin)) return reply(403, { error: "This site isn't allowed to use the assistant." }, null);

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return reply(413, { error: "That request is too large." }, origin);

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return reply(400, { error: "Could not read the request." }, origin);
  }
  if (raw.length > MAX_BODY_BYTES) return reply(413, { error: "That request is too large." }, origin);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return reply(400, { error: "Request body must be valid JSON." }, origin);
  }

  const parsed = parseChatRequest(body);
  if (!parsed.ok) return reply(parsed.status, { error: parsed.error }, origin);

  const limit = await checkRateLimit(clientKey(req));
  if (!limit.allowed) {
    return reply(429, { error: "You're asking quickly — please wait a moment and try again." }, origin, {
      "Retry-After": String(limit.retryAfter),
    });
  }

  try {
    const evidence = retrieve(parsed.message);
    const answer = await generateAnswer({
      system: buildSystemPrompt(formatContext(evidence)),
      history: parsed.history,
      message: parsed.message,
    });
    return reply(200, { answer }, origin);
  } catch (err) {
    if (err instanceof ChatError) {
      console.error(`[chat] ${err.status} ${err.publicMessage}`);
      return reply(err.status, { error: err.publicMessage }, origin);
    }
    console.error("[chat] unexpected failure");
    return reply(500, { error: "Something went wrong. Please try again." }, origin);
  }
}
