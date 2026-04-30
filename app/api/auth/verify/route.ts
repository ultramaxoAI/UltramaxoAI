import {
	getUser,
	setEmailVerified,
	verifyVerificationCode,
} from "@backend/db/queries";
import { sendWelcomeEmail } from "@backend/email";
import { NextResponse } from "next/server";
import { z } from "zod";

const verifyRequestSchema = z.object({
	email: z
		.string()
		.email()
		.transform((email) => email.trim().toLowerCase()),
	code: z.string().min(16).max(128),
});

export async function POST(request: Request) {
	try {
		const parsedBody = verifyRequestSchema.safeParse(await request.json());

		if (!parsedBody.success) {
			return NextResponse.json(
				{ error: "Email dan kode verifikasi harus diisi" },
				{ status: 400 },
			);
		}

		const { email, code } = parsedBody.data;
		const isValid = await verifyVerificationCode(email, code);
		if (!isValid) {
			return NextResponse.json(
				{ error: "Kode verifikasi salah atau kedaluwarsa" },
				{ status: 400 },
			);
		}

		await setEmailVerified(email);

		// Send Welcome Email
		const [user] = await getUser(email);
		if (user) {
			// Don't await strictly to prevent slow response, but good to ensure
			await sendWelcomeEmail(email, user.name || "User");
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("API Error (verify):", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan internal" },
			{ status: 500 },
		);
	}
}
