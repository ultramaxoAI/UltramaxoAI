// Simple in-memory rate limiter (per-key).
// NOTE: Resets on server restart; intended as a basic abuse protection layer.

type Bucket = { timestamps: number[] };

const buckets: Record<string, Bucket> = {};

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets[key] || { timestamps: [] };

  // keep only hits within window
  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);

  const remaining = limit - bucket.timestamps.length;
  const allowed = remaining > 0;

  if (allowed) {
    bucket.timestamps.push(now);
  }

  buckets[key] = bucket;

  return { allowed, remaining: Math.max(remaining - 1, 0) };
}

export function getClientIp(request: Request) {
  const header = request.headers.get("x-forwarded-for") || "";
  const ip = header.split(",")[0]?.trim();
  // next/server Request may expose ip, but keep a generic fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ip || (request as any).ip || "unknown";
}
