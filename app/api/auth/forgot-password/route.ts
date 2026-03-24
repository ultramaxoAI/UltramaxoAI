import { NextResponse } from "next/server";
import {
	consumePasswordResetToken,
	createPasswordResetTokenForEmail,
	updateUserPassword,
} from "@/lib/db/queries";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { email, token, newPassword } = body || {};

		if (email && !token && !newPassword) {
			const normalizedEmail = String(email).trim().toLowerCase();
			if (!normalizedEmail.includes("@")) {
				return NextResponse.json({ error: "Invalid email" }, { status: 400 });
			}

			const result = await createPasswordResetTokenForEmail(normalizedEmail);
			if (!result) {
				return NextResponse.json({ success: true });
			}

			const { origin } = new URL(request.url);
			const baseUrl = origin;
			const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(
				result.token,
			)}`;

			const sent = await sendPasswordResetEmail(result.email, resetUrl);
			if (!sent) {
				return NextResponse.json(
					{ error: "Failed to send password reset email" },
					{ status: 500 },
				);
			}

			return NextResponse.json({
				success: true,
				message: "Reset link sent",
			});
		}

		if (token && newPassword) {
			if (String(newPassword).length < 8) {
				return NextResponse.json(
					{ error: "Password must be at least 8 characters" },
					{ status: 400 },
				);
			}

			const consumed = await consumePasswordResetToken(String(token));
			if (!consumed) {
				return NextResponse.json(
					{ error: "Invalid or expired reset token" },
					{ status: 400 },
				);
			}

			await updateUserPassword(consumed.userId, String(newPassword));
			return NextResponse.json({
				success: true,
				message: "Password successfully reset",
			});
		}

		return NextResponse.json({ error: "Invalid request" }, { status: 400 });
	} catch (error) {
		console.error("API Error (forgot-password):", error);
		return NextResponse.json(
			{ error: "Internal error occurred" },
			{ status: 500 },
		);
	}
}
