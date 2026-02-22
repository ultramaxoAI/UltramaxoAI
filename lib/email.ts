import { Resend } from "resend";
import { getEmailWrapper } from "./email-wrapper";

// Resend Configuration from environment variables
const resend = new Resend(process.env.RESEND_API_KEY || "re_missing_key");

// Authorized domains should match the ones verified on Resend
const EMAIL_FROM =
	process.env.RESEND_FROM ||
	process.env.EMAIL_FROM ||
	"Ultramaxo AI <no-reply@ultramaxo.tech>";

// Re-export wrapper for convenience if needed, but primary usage is internal here
export { getEmailWrapper } from "./email-wrapper";

async function sendEmail(to: string, subject: string, html: string) {
	if (!process.env.RESEND_API_KEY) {
		console.warn("[email] RESEND_API_KEY not configured; skipping send.");
		return false;
	}

	// Generate plain text fallback for better email deliverability (stops spam filtering)
	const text = html
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<[^>]*>?/gm, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	try {
		const { data, error } = await resend.emails.send({
			from: EMAIL_FROM,
			to: [to],
			subject,
			html,
			text,
		});

		if (error) {
			console.error("[email] Resend API error:", error);
			return false;
		}

		console.info("[email] Email sent successfully via Resend:", {
			to,
			subject,
			id: data?.id,
		});
		return true;
	} catch (err) {
		console.error("[email] Unexpected send error:", err);
		return false;
	}
}

export async function sendVerificationEmail(email: string, token: string) {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ultramaxo.tech";
	const verificationUrl = `${baseUrl}/verify?token=${token}&email=${encodeURIComponent(
		email,
	)}`;

	const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 28px;">Verifikasi Akun</h1>
      <p>Terima kasih telah mendaftar di <strong>Ultramaxo AI</strong>. Silakan klik tombol di bawah ini untuk memverifikasi akun Anda:</p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verificationUrl}" class="button" style="display: inline-block; padding: 14px 28px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Verifikasi Sekarang</a>
    </div>
    
    <p style="text-align: center; font-size: 14px; opacity: 0.8;">
      Link ini akan kedaluwarsa dalam <strong>10 menit</strong>. Jika Anda tidak mendaftar, abaikan email ini.
    </p>
  `;
	return await sendEmail(
		email,
		"🔐 Verifikasi Akun Ultramaxo AI",
		getEmailWrapper(content),
	);
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
	const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 28px;">Reset Password</h1>
      <p>Kami menerima permintaan reset password untuk akun Anda. Klik tombol di bawah untuk melanjutkan.</p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    
    <p style="text-align: center; font-size: 14px; opacity: 0.8;">
      Link ini akan kedaluwarsa dalam <strong>1 jam</strong>. Jika Anda tidak meminta reset password, abaikan email ini.
    </p>
  `;
	return await sendEmail(
		email,
		"🔑 Reset Password Ultramaxo AI",
		getEmailWrapper(content),
	);
}

export async function sendUpgradeReminderEmail(email: string, name: string) {
	// Use the template content but inject variables manually here
	// Ideally, we import from email-templates.ts but avoid circular dep or just keep logic simple
	const content = `
    <p>Halo <strong>${name}</strong>,</p>

    <p>Kami melihat Anda sangat aktif menggunakan Ultramaxo AI. Maksimalkan pengalaman Anda dengan fitur <strong>PRO</strong>:</p>

    <ul>
      <li>✨ Akses Ultra Agent Pro (Lebih Cerdas, Logika Tinggi & Coding Expert)</li>
      <li>⚡ Respon Lebih Cepat & Prioritas Antrian</li>
      <li>🎨 Generate Image Tanpa Batas</li>
      <li>📂 Upload Dokumen & Analisis Data</li>
    </ul>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://ultramaxo.tech/pricing" class="button">UPGRADE SEKARANG</a>
    </div>

    <p style="text-align: center;">Jangan lewatkan kesempatan untuk meningkatkan produktivitas Anda!</p>
  `;

	return await sendEmail(
		email,
		"✨ Unlock Full Potential dengan Ultramaxo PRO!",
		getEmailWrapper(content),
	);
}

export async function sendWelcomeEmail(email: string, name: string) {
	const content = `
    <p>Halo <strong>${name}</strong>,</p>

    <p>Selamat datang di <strong>Ultramaxo AI</strong>! Kami sangat senang Anda bergabung dengan komunitas kami yang terus berkembang.</p>

    <p>Dengan Ultramaxo, Anda kini memiliki akses ke:</p>
    <ul>
      <li>🤖 <strong>Ultra Agent:</strong> Asisten AI cerdas untuk tugas sehari-hari.</li>
      <li>⚡ <strong>Kecepatan Kilat:</strong> Dapatkan jawaban instan untuk pertanyaan kompleks Anda.</li>
      <li>🔒 <strong>Privasi Terjamin:</strong> Data Anda aman bersama kami.</li>
    </ul>

    <p>Siap memulai? Coba buat percakapan pertama Anda sekarang!</p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="https://ultramaxo.tech/chat" class="button">Mulai Chatting</a>
    </div>
  `;

	return await sendEmail(
		email,
		"👋 Selamat Datang di Era Baru AI - Ultramaxo",
		getEmailWrapper(content),
	);
}

export async function sendCustomEmail(
	email: string,
	subject: string,
	body: string,
) {
	// \`body\` is expected to be HTML fragment
	// Replace newlines with <br/> only if it doesn't look like HTML
	const isHtml = /<[a-z][\s\S]*>/i.test(body);
	const formattedBody = isHtml ? body : body.replace(/\n/g, "<br/>");

	return await sendEmail(email, subject, getEmailWrapper(formattedBody));
}
