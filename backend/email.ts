import nodemailer from "nodemailer";
import { TEMPLATE_WRAPPER } from "./email-templates";

// Nodemailer Transport Configuration
const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || "smtp.sumopod.com",
	port: Number(process.env.SMTP_PORT) || 465,
	secure: true, // SSL: True (Port 465)
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

const EMAIL_FROM =
	process.env.EMAIL_FROM || "Ultramaxo AI <no-reply@ultramaxo.tech>";

async function sendEmail(to: string, subject: string, html: string) {
	if (
		!process.env.SMTP_HOST ||
		!process.env.SMTP_USER ||
		!process.env.SMTP_PASS
	) {
		console.warn("[email] SMTP credentials not configured; skipping send.");
		return false;
	}

	// Generate plain text fallback for better email deliverability
	const text = html
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<[^>]*>?/gm, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	try {
		const info = await transporter.sendMail({
			from: EMAIL_FROM,
			to,
			subject,
			text,
			html,
			headers: {
				"List-Unsubscribe": `<mailto:unsubscribe@ultramaxo.tech?subject=unsubscribe>`,
				"List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
				Precedence: "bulk",
				"X-Mailer": "UltramaxoAI/2.0",
			},
		});

		console.info("[email] Email sent successfully:", {
			to,
			subject,
			messageId: info.messageId,
		});
		return true;
	} catch (err) {
		console.error("[email] Unexpected send error:", err);
		return false;
	}
}

// --------------------------------------------------------------------------------------
// TRANSACTIONAL CORE EVENTS
// --------------------------------------------------------------------------------------

export async function sendVerificationEmail(email: string, token: string) {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ultramaxo.tech";
	const verificationUrl = `${baseUrl}/verify?token=${token}&email=${encodeURIComponent(email)}`;

	const content = `
<h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #09090b; letter-spacing: -0.5px;">Verify your account</h2>
<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    Thank you for registering at <strong>Ultramaxo AI</strong>. Please click the button below to verify your email address and activate your account.
</p>
<div style="text-align: center; margin: 40px 0;">
    <a href="${verificationUrl}" style="display: inline-block; background-color: #09090b; box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; transition: opacity 0.2s;">Verify Email</a>
</div>
<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a;">
    This link will expire in <strong>10 minutes</strong>. If you did not sign up for this account, you can safely ignore this email.
</p>
`;
	return await sendEmail(
		email,
		"Verify your Ultramaxo AI account",
		TEMPLATE_WRAPPER(content),
	);
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
	const content = `
<h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #09090b; letter-spacing: -0.5px;">Password Reset</h2>
<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    We received a request to reset your password. Click the button entirely below to securely set a new password for your account.
</p>
<div style="text-align: center; margin: 40px 0;">
    <a href="${resetUrl}" style="display: inline-block; background-color: #09090b; box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; transition: opacity 0.2s;">Reset Password</a>
</div>
<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a;">
    This link will expire in <strong>1 hour</strong>. If you did not request this, please ignore this email.
</p>
`;
	return await sendEmail(
		email,
		"Reset your Ultramaxo AI password",
		TEMPLATE_WRAPPER(content),
	);
}

// --------------------------------------------------------------------------------------
// LIFECYCLE AUTOMATION EVENTS
// --------------------------------------------------------------------------------------

export async function sendWelcomeEmail(email: string, name: string) {
	const content = `
<h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #09090b; letter-spacing: -0.5px;">Welcome to the next generation.</h2>
<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    Hello <strong>${name || "there"}</strong>,<br/><br/>
    We're absolutely thrilled to welcome you to <strong>Ultramaxo AI</strong>. You've just unlocked access to an advanced ecosystem for high-performance reasoning, autonomous workflows, and limitless productivity.
</p>
<div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
    <h3 style="margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Next Steps</h3>
    <ul style="margin: 0; padding: 0 0 0 20px; color: #334155; font-size: 15px; line-height: 1.6;">
        <li style="margin-bottom: 8px;"><strong>Initiate a Session:</strong> Start chatting with our intelligent reasoning agents.</li>
        <li style="margin-bottom: 8px;"><strong>Bring Your Keys:</strong> Plug in your API keys in Settings.</li>
        <li style="margin-bottom: 0;"><strong>Scale with PRO:</strong> Upgrade anytime for unlimited, prioritized intelligence.</li>
    </ul>
</div>
<div style="text-align: center; margin: 40px 0;">
    <a href="https://ultramaxo.tech/chat" style="display: inline-block; background-color: #09090b; box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; transition: opacity 0.2s;">Open Dashboard</a>
</div>
`;
	return await sendEmail(
		email,
		"Welcome to Ultramaxo AI",
		TEMPLATE_WRAPPER(content),
	);
}

export async function sendProUpgradeEmail(email: string, name: string) {
	const content = `
<h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #09090b; letter-spacing: -0.5px;">You're officially PRO ✨</h2>
<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    Thank you for upgrading, <strong>${name || "there"}</strong>! Your account has been successfully elevated to PRO status.
</p>
<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    You now have <strong>unlimited access</strong> to our most advanced reasoning models, prioritized zero-queue streams, and premium capabilities. There are no more limits holding you back.
</p>
<div style="text-align: center; margin: 40px 0;">
    <a href="https://ultramaxo.tech/chat" style="display: inline-block; background-color: #09090b; box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; transition: opacity 0.2s;">Start Deep Work</a>
</div>
<p style="margin: 0; font-size: 14px; line-height: 1.6; color: #71717a;">
    A receipt of your transaction is available in your account settings. If you need any assistance, hit reply to this email.
</p>
`;
	return await sendEmail(
		email,
		"Your Ultramaxo PRO upgrade is confirmed",
		TEMPLATE_WRAPPER(content),
	);
}

export async function sendProExpiringEmail(email: string, name: string) {
	const content = `
<h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #09090b; letter-spacing: -0.5px;">Action Required: PRO Access Expiring</h2>
<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    Hello <strong>${name || "there"}</strong>,<br/><br/>
    We wanted to remind you that your Ultramaxo PRO subscription is scheduled to expire in exactly <strong>3 days</strong>.
</p>
<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    To ensure you do not lose access to unlimited queries, complex reasoning models, and zero-queue prioritization, please verify your plan status.
</p>
<div style="text-align: center; margin: 40px 0;">
    <a href="https://ultramaxo.tech/pricing" style="display: inline-block; background-color: #09090b; box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; transition: opacity 0.2s;">Extend PRO Pass</a>
</div>
`;
	return await sendEmail(
		email,
		"Your Ultramaxo PRO plan expires in 3 days",
		TEMPLATE_WRAPPER(content),
	);
}

export async function sendProExpiredEmail(email: string, name: string) {
	const content = `
<h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #09090b; letter-spacing: -0.5px;">Your PRO Pass Has Expired</h2>
<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    Hello <strong>${name || "there"}</strong>,<br/><br/>
    Your Ultramaxo PRO subscription has officially concluded. Your account has been safely transitioned back to the free tier limits.
</p>
<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    You can still use all basic functions, but daily limits will apply to high-reasoning intelligence models. Whenever you're ready to break the limits again, we'll be waiting.
</p>
<div style="text-align: center; margin: 40px 0;">
    <a href="https://ultramaxo.tech/pricing" style="display: inline-block; background-color: #09090b; box-shadow: 0 4px 12px rgba(0,0,0,0.15); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; transition: opacity 0.2s;">Upgrade to PRO</a>
</div>
`;
	return await sendEmail(
		email,
		"Your Ultramaxo PRO subscription has ended.",
		TEMPLATE_WRAPPER(content),
	);
}

// --------------------------------------------------------------------------------------
// GENERIC BROADCAST HOOK
// --------------------------------------------------------------------------------------

export async function sendCustomEmail(
	email: string,
	subject: string,
	body: string,
) {
	const isHtml = /<[a-z][\s\S]*>/i.test(body);
	const formattedBody = isHtml ? body : body.replace(/\n/g, "<br/>");
	return await sendEmail(email, subject, TEMPLATE_WRAPPER(formattedBody));
}
