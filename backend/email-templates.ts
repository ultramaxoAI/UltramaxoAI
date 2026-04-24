export interface EmailTemplate {
	id: string;
	name: string;
	subject: string;
	body: string;
	type:
		| "custom"
		| "upgrade-reminder"
		| "verification-test"
		| "welcome"
		| "announcement"
		| "forgot-password";
}

export const TEMPLATE_WRAPPER = (bodyContent: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultramaxo AI Notification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 40px; margin-bottom: 40px;">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 40px; border-bottom: 1px solid #f1f5f9; text-align: center; background-color: #ffffff;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">Ultramaxo<span style="color: #4f46e5;">AI</span></h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            ${bodyContent}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- Full Width Footer Section -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-top: 1px solid #e2e8f0;">
        <tr>
            <td align="center" style="padding: 48px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; text-align: center;">
                    <tr>
                        <td>
                            <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #0f172a;">Ultramaxo AI</h3>
                            <p style="margin: 0 0 24px; font-size: 14px; color: #64748b; line-height: 1.6;">
                                The intelligent workspace for chat, artifacts, and high-performance AI execution. Built for real work.
                            </p>
                            
                            <!-- Links Grid -->
                            <div style="margin-bottom: 32px;">
                                <a href="https://ultramaxo.tech" style="color: #4f46e5; text-decoration: none; font-size: 13px; font-weight: 600; margin: 0 12px;">Product</a>
                                <a href="https://ultramaxo.tech/chat/settings" style="color: #4f46e5; text-decoration: none; font-size: 13px; font-weight: 600; margin: 0 12px;">Settings</a>
                                <a href="https://ultramaxo.tech/privacy" style="color: #4f46e5; text-decoration: none; font-size: 13px; font-weight: 600; margin: 0 12px;">Privacy</a>
                                <a href="https://ultramaxo.tech/terms" style="color: #4f46e5; text-decoration: none; font-size: 13px; font-weight: 600; margin: 0 12px;">Terms</a>
                            </div>

                            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 24px;">

                            <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                                © ${new Date().getFullYear()} Ultramaxo AI. All rights reserved.<br>
                                You are receiving this because you signed up for Ultramaxo AI.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

export const EMAIL_TEMPLATES: EmailTemplate[] = [
	{
		id: "custom",
		name: "Custom Broadcast",
		subject: "",
		body: "",
		type: "custom",
	},
	{
		id: "welcome",
		name: "Welcome Onboarding",
		subject: "Welcome to Ultramaxo AI 🚀",
		body: TEMPLATE_WRAPPER(`
<h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #09090b;">Welcome aboard, {{NAME}}!</h2>
<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    Thank you for joining <strong>Ultramaxo AI</strong>. We're thrilled to have you as part of our growing community of innovators, developers, and creators.
</p>
<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    With your new account, you now have access to ultra-fast inference, advanced logic models, and a sleek workspace designed for high-performance productivity.
</p>

<!-- Features List -->
<div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
    <h3 style="margin: 0 0 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Getting Started</h3>
    <ul style="margin: 0; padding: 0 0 0 20px; color: #334155; font-size: 15px; line-height: 1.6;">
        <li style="margin-bottom: 8px;"><strong>Start a Chat:</strong> Create a new session and talk to our intelligent agents.</li>
        <li style="margin-bottom: 8px;"><strong>BYOK Support:</strong> Plug in your own API keys in the Settings page.</li>
        <li style="margin-bottom: 0;"><strong>PRO Tier:</strong> Upgrade anytime for unlimited access.</li>
    </ul>
</div>

<div style="text-align: center; margin: 32px 0;">
    <a href="https://ultramaxo.tech/chat" style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; transition: background-color 0.2s;">Go to Dashboard</a>
</div>
<p style="margin: 0; font-size: 15px; line-height: 1.6; color: #71717a;">
    If you have any questions, feel free to reply to this email. We're always here to help!
</p>
        `),
		type: "welcome",
	},
	{
		id: "forgot-password",
		name: "Password Reset",
		subject: "Reset Your Ultramaxo AI Password",
		body: TEMPLATE_WRAPPER(`
<h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #09090b;">Password Reset Request</h2>
<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    Hello {{NAME}},
</p>
<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    We received a request to reset the password for your Ultramaxo AI account associated with this email address.
</p>

<div style="text-align: center; margin: 40px 0;">
    <a href="{{RESET_LINK}}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; transition: background-color 0.2s; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">Reset Password</a>
</div>

<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #71717a;">
    If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
</p>
<p style="margin: 0; font-size: 14px; line-height: 1.5; color: #a1a1aa;">
    For security reasons, this link will expire in 1 hour.
</p>
        `),
		type: "forgot-password",
	},
	{
		id: "upgrade-reminder",
		name: "Upgrade to PRO",
		subject: "✨ Maximize Your Productivity with Ultramaxo PRO",
		body: TEMPLATE_WRAPPER(`
<h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #09090b;">Ready to level up, {{NAME}}?</h2>
<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    We noticed you've been loving the features on Ultramaxo AI. If you're ready to break past the daily limits and unlock our most advanced capabilities, it's time to go <strong>PRO</strong>.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px; border-collapse: separate; border-spacing: 0 12px;">
    <tr>
        <td width="30" style="vertical-align: top;"><span style="font-size: 18px;">✨</span></td>
        <td style="font-size: 15px; color: #3f3f46; line-height: 1.5;"><strong>Unlimited Messages:</strong> Chat seamlessly without worrying about daily quota.</td>
    </tr>
    <tr>
        <td width="30" style="vertical-align: top;"><span style="font-size: 18px;">🧠</span></td>
        <td style="font-size: 15px; color: #3f3f46; line-height: 1.5;"><strong>Ultimate Intelligence:</strong> Premium access to top-tier reasoning AI models.</td>
    </tr>
    <tr>
        <td width="30" style="vertical-align: top;"><span style="font-size: 18px;">⚡</span></td>
        <td style="font-size: 15px; color: #3f3f46; line-height: 1.5;"><strong>Priority Network:</strong> Zero queue logic with instant stream response.</td>
    </tr>
</table>

<div style="text-align: center; margin: 40px 0;">
    <a href="https://ultramaxo.tech/pricing" style="display: inline-block; background-image: linear-gradient(to right, #f59e0b, #ea580c); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.2);">Upgrade to PRO Now</a>
</div>
        `),
		type: "upgrade-reminder",
	},
	{
		id: "announcement",
		name: "Platform Announcement",
		subject: "📢 Important Update regarding Ultramaxo AI",
		body: TEMPLATE_WRAPPER(`
<h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #09090b;">Hello there,</h2>
<p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    A new major update has been deployed to the Ultramaxo AI platform, bringing you significantly requested features and massive performance improvements.
</p>

<!-- Content Block -->
<div style="background-color: #ffffff; border-left: 4px solid #4f46e5; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px;">
    <h3 style="margin: 0 0 12px; font-size: 18px; color: #09090b;">Release Highlights</h3>
    <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.5; color: #52525b;">• Redesigned Settings workspace utilizing native UI bindings.</p>
    <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.5; color: #52525b;">• Introduced Voucher Code redeeming (Check your settings panel!).</p>
    <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #52525b;">• Optimized database query calls resulting in 40% faster latency.</p>
</div>

<p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
    Log in today to check out all the new features and continue your deep work session!
</p>

<div style="text-align: center;">
    <a href="https://ultramaxo.tech" style="display: inline-block; background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 12px 28px; border-radius: 8px;">Explore Updates</a>
</div>
        `),
		type: "announcement",
	},
];
