// Simple in-memory rate limiter (per-key).
// NOTE: Resets on server restart; intended as a basic abuse protection layer.

import { createClient } from "redis";

type Bucket = { timestamps: number[] };

const buckets: Record<string, Bucket> = {};
type AppRedisClient = ReturnType<typeof createClient>;

let redisClientPromise: Promise<AppRedisClient | null> | null = null;

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

async function getRedisClient() {
	if (!process.env.REDIS_URL) {
		return null;
	}

	if (!redisClientPromise) {
		redisClientPromise = (async () => {
			try {
				const client = createClient({ url: process.env.REDIS_URL });
				client.on("error", () => {});
				await client.connect();
				return client;
			} catch {
				redisClientPromise = null;
				return null;
			}
		})();
	}

	return redisClientPromise;
}

export async function checkApiRateLimit(
	key: string,
	limit: number,
	windowMs: number,
) {
	const redis = await getRedisClient();

	if (!redis) {
		const memoryResult = checkRateLimit(key, limit, windowMs);
		return {
			...memoryResult,
			resetSeconds: Math.ceil(windowMs / 1000),
			storage: "memory" as const,
		};
	}

	try {
		const hits = await redis.incr(key);
		if (hits === 1) {
			await redis.pExpire(key, windowMs);
		}

		const ttlMs = await redis.pTTL(key);
		const remaining = Math.max(limit - hits, 0);

		return {
			allowed: hits <= limit,
			remaining,
			resetSeconds:
				ttlMs > 0 ? Math.max(1, Math.ceil(ttlMs / 1000)) : Math.ceil(windowMs / 1000),
			storage: "redis" as const,
		};
	} catch {
		const memoryResult = checkRateLimit(key, limit, windowMs);
		return {
			...memoryResult,
			resetSeconds: Math.ceil(windowMs / 1000),
			storage: "memory" as const,
		};
	}
}

export function getClientIp(request: Request) {
	const header = request.headers.get("x-forwarded-for") || "";
	const ip = header.split(",")[0]?.trim();
	return ip || (request as { ip?: string }).ip || "unknown";
}
