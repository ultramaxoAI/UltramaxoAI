import { NextResponse } from "next/server";
import { upsertVerificationCode } from "@/lib/db/queries";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
	try {
		const { email } = await request.json();

		if (!email || !email.includes("@")) {
			return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
		}

		const code = Math.floor(100_000 + Math.random() * 900_000).toString();
		await upsertVerificationCode(email, code);

		const sent = await sendVerificationEmail(email, code);
		if (!sent) {
			return NextResponse.json(
				{ error: "Failed to send verification email" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("API Error (resend-code):", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan internal" },
			{ status: 500 },
		);
	}
}
