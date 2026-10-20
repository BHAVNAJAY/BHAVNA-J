/**
 * Request rate limiting for /api/chat.
 *
 * - If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, counts live in Redis, so the limit holds
 *   across serverless instances and restarts (recommended for production; Upstash has a free tier).
 * - Otherwise it falls back to an in-memory counter. That is fine for local development, but each server
 *   instance counts separately, so on serverless hosting it only slows abuse down — set the Upstash vars.
 *
 * Tunable with RATE_LIMIT_MAX (requests, default 12) and RATE_LIMIT_WINDOW_SEC (default 60).
 */
const MAX = Number(process.env.RATE_LIMIT_MAX) > 0 ? Number(process.env.RATE_LIMIT_MAX) : 12;
const WINDOW = Number(process.env.RATE_LIMIT_WINDOW_SEC) > 0 ? Number(process.env.RATE_LIMIT_WINDOW_SEC) : 60;

export type RateResult = { allowed: boolean; retryAfter: number };

const memory = new Map<string, { count: number; reset: number }>();

function memoryLimit(key: string): RateResult {
  const now = Date.now();
  if (memory.size > 5000) for (const [k, v] of memory) if (v.reset < now) memory.delete(k);
  let entry = memory.get(key);
  if (!entry || entry.reset < now) {
    entry = { count: 0, reset: now + WINDOW * 1000 };
    memory.set(key, entry);
  }
  entry.count += 1;
  return { allowed: entry.count <= MAX, retryAfter: Math.max(1, Math.ceil((entry.reset - now) / 1000)) };
}

async function redisLimit(key: string, url: string, token: string): Promise<RateResult | null> {
  try {
    const bucket = Math.floor(Date.now() / (WINDOW * 1000));
    const k = `chat:${key}:${bucket}`;
    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", k],
        ["EXPIRE", k, String(WINDOW * 2)],
      ]),
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: number }[];
    const count = Number(data?.[0]?.result);
    if (!Number.isFinite(count)) return null;
    const retryAfter = WINDOW - (Math.floor(Date.now() / 1000) % WINDOW);
    return { allowed: count <= MAX, retryAfter };
  } catch {
    return null; // Redis unreachable: fall back to the in-memory limiter rather than failing the request
  }
}

export async function checkRateLimit(key: string): Promise<RateResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const r = await redisLimit(key, url, token);
    if (r) return r;
  }
  return memoryLimit(key);
}
