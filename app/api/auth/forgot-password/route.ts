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
        return NextResponse.json(
          { error: "Email tidak valid" },
          { status: 400 }
        );
      }

      const result = await createPasswordResetTokenForEmail(normalizedEmail);
      if (!result) {
        return NextResponse.json({ success: true });
      }

      const { origin } = new URL(request.url);
      const baseUrl = origin;
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(
        result.token
      )}`;

      const sent = await sendPasswordResetEmail(result.email, resetUrl);
      if (!sent) {
        return NextResponse.json(
          { error: "Gagal mengirim email reset password" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Link reset dikirim",
      });
    }

    if (token && newPassword) {
      if (String(newPassword).length < 6) {
        return NextResponse.json(
          { error: "Password minimal 6 karakter" },
          { status: 400 }
        );
      }

      const consumed = await consumePasswordResetToken(String(token));
      if (!consumed) {
        return NextResponse.json(
          { error: "Token reset tidak valid atau sudah kedaluwarsa" },
          { status: 400 }
        );
      }

      await updateUserPassword(consumed.userId, String(newPassword));
      return NextResponse.json({
        success: true,
        message: "Password berhasil direset",
      });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("API Error (forgot-password):", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}
