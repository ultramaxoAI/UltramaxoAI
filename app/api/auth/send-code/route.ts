import { randomUUID } from "node:crypto";
import { upsertVerificationCode } from "@backend/db/queries";
import { sendVerificationEmail } from "@backend/email";
import { checkRateLimit, getClientIp } from "@backend/rateLimiter";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { email } = await request.json();
		const normalizedEmail = String(email ?? "")
			.trim()
			.toLowerCase();
		const ip = getClientIp(request);
		const rateLimit = checkRateLimit(
			`verification:${normalizedEmail || ip}`,
			3,
			15 * 60 * 1000,
		);

		if (!rateLimit.allowed) {
			return NextResponse.json(
				{ error: "Terlalu banyak permintaan. Coba lagi nanti." },
				{ status: 429 },
			);
		}

		if (!normalizedEmail || !normalizedEmail.includes("@")) {
			return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
		}

		const code = randomUUID();

		// Save to DB
		await upsertVerificationCode(normalizedEmail, code);

		// Send Email
		const sent = await sendVerificationEmail(normalizedEmail, code);

		if (!sent) {
			return NextResponse.json(
				{ error: "Failed to send verification email" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("API Error (send-code):", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan internal" },
			{ status: 500 },
		);
	}
}
