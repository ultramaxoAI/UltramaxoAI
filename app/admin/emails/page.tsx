"use client";

import { TEMPLATE_WRAPPER } from "@backend/email-templates";
import {
	CheckCircle2Icon,
	EyeIcon,
	LayoutTemplateIcon,
	Loader2,
	MailIcon,
	SendIcon,
	UsersIcon,
} from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";

// Simple markdown parsing for admin templates
function parseMarkdownToHtml(text: string) {
	if (!text) return "";

	let html = text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

	html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
	html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
	html = html.replace(
		/\[(.*?)\]\((.*?)\)/g,
		'<a href="$2" style="color: #4f46e5; text-decoration: underline;">$1</a>',
	);

	// Convert line breaks to paragraphs
	const paragraphs = html.split(/\n\n+/);
	html = paragraphs
		.map((p) => {
			const lines = p.split("\n").join("<br />");
			return `<p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">${lines}</p>`;
		})
		.join("");

	return html;
}

export default function AdminEmailsPage() {
	const [loading, setLoading] = useState(false);

	const [formData, setFormData] = useState({
		recipientType: "single",
		type: "pro_upgrade", // 'update', 'promo', 'newsletter', 'maintenance', 'feedback', 'pro_upgrade', 'pro_expiring'
		email: "",
		name: "",
		subject: "Welcome to Ultramaxo PRO! 🚀",
		headline: "You're officially PRO",
		bodyText:
			"Thank you for upgrading! Your account has been successfully elevated to PRO status.\n\nYou now have unlimited access to our most advanced reasoning models, prioritized processing, and exclusive features.",
		ctaText: "Start Chatting Now",
		ctaLink: "https://ultramaxo.tech/chat",
	});

	// Synchronize defaults on type changes
	useEffect(() => {
		if (formData.type === "promo") {
			setFormData((prev) => ({
				...prev,
				subject: "Exclusive Offer for You",
				headline: "Unlock Pro Power",
				bodyText:
					"We're giving you an exclusive opportunity to upgrade your Ultramaxo AI experience today.\n\nTake your productivity to the next level with our premium reasoning models.",
				ctaText: "Upgrade Account",
				ctaLink: "https://ultramaxo.tech/pricing",
			}));
		} else if (formData.type === "update") {
			setFormData((prev) => ({
				...prev,
				subject: "Action Required / Important Update",
				headline: "Important Update",
				bodyText:
					"We wanted to let you know about a recent update to our platform.\n\nPlease review these changes at your earliest convenience.",
				ctaText: "View Details",
				ctaLink: "https://ultramaxo.tech",
			}));
		} else if (formData.type === "newsletter") {
			setFormData((prev) => ({
				...prev,
				subject: "Ultramaxo Weekly Digest",
				headline: "Your Weekly AI Insights",
				bodyText:
					"Here are the top AI breakthroughs and platform news from this week.\n\n**1. Faster Inference**\nOur new infrastructure handles queries 40% faster.\n\n**2. New Agent Frameworks**\nBuild autonomous agents with our new SDK update.",
				ctaText: "Read the Blog",
				ctaLink: "https://ultramaxo.tech/blog",
			}));
		} else if (formData.type === "maintenance") {
			setFormData((prev) => ({
				...prev,
				subject: "Scheduled Maintenance Notice",
				headline: "Maintenance Notice",
				bodyText:
					"We will be performing scheduled server maintenance this weekend to improve system reliability.\n\nExpected downtime is approximately 2 hours. We apologize for any inconvenience.",
				ctaText: "Check Status Page",
				ctaLink: "https://ultramaxo.tech",
			}));
		} else if (formData.type === "feedback") {
			setFormData((prev) => ({
				...prev,
				subject: "How are we doing?",
				headline: "We value your input",
				bodyText:
					"Your feedback helps us build a better AI platform for everyone.\n\nCould you spare 2 minutes to answer a few quick questions about your experience?",
				ctaText: "Take the Survey",
				ctaLink: "https://ultramaxo.tech",
			}));
		} else if (formData.type === "pro_upgrade") {
			setFormData((prev) => ({
				...prev,
				subject: "Welcome to Ultramaxo PRO! 🚀",
				headline: "You're officially PRO",
				bodyText:
					"Thank you for upgrading! Your account has been successfully elevated to PRO status.\n\nYou now have unlimited access to our most advanced reasoning models, prioritized processing, and exclusive features.\n\nReceipt of your transaction is available in your account settings.",
				ctaText: "Start Chatting Now",
				ctaLink: "https://ultramaxo.tech/chat",
			}));
		} else if (formData.type === "pro_expiring") {
			setFormData((prev) => ({
				...prev,
				subject: "Your Ultramaxo PRO plan is expiring soon",
				headline: "Subscription Expiring",
				bodyText:
					"We wanted to remind you that your Ultramaxo PRO subscription is scheduled to expire in **3 days**.\n\nTo ensure you don't lose access to unlimited queries and premium reasoning models, please verify your payment method.",
				ctaText: "Manage Subscription",
				ctaLink: "https://ultramaxo.tech/settings/billing",
			}));
		}
	}, [formData.type]);

	const handleChange = (
		e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
	) => setFormData({ ...formData, [e.target.name]: e.target.value });

	// Compute internal HTML content
	const getInternalContentHtml = () => {
		const parsedBody = parseMarkdownToHtml(formData.bodyText);

		let ctaHtml = "";
		if (formData.ctaText && formData.ctaLink) {
			// Sleek black for everything for a more premium, professional feel
			const btnColor =
				"background-color: #09090b; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);";

			ctaHtml = `
<div style="text-align: center; margin: 40px 0;">
    <a href="${formData.ctaLink}" style="display: inline-block; ${btnColor} color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; transition: opacity 0.2s;">${formData.ctaText}</a>
</div>`;
		}

		return `
<h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #09090b; letter-spacing: -0.5px;">${formData.headline}</h2>
${parsedBody}
${ctaHtml}
        `;
	};

	// Computing the Live Preview HTML inside the frame
	const generatePreviewHtml = () => {
		let html = TEMPLATE_WRAPPER(getInternalContentHtml());
		const recipientName = formData.name || "Customer";
		html = html.replace(/{{NAME}}/g, recipientName);
		return html;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		// Bake the HTML using the dynamic wrapper
		const finalHtml = TEMPLATE_WRAPPER(getInternalContentHtml());

		const payload = {
			recipientType: formData.recipientType,
			type: "custom", // Send as custom so backend API natively supports it
			email: formData.email,
			name: formData.name,
			subject: formData.subject,
			message: finalHtml,
		};

		try {
			const res = await fetch("/api/admin/send-email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await res.json();
			if (data.success) {
				const meta = data.meta
					? `(Sent: ${data.meta.sent}, Failed: ${data.meta.failed})`
					: "";
				toast.success(`Broadcasting complete! ${meta}`);
				if (formData.recipientType === "single") {
					setFormData({ ...formData, email: "", name: "" });
				}
			} else {
				toast.error(data.error || "Failed to dispatch email");
			}
		} catch (_error) {
			toast.error("Network error. Could not reach server.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col h-full min-h-[calc(100vh-80px)]">
			{/* Header */}
			<div className="mb-8 pl-1">
				<h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
					<MailIcon className="text-zinc-900 dark:text-white" size={24} />
					Email Studio
				</h1>
				<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
					Design, preview, and dispatch pixel-perfect marketing templates to
					your users. Transactional emails (OTP, resets) are automatically
					handled by the system.
				</p>
			</div>

			<div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* LEFT COLUMN: Configuration Form */}
				<div className="lg:col-span-5 flex flex-col gap-6 pb-20">
					<form
						onSubmit={handleSubmit}
						className="flex flex-col gap-6"
						id="email-form"
					>
						{/* Card 1: Targeting */}
						<div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
							<h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-5 flex items-center gap-1.5">
								<UsersIcon size={14} /> Default Targeting
							</h3>

							<div className="space-y-5">
								<div className="space-y-2">
									<label
										htmlFor="recipientType"
										className="text-sm font-medium text-zinc-900 dark:text-zinc-300"
									>
										Audience Group
									</label>
									<select
										id="recipientType"
										name="recipientType"
										value={formData.recipientType}
										onChange={handleChange}
										className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors dark:text-white"
									>
										<option value="single">Single Selected User</option>
										<option value="all">Everyone (All Database Users)</option>
										<option value="pro">Paid Subscribers Only (PRO)</option>
										<option value="free">Free Tier Users Only</option>
									</select>
								</div>

								{formData.recipientType === "single" && (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
										<div className="space-y-2">
											<label
												htmlFor="email"
												className="text-sm font-medium text-zinc-900 dark:text-zinc-300"
											>
												Email Address
											</label>
											<input
												id="email"
												name="email"
												type="email"
												required
												value={formData.email}
												onChange={handleChange}
												className="w-full h-10 px-3 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white shadow-sm"
												placeholder="user@example.com"
											/>
										</div>
										<div className="space-y-2">
											<label
												htmlFor="name"
												className="text-sm font-medium text-zinc-900 dark:text-zinc-300"
											>
												Name (Merge Tag)
											</label>
											<input
												id="name"
												name="name"
												type="text"
												value={formData.name}
												onChange={handleChange}
												className="w-full h-10 px-3 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white shadow-sm"
												placeholder="Alex Doe"
											/>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Card 2: Email Content */}
						<div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
							<h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-5 flex items-center gap-1.5">
								<LayoutTemplateIcon size={14} /> Dynamic Marketing Template
							</h3>

							<div className="space-y-5">
								<div className="space-y-2">
									<label
										htmlFor="type"
										className="text-sm font-medium text-zinc-900 dark:text-zinc-300"
									>
										Template Style
									</label>
									<select
										id="type"
										name="type"
										value={formData.type}
										onChange={handleChange}
										className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-colors dark:text-white"
									>
										<option value="update">
											Product Update / Announcement
										</option>
										<option value="newsletter">
											Newsletter / Weekly Digest
										</option>
										<option value="promo">Special Offer / Upgrade</option>
										<option value="maintenance">Maintenance Notice</option>
										<option value="feedback">Feedback / Survey Request</option>
									</select>
								</div>

								<div className="space-y-2">
									<label
										htmlFor="subject"
										className="text-sm font-medium text-zinc-900 dark:text-zinc-300"
									>
										Email Subject Line
									</label>
									<input
										id="subject"
										name="subject"
										type="text"
										required
										value={formData.subject}
										onChange={handleChange}
										className="w-full h-10 px-3 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white shadow-sm"
										placeholder="e.g. You've got an update..."
									/>
								</div>

								<div className="h-px bg-zinc-200 dark:bg-white/10 my-4" />

								<div className="space-y-2">
									<label
										htmlFor="headline"
										className="text-sm font-medium text-zinc-900 dark:text-zinc-300"
									>
										Headline
									</label>
									<input
										id="headline"
										name="headline"
										type="text"
										required
										value={formData.headline}
										onChange={handleChange}
										className="w-full h-10 px-3 font-semibold bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white shadow-sm"
										placeholder="Headline Text"
									/>
								</div>

								<div className="space-y-2">
									<label
										htmlFor="bodyText"
										className="text-sm font-medium text-zinc-900 dark:text-zinc-300 flex justify-between"
									>
										<span>Body Message</span>
										<span className="text-[10px] text-zinc-500 font-normal">
											Supports Basic Markdown
										</span>
									</label>
									<textarea
										id="bodyText"
										name="bodyText"
										required
										rows={7}
										value={formData.bodyText}
										onChange={handleChange}
										className="w-full px-3 py-3 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white resize-y dark:text-zinc-300 shadow-sm leading-relaxed"
										placeholder="Write your email body here..."
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<label
											htmlFor="ctaText"
											className="text-sm font-medium text-zinc-900 dark:text-zinc-300"
										>
											Button Text
										</label>
										<input
											id="ctaText"
											name="ctaText"
											type="text"
											value={formData.ctaText}
											onChange={handleChange}
											className="w-full h-10 px-3 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white shadow-sm"
											placeholder="Learn More"
										/>
									</div>
									<div className="space-y-2">
										<label
											htmlFor="ctaLink"
											className="text-sm font-medium text-zinc-900 dark:text-zinc-300"
										>
											Button URL
										</label>
										<input
											id="ctaLink"
											name="ctaLink"
											type="url"
											value={formData.ctaLink}
											onChange={handleChange}
											className="w-full h-10 px-3 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white dark:text-white shadow-sm"
											placeholder="https://..."
										/>
									</div>
								</div>
								<p className="text-[11px] text-zinc-500 mt-1 leading-tight">
									Leave Button Text blank to remove the button completely. Use
									merge tag {"{{"}NAME{"}}"} anywhere to insert the recipient's
									name.
								</p>
							</div>
						</div>

						{/* Actions */}
						<div className="flex justify-end pt-2">
							<button
								form="email-form"
								disabled={loading}
								type="submit"
								className="inline-flex items-center gap-2 px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold rounded-xl transition-all shadow-sm"
							>
								{loading ? (
									<Loader2 className="animate-spin" size={18} />
								) : (
									<SendIcon size={18} />
								)}
								{loading ? "Dispatching..." : "Send Campaign out"}
							</button>
						</div>
					</form>
				</div>

				{/* RIGHT COLUMN: Live Interactive Preview */}
				<div className="lg:col-span-7 static lg:sticky lg:top-8 flex flex-col h-full max-h-[800px]">
					<div className="flex items-center justify-between mb-3 px-1">
						<h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
							<EyeIcon size={16} className="text-zinc-500" />
							Live Inspector
						</h3>
						<div className="flex items-center gap-1.5">
							<span className="flex h-2 w-2 relative">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 dark:bg-zinc-600 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-900 dark:bg-white"></span>
							</span>
							<span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-900 dark:text-white">
								Real-Time Render
							</span>
						</div>
					</div>

					{/* Device Frame Wrapper */}
					<div className="flex-1 min-h-[600px] border border-zinc-200 dark:border-white/10 rounded-2xl bg-[#f6f9fc] overflow-hidden shadow-sm flex flex-col relative group">
						{/* Browser-like Header */}
						<div className="h-12 bg-white border-b border-zinc-200 flex items-center px-4 gap-4 shrink-0 shadow-sm z-10 w-full relative">
							{/* Mac window dots */}
							<div className="flex gap-1.5">
								<div className="w-2.5 h-2.5 rounded-full bg-red-400" />
								<div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
								<div className="w-2.5 h-2.5 rounded-full bg-green-400" />
							</div>

							{/* Email Context Simulation */}
							<div className="flex-1 flex items-center justify-between mx-4 bg-[#f1f3f4] rounded-md h-7 px-3 border border-zinc-100">
								<div className="flex items-center gap-2 overflow-hidden">
									<span className="text-[11px] font-medium text-zinc-500 shrink-0">
										Subject:
									</span>
									<span className="text-[11px] font-semibold text-zinc-800 truncate">
										{formData.subject || "No Subject"}
									</span>
								</div>
							</div>
						</div>

						{/* Iframe Content Body */}
						<div className="w-full flex-1 relative bg-[#f6f9fc] overflow-hidden">
							<iframe
								title="Email Template Preview"
								srcDoc={generatePreviewHtml()}
								className="w-full h-full border-none absolute inset-0 bg-[#f6f9fc]"
								sandbox="allow-same-origin"
							/>
						</div>
					</div>

					<div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
						<CheckCircle2Icon size={12} className="text-zinc-400" />
						Visual framework is mobile-first and extensively tested across
						primary mail clients (Gmail, Apple Mail, Outlook).
					</div>
				</div>
			</div>
		</div>
	);
}
