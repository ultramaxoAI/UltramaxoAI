import { db, ensureApiCreditAccountForUser } from "@backend/db/queries";
import { platformApiKey } from "@backend/db/schema";
import { checkRateLimit, getClientIp } from "@backend/rateLimiter";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { hashPlatformApiKey } from "@/lib/platform-api-keys";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const BALANCE_KEY_LIMIT = 60;
const BALANCE_IP_LIMIT = 120;
const BALANCE_WINDOW_MS = 60_000;

export async function GET(req: NextRequest) {
	try {
		const authHeader = req.headers.get("authorization");
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return NextResponse.json(
				{ error: { message: "Missing or invalid Authorization header" } },
				{ status: 401, headers: CORS_HEADERS },
			);
		}

		const apiKey = authHeader.split(" ")[1];
		if (!apiKey.startsWith("ux_sk_")) {
			return NextResponse.json(
				{ error: { message: "Invalid API Key format." } },
				{ status: 401, headers: CORS_HEADERS },
			);
		}

		const hashedApiKey = hashPlatformApiKey(apiKey);
		let [keyRecord] = await db
			.select()
			.from(platformApiKey)
			.where(eq(platformApiKey.key, hashedApiKey));

		if (!keyRecord) {
			[keyRecord] = await db
				.select()
				.from(platformApiKey)
				.where(eq(platformApiKey.key, apiKey));
		}

		if (!keyRecord || keyRecord.status !== "active") {
			return NextResponse.json(
				{ error: { message: "Invalid or revoked API Key." } },
				{ status: 401, headers: CORS_HEADERS },
			);
		}

		const clientIp = getClientIp(req);
		const keyRate = checkRateLimit(
			`api-balance:key:${keyRecord.id}`,
			BALANCE_KEY_LIMIT,
			BALANCE_WINDOW_MS,
		);
		const ipRate = checkRateLimit(
			`api-balance:ip:${clientIp}`,
			BALANCE_IP_LIMIT,
			BALANCE_WINDOW_MS,
		);

		if (!keyRate.allowed || !ipRate.allowed) {
			return NextResponse.json(
				{ error: { message: "Rate limit exceeded. Try again later." } },
				{ status: 429, headers: CORS_HEADERS },
			);
		}

		const account = await ensureApiCreditAccountForUser({
			userId: keyRecord.userId,
		});

		return NextResponse.json(
			{
				data: {
					balance_cents: account.balanceCents,
					balance_usd: (account.balanceCents / 100).toFixed(4),
					lifetime_granted_cents: account.lifetimeGrantedCents,
					lifetime_spent_cents: account.lifetimeSpentCents,
				},
			},
			{ headers: CORS_HEADERS },
		);
	} catch (error) {
		console.error("Balance API Error:", error);
		return NextResponse.json(
			{ error: { message: "Internal server error" } },
			{ status: 500, headers: CORS_HEADERS },
		);
	}
}

export async function OPTIONS() {
	return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
