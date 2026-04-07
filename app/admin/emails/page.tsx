"use client";

import { useEffect, useState } from "react";
import { MailIcon, SendIcon, EyeIcon, SearchIcon, UsersIcon, SparklesIcon, CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";

export default function AdminEmailsPage() {
	const [loading, setLoading] = useState(false);
	
	const [formData, setFormData] = useState({
		recipientType: "single",
		type: "welcome", // Default to a standard visual template
		email: "",
		name: "",
		subject: "",
		message: "",
	});

	// Synchronize defaults on mount or when type changes
	useEffect(() => {
		const tmpl = EMAIL_TEMPLATES.find((t) => t.id === formData.type);
		if (tmpl && tmpl.id !== "custom") {
			setFormData((prev) => ({
				...prev,
				subject: tmpl.subject,
				message: tmpl.body, // In UI we don't necessarily show the raw HTML to the user if it's a preset, but we store it
			}));
		} else if (tmpl && tmpl.id === "custom") {
			setFormData((prev) => ({
				...prev,
				subject: "",
				message: "<p>Hello world!</p>",
			}));
		}
	}, [formData.type]);

	const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const res = await fetch("/api/admin/send-email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});
			const data = await res.json();
			if (data.success) {
				const meta = data.meta ? `(Sent: ${data.meta.sent}, Failed: ${data.meta.failed})` : "";
				toast.success(`Broadcasting complete! ${meta}`);
				if (formData.recipientType === "single") {
					setFormData({ ...formData, email: "", name: "" });
				}
			} else {
				toast.error(data.error || "Failed to dispatch email");
			}
		} catch (error) {
			toast.error("Network error. Could not reach server.");
		} finally {
			setLoading(false);
		}
	};

	// Computing the Live Preview HTML
	const generatePreviewHtml = () => {
		let html = "";
		if (formData.type === "custom") {
			// For custom, use a basic wrapper just for previewing cleanly, 
			// though raw custom template might send raw.
			html = `<div style="font-family: sans-serif; padding: 20px; color: #333;">${formData.message}</div>`;
		} else {
			const tmpl = EMAIL_TEMPLATES.find((t) => t.id === formData.type);
			html = tmpl ? tmpl.body : "";
		}

		// Replace merge tags for preview purposes
		const recipientName = formData.name || "Customer";
		const resetLink = "https://ultramaxo.tech/reset-password?token=preview";
		
		html = html.replace(/{{NAME}}/g, recipientName);
		html = html.replace(/{{RESET_LINK}}/g, resetLink);
		
		return html;
	};

	return (
		<div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col h-full min-h-[calc(100vh-80px)]">
			{/* Header */}
			<div className="mb-8 pl-1">
				<h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
					<MailIcon className="text-indigo-500" size={24} />
					Email Studio
				</h1>
				<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
					Design, preview, and dispatch pixel-perfect transactional and marketing emails to your user base.
				</p>
			</div>
			
			<div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				
				{/* LEFT COLUMN: Configuration Form */}
				<div className="lg:col-span-5 flex flex-col gap-6">
					
					<form onSubmit={handleSubmit} className="flex flex-col gap-6" id="email-form">
						{/* Card 1: Targeting */}
						<div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
							<h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-5 flex items-center gap-1.5">
								<UsersIcon size={14} /> Default Targeting
							</h3>
							
							<div className="space-y-5">
								<div className="space-y-2">
									<label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Audience Group</label>
									<select
										name="recipientType"
										value={formData.recipientType}
										onChange={handleChange}
										className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors dark:text-white"
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
											<label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Email Address</label>
											<input
												name="email"
												type="email"
												required
												value={formData.email}
												onChange={handleChange}
												className="w-full h-10 px-3 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white shadow-sm"
												placeholder="user@example.com"
											/>
										</div>
										<div className="space-y-2">
											<label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Name (Merge Tag)</label>
											<input
												name="name"
												type="text"
												value={formData.name}
												onChange={handleChange}
												className="w-full h-10 px-3 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white shadow-sm"
												placeholder="Alex Doe"
											/>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Card 2: Blueprint & Content */}
						<div className="bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
							<h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-5 flex items-center gap-1.5">
								<SparklesIcon size={14} /> Creative Payload
							</h3>

							<div className="space-y-5">
								<div className="space-y-2">
									<label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Template Selection</label>
									<select
										name="type"
										value={formData.type}
										onChange={handleChange}
										className="w-full h-10 px-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors dark:text-white"
									>
										{EMAIL_TEMPLATES.map((tmpl) => (
											<option key={tmpl.id} value={tmpl.id}>
												{tmpl.name}
											</option>
										))}
									</select>
								</div>

								<div className="space-y-2">
									<label className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Subject Line</label>
									<input
										name="subject"
										type="text"
										required
										value={formData.subject}
										onChange={handleChange}
										disabled={formData.type !== "custom"}
										className="w-full h-10 px-3 bg-white dark:bg-[#0a0a0a] disabled:bg-zinc-50 disabled:dark:bg-zinc-900 disabled:text-zinc-500 border border-zinc-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white shadow-sm"
										placeholder="You've got a message..."
									/>
								</div>

								{formData.type === "custom" && (
									<div className="space-y-2 animate-in fade-in slide-in-from-top-2">
										<label className="text-sm font-medium text-zinc-900 dark:text-zinc-300 flex justify-between">
											<span>HTML Body</span>
											<span className="text-[10px] text-zinc-500 font-normal">Raw HTML injected directly.</span>
										</label>
										<textarea
											name="message"
											required
											rows={6}
											value={formData.message}
											onChange={handleChange}
											className="w-full px-3 py-3 bg-zinc-50 dark:bg-[#050505] border border-zinc-200 dark:border-white/10 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y dark:text-zinc-300 shadow-inner"
											placeholder="<p>Custom dispatch payload...</p>"
										/>
									</div>
								)}
							</div>
						</div>

						{/* Actions */}
						<div className="flex justify-end pt-2 mb-8">
							<button
								form="email-form"
								disabled={loading}
								type="submit"
								className="inline-flex items-center gap-2 px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold rounded-xl transition-all shadow-sm"
							>
								{loading ? <Loader2Icon className="animate-spin" size={18} /> : <SendIcon size={18} />} 
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
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
							</span>
							<span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400">
								Real-Time Render
							</span>
						</div>
					</div>

					{/* Device Frame Wrapper to make it look professional */}
					<div className="flex-1 min-h-[500px] border border-zinc-200 dark:border-white/10 rounded-2xl bg-[#f6f9fc] overflow-hidden shadow-sm flex flex-col relative relative group">
						
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
									<span className="text-[11px] font-medium text-zinc-500 shrink-0">Subject:</span>
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
								className="w-full h-full border-none absolute inset-0"
								sandbox="allow-same-origin"
							/>
						</div>

					</div>

					<div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
						<CheckCircle2Icon size={12} className="text-emerald-500" />
						All templates are mobile-first and extensively tested across primary mail clients (Gmail, Apple Mail, Outlook).
					</div>
				</div>

			</div>
		</div>
	);
}
