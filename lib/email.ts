const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM = process.env.RESEND_FROM || "Ultramaxo AI <noreply@send.ultramaxo.tech>";

async function sendResendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not configured; skipping send.");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[email] Resend error:", text);
      return false;
    }

    const data = await response.json();
    console.info("[email] Resend sent:", { to, subject, id: data.id });
    return true;
  } catch (err) {
    console.error("[email] Resend exception:", err);
    return false;
  }
}

export async function sendVerificationEmail(email: string, code: string) {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); color: white; border-radius: 20px;">
      <div style="background: #111; border-radius: 16px; padding: 40px; border: 1px solid #333;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 700;">Verifikasi Akun</h1>
        </div>
        
        <p style="color: #ccc; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          Terima kasih telah mendaftar di <strong>Ultramaxo AI</strong>. Gunakan kode verifikasi di bawah untuk mengaktifkan akun Anda:
        </p>
        
        <div style="background: #222; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0; border: 1px dashed #444;">
          <div style="font-size: 36px; font-weight: 800; color: #fff; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</div>
        </div>
        
        <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 24px;">
          Kode ini akan kedaluwarsa dalam <strong>10 menit</strong>. Jika Anda tidak mendaftar, abaikan email ini.
        </p>
        
        <hr style="border: none; border-top: 1px solid #333; margin: 32px 0;">
        
        <p style="color: #666; font-size: 12px; text-align: center; margin: 0;">
          Email otomatis dari Ultramaxo AI • Jangan reply email ini
        </p>
      </div>
    </div>
  `;
  return sendResendEmail(email, "🔐 Kode Verifikasi Ultramaxo AI", html);
}
