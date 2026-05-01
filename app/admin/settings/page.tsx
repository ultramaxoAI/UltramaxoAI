"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

const TEMPLATE_OPTIONS = [
	{ value: "midnight", label: "Midnight", desc: "Dark glass panel" },
	{ value: "aurora", label: "Aurora", desc: "Northern lights gradient" },
	{ value: "minimal", label: "Minimal", desc: "Clean editorial layout" },
	{ value: "ember", label: "Ember", desc: "Warm orange accents" },
];

const MAINTENANCE_SCOPES = [
	{
		key: "chat",
		title: "Chat Maintenance",
		description:
			"Control maintenance state for chat workspace pages used by regular users.",
		onlineLabel: "Chat is LIVE and operational",
		offlineLabel: "Chat is OFFLINE for non-admin users",
	},
	{
		key: "api",
		title: "API Maintenance",
		description:
			"Control maintenance state for API Console and public API endpoints.",
		onlineLabel: "API is LIVE and operational",
		offlineLabel: "API is OFFLINE for non-admin users",
	},
] as const;

type MaintenanceScopeKey = (typeof MAINTENANCE_SCOPES)[number]["key"];

type MaintenanceScopeSettings = {
	key: MaintenanceScopeKey;
	maintenanceEnabled: boolean;
	maintenanceTemplate: string;
	maintenanceTitle: string;
	maintenanceMessage: string;
};

type SiteSettingsData = Record<MaintenanceScopeKey, MaintenanceScopeSettings>;

const DEFAULT_SCOPE_SETTINGS: SiteSettingsData = {
	chat: {
		key: "chat",
		maintenanceEnabled: false,
		maintenanceTemplate: "minimal",
		maintenanceTitle: "We will be right back.",
		maintenanceMessage: "Lagi ada update kecil. Sebentar lagi balik.",
	},
	api: {
		key: "api",
		maintenanceEnabled: false,
		maintenanceTemplate: "minimal",
		maintenanceTitle: "API temporarily unavailable.",
		maintenanceMessage: "API sedang maintenance sementara. Coba lagi sebentar.",
	},
};

export default function AdminSettingsPage() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [settings, setSettings] = useState<SiteSettingsData>(
		DEFAULT_SCOPE_SETTINGS,
	);

	useEffect(() => {
		const fetchSettings = async () => {
			try {
				const res = await fetch("/api/admin/site-settings");
				const data = await res.json();

				if (data.settings) {
					setSettings({
						chat: {
							...DEFAULT_SCOPE_SETTINGS.chat,
							...data.settings.chat,
							key: "chat",
						},
						api: {
							...DEFAULT_SCOPE_SETTINGS.api,
							...data.settings.api,
							key: "api",
						},
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

	const updateScope = (
		scope: MaintenanceScopeKey,
		nextValue: Partial<MaintenanceScopeSettings>,
	) => {
		setSettings((current) => ({
			...current,
			[scope]: {
				...current[scope],
				...nextValue,
			},
		}));
	};

	const handleSave = async () => {
		for (const scope of MAINTENANCE_SCOPES) {
			const scopeSettings = settings[scope.key];
			if (
				!scopeSettings.maintenanceTitle.trim() ||
				!scopeSettings.maintenanceMessage.trim()
			) {
				toast.error(`Title and message are required for ${scope.title}`);
				return;
			}
		}

		setSaving(true);
		try {
			const res = await fetch("/api/admin/site-settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ scopes: settings }),
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
			<div className="p-8 max-w-5xl mx-auto">
				<p className="text-gray-500 text-sm">Loading settings...</p>
			</div>
		);
	}

	return (
		<div className="p-8 max-w-5xl mx-auto space-y-8">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
					Settings
				</h1>
				<p className="text-sm text-gray-500 mt-1">
					Application configurations and maintenance controls per surface.
				</p>
			</div>

			<div className="space-y-8">
				{MAINTENANCE_SCOPES.map((scope) => {
					const scopeSettings = settings[scope.key];
					return (
						<div
							key={scope.key}
							className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden"
						>
							<div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
								<div>
									<h3 className="text-sm font-medium text-gray-900 dark:text-white">
										{scope.title}
									</h3>
									<p className="text-xs text-gray-500 mt-0.5">
										{scope.description}
									</p>
								</div>
								<button
									type="button"
									onClick={() =>
										updateScope(scope.key, {
											maintenanceEnabled: !scopeSettings.maintenanceEnabled,
										})
									}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
										scopeSettings.maintenanceEnabled
											? "bg-red-500"
											: "bg-gray-300 dark:bg-white/10"
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
											scopeSettings.maintenanceEnabled
												? "translate-x-6"
												: "translate-x-1"
										}`}
									/>
								</button>
							</div>

							<div className="p-6 space-y-6">
								<div
									className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
										scopeSettings.maintenanceEnabled
											? "border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5"
											: "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5"
									}`}
								>
									<div
										className={`w-2 h-2 rounded-full ${
											scopeSettings.maintenanceEnabled
												? "bg-red-500 animate-pulse"
												: "bg-emerald-500"
										}`}
									/>
									<span
										className={`text-sm font-medium ${
											scopeSettings.maintenanceEnabled
												? "text-red-700 dark:text-red-400"
												: "text-emerald-700 dark:text-emerald-400"
										}`}
									>
										{scopeSettings.maintenanceEnabled
											? scope.offlineLabel
											: scope.onlineLabel}
									</span>
								</div>

								<div className="space-y-3">
									<span className="text-sm font-medium text-gray-900 dark:text-white">
										Maintenance Template
									</span>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
										{TEMPLATE_OPTIONS.map((tpl) => (
											<button
												key={`${scope.key}-${tpl.value}`}
												type="button"
												onClick={() =>
													updateScope(scope.key, {
														maintenanceTemplate: tpl.value,
													})
												}
												className={`p-3 rounded-lg border text-left transition-all ${
													scopeSettings.maintenanceTemplate === tpl.value
														? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-500/20"
														: "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
												}`}
											>
												<p
													className={`text-sm font-medium ${
														scopeSettings.maintenanceTemplate === tpl.value
															? "text-indigo-700 dark:text-indigo-400"
															: "text-gray-900 dark:text-white"
													}`}
												>
													{tpl.label}
												</p>
												<p className="text-xs text-gray-500 mt-0.5">
													{tpl.desc}
												</p>
											</button>
										))}
									</div>
								</div>

								<div className="space-y-2">
									<span className="text-sm font-medium text-gray-900 dark:text-white">
										Title
									</span>
									<input
										type="text"
										value={scopeSettings.maintenanceTitle}
										onChange={(e) =>
											updateScope(scope.key, {
												maintenanceTitle: e.target.value,
											})
										}
										className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white focus:outline-none focus:border-indigo-500 transition-colors"
										placeholder="We'll be right back"
									/>
								</div>

								<div className="space-y-2">
									<span className="text-sm font-medium text-gray-900 dark:text-white">
										Message
									</span>
									<textarea
										rows={3}
										value={scopeSettings.maintenanceMessage}
										onChange={(e) =>
											updateScope(scope.key, {
												maintenanceMessage: e.target.value,
											})
										}
										className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm dark:text-white focus:outline-none focus:border-indigo-500 transition-colors resize-y"
										placeholder="Currently performing maintenance..."
									/>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="flex justify-end">
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
	);
}
