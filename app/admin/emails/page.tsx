"use client";

import { useState } from "react";
import { MailIcon, Send } from "lucide-react";
import { toast } from "sonner";

export default function AdminEmailsPage() {
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		recipientType: "single",
		type: "custom",
		email: "",
		name: "",
		subject: "",
		message: "",
	});

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
				toast.success(`Email trigger successful! ${meta}`);
				if (formData.recipientType === "single") setFormData({ ...formData, email: "", message: "", subject: "" });
			} else {
				toast.error(data.error || "Failed to send email");
			}
		} catch (error) {
			toast.error("Network error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-8 max-w-4xl mx-auto space-y-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
					Email Studio
				</h1>
				<p className="text-sm text-gray-500 mt-1">
					Broadcast announcements to user segments directly from the platform.
				</p>
			</div>
			
			<div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
				<form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
					
					{/* Recipient & Template Config */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-3">
							<label className="text-sm font-medium text-gray-900 dark:text-white">Recipient Target</label>
							<select
								name="recipientType"
								value={formData.recipientType}
								onChange={handleChange}
								className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors dark:text-white"
							>
								<option value="single" className="dark:bg-[#0a0a0a] dark:text-white">Single User</option>
								<option value="all" className="dark:bg-[#0a0a0a] dark:text-white">All Users</option>
								<option value="pro" className="dark:bg-[#0a0a0a] dark:text-white">Pro Users Only</option>
								<option value="free" className="dark:bg-[#0a0a0a] dark:text-white">Free Users Only</option>
							</select>
						</div>

						<div className="space-y-3">
							<label className="text-sm font-medium text-gray-900 dark:text-white">Template Payload</label>
							<select
								name="type"
								value={formData.type}
								onChange={handleChange}
								className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors dark:text-white"
							>
								<option value="custom" className="dark:bg-[#0a0a0a] dark:text-white">Custom Text Blast</option>
								<option value="upgrade-reminder" className="dark:bg-[#0a0a0a] dark:text-white">Upgrade Reminder (Built-in)</option>
								<option value="verification-test" className="dark:bg-[#0a0a0a] dark:text-white">Verification Test</option>
							</select>
						</div>
					</div>

					{/* Target Email (Single Only) */}
					{formData.recipientType === "single" && (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
							<div className="space-y-3">
								<label className="text-sm font-medium text-gray-900 dark:text-white">Target Email</label>
								<input
									name="email"
									type="email"
									required
									value={formData.email}
									onChange={handleChange}
									className="w-full px-4 py-2 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:text-white"
									placeholder="user@example.com"
								/>
							</div>
							<div className="space-y-3">
								<label className="text-sm font-medium text-gray-900 dark:text-white">Name (Optional)</label>
								<input
									name="name"
									type="text"
									value={formData.name}
									onChange={handleChange}
									className="w-full px-4 py-2 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:text-white"
									placeholder="John Doe"
								/>
							</div>
						</div>
					)}

					{/* Custom Email Content */}
					{formData.type === "custom" && (
						<div className="space-y-6 pt-2 border-t border-gray-200 dark:border-white/10">
							<div className="space-y-3">
								<label className="text-sm font-medium text-gray-900 dark:text-white">Email Subject</label>
								<input
									name="subject"
									type="text"
									required
									value={formData.subject}
									onChange={handleChange}
									className="w-full px-4 py-2 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 dark:text-white"
									placeholder="Important Update..."
								/>
							</div>
							<div className="space-y-3">
								<label className="text-sm font-medium text-gray-900 dark:text-white">Message Body (Supports HTML)</label>
								<textarea
									name="message"
									required
									rows={6}
									value={formData.message}
									onChange={handleChange}
									className="w-full px-4 py-2 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:border-indigo-500 font-mono resize-y dark:text-white"
									placeholder="<p>Hello world!</p>"
								/>
							</div>
						</div>
					)}

					<div className="pt-4 flex justify-end">
						<button
							disabled={loading}
							type="submit"
							className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
						>
							{loading ? <span className="animate-spin">⟳</span> : <Send size={16} />} 
							{loading ? "Dispatching..." : "Send Blast"}
						</button>
					</div>

				</form>
			</div>
		</div>
	);
}
