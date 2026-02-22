import { NextResponse } from "next/server";
import { upsertVerificationCode } from "@/lib/db/queries";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
	try {
		const { email } = await request.json();

		if (!email || !email.includes("@")) {
			return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
		}

		// Generate 6-digit code
		const code = Math.floor(100_000 + Math.random() * 900_000).toString();

		// Save to DB
		await upsertVerificationCode(email, code);

		// Send Email
		const sent = await sendVerificationEmail(email, code);

		if (!sent) {
			return NextResponse.json(
				{ error: "Gagal mengirim email verifikasi" },
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
