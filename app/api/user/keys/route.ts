import crypto from "node:crypto";
import {
	createPlatformApiKey,
	getPlatformApiKeysByUserId,
} from "@backend/db/queries";
import { checkRateLimit, getClientIp } from "@backend/rateLimiter";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
	hashPlatformApiKey,
	maskPlatformApiKey,
} from "@/lib/platform-api-keys";
import { isAllowedFirstPartyOrigin } from "@/lib/request-security";

// Security: Generate cryptographically secure API keys
function generateSecureApiKey(): string {
	const randomBytes = crypto.randomBytes(32).toString("hex");
	return `ux_sk_${randomBytes}`;
}

// Security: Input validation
function sanitizeName(name: unknown): string | null {
	if (typeof name !== "string") return null;
	const trimmed = name.trim();
	if (trimmed.length === 0 || trimmed.length > 64) return null;
	// Allow alphanumeric, spaces, hyphens, underscores only
	if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) return null;
	return trimmed;
}

// Security: Rate limit key creation (max 10 keys per user)
const MAX_KEYS_PER_USER = 10;
const KEY_CREATE_USER_LIMIT = 5;
const KEY_CREATE_IP_LIMIT = 20;
const KEY_CREATE_WINDOW_MS = 60 * 60 * 1000;

export async function GET() {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const keys = await getPlatformApiKeysByUserId(session.user.id);
		// Security: Never return full key in list — only masked prefix
		const maskedKeys = keys.map((k) => ({
			...k,
			key: k.key
				? maskPlatformApiKey(k.key)
				: "ux_sk_****************************",
		}));
		return NextResponse.json(maskedKeys);
	} catch {
		return NextResponse.json(
			{ error: "Failed to fetch keys" },
			{ status: 500 },
		);
	}
}

export async function POST(req: Request) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	if (!isAllowedFirstPartyOrigin(req)) {
		return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
	}

	try {
		// Security: Validate Content-Type
		const contentType = req.headers.get("content-type");
		if (!contentType?.includes("application/json")) {
			return NextResponse.json(
				{ error: "Invalid content type" },
				{ status: 400 },
			);
		}

		const clientIp = getClientIp(req);
		const userRate = checkRateLimit(
			`user:${session.user.id}:api-key-create`,
			KEY_CREATE_USER_LIMIT,
			KEY_CREATE_WINDOW_MS,
		);
		const ipRate = checkRateLimit(
			`ip:${clientIp}:api-key-create`,
			KEY_CREATE_IP_LIMIT,
			KEY_CREATE_WINDOW_MS,
		);

		if (!userRate.allowed || !ipRate.allowed) {
			return NextResponse.json(
				{ error: "Too many key creation attempts. Please try again later." },
				{ status: 429 },
			);
		}

		const body = await req.json();

		// Security: Validate name input
		const name = sanitizeName(body.name);
		if (!name) {
			return NextResponse.json(
				{
					error:
						"Key name is required. Use 1-64 alphanumeric characters, hyphens, or underscores.",
				},
				{ status: 400 },
			);
		}

		// Security: Enforce max keys per user
		const existingKeys = await getPlatformApiKeysByUserId(session.user.id);
		const activeKeys = existingKeys.filter((k) => k.status === "active");
		if (activeKeys.length >= MAX_KEYS_PER_USER) {
			return NextResponse.json(
				{
					error: `Maximum ${MAX_KEYS_PER_USER} active API keys allowed. Revoke an existing key first.`,
				},
				{ status: 429 },
			);
		}

		// Security: Generate cryptographically secure key
		const plainKey = generateSecureApiKey();

		const newKey = await createPlatformApiKey({
			userId: session.user.id,
			name,
			key: hashPlatformApiKey(plainKey),
		});

		// Security: Return the full key ONLY on creation (show-once)
		return NextResponse.json({
			id: newKey.id,
			name: newKey.name,
			key: plainKey,
			status: newKey.status,
			createdAt: newKey.createdAt,
		});
	} catch {
		return NextResponse.json(
			{ error: "Failed to create key" },
			{ status: 500 },
		);
	}
}
