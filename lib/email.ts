import nodemailer from "nodemailer";
import { getEmailWrapper } from "./email-wrapper";

// SMTP Configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const EMAIL_FROM =
  process.env.EMAIL_FROM || "Ultramaxo AI <noreply@ultramaxo.tech>";

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (!SMTP_USER || !SMTP_PASS) {
      console.warn(
        "[email] SMTP credentials not configured; email sending disabled."
      );
      return null;
    }

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return transporter;
}

// Re-export wrapper for convenience if needed, but primary usage is internal here
export { getEmailWrapper };

async function sendEmail(to: string, subject: string, html: string) {
  const transport = getTransporter();

  if (!transport) {
    console.warn("[email] Email transport not configured; skipping send.");
    return false;
  }

  try {
    const info = await transport.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.info("[email] Email sent:", {
      to,
      subject,
      messageId: info.messageId,
    });
    return true;
  } catch (err) {
    console.error("[email] Send error:", err);
    return false;
  }
}

export async function sendVerificationEmail(email: string, code: string) {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 28px;">Verifikasi Akun</h1>
      <p>Terima kasih telah mendaftar di <strong>Ultramaxo AI</strong>. Gunakan kode verifikasi di bawah untuk mengaktifkan akun Anda:</p>
    </div>
    
    <div style="background: #27272a; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0; border: 1px dashed #3f3f46;">
      <div style="font-size: 36px; font-weight: 800; color: #fff; letter-spacing: 8px; font-family: monospace;">${code}</div>
    </div>
    
    <p style="text-align: center; font-size: 14px; opacity: 0.8;">
      Kode ini akan kedaluwarsa dalam <strong>10 menit</strong>. Jika Anda tidak mendaftar, abaikan email ini.
    </p>
  `;
  return sendEmail(
    email,
    "🔐 Kode Verifikasi Ultramaxo AI",
    getEmailWrapper(content)
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
  return sendEmail(
    email,
    "🔑 Reset Password Ultramaxo AI",
    getEmailWrapper(content)
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

  return sendEmail(
    email,
    "✨ Unlock Full Potential dengan Ultramaxo PRO!",
    getEmailWrapper(content)
  );
}

export async function sendCustomEmail(
  email: string,
  subject: string,
  body: string
) {
  // `body` is expected to be HTML fragment
  // Replace newlines with <br/> only if it doesn't look like HTML
  const isHtml = /<[a-z][\s\S]*>/i.test(body);
  const formattedBody = isHtml ? body : body.replace(/\n/g, "<br/>");

  return sendEmail(email, subject, getEmailWrapper(formattedBody));
}
