import { db } from "@backend/db/queries";
import { apiCreditTransaction, platformApiKey } from "@backend/db/schema";
import { checkRateLimit, getClientIp } from "@backend/rateLimiter";
import { and, desc, eq, gte } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { hashPlatformApiKey } from "@/lib/platform-api-keys";

const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const USAGE_KEY_LIMIT = 60;
const USAGE_IP_LIMIT = 120;
const USAGE_WINDOW_MS = 60_000;

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
			`api-usage:key:${keyRecord.id}`,
			USAGE_KEY_LIMIT,
			USAGE_WINDOW_MS,
		);
		const ipRate = checkRateLimit(
			`api-usage:ip:${clientIp}`,
			USAGE_IP_LIMIT,
			USAGE_WINDOW_MS,
		);

		if (!keyRate.allowed || !ipRate.allowed) {
			return NextResponse.json(
				{ error: { message: "Rate limit exceeded. Try again later." } },
				{ status: 429, headers: CORS_HEADERS },
			);
		}

		const { searchParams } = new URL(req.url);
		const days = Math.min(Number(searchParams.get("days") || "30"), 90);
		const limit = Math.min(Number(searchParams.get("limit") || "50"), 100);
		const since = new Date();
		since.setDate(since.getDate() - days);

		const transactions = await db
			.select()
			.from(apiCreditTransaction)
			.where(
				and(
					eq(apiCreditTransaction.userId, keyRecord.userId),
					eq(apiCreditTransaction.type, "spend"),
					gte(apiCreditTransaction.createdAt, since),
				),
			)
			.orderBy(desc(apiCreditTransaction.createdAt))
			.limit(limit);

		const totalSpentCents = transactions.reduce(
			(sum, tx) => sum + Math.abs(tx.amountCents),
			0,
		);

		return NextResponse.json(
			{
				data: {
					period_days: days,
					total_requests: transactions.length,
					total_spent_cents: totalSpentCents,
					total_spent_usd: (totalSpentCents / 100).toFixed(4),
					transactions: transactions.map((tx) => ({
						id: tx.id,
						amount_cents: tx.amountCents,
						balance_after_cents: tx.balanceAfterCents,
						reason: tx.reason,
						metadata: tx.metadata,
						created_at: tx.createdAt,
					})),
				},
			},
			{ headers: CORS_HEADERS },
		);
	} catch (error) {
		console.error("Usage API Error:", error);
		return NextResponse.json(
			{ error: { message: "Internal server error" } },
			{ status: 500, headers: CORS_HEADERS },
		);
	}
}

export async function OPTIONS() {
	return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}
