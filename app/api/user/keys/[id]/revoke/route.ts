import { revokePlatformApiKey } from "@backend/db/queries";
import { checkRateLimit, getClientIp } from "@backend/rateLimiter";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { isAllowedFirstPartyOrigin } from "@/lib/request-security";

const KEY_REVOKE_USER_LIMIT = 30;
const KEY_REVOKE_IP_LIMIT = 60;
const KEY_REVOKE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	if (!isAllowedFirstPartyOrigin(req)) {
		return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
	}

	try {
		const { id } = await params;
		if (
			!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
				id,
			)
		) {
			return NextResponse.json({ error: "Invalid key id" }, { status: 400 });
		}

		const clientIp = getClientIp(req);
		const userRate = checkRateLimit(
			`user:${session.user.id}:api-key-revoke`,
			KEY_REVOKE_USER_LIMIT,
			KEY_REVOKE_WINDOW_MS,
		);
		const ipRate = checkRateLimit(
			`ip:${clientIp}:api-key-revoke`,
			KEY_REVOKE_IP_LIMIT,
			KEY_REVOKE_WINDOW_MS,
		);

		if (!userRate.allowed || !ipRate.allowed) {
			return NextResponse.json(
				{ error: "Too many revoke attempts. Please try again later." },
				{ status: 429 },
			);
		}

		const revoked = await revokePlatformApiKey(id, session.user.id);
		return NextResponse.json(revoked);
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to revoke key" },
			{ status: 500 },
		);
	}
}
