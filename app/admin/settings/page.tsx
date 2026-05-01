"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

const TEMPLATE_OPTIONS = [
	{ value: "midnight", label: "Midnight", desc: "Dark glass panel" },
	{ value: "aurora", label: "Aurora", desc: "Northern lights gradient" },
	{ value: "minimal", label: "Minimal", desc: "Clean editorial layout" },
	{ value: "ember", label: "Ember", desc: "Warm orange accents" },
];

interface SiteSettingsData {
	maintenanceEnabled: boolean;
	maintenanceTemplate: string;
	maintenanceTitle: string;
	maintenanceMessage: string;
}

export default function AdminSettingsPage() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [settings, setSettings] = useState<SiteSettingsData>({
		maintenanceEnabled: false,
		maintenanceTemplate: "minimal",
		maintenanceTitle: "We will be right back.",
		maintenanceMessage: "Lagi ada update kecil. Sebentar lagi balik.",
	});

	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const res = await fetch("/api/admin/site-settings");
				const data = await res.json();
				if (data.settings) {
					setSettings({
						maintenanceEnabled: data.settings.maintenanceEnabled ?? false,
						maintenanceTemplate: data.settings.maintenanceTemplate ?? "minimal",
						maintenanceTitle: data.settings.maintenanceTitle ?? "",
						maintenanceMessage: data.settings.maintenanceMessage ?? "",
					});
				}
			} catch {
				toast.error("Failed to load settings");
			} finally {
				setLoading(false);
			}
		};
		fetchSettings();
	}, []);

	const handleSave = async () => {
		if (
			!settings.maintenanceTitle.trim() ||
			!settings.maintenanceMessage.trim()
		) {
			toast.error("Title and message are required");
			return;
		}
		setSaving(true);
		try {
			const res = await fetch("/api/admin/site-settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(settings),
			});
			const data = await res.json();
			if (data.success) {
				toast.success("Settings saved");
			} else {
				toast.error(data.error || "Save failed");
			}
		} catch {
			toast.error("Network error");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="p-8 max-w-4xl mx-auto">
				<p className="text-gray-500 text-sm">Loading settings...</p>
			</div>
		);
	}

	return (
		<div className="p-8 max-w-4xl mx-auto space-y-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
					Settings
				</h1>
				<p className="text-sm text-gray-500 mt-1">
					Application configurations and maintenance controls.
				</p>
			</div>

			{/* Maintenance Mode Card */}
			<div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
				<div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
					<div>
						<h3 className="text-sm font-medium text-gray-900 dark:text-white">
							Maintenance Mode
						</h3>
						<p className="text-xs text-gray-500 mt-0.5">
							When enabled, all non-admin users see the maintenance page.
						</p>
					</div>
					<button
						type="button"
						onClick={() =>
							setSettings({
								...settings,
								maintenanceEnabled: !settings.maintenanceEnabled,
							})
						}
						className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
							settings.maintenanceEnabled
								? "bg-red-500"
								: "bg-gray-300 dark:bg-white/10"
						}`}
					>
						<span
							className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
								settings.maintenanceEnabled ? "translate-x-6" : "translate-x-1"
							}`}
						/>
					</button>
				</div>

				<div className="p-6 space-y-6">
					{/* Status Indicator */}
					<div
						className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
							settings.maintenanceEnabled
								? "border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5"
								: "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5"
						}`}
					>
						<div
							className={`w-2 h-2 rounded-full ${settings.maintenanceEnabled ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`}
						/>
						<span
							className={`text-sm font-medium ${
								settings.maintenanceEnabled
									? "text-red-700 dark:text-red-400"
									: "text-emerald-700 dark:text-emerald-400"
							}`}
						>
							{settings.maintenanceEnabled
								? "Site is OFFLINE for non-admin users"
								: "Site is LIVE and operational"}
						</span>
					</div>

					{/* Template Selection */}
					<div className="space-y-3">
						<span className="text-sm font-medium text-gray-900 dark:text-white">
							Maintenance Template
						</span>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							{TEMPLATE_OPTIONS.map((tpl) => (
								<button
									key={tpl.value}
									type="button"
									onClick={() =>
										setSettings({ ...settings, maintenanceTemplate: tpl.value })
									}
									className={`p-3 rounded-lg border text-left transition-all ${
										settings.maintenanceTemplate === tpl.value
											? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-500/20"
											: "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
									}`}
								>
									<p
										className={`text-sm font-medium ${
											settings.maintenanceTemplate === tpl.value
												? "text-indigo-700 dark:text-indigo-400"
												: "text-gray-900 dark:text-white"
										}`}
									>
										{tpl.label}
									</p>
									<p className="text-xs text-gray-500 mt-0.5">{tpl.desc}</p>
								</button>
							))}
						</div>
					</div>

					{/* Title */}
					<div className="space-y-2">
						<span className="text-sm font-medium text-gray-900 dark:text-white">
							Title
						</span>
						<input
							type="text"
							value={settings.maintenanceTitle}
							onChange={(e) =>
								setSettings({ ...settings, maintenanceTitle: e.target.value })
							}
							className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
							placeholder="We'll be right back"
						/>
					</div>

					{/* Message */}
					<div className="space-y-2">
						<span className="text-sm font-medium text-gray-900 dark:text-white">
							Message
						</span>
						<textarea
							rows={3}
							value={settings.maintenanceMessage}
							onChange={(e) =>
								setSettings({ ...settings, maintenanceMessage: e.target.value })
							}
							className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-y"
							placeholder="Currently performing maintenance..."
						/>
					</div>
				</div>

				{/* Footer Actions */}
				<div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.01] flex justify-end">
					<button
						type="button"
						disabled={saving}
						onClick={handleSave}
						className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
					>
						{saving ? "Saving..." : "Save Changes"}
					</button>
				</div>
			</div>
		</div>
	);
}
